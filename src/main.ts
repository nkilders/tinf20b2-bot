import * as config from "./util/config";

config.init();

import { Client, Intents } from "discord.js";
import * as slashCommands from './util/slash-commands';
import * as autovc from './autovc/listener';
import * as dualis from "./dualis/dualis";
import * as rapla from './rapla/rapla';

const botConfig = config.load().bot;

const bot = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES,
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