import * as fs from 'fs';
import { Guild } from "discord.js";
import { DATA_DIR } from "../util/config";

const CONFIG_FILE = DATA_DIR + 'rapla.json';


interface IConfig {
    [guildId:string]: INotifierEntry[];
}

interface INotifierEntry {
    channelId: string;
    raplaUser: string;
    raplaFile: string;
}


/**
 * Fügt einen neuen AutoVC-Datensatz der Config hinzu
 */
export function onRegister(guildId: string, channelId: string, raplaUser: string, raplaFile: string) {
    const config = loadConfig();

    if(!config[guildId]) {
        config[guildId] = [];
    }

    config[guildId].push({
        channelId: channelId,
        raplaUser: raplaUser,
        raplaFile: raplaFile,
    });

    saveConfig(config);
}

/**
 * Entfernt einen bestimmten AutoVC-Datensatz aus der Config
 */
export function onUnregister(guildId: string, channelId: string, raplaUser: string, raplaFile: string) {
    const config = loadConfig();

    // Abbruch, wenn keine Notifier für den Server registriert sind
    if(!config[guildId]) return;

    // Notifier aus Config löschen
    config[guildId] = config[guildId].filter(e => !(
        e.channelId === channelId &&
        e.raplaUser === raplaUser &&
        e.raplaFile === raplaFile
    ));

    // Server aus Config löschen, wenn keine Notifier mehr existieren
    if(config[guildId].length === 0) {
        delete config[guildId];
    }

    saveConfig(config);
}

/**
 * Entfernt alle Daten des übergebenen Servers aus der Config
 */
export function onGuildDelete(guildId: string) {
    const config = loadConfig();

    delete config[guildId];

    saveConfig(config);
}

/**
 * Lädt alle AutoVC-Datensätze eines Servers aus der Config
 * und gibt sie zurück
 */
export function getGuildData(guild: Guild): INotifierEntry[] {
    return loadConfig()[guild.id] || [];
}

/**
 * Lädt die gesamte Config und gibt sie zurück
 */
export function loadConfig(): IConfig {
    if(!fs.existsSync(CONFIG_FILE)) {
        return {};
    }

    return JSON.parse(fs.readFileSync(CONFIG_FILE).toString());
}

/**
 * Überschreibt die Config mit den übergebenen Daten
 */
export function saveConfig(config: IConfig) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}