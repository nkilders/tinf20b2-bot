package de.nkilders.tinf20b2bot;

import de.nkilders.tinf20b2bot.dyntalk.DynTalkListener;
import de.nkilders.tinf20b2bot.rapla.Rapla;
import net.dv8tion.jda.api.JDA;
import net.dv8tion.jda.api.JDABuilder;

import java.io.File;

public class Bot {
    public static final File BOT_FOLDER = new File("tinf20b2-bot");
    public static JDA jda;

    public Bot() {
        if (!BOT_FOLDER.exists()) {
            BOT_FOLDER.mkdirs();
        }

        try {
            jda = JDABuilder
                    .createDefault("Nzk5MjM1MzUyNTk4MDIwMDk2.YAAn7Q.2_2Z6JdsRC9vNFe4SRMcWkQXTHU")
                    .addEventListeners(new DynTalkListener())
                    .addEventListeners(new Rapla())
                    .setAutoReconnect(true)
                    .build();
        } catch (Exception exception) {
            exception.printStackTrace();
        }
    }
}