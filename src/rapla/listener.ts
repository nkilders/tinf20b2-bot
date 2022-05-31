import { Client } from "discord.js";
import * as commandHandler from './command-handler';
import * as configMngr from './config-manager';

export function registerListeners(bot: Client) {
    bot.on('guildDelete', guild => {
        configMngr.onGuildDelete(guild.id);
    })
    
    .on('interactionCreate', async interaction => {
        if(!interaction.isCommand()) return;
        if(interaction.commandName !== 'rapla') return;

        commandHandler.handleRaplaCommand(interaction);
    });
}