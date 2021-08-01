package de.nkilders.tinf20b2bot.dyntalk;

import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.events.ReadyEvent;
import net.dv8tion.jda.api.events.guild.GuildJoinEvent;
import net.dv8tion.jda.api.events.guild.voice.GuildVoiceJoinEvent;
import net.dv8tion.jda.api.events.guild.voice.GuildVoiceLeaveEvent;
import net.dv8tion.jda.api.events.guild.voice.GuildVoiceMoveEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;
import org.jetbrains.annotations.NotNull;

public class DynTalkListener extends ListenerAdapter {
    private final DynTalkManager manager;

    public DynTalkListener() {
        this.manager = new DynTalkManager();
    }

    @Override
    public void onReady(@NotNull ReadyEvent e) {
        for (Guild g : e.getJDA().getGuilds()) {
            manager.setup(g);
        }
    }

    @Override
    public void onGuildJoin(@NotNull GuildJoinEvent e) {
        manager.setup(e.getGuild());
    }

    @Override
    public void onGuildVoiceJoin(@NotNull GuildVoiceJoinEvent e) {
        manager.updateChannels(e.getGuild());
    }

    @Override
    public void onGuildVoiceMove(@NotNull GuildVoiceMoveEvent e) {
        manager.updateChannels(e.getGuild());
    }

    @Override
    public void onGuildVoiceLeave(@NotNull GuildVoiceLeaveEvent e) {
        manager.updateChannels(e.getGuild());
    }
}