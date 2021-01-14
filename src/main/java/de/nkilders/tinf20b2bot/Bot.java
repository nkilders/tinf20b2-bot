package de.nkilders.tinf20b2bot;

import de.nkilders.tinf20b2bot.dyntalk.DynTalkListener;
import net.dv8tion.jda.api.JDABuilder;

public class Bot {

    public Bot() {
        try {
            JDABuilder
                    .createDefault("Nzk5MjM1MzUyNTk4MDIwMDk2.YAAn7Q.2_2Z6JdsRC9vNFe4SRMcWkQXTHU")
                    .addEventListeners(new DynTalkListener())
                    .build();
        } catch (Exception exception) {
            exception.printStackTrace();
        }
    }
}