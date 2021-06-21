package de.nkilders.tinf20b2bot.rapla;

import de.nkilders.tinf20b2bot.Bot;
import de.nkilders.tinf20b2bot.Config;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.MessageEmbed;
import net.dv8tion.jda.api.entities.TextChannel;
import net.dv8tion.jda.api.events.ReadyEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;
import net.fortuna.ical4j.data.CalendarBuilder;
import net.fortuna.ical4j.model.Calendar;
import net.fortuna.ical4j.model.Date;
import net.fortuna.ical4j.model.component.CalendarComponent;
import net.fortuna.ical4j.model.component.VEvent;
import org.jetbrains.annotations.NotNull;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.PrintWriter;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.util.Timer;
import java.util.TimerTask;

public class Rapla extends ListenerAdapter {
    private final File file = new File(Bot.BOT_FOLDER, "rapla.ics");
    private final SimpleDateFormat format = new SimpleDateFormat("dd.MM.yyyy HH:mm:ss");

    @Override
    public void onReady(@NotNull ReadyEvent event) {
        if (!file.exists()) {
            saveFile(loadRapla());
        }

        new Timer().schedule(new TimerTask() {
            @Override
            public void run() {
                Calendar rapla = loadRapla();
                Calendar local = loadFile();

                if (rapla == null || local == null) return;

                // Prüft, ob ein neues Event erstellt oder ein bereits vorhandenes verschoben wurde
                for (CalendarComponent rComponent : rapla.getComponents()) {
                    if (!(rComponent instanceof VEvent)) continue;

                    VEvent rEvent = (VEvent) rComponent;

                    // Event schon vorbei? => kann übersprungen werden
                    if (rEvent.getStartDate().getDate().before(Date.from(Instant.now()))) continue;

                    // Prüft, ob im lokalen Kalender ein Event mit der gleichen UID wie "rEvent" existiert
                    // Falls ja => Prüft, ob das Event zeitlich verschoben wurde
                    boolean found = false;
                    for (CalendarComponent lComponent : local.getComponents()) {
                        if (!(lComponent instanceof VEvent)) continue;

                        VEvent lEvent = (VEvent) lComponent;

                        if (lEvent.getUid().equals(rEvent.getUid())) {
                            found = true;

                            if (rEvent.getStartDate().getDate().getTime() != lEvent.getStartDate().getDate().getTime()
                                    || rEvent.getEndDate().getDate().getTime() != lEvent.getEndDate().getDate().getTime()) {
                                TextChannel tc = Bot.jda.getTextChannelById(Config.RAPLA_CHANNEL_ID);
                                if (tc != null) tc.sendMessage(embedUpdate(lEvent, rEvent)).queue();
                            }

                            break;
                        }
                    }

                    // Kein Event mit der gleichen UID gefunden? => "rEvent" wurde neu erstellt
                    if (!found) {
                        TextChannel tc = Bot.jda.getTextChannelById(Config.RAPLA_CHANNEL_ID);
                        if (tc != null) tc.sendMessage(embedNew(rEvent)).queue();
                    }
                }

                // Prüft, ob ein Event gelöscht wurde
                for (CalendarComponent lComponent : local.getComponents()) {
                    if (!(lComponent instanceof VEvent)) continue;

                    VEvent lEvent = (VEvent) lComponent;

                    // Event schon vorbei? => kann übersprungen werden
                    if (lEvent.getStartDate().getDate().before(Date.from(Instant.now()))) continue;

                    // Prüft, ob in Rapla ein Event mit der gleichen UID wie "lEvent" existiert
                    boolean found = false;
                    for (CalendarComponent rComponent : rapla.getComponents()) {
                        if (rComponent instanceof VEvent) {
                            VEvent rEvent = (VEvent) rComponent;

                            if (rEvent.getUid().equals(lEvent.getUid())) {
                                found = true;

                                break;
                            }
                        }
                    }

                    // Kein Event mit der gleichen UID gefunden? => "lEvent" wurde gelöscht
                    if (!found) {
                        TextChannel tc = Bot.jda.getTextChannelById(Config.RAPLA_CHANNEL_ID);
                        if (tc != null) tc.sendMessage(embedDelete(lEvent)).queue();
                    }
                }

                saveFile(rapla);
            }
        }, 0, 1000 * 60 * 5);
    }

    // Lädt den Kalender von Rapla
    private Calendar loadRapla() {
        try {
            return new CalendarBuilder().build(new URL(Config.RAPLA_URL).openStream());
        } catch (Exception exception) {
            exception.printStackTrace();
        }

        return null;
    }

    // Speichert einen Kalender lokal ab
    private void saveFile(Calendar calendar) {
        try (PrintWriter writer = new PrintWriter(new FileOutputStream(file))) {
            writer.print(calendar.toString());
        } catch (Exception exception) {
            exception.printStackTrace();
        }
    }

    // Lädt den lokal gespeicherten Kalender
    private Calendar loadFile() {
        try {
            return new CalendarBuilder().build(new FileInputStream(file));
        } catch (Exception exception) {
            exception.printStackTrace();
        }

        return null;
    }

    private String title(VEvent event) {
        if (event.getDescription() == null) {
            if (event.getSummary() == null) return "???";

            return event.getSummary().getValue();
        }

        return event.getDescription().getValue();
    }

    private String dozent(VEvent event) {
        if (event.getProperty("ATTENDEE") == null) return "";
        if (event.getProperty("ATTENDEE").getParameter("CN") == null) return "";

        return event.getProperty("ATTENDEE").getParameter("CN").getValue();
    }

    private MessageEmbed embedNew(VEvent event) {
        return new EmbedBuilder()
                .setAuthor("Neu")
                .setTitle(title(event))
                .appendDescription(dozent(event))
                .appendDescription("\n\nvon ")
                .appendDescription(format.format(event.getStartDate().getDate()))
                .appendDescription("\nbis ")
                .appendDescription(format.format(event.getEndDate().getDate()))
                .setColor(3066993)
                .build();
    }

    private MessageEmbed embedUpdate(VEvent oldEvent, VEvent newEvent) {
        return new EmbedBuilder()
                .setAuthor("Verschoben")
                .setTitle(title(newEvent))
                .appendDescription(dozent(newEvent))
                .appendDescription("\n\nvorher:\nvon ")
                .appendDescription(format.format(oldEvent.getStartDate().getDate()))
                .appendDescription("\nbis ")
                .appendDescription(format.format(oldEvent.getEndDate().getDate()))
                .appendDescription("\n\njetzt:\nvon ")
                .appendDescription(format.format(newEvent.getStartDate().getDate()))
                .appendDescription("\nbis ")
                .appendDescription(format.format(newEvent.getEndDate().getDate()))
                .setColor(15844367)
                .build();
    }

    private MessageEmbed embedDelete(VEvent event) {
        return new EmbedBuilder()
                .setAuthor("Gelöscht")
                .setTitle(title(event))
                .appendDescription(dozent(event))
                .appendDescription("\n\nvon ")
                .appendDescription(format.format(event.getStartDate().getDate()))
                .appendDescription("\nbis ")
                .appendDescription(format.format(event.getEndDate().getDate()))
                .setColor(15158332)
                .build();
    }
}