import { Client, StageChannel, VoiceChannel, VoiceState } from "discord.js";
import * as channelMngr from "./channel-manager";
import * as configMngr from './config-manager';

export function registerListeners(bot: Client) {
    channelMngr.start(bot);

    bot.on('voiceStateUpdate', (oldVs, newVs) => {
        updateChannels(oldVs, newVs);
        updatePermissionOverwrites(oldVs, newVs);
    })

    .on('guildDelete', guild => {
        configMngr.onGuildDelete(guild.id);
    })
    
    .on('interactionCreate', async interaction => {
        if(!interaction.isCommand()) return;
        if(interaction.commandName !== 'autovc') return;

        channelMngr.handleAutoVCCommand(interaction);
    });
}

function updateChannels(oldVs: VoiceState, newVs: VoiceState) {
    // Abbruch, wenn ChannelID unverändert ist
    if(oldVs.channelId === newVs.channelId) return;

    const channel = oldVs.channel !== null ? oldVs.channel : newVs.channel;
    // Abbruch, wenn Channel kein VoiceChannel ist
    if(!(channel instanceof VoiceChannel)) return;

    // Abbruch, wenn Channel in keiner Category ist
    if(channel.parent == null) return;

    channelMngr.updateChannels(channel.parent);
}

function updatePermissionOverwrites(oldVs: VoiceState, newVs: VoiceState) {
    // Abbruch, wenn member == null
    if(!newVs.member) return;

    // Abbruch, wenn ChannelID unverändert ist
    if(oldVs.channelId === newVs.channelId) return;

    // Abbruch, wenn keine Interaktion mit einem VoiceChannel stattgefunden hat
    const oldChannel = oldVs.channel;
    const newChannel = newVs.channel;
    if(!(oldChannel instanceof VoiceChannel || newChannel instanceof VoiceChannel)) return;

    if(oldChannel instanceof StageChannel || newChannel instanceof StageChannel) return;

    channelMngr.updatePermissionOverwrites(newVs.member, oldChannel, newChannel);
}