import { CategoryChannel, Client, CommandInteraction, Guild, GuildMember, Permissions, TextChannel, VoiceChannel } from "discord.js";
import * as configMngr from './config-manager';

const ERR_MSG = 'Irgendetwas ist schiefgelaufen, versuche es später erneut :(';

export function start(bot: Client) {
    setInterval(loop, 1000 * 10, bot);
}

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
        }).then(createTextChannel);

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

const topicCooldowns = new Map<string, number>();

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

    channel.setName(topic);

    reply(interaction, 'Erledigt! :)');
}

function reply(interaction: CommandInteraction, text: string) {
    interaction.reply({
        content: text,
        ephemeral: true,
    });
}

/**
 * Erstellt neue Voice-/TextChannels, wenn alle voll sind,
 * und löscht überflüssige VoiceChannels.
 */
export function updateChannels(category: CategoryChannel) {
    // Abbruch, wenn Category nicht von AutoVC ist
    if(!configMngr.isAutoVCCategory(category)) return;

    let fullHouse = true;

    category.children.filter(ch => ch.type === 'GUILD_VOICE').sort((a, b) => a.position - b.position).forEach(vc => {
        if(vc.members.size > 0) return;

        if(fullHouse) {
            fullHouse = false;

            // Ersten leeren Channel nach oben schieben
            vc.setPosition(0);
        } else {
            // Weitere leere Channels löschen
            vc.delete();
            topicCooldowns.delete(vc.id);
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
        position: 0,
        permissionOverwrites: [
            {
                id: voiceChannel.guildId,
                deny: [ Permissions.FLAGS.VIEW_CHANNEL ],
            },
        ],
    }).then(tc => {
        tc.send('Mit `/autovc topic <Thema>` könnt ihr euren Sprachkanal umbenennen, damit andere sehen was ihr macht und dazukommen können!');
    });
}