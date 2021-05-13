package de.nkilders.tinf20b2bot.dualis;

import de.nkilders.tinf20b2bot.Bot;
import de.nkilders.tinf20b2bot.Config;
import net.dv8tion.jda.api.EmbedBuilder;
import net.dv8tion.jda.api.entities.TextChannel;
import net.dv8tion.jda.api.events.ReadyEvent;
import net.dv8tion.jda.api.hooks.ListenerAdapter;
import org.jetbrains.annotations.NotNull;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.*;
import java.util.Timer;
import java.util.TimerTask;

public class Dualis extends ListenerAdapter {
    private final File file = new File(Bot.BOT_FOLDER, "dualis.json");

    @Override
    public void onReady(@NotNull ReadyEvent event) {
        if (!file.exists()) {
            saveFile(loadDualis());
        }

        new Timer().schedule(new TimerTask() {
            @Override
            public void run() {
                JSONArray dualis = loadDualis();
                JSONArray local = loadFile();

                if (dualis == null || local == null) return;
                if (dualis.toString().equals(local.toString())) return;

                for (int semester = 0; semester < local.length(); semester++) {
                    JSONObject dSemester = dualis.getJSONObject(semester);
                    JSONObject lSemester = local.getJSONObject(semester);

                    JSONArray dModules = dSemester.getJSONArray("modules");
                    JSONArray lModules = lSemester.getJSONArray("modules");

                    for (int module = 0; module < lModules.length(); module++) {
                        JSONObject dModule = dModules.getJSONObject(module);
                        JSONObject lModule = lModules.getJSONObject(module);

                        JSONArray dExams = dModule.getJSONArray("exams");
                        JSONArray lExams = lModule.getJSONArray("exams");

                        for (int exam = 0; exam < lExams.length(); exam++) {
                            JSONObject dExam = dExams.getJSONObject(exam);
                            JSONObject lExam = lExams.getJSONObject(exam);

                            if (lExam.getString("grade").equals("-") && !dExam.getString("grade").equals("-")) {
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
            }
        }, 0, 1000 * 60 * 15);
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
        } catch (Exception exception) {
            exception.printStackTrace();
        }

        return null;
    }

    private void saveFile(JSONArray json) {
        try (PrintWriter writer = new PrintWriter(new FileWriter(file))) {
            writer.print(json.toString());
        } catch (Exception exception) {
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
        } catch (Exception exception) {
            exception.printStackTrace();
        }

        return null;
    }

    private void sendMessage(String semester, String module, String exam) {
        EmbedBuilder eb = new EmbedBuilder()
                .setAuthor("Dualis")
                .setTitle(semester + " - " + module)
                .setDescription(exam)
                .setColor(15158332);

        TextChannel tc = Bot.jda.getTextChannelById(Config.DUALIS_CHANNEL_ID);
        if (tc != null) {
            tc.sendMessage(eb.build()).queue();
        }
    }
}