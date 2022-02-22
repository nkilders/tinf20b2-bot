import { CategoryChannel, Client, GuildMember, Permissions, TextChannel, VoiceChannel } from "discord.js";
import * as cmdHandler from "./command-handler";
import * as configMngr from './config-manager';

export function start(bot: Client) {
    setInterval(loop, 1000 * 10, bot);
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
            cmdHandler.clearTopicCooldown(vc.id);
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
export function createTextChannel(voiceChannel: VoiceChannel) {
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