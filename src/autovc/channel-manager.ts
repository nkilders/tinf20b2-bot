import { CategoryChannel, Client, CommandInteraction, Guild, GuildMember, Interaction, Permissions, TextChannel, VoiceChannel } from "discord.js";
import * as configMngr from './config-manager';

export function start(bot: Client) {


    setInterval(loop, 1000 * 10, bot);
}

/**
 * Event-Handler für "/autovc"-Commands
 */
export async function handleAutoVCCommand(interaction: CommandInteraction) {
    if(!interaction.guild) return;

    try {
        const member = await interaction.guild.members.fetch(interaction.user.id);

        if(!member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            interaction.reply('Only Administrators may use this command!');
            return;
        }
    } catch(err) {
        interaction.reply('An error occurred. Please try again later.');
        return;
    }

    switch(interaction.options.getSubcommand()) {
        case 'create':
            const categoryName = interaction.options.getString('category_name');
            if(categoryName === null) break;

            const channelName = interaction.options.getString('channel_name');
            if(channelName === null) break;

            handleCreateCommand(interaction.guild, categoryName, channelName);
            break;

        case 'delete':
            const categoryId = interaction.options.getString('category_id');
            if(categoryId === null) break;

            handleDeleteCommand(interaction.guild, categoryId);
            break;

        default:
            interaction.reply('Invalid Subcommand');
            break;
    }

    interaction.reply('Done :)');
}

/**
 * Event-Handler für "/autovc create"-Commands
 */
function handleCreateCommand(guild: Guild, categoryName: string, channelName: string) {
    // Category erstellen
    guild.channels.create(categoryName, {
        type: 'GUILD_CATEGORY',
        position: 0
    }).then(cat => {
        // Config-Eintrag erstellen
        configMngr.onCreate(guild.id, cat.id, categoryName, channelName);

        // Voice- und TextChannel erstellen
        guild.channels.create(channelName, {
            type: 'GUILD_VOICE',
            parent: cat     
        }).then(createTextChannel);
    });
}

/**
 * Event-Handler für "/autovc delete"-Commands
 */
async function handleDeleteCommand(guild: Guild, categoryId: string) {
    const category = await guild.channels.fetch(categoryId);
    if(!(category instanceof CategoryChannel)) return;
    if(!configMngr.isAutoVCCategory(category)) return;

    configMngr.onDelete(guild.id, categoryId);

    category.children.forEach(c => c.delete());
    category.delete();
}

export function updateChannels(category: CategoryChannel) {
    // Abbruch, wenn Category nicht von AutoVC ist
    if(!configMngr.isAutoVCCategory(category)) return;

    let fullHouse = true;

    category.children.filter(ch => ch.type === 'GUILD_VOICE').forEach(vc => {
        if(vc.members.size > 0) return;

        if(fullHouse) {
            fullHouse = false;

            // Ersten leeren Channel nach oben schieben
            vc.setPosition(0);
        } else {
            // Weitere leere Channels löschen
            vc.delete();
        }
    });

    const data = configMngr.getData(category);
    if(!data) return;

    // Neuen Channel erstellen, wenn alle anderen voll sind
    if(fullHouse) {
        category.guild.channels.create(data.channelName, {
            type: 'GUILD_VOICE',
            parent: category
        }).then(vc => {
            vc.setPosition(0);
            createTextChannel(vc);
        });
    }
}

/**
 * Gibt/nimmt Membern Rechte für private TextChannels, wenn sie die dazugehörigen VoiceChannel betreten/verlassen
 */
export function updatePermissionOverwrites(member: GuildMember, oldVC: VoiceChannel | null, newVC: VoiceChannel | null) {
    if(oldVC && oldVC.parent && configMngr.isAutoVCCategory(oldVC.parent)) {
        oldVC.parent.children.forEach(tc => {
            if(!(tc instanceof TextChannel)) return;
            if(tc.name !== oldVC.id) return;

            tc.permissionOverwrites.delete(member);
        });
    }

    if(newVC && newVC.parent && configMngr.isAutoVCCategory(newVC.parent)) {
        newVC.parent.children.forEach(tc => {
            if(!(tc instanceof TextChannel)) return;
            if(tc.name !== newVC.id) return;

            tc.permissionOverwrites.create(member, {
                VIEW_CHANNEL: true
            });
        })
    }
}

/**
 * Löscht überflüssige TextChannels
 */
function loop(bot: Client) {
    bot.guilds.cache.forEach(guild => {
        const guildData = configMngr.getGuildData(guild);
        if(!guildData) return;

        guildData.forEach(async data => {
            let cat;
            try {
                cat = await guild.channels.fetch(data.categoryId);
            } catch(err) {
                configMngr.onDelete(guild.id, data.categoryId);
                return;
            }

            if(!(cat instanceof CategoryChannel)) return;

            cat.children.forEach(async tc => {
                if(!(tc instanceof TextChannel)) return;

                try {
                    await guild.channels.fetch(tc.name);
                } catch(err) {
                    tc.delete();
                    return;
                }
            });
        });
    });
}

/**
 * Erstellt einen privaten TextChannel zu einem gegebenen VoiceChannel
 */
function createTextChannel(voiceChannel: VoiceChannel) {
    if(!voiceChannel.parent) return;

    voiceChannel.guild.channels.create(voiceChannel.id, {
        type: 'GUILD_TEXT',
        topic: ':warning: Dieser Kanal wird gelöscht, wenn ihr euren Sprachkanal verlasst! :warning:',
        parent: voiceChannel.parent,
        permissionOverwrites: [
            {
                id: voiceChannel.guildId,
                deny: [ Permissions.FLAGS.VIEW_CHANNEL ]
            }
        ]
    });
}