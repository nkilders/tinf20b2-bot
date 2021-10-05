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
    const dualis = await loadDualis();
    const local = loadFile();

    if(dualis == null) return;
    if(local == null) return;

    for(let semester = 0; semester < dualis.length && semester < local.length; semester++) {
        const dSemester = dualis[semester];
        const lSemester = local[semester];

        const dModules = dSemester.modules;
        const lModules = lSemester.modules;

        for(let module = 0; module < dModules.length && module < lModules.length; module++) {
            const dModule = dModules[module];
            const lModule = lModules[module];

            const dExams = dModule.exams;
            const lExams = lModule.exams;

            for(let exam = 0; exam < dExams.length && exam < lExams.length; exam++) {
                const dExam = dExams[exam];
                const lExam = lExams[exam];

                if(lExam.grade == '-' && dExam.grade != '-') {
                    const sem = dSemester.semester;
                    const mod = dModule.name;
                    const exa = dExam.exam;

                    console.log(`[Dualis] New grade: ${sem} - ${mod} ${exa}`);
                    
                    sendMessage(bot, sem, mod, exa);
                }
            }
        }
    }

    saveFile(dualis);
}

/**
 * Lädt die aktuellen Noten von Dualis
 */
function loadDualis(): Promise<any> {
    return new Promise(resolve => {
        exec(
            `./resource/NOTEN.sh -u ${config.username} -p ${config.password}`,
            (err, out) => {
                if(err) {
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
function loadFile(): any {
    if(!fs.existsSync(localFile)) return null;

    return JSON.parse(fs.readFileSync(localFile).toString());
}

/**
 * Überschreibt die lokale Datei mit den übergebenen Daten
 */
function saveFile(json: any) {
    fs.writeFileSync(localFile, JSON.stringify(json));
}

/**
 * Sendet eine Benachrichtigung in Discord, dass neue Noten eingetragen wurden
 */
async function sendMessage(bot: Client, semester: string, module: string, exam: string) {
    const channel = await bot.channels.fetch(config.channelId);
    if(!(channel instanceof TextChannel)) return;

    const embed = new MessageEmbed()
        .setAuthor('Dualis')
        .setTitle(`${semester} - ${module}`)
        .setDescription(exam)
        .setColor('#E74C3C');

    channel.send({ embeds: [ embed ] });
}