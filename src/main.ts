import * as config from "./util/config";

config.init();

import { Client, Intents } from "discord.js";
import * as dualis from "./dualis/dualis";

const botConfig = config.load().bot;

const bot = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES
    ]
});

bot.once('ready', () => {
    console.log('[Bot] Ready');
    
    dualis.start(bot);
});

bot.login(botConfig.token);