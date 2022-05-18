# TINF20B2-Bot

Ein Discord-Bot mit praktischen Funktionen für Studierende der DHBW Karlsruhe.

## Funktionen

### AutoVC

Erstellt automatisch neue Sprachkanäle, sobald keine leeren mehr vorhanden sind. Zu jedem Sprachkanal wird außerdem ein temporärer Textkanal erstellt, den nur die Personen in jenem Sprachkanal sehen/nutzen können.

Über folgenden Befehl kann jedes Servermitglied das Thema seines aktuellen Sprachkanals ändern. Das Thema wird im Namen des Kanals angezeigt, damit andere sehen, woran man gerade arbeit, und bei Interesse dazukommen können.

#### `/autovc topic <topic>`

Jedes Servermitglied mit Administrator-Rechten kann folgende Befehle nutzen, um neue Kanäle zu erstellen oder bereits vorhandene zu löschen.

#### `/autovc create <category_name> <channel_name>`

#### `/autovc delete <category_id>`

### Rapla-Notifier

Sendet Benachrichtigungen, wenn es Änderungen (Neue Termine, Terminverschiebungen, Ausfälle) in Rapla gibt.

![Embed: Rapla neu](/images/embed-rapla-neu.png)
![Embed: Rapla verschoben](/images/embed-rapla-verschoben.png)
![Embed: Rapla gelöscht](/images/embed-rapla-gelöscht.png)

### Dualis-Notifier

Basiert auf der [Dualis-API von neinkob15](https://github.com/neinkob15/Dualis-API). \
Sendet Benachrichtigungen, wenn neue Noten in Dualis eingetragen wurden.

![Embed: Dualis](/images/embed-dualis.png)