import { CommandInteraction, Guild } from "discord.js";
import { isAdmin } from "../util/permission";
import * as configMngr from './config-manager';

/**
 * Event-Handler für "/rapla"-Commands
 */
 export async function handleRaplaCommand(interaction: CommandInteraction) {
    if(!interaction.guild) return;
    
    if(!await isAdmin(interaction.guild, interaction.user)) {
        reply(interaction, 'Du benötigtst Administrator-Rechte, um diesen Befehl nutzen zu können!');
        return;
    }

    switch(interaction.options.getSubcommand()) {
        case 'register':
            handleRegisterCommand(interaction, interaction.guild);
            break;

        case 'list':
            handleListCommand(interaction, interaction.guild);
            break;

        case 'unregister':
            handleUnregisterCommand(interaction, interaction.guild);
            break;

        default:
            reply(interaction, 'Diesen Befehl kenne ich leider nicht :(');
            return;
    }
}

/**
 * Event-Handler für "/rapla register"-Commands
 */
async function handleRegisterCommand(interaction: CommandInteraction, guild: Guild) {
    const channel = interaction.options.getChannel('channel');
    if(!channel) {
        reply(interaction, 'Fehlender Parameter: channel');
        return;
    }

    const raplaUser = interaction.options.getString('rapla_user');
    if(!raplaUser) {
        reply(interaction, 'Fehlender Parameter: rapla_user');
        return;
    }

    const raplaFile = interaction.options.getString('rapla_file');
    if(!raplaFile) {
        reply(interaction, 'Fehlender Parameter: rapla_file');
        return;
    }

    configMngr.onRegister(`${raplaUser}/${raplaFile}`, guild.id, channel.id);

    reply(interaction, 'Erledigt! :)');
}

/**
 * Event-Handler für "/rapla list"-Commands
 */
async function handleListCommand(interaction: CommandInteraction, guild: Guild) {
    const data = configMngr.getGuildData(guild);

    if(!data) {
        reply(interaction, 'Auf diesem Server sind noch keine Rapla-Notifier registriert :(');
        return;
    }

    let msg = 'Rapla-Notifier auf diesem Server:';

    for(const [calendar, channels] of Object.entries(data)) {
        const channelStr = channels.map(ch => `<#${ch.channelId}>`).join(' ');

        msg += `\n\`${calendar}\` ${channelStr}`;
    }

    reply(interaction, msg);
}

/**
 * Event-Handler für "/rapla unregister"-Commands
 */
function handleUnregisterCommand(interaction: CommandInteraction, guild: Guild) {
    const channel = interaction.options.getChannel('channel');
    if(!channel) {
        reply(interaction, 'Fehlender Parameter: channel');
        return;
    }

    const raplaUser = interaction.options.getString('rapla_user');
    if(!raplaUser) {
        reply(interaction, 'Fehlender Parameter: rapla_user');
        return;
    }

    const raplaFile = interaction.options.getString('rapla_file');
    if(!raplaFile) {
        reply(interaction, 'Fehlender Parameter: rapla_file');
        return;
    }

    configMngr.onUnregister(`${raplaUser}/${raplaFile}`, guild.id, channel.id);

    reply(interaction, 'Erledigt! :)');
}


function reply(interaction: CommandInteraction, text: string) {
    interaction.reply({
        content: text,
        ephemeral: true,
    });
}