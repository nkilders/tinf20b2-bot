import { Client } from "discord.js";
import * as commandHandler from './command-handler';

export function registerListeners(bot: Client) {
    bot.on('interactionCreate', async interaction => {
        if(!interaction.isCommand()) return;
        if(interaction.commandName !== 'rapla') return;

        commandHandler.handleRaplaCommand(interaction);
    });
}