import { Client, MessageEmbed, TextChannel } from "discord.js";
import * as fs from "fs";
import * as util from '../util/calendar';
import * as configMngr from './config-manager';
import { IChannelData, filePathFromCalendarName, RAPLA_DIR } from "./config-manager";
import { registerListeners } from "./listener";

const loopInterval = 1000 * 60 * 15;

/**
 * Startet den ganzen Rapla-Bums
 */
export async function start(bot: Client) {
    registerListeners(bot);

    loop(bot);

    setInterval(loop, loopInterval, bot);
}

async function loop(bot: Client) {
    console.log('[Rapla] Checking for new events...');
    
    for(const [calendar, channels] of Object.entries(configMngr.loadConfig())) {
        console.log(`[Rapla] Checking ${calendar}...`);
        await checkCalendar(bot, calendar, channels);
    }

    console.log('[Rapla] Done');
}

async function checkCalendar(bot: Client, calName: string, channels: IChannelData[]) {
    // Kalender von Rapla laden
    const [raplaUser, raplaFile] = calName.split('/')
    const raplaCalSrc = await util.fetchRapla(raplaUser, raplaFile);

    if(!raplaCalSrc) {
        console.log(`[Rapla] An error occurred while loading the calendar ${calName}`);
        return;
    }

    // Lokale Datei laden
    const localCalSrc = loadFile(calName);
    saveFile(calName, raplaCalSrc);

    // Wenn die lokale Datei leer ist, können keine Unterschiede ermittelt werden
    if(localCalSrc === '') return;

    // Kalender-Strings zu Objekten parsen
    const localCal = util.parseCalendar(localCalSrc);
    const raplaCal = util.parseCalendar(raplaCalSrc);

    // Unterschiede zwischen altem und neuem Kalender ermitteln
    const embeds = util.compareCalendars(localCal, raplaCal);
    if(embeds.length === 0) return;

    // Benachrichtigung in Discord senden
    sendNotification(bot, channels, embeds);
}

/**
 * Lädt den Inhalt von rapla.ics und gibt ihn zurück
 */
function loadFile(name: string): string {
    if(!fs.existsSync(filePathFromCalendarName(name))) {
        console.log(`[Rapla] An error occurred while loading the local file ${name}`);
        return '';
    }

    return fs.readFileSync(filePathFromCalendarName(name)).toString();
}

/**
 * Schreibt den übergebenen Wert in rapla.ics
 */
function saveFile(name: string, calendar: string) {
    if(!fs.existsSync(RAPLA_DIR)) {
        fs.mkdirSync(RAPLA_DIR);
    }

    fs.writeFileSync(filePathFromCalendarName(name), calendar);
}


/**
 * Sendet die Embeds in embeds an alle Kanäle in channelData
 */
async function sendNotification(bot: Client, channelData: IChannelData[], embeds: MessageEmbed[]) {
    const channels: TextChannel[] = [];

    for(const cd of channelData) {
        const channel = await bot.channels.fetch(cd.channelId);
        if(!(channel instanceof TextChannel)) continue;

        channels.push(channel);
    }

    if(channels.length === 0) return;

    let temp: MessageEmbed[] = [];
    embeds.forEach((embed, index) => {
        temp.push(embed);

        if((index+1) % 10 === 0 || index === embeds.length - 1) {
            channels.forEach(c => c.send({ embeds: temp }));
            temp = [];
        }
    });
}