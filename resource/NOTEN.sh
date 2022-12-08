#!/bin/bash

while ! mkdir ./.lock 2>/dev/null
do
	sleep 1
done
trap "rm -rf ./.lock; exit" INT TERM EXIT

while getopts hju:p: opt
do
	case $opt in
		u) username=$OPTARG;;
		p) password=$OPTARG;;
		h) echo
		   echo "Call:"
		   echo " ./NOTEN.sh [Options]"
		   echo
		   echo "Options:"
		   echo -e " -u\tSet username"
		   echo -e " -p\tSet password"
		   echo
		   echo "For more details see https://github.com/neinkob15/DualisApp"
		   exit 0;;
	esac
done

if [ -z "${username}" ]
then
	echo "Username cannot be empty"
	exit 1
fi
if [ -z "${password}" ]
then
	echo "Password cannot be empty"
	exit 1
fi


curl -X POST -c "cookie" -s \
	-F "usrname=${username}" \
	-F "pass=${password}" \
	-F 'APPNAME=CampusNet' \
	-F 'PRGNAME=LOGINCHECK' \
	-F 'ARGUMENTS=clino,usrname,pass,menuno,menu_type,browser,platform' \
	-F 'clino=000000000000001' \
	-F 'menuno=000324' \
	-F 'menu_type=classic' \
	-D 'header' \
	--connect-timeout 20 \
	"https://dualis.dhbw.de/scripts/mgrqispi.dll" > /dev/null

argVar=$(sed -n 's/.*ARGUMENTS=//p' header)

url="https://dualis.dhbw.de/scripts/mgrqispi.dll?APPNAME=CampusNet&PRGNAME=COURSERESULTS&ARGUMENTS=${argVar}"
url=${url%$'\r'}

curl -X GET -b ./cookie -s "${url}" --connect-timeout 20 > page.html

lines=$(sed -n '/<select id="semester"/,/<\/select>/p' page.html)

# Semester numbers
arrNum=()

# Semester String
arrSem=()

i=0

#echo "SEMESTER:"

IFS=$'\n'
for line in $lines
do
	line=$(echo $line | tr -d "\t")
	line=$(echo $line | grep "option")
	if ! [ -z "${line}" ]; then
		arrNum[i]=$(echo $line | sed 's/.*value=\"\(.*\)\" .*/\1/')
		arrSem[i]=$(echo $line | sed 's/.*>\(.*\)<\/option>.*/\1/')
#		echo "$((i+1))| ${arrSem[i]}"
		i=$((i+1))
	fi
done
l=$i
now=$(date)


upperBound=2
if [ $l -lt $upperBound ]; then
	upperBound=$l
fi


echo "["
# loop through semesters
for (( m=0; m<upperBound; m++ ))
do

	semester=$m
	echo "  {"
	echo "    \"semester\":\"${arrSem[semester]}\","
	echo "    \"modules\": ["

	arg1=$(echo $argVar | cut -d"," -f1)
	arg2=$(echo $argVar | cut -d"," -f2)

	url2="https://dualis.dhbw.de/scripts/mgrqispi.dll?APPNAME=CampusNet&PRGNAME=COURSERESULTS&ARGUMENTS=$arg1,$arg2,-N${arrNum[semester]}"


	curl -b ./cookie -s $url2 > page.html

	lines=$(sed -n '/.*<tbody>/,/.*<\/tbody>/p' page.html)

	lines=$(echo "$lines" | sed -e 's/^[[:space:]]*//' | sed -e '/^$/d' | grep 'td.*"tbdata".*td\|href="/script')


	arrModules=()
	arrLinks=()

	i=0
	j=0
	k=0
	for line in $lines
	do
		if [[ $line == *"tbdata"* ]]; then
			if ((i % 2)); then
				arrModules[j]=$(echo $line | sed 's/.*>\(.*\)<.*/\1/')
#				echo "$((j+1))| ${arrModules[j]}"
				j=$((j+1))
			fi
			i=$((i+1))
		else
			arrLinks[k]=$(echo $line | sed 's/.*href="\(.*\)".*/\1/' | sed 's/\&amp;/\&/g')
			arrLinks[k]=$(echo "https://dualis.dhbw.de${arrLinks[k]}")
			k=$((k+1))
		fi
	done

	# loop through modules
	for (( c=0; c<$k; c++ ))
	do
		module=$c
		echo "      {"
		echo "        \"name\":\"${arrModules[c]}\","
		echo "        \"exams\": ["


		curl -b ./cookie -s "${arrLinks[module]}" > page.html
		lines=$(sed -n '/Versuch/,/Bausteine/p' page.html)

#		if ! [ -z "{$lines}" ]; then
#			echo $lines > bug.txt
#			bug3=1
#		fi

		flag=0
		flag2=0
		flag3=0
		lineCount=0
		examName=""
		for line in $lines
		do
			if [[ $line == *"&nbsp;&nbsp;"* ]] || [[ $line == *"tbdata\" >"* ]] || [[ $line == *"colspan=\"8\""* ]]; then

#if #tbdata ># and next lines no &nbsp;&nbsp; then...
				check1=$(echo "$lines" | grep -A20 $line)
				check2=$(echo "$lines" | grep -A5 $line)
#		echo "$check1"
				if [[ $line == *"tbdata\" >"* ]] && ! [[ "$check1" == *"&nbsp;&nbsp;"* ]] || [[ $line == *"&nbsp;&nbsp;"* ]] || [[ $line == *"colspan=\"8\""* ]]; then
					oldLine=$(echo $line)
					line=$(echo "$line" | sed 's/.*>\(.*\)<.*/\1/' | sed 's/&nbsp;//g')
					if ! [[ $line == *"<td class"* ]]; then
						if [[ "$check2" == *","* ]] || [[ "$check2" == *"noch nicht gesetzt"* ]] || [[ "$check2" == *" b"* ]] || [[ $oldLine == *"colspan=\"8\""* ]]; then
							if ! [[ $line == *"Modulabschlussleistungen"* ]]; then
								if [[ "$oldLine" == *"colspan=\"8\""* ]]; then
#							echo "Name: $line"
									examName=$(echo $line | cut -d " " -f3- )
								else
									if ! [ $flag2 -eq 0 ]; then
										echo "          },"
										echo "          {"
									else
										echo "          {"
									fi
									if [ -z $examName ]; then
										echo "            \"exam\":\"$line\","
										flag3=1
									else
										percent=$(echo $line | cut -d "(" -f2 | cut -d ")" -f1 )
										echo "            \"exam\":\"$examName ($percent)\","
										flag3=1
									fi
									lineCount=$((lineCount+1))
								fi
							fi
						fi
					fi
				fi
				if [[ "$check1" == *"&nbsp;&nbsp;"* ]] && [[ $line == *"tbdata\" >"* ]] && { [[ "$check2" == *","* ]] || [[ "$check2" == *"noch nicht gesetzt"* ]] || [[ "$check2" == *" b"* ]]; } ; then
					flag=1
				fi
			fi
			if [[ $line =~ [0-9]+,[0-9]+ ]] || [[ $line == *"noch nicht gesetzt"* ]] || [[ $line == *" b"* ]]; then
				if [ $flag -eq 1 ]; then
					flag=0
				else
					if ! [[ $line == *"bestanden"* ]] && ! [[ $line == *"\"noch"* ]] && ! [[ $line == *"<div"* ]]; then
						if [[ $line == *"<td"* ]]; then
							grade=$(echo "$line" | sed 's/.*>\(.*\)<.*/\1/')
							grade=$(echo $grade | sed 's/\r//g' )
							grade=$(echo $grade | sed 's/ //g' )
							if ! [[ $grade == *")"* ]]; then
								echo "            \"grade\":\"$grade\""
								flag2=1
							fi
						else
							grade=$(echo "$line" | sed 's/^ *//g' | sed 's/noch nicht gesetzt/-/g')
							grade=$(echo $grade | sed 's/\r//g' )
							grade=$(echo $grade | sed 's/ //g' )



							if ! [[ $grade == *")"* ]]; then
								echo "            \"grade\":\"$grade\""
								flag2=1
							fi
						fi
					fi
				fi
			fi
		done

		if ! [ $flag3 -eq 0 ];then
			echo "          }"
		fi
		echo "        ]"
		if [ $c -eq $((k-1)) ]; then
			echo "      }"
		else
			echo "      },"
		fi
	done
	echo "    ]"
	if [ $m -eq $((l-1)) ]; then
		echo "  }"
	else
		echo "  },"
	fi
done
echo "]"
