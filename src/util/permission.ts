import { Guild, Permissions, User } from "discord.js";

export async function isAdmin(guild: Guild, user: User) {
    return hasPermission(guild, user, Permissions.FLAGS.ADMINISTRATOR);
}

export async function hasPermission(guild: Guild, user: User, ...permissions: bigint[]) {
    try {
        const member = await guild.members.fetch(user.id);

        return permissions.every(p => member.permissions.has(p));
    } catch(err) {
        return false;
    }
}