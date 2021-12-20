import * as fs from "fs";

export const DATA_DIR = './bot-data/';
const CONFIG_FILE = DATA_DIR + 'config.json';

export interface IConfig {
    bot: IBotConfig;
    rapla: IRaplaConfig;
    dualis: IDualisConfig;
}

export interface IBotConfig {
    token: string;
}

export interface IRaplaConfig {
    user: string;
    file: string;
    channelId: string;
}

export interface IDualisConfig {
    username: string;
    password: string;
    channelId: string;
}

export function init() {
    if(!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR);
    }

    if(!fs.existsSync(CONFIG_FILE)) {
        fs.writeFileSync(
            CONFIG_FILE,
            JSON.stringify(blank(), null, 4)
        );

        console.log('Created config.json');
        console.log('Go, enter your data ;)');

        process.exit();
    }
}

export function load(): IConfig {
    return JSON.parse(fs.readFileSync(CONFIG_FILE).toString());
}

function blank(): IConfig {
    return {
        bot: {
            token: '',
        },
        dualis: {
            username: 'nachname.vorname@dh-karlsruhe.de',
            password: '',
            channelId: '',
        },
        rapla: {
            user: '',
            file: '',
            channelId: '',
        },
    };
}