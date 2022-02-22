import { SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { Client, Guild } from "discord.js";
import { REST } from '@discordjs/rest';
import { Routes } from "discord-api-types/v9";
import { load } from "./config";

const config = load().bot;

export async function registerListeners(bot: Client) {
    bot.guilds.cache.forEach(g => registerCommands(bot, g));

    bot.on('guildCreate', g => registerCommands(bot, g));
}

function registerCommands(bot: Client, guild: Guild) {
    if(!bot.application?.id) return;

    const rest = new REST({ version: '9' }).setToken(config.token);

    const commands = [
        autovc(),
    ].map(cmd => cmd.toJSON());

    rest.put(
        Routes.applicationGuildCommands(bot.application?.id, guild.id),
        { body: commands },
    );
}

function autovc(): SlashCommandBuilder {
    const builder = new SlashCommandBuilder()
        .setName('autovc')
        .setDescription('AutoVC-Kanäle');

    builder
        .addSubcommand(autovcCreate())
        .addSubcommand(autovcDelete())
        .addSubcommand(autovcTopic());

    return builder;
}

function autovcCreate(): SlashCommandSubcommandBuilder {
    const builder = new SlashCommandSubcommandBuilder()
        .setName('create')
        .setDescription('Neue Kanalgruppe erstellen');

    builder
        .addStringOption(
            new SlashCommandStringOption()
                .setName('category_name')
                .setDescription('Name der Kategorie')
                .setRequired(true)
        )
        .addStringOption(
            new SlashCommandStringOption()
                .setName('channel_name')
                .setDescription('Name der Sprachkanäle')
                .setRequired(true)
        );

    return builder;
}

function autovcDelete(): SlashCommandSubcommandBuilder {
    const builder = new SlashCommandSubcommandBuilder()
        .setName('delete')
        .setDescription('Kanalgruppe löschen');

    builder
        .addStringOption(
            new SlashCommandStringOption()
                .setName('category_id')
                .setDescription('ID der Kategorie')
                .setRequired(true)
        );

    return builder;
}

function autovcTopic(): SlashCommandSubcommandBuilder {
    const builder = new SlashCommandSubcommandBuilder()
        .setName('topic')
        .setDescription('Thema eines Sprachkanals ändern');

    builder
        .addStringOption(
            new SlashCommandStringOption()
                .setName('topic')
                .setDescription('Neues Kanalthema')
                .setRequired(true)
        );

    return builder;
}