import { Client, MessageEmbed, TextChannel } from "discord.js";
import * as fs from "fs";
import { DATA_DIR, load } from "../util/config";
import * as util from '../util/calendar';

const localFile = DATA_DIR + 'rapla.ics';
const config = load().rapla;
const loopInterval = 1000 * 60 * 15;

/**
 * Startet den ganzen Rapla-Bums
 */
export async function start(bot: Client) {
    if(!fs.existsSync(localFile)) {
        const rapla = await util.fetchRapla(config.user, config.file);
        if(!!rapla) saveFile(rapla);
    } else {
        loop(bot);
    }

    setInterval(loop, loopInterval, bot);
}

async function loop(bot: Client) {
    console.log('[Rapla] Checking for new events...');
    
    const localCalSrc = loadFile();
    const raplaCalSrc = await util.fetchRapla(config.user, config.file);

    if(localCalSrc === '') {
        console.log('[Rapla] An error occurred while loading the local file');
        return;
    }

    if(!raplaCalSrc) {
        console.log('[Rapla] An error occurred while loading the calendar');
        return;
    }

    saveFile(raplaCalSrc);

    const localCal = util.parseCalendar(localCalSrc);
    const raplaCal = util.parseCalendar(raplaCalSrc);

    const embeds = util.compareCalendars(localCal, raplaCal);

    sendNotification(bot, embeds);

    console.log('[Rapla] Done');
}

/**
 * Lädt den Inhalt von rapla.ics und gibt ihn zurück
 */
function loadFile(): string {
    if(!fs.existsSync(localFile)) {
        console.log('[Rapla] An error occurred while loading the local file');
        return '';
    }

    return fs.readFileSync(localFile).toString();
}

/**
 * Schreibt den übergebenen Wert in rapla.ics
 */
function saveFile(calendar: string) {
    fs.writeFileSync(localFile, calendar);
}

async function sendNotification(bot: Client, embeds: MessageEmbed[]) {
    const channel = await bot.channels.fetch(config.channelId);
    if(!(channel instanceof TextChannel)) return;

    let temp: MessageEmbed[] = [];
    embeds.forEach((embed, index) => {
        temp.push(embed);

        if((index+1) % 10 === 0 || index === embeds.length - 1) {
            channel.send({ embeds: temp });
            temp = [];
        }
    });
}