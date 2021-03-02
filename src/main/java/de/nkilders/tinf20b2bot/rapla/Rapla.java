package de.nkilders.tinf20b2bot.rapla;

import de.nkilders.tinf20b2bot.Bot;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.TextChannel;
import net.dv8tion.jda.api.events.ReadyEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;
import net.fortuna.ical4j.data.CalendarBuilder;
import net.fortuna.ical4j.model.Calendar;
import net.fortuna.ical4j.model.Date;
import net.fortuna.ical4j.model.component.CalendarComponent;
import net.fortuna.ical4j.model.component.VEvent;
import net.fortuna.ical4j.model.property.Uid;
import org.jetbrains.annotations.NotNull;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.PrintWriter;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.util.TimeZone;
import java.util.Timer;
import java.util.TimerTask;

public class Rapla extends ListenerAdapter {
    private final String raplaUrl = "https://rapla.dhbw-karlsruhe.de/rapla?page=ical&user=braun&file=TINF20B2";
    private final File file = new File(Bot.BOT_FOLDER, "rapla.ics");
    private final SimpleDateFormat format = new SimpleDateFormat("dd.MM.yyyy HH:mm:ss");
    private final long channelId = 799353375154110474L;

    @Override
    public void onReady(@NotNull ReadyEvent event) {
        if (!file.exists()) {
            saveFile(loadRapla());
        }

        format.setTimeZone(TimeZone.getTimeZone("UTC"));

        new Timer().schedule(new TimerTask() {
            @Override
            public void run() {
                Calendar rapla = loadRapla();
                Calendar local = loadFile();

                if (rapla != null && local != null) {
                    for (CalendarComponent cc : rapla.getComponents()) {
                        if (cc instanceof VEvent) {
                            VEvent e = (VEvent) cc;

                            // Event schon vorbei
                            if (e.getStartDate().getDate().before(Date.from(Instant.now()))) {
                                continue;
                            }

                            Uid uid = e.getUid();

                            boolean found = false;
                            for (CalendarComponent cc2 : local.getComponents()) {
                                if (cc2 instanceof VEvent) {
                                    VEvent e2 = (VEvent) cc2;

                                    if (e2.getUid().equals(uid)) {
                                        found = true;

                                        if (e.getStartDate().getDate().getTime() != e2.getStartDate().getDate().getTime()
                                                || e.getEndDate().getDate().getTime() != e2.getEndDate().getDate().getTime()) {
                                            String title = e.getDescription() != null ? e.getDescription().getValue() : (e.getSummary() != null ? e.getSummary().getValue() : null);
                                            String dozent = e.getProperty("ATTENDEE") != null && e.getProperty("ATTENDEE").getParameter("CN") != null ?
                                                    e.getProperty("ATTENDEE").getParameter("CN").getValue() : "";

                                            EmbedBuilder eb = new EmbedBuilder()
                                                    .setAuthor("Verschoben")
                                                    .setTitle(title)
                                                    .appendDescription(dozent)
                                                    .appendDescription("\n\nvorher:\nvon ")
                                                    .appendDescription(format.format(e2.getStartDate().getDate()))
                                                    .appendDescription("\nbis ")
                                                    .appendDescription(format.format(e2.getEndDate().getDate()))
                                                    .appendDescription("\n\njetzt:\nvon ")
                                                    .appendDescription(format.format(e.getStartDate().getDate()))
                                                    .appendDescription("\nbis ")
                                                    .appendDescription(format.format(e.getEndDate().getDate()))
                                                    .setColor(15844367);

                                            TextChannel tc = Bot.jda.getTextChannelById(channelId);
                                            if (tc != null) {
                                                tc.sendMessage(eb.build()).queue();
                                            }
                                        }

                                        break;
                                    }
                                }
                            }

                            if (!found) {
                                String title = e.getDescription() != null ? e.getDescription().getValue() : (e.getSummary() != null ? e.getSummary().getValue() : null);
                                String dozent = e.getProperty("ATTENDEE") != null && e.getProperty("ATTENDEE").getParameter("CN") != null ?
                                        e.getProperty("ATTENDEE").getParameter("CN").getValue() : "";

                                EmbedBuilder eb = new EmbedBuilder()
                                        .setAuthor("Neu")
                                        .setTitle(title)
                                        .appendDescription(dozent)
                                        .appendDescription("\n\nvon ")
                                        .appendDescription(format.format(e.getStartDate().getDate()))
                                        .appendDescription("\nbis ")
                                        .appendDescription(format.format(e.getEndDate().getDate()))
                                        .setColor(3066993);

                                TextChannel tc = Bot.jda.getTextChannelById(channelId);
                                if (tc != null) {
                                    tc.sendMessage(eb.build()).queue();
                                }
                            }
                        }
                    }

                    for (CalendarComponent cc : local.getComponents()) {
                        if (cc instanceof VEvent) {
                            VEvent e = (VEvent) cc;

                            // Event schon vorbei
                            if (e.getStartDate().getDate().before(Date.from(Instant.now()))) {
                                continue;
                            }

                            Uid uid = e.getUid();

                            boolean found = false;
                            for (CalendarComponent cc2 : rapla.getComponents()) {
                                if (cc2 instanceof VEvent) {
                                    VEvent e2 = (VEvent) cc2;

                                    if (e2.getUid().equals(uid)) {
                                        found = true;

                                        break;
                                    }
                                }
                            }

                            if (!found) {
                                String title = e.getDescription() != null ? e.getDescription().getValue() : (e.getSummary() != null ? e.getSummary().getValue() : null);
                                String dozent = e.getProperty("ATTENDEE") != null && e.getProperty("ATTENDEE").getParameter("CN") != null ?
                                        e.getProperty("ATTENDEE").getParameter("CN").getValue() : "";

                                EmbedBuilder eb = new EmbedBuilder()
                                        .setAuthor("Gelöscht")
                                        .setTitle(title)
                                        .appendDescription(dozent)
                                        .appendDescription("\n\nvon ")
                                        .appendDescription(format.format(e.getStartDate().getDate()))
                                        .appendDescription("\nbis ")
                                        .appendDescription(format.format(e.getEndDate().getDate()))
                                        .setColor(15158332);

                                TextChannel tc = Bot.jda.getTextChannelById(channelId);
                                if (tc != null) {
                                    tc.sendMessage(eb.build()).queue();
                                }
                            }
                        }
                    }

                    saveFile(rapla);
                }
            }
        }, 0, 1000 * 60 * 5);
    }

    private Calendar loadRapla() {
        try {
            CalendarBuilder builder = new CalendarBuilder();
            return builder.build(new URL(raplaUrl).openStream());
        } catch (Exception exception) {
            exception.printStackTrace();
        }

        return null;
    }

    private void saveFile(Calendar calendar) {
        try {
            PrintWriter writer = new PrintWriter(new FileOutputStream(file));
            writer.print(calendar.toString());
            writer.flush();
            writer.close();
        } catch (Exception exception) {
            exception.printStackTrace();
        }
    }

    private Calendar loadFile() {
        try {
            CalendarBuilder builder = new CalendarBuilder();
            return builder.build(new FileInputStream(file));
        } catch (Exception exception) {
            exception.printStackTrace();
        }

        return null;
    }
}