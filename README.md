# TINF20B2-Bot

Ein Discord-Bot mit praktischen Funktionen für Studierende der DHBW Karlsruhe.

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