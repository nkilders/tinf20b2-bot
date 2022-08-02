import * as config from "./util/config";

config.init();

import { Client } from "discord.js";
import * as slashCommands from './util/slash-commands';
import * as autovc from './autovc/listener';
import * as dualis from "./dualis/dualis";
import * as rapla from './rapla/rapla';

const botConfig = config.load().bot;

const bot = new Client({
    intents: [
        'Guilds',
        'GuildMessages',
        'GuildVoiceStates',
    ]
});

bot.once('ready', () => {
    console.log('[Bot] Ready');
    
    slashCommands.registerListeners(bot);

    autovc.registerListeners(bot);
    dualis.start(bot);
    rapla.start(bot);
});

bot.login(botConfig.token);