package de.nkilders.tinf20b2bot.dyntalk;

import net.dv8tion.jda.api.entities.Category;
import net.dv8tion.jda.api.entities.Guild;
import net.dv8tion.jda.api.entities.VoiceChannel;

import java.util.List;

public class DynTalkManager {
    final String CATEGORY_NAME = "Talks";
    final String CHANNEL_NAME = "Talk";

    public void createChannel(Guild guild) {
        List<Category> categories = guild.getCategoriesByName(CATEGORY_NAME, true);

        if (categories.isEmpty()) {
            guild.createCategory(CATEGORY_NAME).queue(cat -> {
                cat.createVoiceChannel(CHANNEL_NAME).queue();
            });
        } else {
            Category category = categories.get(0);

            if (category.getVoiceChannels().isEmpty()) {
                category.createVoiceChannel(CHANNEL_NAME).queue();
            }
        }
    }

    public boolean isDynTalkChannel(VoiceChannel channel) {
        return channel.getName().equalsIgnoreCase(CHANNEL_NAME)
                && channel.getParent() != null
                && channel.getParent().getName().equalsIgnoreCase(CATEGORY_NAME);
    }

    public void updateChannels(VoiceChannel channel) {
        if (isDynTalkChannel(channel)) {
            Category category = channel.getParent();

            boolean fullHouse = true;
            for (VoiceChannel vc : category.getVoiceChannels()) {
                if (vc.getMembers().isEmpty()) {
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
            }

            // neuen Channel erstellen, wenn alle anderen voll sind...
            if (fullHouse) {
                category.createVoiceChannel(CHANNEL_NAME).queue(vc -> {
                    // ... und nach oben moven
                    category.modifyVoiceChannelPositions()
                            .selectPosition(vc)
                            .moveTo(0)
                            .queue();
                });
            }
        }
    }
}
