import * as fs from 'fs';
import { CategoryChannel, Guild } from "discord.js";
import { DATA_DIR } from "../util/config";

const CONFIG_FILE = DATA_DIR + 'autovc.json';

/*

    Struktur der Config-Datei:

    {
        "guildId1": [
            IData,
            IData
        ],
        "guildId2": [
            IData,
            IData
        ]
    }

*/

/**
 * Struktur eines AutoVC-Datensatzes
 */
export interface IData {
    categoryId: string;
    categoryName: string;
    channelName: string;
}

/**
 * Fügt einen neuen AutoVC-Datensatz der Config hinzu
 */
export function onCreate(guildId: string, categoryId: string, categoryName: string, channelName: string) {
    const config = loadConfig();

    if(!config[guildId]) {
        config[guildId] = [];
    }

    config[guildId].push({
        categoryId: categoryId,
        categoryName: categoryName,
        channelName: channelName
    });

    saveConfig(config);
}

/**
 * Entfernt einen bestimmten AutoVC-Datensatz aus der Config
 */
export function onDelete(guildId: string, categoryID: string) {
    const config = loadConfig();

    if(!config[guildId]) return;

    config[guildId] = config[guildId].filter((obj: any) => obj['categoryId'] !== categoryID);

    saveConfig(config);
}

/**
 * Entfernt alle AutoVC-Daten des übergebenen Servers aus der Config
 */
export function onGuildDelete(guildId: string) {
    const config = loadConfig();

    delete config[guildId];

    saveConfig(config);
}

/**
 * Gibt true zurück, falls die übergebene Category in der Config existiert,
 * andernfalls wird false zurückgegeben
 */
export function isAutoVCCategory(category: CategoryChannel): boolean {
    const config = loadConfig();

    if(!config[category.guildId]) return false;

    for(let cat of config[category.guildId]) {
        if(cat.categoryId == category.id) {
            return true;
        }
    }

    return false;
}

/**
 * Lädt alle AutoVC-Datensätze eines Servers aus der Config
 * und gibt sie zurück
 */
export function getGuildData(guild: Guild): IData[] | undefined {
    return loadConfig()[guild.id];
}

/**
 * Lädt den AutoVC-Datensatz einer Category aus der Config
 * und gibt ihn zurück
 */
export function getData(category: CategoryChannel): IData | null {
    const guildData = getGuildData(category.guild);
    if(!guildData) return null;

    for(const data of guildData) {
        if(data.categoryId == category.id) {
            return data;
        }
    }

    return null;
}

/**
 * Lädt die gesamte Config und gibt sie zurück
 */
export function loadConfig() {
    if(!fs.existsSync(CONFIG_FILE)) {
        return {};
    }

    return JSON.parse(fs.readFileSync(CONFIG_FILE).toString());
}

/**
 * Überschreibt die Config mit den übergebenen Daten
 */
export function saveConfig(config: any) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}