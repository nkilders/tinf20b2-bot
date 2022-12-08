import { exec } from "child_process";
import { Client, MessageEmbed, TextChannel } from "discord.js";
import * as fs from 'fs'
import { DATA_DIR, load } from "../util/config";

// Pfad zur lokalen Datei
const localFile = DATA_DIR + 'dualis.json';
// Config mit Login-Daten und Channel-ID
const config = load().dualis;
// Interval, in dem nach neuen Noten gesucht wird
const loopInterval = 1000 * 60 * 60;

/**
 * Startet den ganzen Dualis-Bums
 */
export async function start(bot: Client) {
    if(!fs.existsSync(localFile)) {
        await hehe();
    } else {
        loop(bot);
    }

    setInterval(loop, loopInterval, bot);
}

/**
 * Lädt alle Noten und prüft, ob neue eingetragen wurden
 */
async function loop(bot: Client) {
    console.log('[Dualis] Checking for new grades...');

    const dualis = await loadDualis();
    const local = loadFile();

    if(!dualis || !local) return;

    for(let semester = 0; semester < dualis.length; semester++) {
        const dSemester = dualis[semester];
        const dModules = dSemester.modules;
        
        const sem = dSemester.semester;
        if(!local[sem]) local[sem] = {};

        for(let module = 0; module < dModules.length; module++) {
            const dModule = dModules[module];
            const dExams = dModule.exams;
            
            const mod = dModule.name;
            if(!local[sem][mod]) local[sem][mod] = [];

            for(let exam = 0; exam < dExams.length; exam++) {
                const dExam = dExams[exam];
                if(dExam.grade === '-') continue;

                const exa = dExam.exam;

                if(local[sem][mod].includes(exa)) continue;
                local[sem][mod].push(exa);
                
                console.log(`[Dualis] New grade: ${sem} - ${mod} ${exa}`);
                
                sendNotification(bot, sem, mod, exa);
            }
        }
    }

    saveFile(local);

    console.log('[Dualis] Done');
}

/**
 * Lädt die aktuellen Noten von Dualis
 */
function loadDualis(): Promise<any> {
    return new Promise(resolve => {
        exec(
            `cd ./resource/ && ./NOTEN.sh -u ${config.username} -p ${config.password}`,
            (err, out) => {
                if(err) {
                    console.log('[Dualis] An error occurred while fetching the grades from Dualis');
                    resolve(null);
                    return;
                }

                resolve(JSON.parse(out));
            }
        );
    });
}

async function hehe() {
    const dualis: any = await loadDualis();
    const out: any = {};

    if(!dualis) return;

    for(let semester = 0; semester < dualis.length; semester++) {
        const dSemester = dualis[semester];
        const dModules = dSemester.modules;
        
        const sem = dSemester.semester;
        if(!out[sem]) out[sem] = {};

        for(let module = 0; module < dModules.length; module++) {
            const dModule = dModules[module];
            const dExams = dModule.exams;
            
            const mod = dModule.name;
            if(!out[sem][mod]) out[sem][mod] = [];

            for(let exam = 0; exam < dExams.length; exam++) {
                const dExam = dExams[exam];
                if(dExam.grade === '-') continue;

                const exa = dExam.exam;
                if(!out[sem][mod].includes(exa)) out[sem][mod].push(exa);
            }
        }
    }

    saveFile(out);
}

/**
 * Lädt die lokale Datei mit den letzten Noten
 */
function loadFile() {
    if(!fs.existsSync(localFile)) {
        console.log('[Dualis] An error occurred while loading the local file');
        return null;
    }

    return JSON.parse(fs.readFileSync(localFile).toString());
}

/**
 * Überschreibt die lokale Datei mit den übergebenen Daten
 */
function saveFile(json: any) {
    fs.writeFileSync(localFile, JSON.stringify(json, null, 2));
}

/**
 * Sendet eine Benachrichtigung in Discord, dass neue Noten eingetragen wurden
 */
async function sendNotification(bot: Client, semester: string, module: string, exam: string) {
    const channel = await bot.channels.fetch(config.channelId);
    if(!(channel instanceof TextChannel)) return;

    const embed = new MessageEmbed()
        .setAuthor({
            name: 'Dualis',
        })
        .setTitle(`${semester} - ${module}`)
        .setDescription(exam)
        .setColor('#E74C3C');

    channel.send({ embeds: [ embed ] });
}