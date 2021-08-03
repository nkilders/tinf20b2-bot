package de.nkilders.tinf20b2bot.dualis;

import de.nkilders.tinf20b2bot.Bot;
import de.nkilders.tinf20b2bot.Config;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.TextChannel;
import net.dv8tion.jda.api.events.ReadyEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;
import org.jetbrains.annotations.NotNull;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.*;
import java.util.Timer;
import java.util.TimerTask;

public class Dualis extends ListenerAdapter {
    private final File file = new File(Bot.BOT_FOLDER, "dualis.json");
    private final long TIMER_PERIOD = 1000 * 60 * 15;

    @Override
    public void onReady(@NotNull ReadyEvent event) {
        long timerDelay = 0L;

        if (!file.exists()) {
            System.out.println("[Dualis] Could not find local file. Creating it...");
            timerDelay = TIMER_PERIOD;
            saveFile(loadDualis());
        }

        new Timer().schedule(new Manni(), timerDelay, TIMER_PERIOD);
    }

    private class Manni extends TimerTask {
        @Override
        public void run() {
            System.out.println("[Dualis] Checking for new grades...");

            JSONArray dualis = loadDualis();
            JSONArray local = loadFile();

            if (dualis == null) {
                System.err.println("[Dualis] An error occurred while loading the grades");
                return;
            }

            if (local == null) {
                System.err.println("[Dualis] An error occurred while loading the local file");
                return;
            }

            if (dualis.toString().equals(local.toString())) {
                System.out.println("[Dualis] Nothing has changed");
                return;
            }

            for (int semester = 0; semester < local.length() && semester < dualis.length(); semester++) {
                JSONObject dSemester = dualis.getJSONObject(semester);
                JSONObject lSemester = local.getJSONObject(semester);

                JSONArray dModules = dSemester.getJSONArray("modules");
                JSONArray lModules = lSemester.getJSONArray("modules");

                for (int module = 0; module < lModules.length() && module < dModules.length(); module++) {
                    JSONObject dModule = dModules.getJSONObject(module);
                    JSONObject lModule = lModules.getJSONObject(module);

                    JSONArray dExams = dModule.getJSONArray("exams");
                    JSONArray lExams = lModule.getJSONArray("exams");

                    for (int exam = 0; exam < lExams.length() && exam < dExams.length(); exam++) {
                        JSONObject dExam = dExams.getJSONObject(exam);
                        JSONObject lExam = lExams.getJSONObject(exam);

                        if (lExam.getString("grade").equals("-") && !dExam.getString("grade").equals("-")) {
                            System.out.println(String.format("[Dualis] New grade: %s - %s %s",
                                    dSemester.getString("semester"),
                                    dModule.getString("name"),
                                    dExam.getString("exam")
                            ));

                            sendMessage(
                                    dSemester.getString("semester"),
                                    dModule.getString("name"),
                                    dExam.getString("exam")
                            );
                        }
                    }
                }
            }

            saveFile(dualis);
            System.out.println("[Dualis] Done");
        }
    }

    private JSONArray loadDualis() {
        try {
            String[] cmd = {"/bin/bash", "resource/NOTEN.sh", "-u", Config.DUALIS_USERNAME, "-p", Config.DUALIS_PASSWORD};
            Process p = Runtime.getRuntime().exec(cmd);
            p.waitFor();

            BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()));
            String line;
            StringBuilder sb = new StringBuilder();

            while ((line = reader.readLine()) != null) {
                sb.append(sb.length() == 0 ? "" : "\n").append(line);
            }

            return new JSONArray(sb.toString());
        } catch (JSONException | InterruptedException | IOException exception) {
            exception.printStackTrace();
        }

        return null;
    }

    private void saveFile(JSONArray json) {
        try (PrintWriter writer = new PrintWriter(new FileWriter(file))) {
            writer.print(json.toString());
        } catch (IOException exception) {
            exception.printStackTrace();
        }
    }

    private JSONArray loadFile() {
        try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
            String line;
            StringBuilder sb = new StringBuilder();

            while ((line = reader.readLine()) != null) {
                sb.append(sb.length() == 0 ? "" : "\n").append(line);
            }

            return new JSONArray(sb.toString());
        } catch (JSONException | IOException exception) {
            exception.printStackTrace();
        }

        return null;
    }

    private void sendMessage(String semester, String module, String exam) {
        TextChannel tc = Bot.jda.getTextChannelById(Config.DUALIS_CHANNEL_ID);

        if (tc == null) {
            System.err.println("[Dualis] Could not find TextChannel#" + Config.DUALIS_CHANNEL_ID);
            return;
        }

        EmbedBuilder eb = new EmbedBuilder()
                .setAuthor("Dualis")
                .setTitle(semester + " - " + module)
                .setDescription(exam)
                .setColor(15158332);

        tc.sendMessage(eb.build()).queue();
    }
}