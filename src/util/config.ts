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
    applicationId: string;
}

export interface IRaplaConfig {
    url: string;
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
            applicationId: ''
        },
        dualis: {
            username: 'nachname.vorname@dh-karlsruhe.de',
            password: '',
            channelId: ''
        },
        rapla: {
            url: 'https://rapla.dhbw-karlsruhe.de/rapla?page=ical&user=USER&file=FILE',
            channelId: ''
        }
    };
}