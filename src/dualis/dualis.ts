import { exec } from "child_process";
import { Client, MessageEmbed, TextChannel } from "discord.js";
import * as fs from 'fs'
import { DATA_DIR, load } from "../util/config";

// Pfad zur lokalen Datei
const localFile = DATA_DIR + 'dualis.json';
// Config mit Login-Daten und Channel-ID
const config = load().dualis;
// Interval, in dem nach neuen Noten gesucht wird
const loopInterval = 1000 * 60 * 15;

/**
 * Startet den ganzen Dualis-Bums
 */
export async function start(bot: Client) {
    if(!fs.existsSync(localFile)) {
        saveFile(await loadDualis());
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

    if(dualis === null) return;
    if(local === null) return;

    for(let semester = 0; semester < dualis.length; semester++) {
        const dSemester = dualis[semester];
        const dModules = dSemester.modules;

        for(let module = 0; module < dModules.length; module++) {
            const dModule = dModules[module];
            const dExams = dModule.exams;

            for(let exam = 0; exam < dExams.length; exam++) {
                const dExam = dExams[exam];
                if(dExam.grade === '-') continue;

                const sem = dSemester.semester;
                const mod = dModule.name;
                const exa = dExam.exam;

                const lSemester = containsAndGet(local, 'semester', sem);
                if(!!lSemester) {
                    const lModule = containsAndGet(lSemester.modules, 'name', mod);
                    if(!!lModule) {
                        const lExam = containsAndGet(lModule.exams, 'exam', exa);
                        if(!!lExam && lExam.grade !== '-') continue;
                    }
                }
                
                console.log(`[Dualis] New grade: ${sem} - ${mod} ${exa}`);
                
                sendNotification(bot, sem, mod, exa);
            }
        }
    }

    saveFile(dualis);

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
 * Falls das Array arr ein Objekt mit dem Attribut key
 * und dem dazugehörigen Attributwert val beinhaltet,
 * wird dieses Objekt zurückgegeben. Andernfalls wird
 * null zurückgegeben.
 */
function containsAndGet(arr: any[], key: string, val: any) {
    for(let obj of arr) {
        if(obj[key] === val) {
            return obj;
        }
    }

    return null;
}

/**
 * Sendet eine Benachrichtigung in Discord, dass neue Noten eingetragen wurden
 */
async function sendNotification(bot: Client, semester: string, module: string, exam: string) {
    const channel = await bot.channels.fetch(config.channelId);
    if(!(channel instanceof TextChannel)) return;

    const embed = new MessageEmbed()
        .setAuthor('Dualis')
        .setTitle(`${semester} - ${module}`)
        .setDescription(exam)
        .setColor('#E74C3C');

    channel.send({ embeds: [ embed ] });
}