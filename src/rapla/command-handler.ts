import { CommandInteraction, Guild } from "discord.js";
import * as configMngr from './config-manager';

const ERR_MSG = 'Irgendetwas ist schiefgelaufen, versuche es später erneut :(';

/**
 * Event-Handler für "/rapla"-Commands
 */
 export async function handleRaplaCommand(interaction: CommandInteraction) {
    if(!interaction.guild) return;

    let channel, raplaUser, raplaFile;

    switch(interaction.options.getSubcommand()) {
        case 'register':
            channel = interaction.options.getChannel('channel');
            if(!channel) {
                reply(interaction, 'Fehlender Parameter: channel');
                return;
            }

            raplaUser = interaction.options.getString('rapla_user');
            if(!raplaUser) {
                reply(interaction, 'Fehlender Parameter: rapla_user');
                return;
            }

            raplaFile = interaction.options.getString('rapla_file');
            if(!raplaFile) {
                reply(interaction, 'Fehlender Parameter: rapla_file');
                return;
            }

            handleRegisterCommand(interaction, interaction.guild, channel.id, raplaUser, raplaFile);
            break;

        case 'list':
            handleListCommand(interaction, interaction.guild);
            break;

        case 'unregister':
            channel = interaction.options.getChannel('channel');
            if(!channel) {
                reply(interaction, 'Fehlender Parameter: channel');
                return;
            }

            raplaUser = interaction.options.getString('rapla_user');
            if(!raplaUser) {
                reply(interaction, 'Fehlender Parameter: rapla_user');
                return;
            }

            raplaFile = interaction.options.getString('rapla_file');
            if(!raplaFile) {
                reply(interaction, 'Fehlender Parameter: rapla_file');
                return;
            }

            handleUnregisterCommand(interaction, interaction.guild, channel.id, raplaUser, raplaFile);
            break;

        default:
            reply(interaction, 'Diesen Befehl kenne ich leider nicht :(');
            return;
    }
}

/**
 * Event-Handler für "/rapla register"-Commands
 */
async function handleRegisterCommand(interaction: CommandInteraction, guild: Guild, channelId: string, raplaUser: string, raplaFile: string) {
    configMngr.onRegister(guild.id, channelId, raplaUser, raplaFile);

    reply(interaction, 'Erledigt! :)');
}

/**
 * Event-Handler für "/rapla list"-Commands
 */
async function handleListCommand(interaction: CommandInteraction, guild: Guild) {
    const data = configMngr.getGuildData(guild);

    let msg = 'Auf diesem Server sind noch keine Rapla-Notifier registriert :(';

    if(data.length > 0) {
        msg = 'Rapla-Notifier auf diesem Server:';

        data.forEach(e => {
            msg += `\n<#${e.channelId}> ${e.raplaUser}/${e.raplaFile}`;
        });
    }

    reply(interaction, msg);
}

/**
 * Event-Handler für "/rapla unregister"-Commands
 */
function handleUnregisterCommand(interaction: CommandInteraction, guild: Guild, channelId: string, raplaUser: string, raplaFile: string) {
    configMngr.onUnregister(guild.id, channelId, raplaUser, raplaFile);

    reply(interaction, 'Erledigt! :)');
}


function reply(interaction: CommandInteraction, text: string) {
    interaction.reply({
        content: text,
        ephemeral: true,
    });
}