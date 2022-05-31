import { SlashCommandBuilder, SlashCommandChannelOption, SlashCommandStringOption, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { Client, Guild } from "discord.js";
import { REST } from '@discordjs/rest';
import { Routes, ChannelType, GatewayVersion } from "discord-api-types/v10";
import { load } from "./config";

const config = load().bot;

export async function registerListeners(bot: Client) {
    bot.guilds.cache.forEach(g => registerCommands(bot, g));

    bot.on('guildCreate', g => registerCommands(bot, g));
}

function registerCommands(bot: Client, guild: Guild) {
    if(!bot.application?.id) return;

    const rest = new REST({ version: GatewayVersion }).setToken(config.token);

    const commands = [
        autovc(),
        rapla(),
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




function rapla(): SlashCommandBuilder {
    const builder = new SlashCommandBuilder()
        .setName('rapla')
        .setDescription('Rapla');

    builder
        .addSubcommand(raplaRegister())
        .addSubcommand(raplaList())
        .addSubcommand(raplaUnregister());

    return builder;
}

function raplaRegister(): SlashCommandSubcommandBuilder {
    const builder = new SlashCommandSubcommandBuilder()
        .setName('register')
        .setDescription('Neuen Rapla-Notifier registrieren');

    addRaplaCommandOptions(builder);

    return builder;
}

function raplaList(): SlashCommandSubcommandBuilder {
    return new SlashCommandSubcommandBuilder()
        .setName('list')
        .setDescription('Registrierte Rapla-Notifiers auflisten');
}

function raplaUnregister(): SlashCommandSubcommandBuilder {
    const builder = new SlashCommandSubcommandBuilder()
        .setName('unregister')
        .setDescription('Rapla-Notifier löschen');

    addRaplaCommandOptions(builder);

    return builder;
}

function addRaplaCommandOptions(builder: SlashCommandSubcommandBuilder) {
    builder
        .addChannelOption(
            new SlashCommandChannelOption()
                .setName('channel')
                .setDescription('Textkanal')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        )
        .addStringOption(
            new SlashCommandStringOption()
                .setName('rapla_user')
                .setDescription('"user" aus der Rapla-URL')
                .setRequired(true)
        )
        .addStringOption(
            new SlashCommandStringOption()
                .setName('rapla_file')
                .setDescription('"file" aus der Rapla-URL')
                .setRequired(true)
        );
}