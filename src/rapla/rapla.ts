import { Client, MessageEmbed, TextChannel } from "discord.js";
import * as fs from "fs";
import { get } from "https";
import { DATA_DIR, load } from "../util/config";
import * as ical from 'node-ical';

const localFile = DATA_DIR + 'rapla.ics';
const config = load().rapla;
const loopInterval = 1000 * 60 * 15;

/**
 * Startet den ganzen Rapla-Bums
 */
export async function start(bot: Client) {
    if(!fs.existsSync(localFile)) {
        const rapla = await fetchRapla();
        if(!!rapla) saveFile(rapla);
    } else {
        loop(bot);
    }

    setInterval(loop, loopInterval, bot);
}

async function loop(bot: Client) {

}

function fetchRapla(): Promise<ical.CalendarResponse | null> {
    return new Promise(resolve => {
        get(config.url, resp => {
            let buffer = '';

            resp.on('data', data => buffer += data )
                .on('close', () => resolve(ical.sync.parseICS(buffer)) )
                .on('error', () => resolve(null) );
        });
    });
}

function loadFile(): ical.CalendarResponse | null {
    if(!fs.existsSync(localFile)) {
        console.log('[Rapla] An error occurred while loading the local file');
        return null;
    }

    return ical.sync.parseICS(fs.readFileSync(localFile).toString());
}

function saveFile(calendar: ical.CalendarResponse) {
    // fs.writeFileSync(localFile, );
}

async function sendNotification(bot: Client) {
    const channel = await bot.channels.fetch(config.channelId);
    if(!(channel instanceof TextChannel)) return;

    const embed = new MessageEmbed()
        .setAuthor('Rapla')
        .setTitle('')

    channel.send({ embeds: [ embed ] });
}