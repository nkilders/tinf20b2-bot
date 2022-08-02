import { Guild, PermissionsBitField, User } from "discord.js";

export async function isAdmin(guild: Guild, user: User) {
    return hasPermission(guild, user, PermissionsBitField.Flags.Administrator);
}

export async function hasPermission(guild: Guild, user: User, ...permissions: bigint[]) {
    try {
        const member = await guild.members.fetch(user.id);

        return member.permissions.has([permissions]);
    } catch(err) {
        return false;
    }
}