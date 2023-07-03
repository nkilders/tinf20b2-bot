# TINF20B2-Bot

Ein Discord-Bot mit praktischen Funktionen für Studierende der DHBW Karlsruhe.

## Status

Da mein Studium an der DHBW vorbei ist, werde ich nicht weiter an diesem Projekt arbeiten. Die Funktionsfähigkeit des Bots ist somit nicht mehr gewährleistet. Der Code darf aber gerne als Basis für neue Projekte verwendet werden.

## Funktionen

### AutoVC

Erstellt automatisch neue Sprachkanäle, sobald keine leeren mehr vorhanden sind. Zu jedem Sprachkanal wird außerdem ein temporärer Textkanal erstellt, den nur die Personen in jenem Sprachkanal sehen/nutzen können. Die Kanäle werden in einer Kanal-Kategorie gruppiert.

![AutoVC](/images/autovc.png)

### Rapla-Notifier

Sendet Benachrichtigungen, wenn es Änderungen (Neue Termine, Terminverschiebungen, Ausfälle) in Rapla gibt.

![Embed: Rapla neu](/images/embed-rapla-neu.png)
![Embed: Rapla verschoben](/images/embed-rapla-verschoben.png)
![Embed: Rapla gelöscht](/images/embed-rapla-gelöscht.png)

### Dualis-Notifier

Basiert auf der [Dualis-API von neinkob15](https://github.com/neinkob15/Dualis-API). \
Sendet Benachrichtigungen, wenn neue Noten in Dualis eingetragen wurden.

![Embed: Dualis](/images/embed-dualis.png)

## Befehle

### `/autovc create <category_name> <channel_name>`

Benötigt Administrator-Rechte.

Erstellt eine neue Kategorie mit AutoVC-Kanälen.

### `/autovc delete <category_id>`

Benötigt Administrator-Rechte.

Löscht eine existierende AutoVC-Kategorie mit allen darinliegenden Kanälen.

### `/autovc topic <topic>`

Kann von jedem genutzt werden, um das Thema seines aktuellen Sprachkanals zu ändern. Das Thema wird im Namen des Kanals angezeigt, damit andere sehen, woran man gerade arbeitet, und bei Interesse dazukommen können.

### `/rapla register <channel> <rapla_user> <rapla_file>`

Benötigt Administrator-Rechte.

Registriert einen neuen Rapla-Notifier im Textkanal `channel`. Die Parameter `rapla_user` und `rapla_file` können aus der Rapla-URL entnommen werden:

`https://rapla.dhbw-karlsruhe.de/rapla?page=calendar&user=<rapla_user>&file=<rapla_file>`.

### `/rapla unregister <channel> <rapla_user> <rapla_file>`

Benötigt Administrator-Rechte.

Löscht einen existierenden Rapla-Notifier.

### `/rapla list`

Benötigt Administrator-Rechte.

Listet alle registrierten Rapla-Notifier für den Server auf, auf dem der Befehl ausgeführt wird.

## Installation

Zuerst müssen bei Discord eine neue App und ein Bot User erstellt werden (s. [Discord Developer Docs](https://discord.com/developers/docs/getting-started)).
Wichtig: beim Hinzufügen des Bots zu einem Server muss der Scope `applications.commands` ausgewählt werden!

Als nächstes kann der TINF20B2-Bot über folgenden Befehl als Docker Container gestartet werden:

```bash
docker run -d \
  -v ~/tinf20b2-bot:/usr/src/tinf20b2-bot/bot-data \
  --name=tinf20b2-bot \
  --restart=unless-stopped \
  -e TZ=Europe/Berlin \
  ghcr.io/nkilders/tinf20b2-bot:latest
```

Beim ersten Start erstellt er eine Config-Datei, in die u. A. der Token des zuvor erstellen Bot Users eingetragen werden muss. Sobald die Config ausgefüllt und der Container neu gestartet wurde, kann der Bot mit all seinen Funktionen genutzt werden.
