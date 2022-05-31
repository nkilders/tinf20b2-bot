import * as fs from 'fs';
import { Guild } from "discord.js";
import { DATA_DIR } from "../util/config";

export const RAPLA_DIR = DATA_DIR + 'rapla/';

const CONFIG_FILE = DATA_DIR + 'rapla.json';


interface IRaplaConfig {
    [calendar:string]: IChannelData[];
}

export interface IChannelData {
    guildId: string;
    channelId: string;
}


export function onRegister(calendar: string, guildId: string, channelId: string) {
    const config = loadConfig();

    if(!config[calendar]) {
        config[calendar] = [];
    }

    // Notifier in Config einfügen
    config[calendar].push({
        guildId:   guildId,
        channelId: channelId,
    });

    saveConfig(config);
}

export function onUnregister(calendar: string, guildId: string, channelId: string) {
    const config = loadConfig();

    // Abbruch, wenn keine Notifier für den Kalender registriert sind
    if(!config[calendar]) return;

    // Notifier aus Config löschen
    config[calendar] = config[calendar].filter(e => !(
        e.guildId   === guildId   &&
        e.channelId === channelId
    ));

    // Server aus Config löschen, wenn keine Notifier mehr existieren
    if(config[calendar].length === 0) {
        delete config[calendar];
        fs.rmSync(filePathFromCalendarName(calendar));
    }

    saveConfig(config);
}

/**
 * Entfernt alle Daten des übergebenen Servers aus der Config
 */
export function onGuildDelete(guildId: string) {
    const config = loadConfig();

    for(const [calendar, channels] of Object.entries(config)) {
        // Kanäle entfernen, die zu dem Server gehören
        config[calendar] = channels.filter(c => c.guildId !== guildId);

        // Kalender entfernen, falls es keine Kanäle mehr gibt
        if(config[calendar].length === 0) {
            delete config[calendar];
            fs.rmSync(filePathFromCalendarName(calendar));
        }
    }

    saveConfig(config);
}

/**
 * Lädt alle Rapla-Notifier eines Servers aus der Config
 * und gibt sie zurück
 */
export function getGuildData(guild: Guild): IRaplaConfig | null {
    const config = loadConfig();

    for(const [calendar, channels] of Object.entries(config)) {
        // Kanäle entfernen, die nicht zum Server gehören
        config[calendar] = channels.filter(c => (
            c.guildId === guild.id
        ));

        // Kalender entfernen, falls es keine Kanäle mehr gibt
        if(config[calendar].length === 0) {
            delete config[calendar];
        }
    }

    if(Object.entries(config).length === 0) return null;

    return config;
}

/**
 * Lädt die gesamte Config und gibt sie zurück
 */
export function loadConfig(): IRaplaConfig {
    if(!fs.existsSync(CONFIG_FILE)) {
        return {};
    }

    return JSON.parse(fs.readFileSync(CONFIG_FILE).toString());
}

/**
 * Überschreibt die Config mit den übergebenen Daten
 */
export function saveConfig(config: IRaplaConfig) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function filePathFromCalendarName(name: string): string {
    return RAPLA_DIR + name.replace('/', '-') + '.ics';
}