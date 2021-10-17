import * as fs from 'fs';
import { CategoryChannel, Guild } from "discord.js";
import { DATA_DIR, load } from "../util/config";

const CONFIG_FILE = DATA_DIR + 'autovc.json';

export interface IData {
    categoryId: string;
    categoryName: string;
    channelName: string;
}

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

export function onDelete(guildId: string, categoryID: string) {
    const config = loadConfig();

    if(!config[guildId]) return;

    config[guildId] = config[guildId].filter((obj: any) => obj['categoryId'] !== categoryID);

    saveConfig(config);
}

export function onGuildDelete(guildId: string) {
    const config = loadConfig();

    delete config[guildId];

    saveConfig(config);
}

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

export function getGuildData(guild: Guild): IData[] | undefined {
    return loadConfig()[guild.id];
}

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

export function loadConfig() {
    if(!fs.existsSync(CONFIG_FILE)) {
        return {};
    }

    return JSON.parse(fs.readFileSync(CONFIG_FILE).toString());
}

export function saveConfig(config: any) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/*

{
    "16498754547876465": [
        {
            "categoryId": "",
            "categoryName": "",
            "channelName": ""
        }
    ]
}

*/