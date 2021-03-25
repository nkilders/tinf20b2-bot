package de.nkilders.tinf20b2bot;

import com.kaaz.configuration.ConfigurationBuilder;
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
            new ConfigurationBuilder(Config.class, new File(BOT_FOLDER, "bot.cfg")).build(false);

            jda = JDABuilder
                    .createDefault(Config.BOT_TOKEN)
                    .addEventListeners(new DynTalkListener())
                    .addEventListeners(new Rapla())
                    .setAutoReconnect(true)
                    .build();
        } catch (Exception exception) {
            exception.printStackTrace();
        }
    }
}