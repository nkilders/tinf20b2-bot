import { CategoryChannel, CommandInteraction, Guild, GuildMember, Permissions, TextChannel } from "discord.js";
import * as channelMngr from './channel-manager';
import * as configMngr from './config-manager';

const ERR_MSG = 'Irgendetwas ist schiefgelaufen, versuche es später erneut :(';

const topicCooldowns = new Map<string, number>();

/**
 * Event-Handler für "/autovc"-Commands
 */
 export async function handleAutoVCCommand(interaction: CommandInteraction) {
    if(!interaction.guild) return;

    switch(interaction.options.getSubcommand()) {
        case 'create':
            const categoryName = interaction.options.getString('category_name');
            if(!categoryName) {
                reply(interaction, 'Fehlender Parameter: category_name');
                return;
            }

            const channelName = interaction.options.getString('channel_name');
            if(!channelName) {
                reply(interaction, 'Fehlender Parameter: channel_name');
                return;
            }

            handleCreateCommand(interaction, interaction.guild, categoryName, channelName);
            break;

        case 'delete':
            const categoryId = interaction.options.getString('category_id');
            if(!categoryId) {
                reply(interaction, 'Fehlender Parameter: category_id');
                return;
            }

            handleDeleteCommand(interaction, interaction.guild, categoryId);
            break;

        case 'topic':
            const topic = interaction.options.getString('topic');
            if(!topic) {
                reply(interaction, 'Fehlender Parameter: topic');
                return;
            }

            if(!(interaction.member instanceof GuildMember)) {
                reply(interaction, ERR_MSG);
                return;
            }

            handleTopicCommand(interaction, interaction.member, topic);
            break;

        default:
            reply(interaction, 'Diesen Befehl kenne ich leider nicht :(');
            return;
    }
}

/**
 * Event-Handler für "/autovc create"-Commands
 */
async function handleCreateCommand(interaction: CommandInteraction, guild: Guild, categoryName: string, channelName: string) {
    try {
        const member = await guild.members.fetch(interaction.user.id);

        if(!member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            reply(interaction, 'Nur Administratoren dürfen diesen Befehl benutzen!');
            return;
        }
    } catch(err) {
        reply(interaction, ERR_MSG);
        return;
    }

    // Category erstellen
    guild.channels.create(categoryName, {
        type: 'GUILD_CATEGORY',
        position: 0,
    }).then(cat => {
        // Config-Eintrag erstellen
        configMngr.onCreate(guild.id, cat.id, categoryName, channelName);

        // Voice- und TextChannel erstellen
        guild.channels.create(channelName, {
            type: 'GUILD_VOICE',
            parent: cat,    
        }).then(channelMngr.createTextChannel);

        reply(interaction, 'Erledigt! :)');
    });
}

/**
 * Event-Handler für "/autovc delete"-Commands
 */
async function handleDeleteCommand(interaction: CommandInteraction, guild: Guild, categoryId: string) {
    try {
        const member = await guild.members.fetch(interaction.user.id);

        if(!member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            reply(interaction, 'Nur Administratoren dürfen diesen Befehl benutzen!');
            return;
        }
    } catch(err) {
        reply(interaction, ERR_MSG);
        return;
    }

    const category = await guild.channels.fetch(categoryId);
    if(!(category instanceof CategoryChannel)) return;
    if(!configMngr.isAutoVCCategory(category)) return;

    configMngr.onDelete(guild.id, categoryId);

    category.children.forEach(c => c.delete());
    category.delete();
    
    reply(interaction, 'Erledigt! :)');
}

/**
 * Event-Handler für "/autovc topic"-Commands
 */
function handleTopicCommand(interaction: CommandInteraction, member: GuildMember, topic: string) {
    const {voice} = member;

    if(!voice.channel) {
        reply(interaction, 'Du muss in einem Sprachkanal sein um diesen Befehl benutzen zu können!');
        return;
    }

    const parent = voice.channel.parent;
    if(!parent || !configMngr.isAutoVCCategory(parent)) {
        reply(interaction, 'Du darfst diesen Sprachkanal nicht umbenennen!');
        return;
    }

    const {channel} = voice;
    const cooldown = topicCooldowns.get(channel.id);
    if(!!cooldown) {
        const diff = new Date().getTime() - cooldown;
        if(diff < 1000 * 60 * 5) {
            reply(interaction, `Dieser Befehl darf nur alle 5 Minuten genutzt werden, bitte warte einen Moment!`);
            return;
        }
    }

    topicCooldowns.set(channel.id, new Date().getTime());
    
    const ch = channel.parent?.children.find(ch => ch instanceof TextChannel && ch.name === channel.id);
    if(ch instanceof TextChannel) {
        ch.send(`${member.displayName} hat das Kanalthema zu "${topic}" geändert!`);
    }

    channel.setName(topic);

    reply(interaction, 'Erledigt! :)');
}

function reply(interaction: CommandInteraction, text: string) {
    interaction.reply({
        content: text,
        ephemeral: true,
    });
}

export function clearTopicCooldown(channelId: string) {
    topicCooldowns.delete(channelId);
}