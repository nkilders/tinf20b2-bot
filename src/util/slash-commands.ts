import { SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { Client } from "discord.js";
import { REST } from '@discordjs/rest';
import { Routes } from "discord-api-types/v9";
import { load } from "./config";

const config = load().bot;

export async function registerListeners(bot: Client) {
    bot.on('guildCreate', guild => {
        const rest = new REST({ version: '9' }).setToken(config.token);

        const commands = [
            autovc()
        ].map(cmd => cmd.toJSON());

        rest.put(
            Routes.applicationGuildCommands(config.applicationId, guild.id),
            { body: commands }
        );
    });
}

function autovc(): SlashCommandBuilder {
    const builder = new SlashCommandBuilder()
        .setName('autovc')
        .setDescription('Manage AutoVC Channels');

    builder
        .addSubcommand(autovcCreate())
        .addSubcommand(autovcDelete());

    return builder;
}

function autovcCreate(): SlashCommandSubcommandBuilder {
    const builder = new SlashCommandSubcommandBuilder()
        .setName('create')
        .setDescription('Create a new channel group');

    builder
        .addStringOption(
            new SlashCommandStringOption()
                .setName('category_name')
                .setDescription('Category\'s name')
                .setRequired(true)
        )
        .addStringOption(
            new SlashCommandStringOption()
                .setName('channel_name')
                .setDescription('Channel\'s name')
                .setRequired(true)
        );

    return builder;
}

function autovcDelete(): SlashCommandSubcommandBuilder {
    const builder = new SlashCommandSubcommandBuilder()
        .setName('delete')
        .setDescription('Delete an existing channel');

    builder
        .addStringOption(
            new SlashCommandStringOption()
                .setName('category_id')
                .setDescription('Category\'s id')
                .setRequired(true)
        );

    return builder;
}