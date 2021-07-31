package de.nkilders.tinf20b2bot.dyntalk;

import de.nkilders.tinf20b2bot.Bot;
import net.dv8tion.jda.api.Permission;
import net.dv8tion.jda.api.entities.Category;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.VoiceChannel;

import java.util.EnumSet;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;

public class DynTalkManager {
    final String CATEGORY_NAME = "Talks";
    final String VC_NAME = "Talk";
    final String TC_TOPIC = ":warning: Dieser Kanal wird gelöscht, wenn ihr euren Sprachkanal verlasst! :warning:";

    public void setup(Guild guild) {
        Category category = getCategory(guild);

        if (category == null) {
            guild.createCategory(CATEGORY_NAME).queue(cat -> {
                cat.createVoiceChannel(VC_NAME).queue(this::createTextChannel);
            });
        } else if (category.getVoiceChannels().isEmpty()) {
            category.createVoiceChannel(VC_NAME).queue(this::createTextChannel);
        }

        new Timer().schedule(new Oskar(), 0, 5000);
    }

    public void updateChannels(Guild guild) {
        Category category = getCategory(guild);
        if (category == null) return;

        boolean fullHouse = true;

        for (VoiceChannel vc : category.getVoiceChannels()) {
            if (!vc.getMembers().isEmpty()) continue;

            if (fullHouse) {
                fullHouse = false;

                // ersten leeren Channel nach oben moven
                category.modifyVoiceChannelPositions()
                        .selectPosition(vc)
                        .moveTo(0)
                        .queue();
            } else {
                // weitere leere Channels löschen
                vc.delete().queue();
            }
        }

        // neuen Channel erstellen, wenn alle anderen voll sind...
        if (fullHouse) {
            category.createVoiceChannel(VC_NAME).queue(vc -> {
                // ... und nach oben moven
                category.modifyVoiceChannelPositions()
                        .selectPosition(vc)
                        .moveTo(0)
                        .queue();

                createTextChannel(vc);
            });
        }
    }

    private Category getCategory(Guild guild) {
        List<Category> categories = guild.getCategoriesByName(CATEGORY_NAME, false);

        if (categories.isEmpty()) return null;

        return categories.get(0);
    }

    private void createTextChannel(VoiceChannel voiceChannel) {
        getCategory(voiceChannel.getGuild()).createTextChannel(voiceChannel.getId())
                .setTopic(TC_TOPIC)
                // Channel für @everyone unsichtbar machen
                .addPermissionOverride(voiceChannel.getGuild().getPublicRole(), null, EnumSet.of(Permission.VIEW_CHANNEL))
                .queue();
    }

    private class Oskar extends TimerTask {

        @Override
        public void run() {
            Bot.jda.getGuilds().forEach(g -> {
                Category c = getCategory(g);
                if (c == null) return;

                c.getTextChannels().forEach(tc -> {
                    VoiceChannel vc = g.getVoiceChannelById(tc.getName());

                    // Lösche TC, wenn es keinen dazugehörigen VC gibt
                    if (vc == null) {
                        tc.delete().queue();
                        return;
                    }

                    // Member hat Rechte im TC, aber ist nicht im VC -> Rechte entfernen
                    tc.getMemberPermissionOverrides().forEach(p -> {
                        if (!vc.getMembers().contains(p.getMember())) {
                            p.delete().queue();
                        }
                    });

                    // Member ist im VC, aber hat keine Rechte für TC -> Rechte geben
                    vc.getMembers().forEach(m -> {
                        if (tc.getPermissionOverride(m) == null) {
                            tc.createPermissionOverride(m).queue(p -> {
                                p.getManager().grant(Permission.VIEW_CHANNEL).queue();
                            });
                        }
                    });
                });
            });
        }
    }
}