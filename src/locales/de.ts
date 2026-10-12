import type { Messages } from "./en.ts";

export const de: Messages = {
  "meta.title": "USB Meter Web – Viewer für Bluetooth-USB-Tester (ATorch UD18, J7-C)",

  "top.tagline": "Live-Messwerte Ihres Bluetooth-USB-Testers, direkt im Browser",
  "top.connect": "Messgerät verbinden",
  "top.demo": "Demo ausprobieren",
  "top.disconnect": "Trennen",
  "top.help": "Hilfe",
  "top.language": "Sprache",

  "pill.idle": "Nicht verbunden",
  "pill.connecting": "Wird verbunden…",
  "pill.live": "Verbunden",
  "pill.demo": "Demo",

  "status.start":
    "Stecken Sie das Messgerät ein, wählen Sie „Messgerät verbinden“ und dann Ihr Messgerät in der Liste aus.",
  "status.choosing": "Wählen Sie Ihr Messgerät in der Bluetooth-Liste des Browsers aus…",
  "status.noneChosen":
    "Kein Messgerät ausgewählt. Ein Messgerät wird nur aufgelistet, solange es in der Nähe ist und Strom hat, sein Bluetooth eingeschaltet ist und nichts anderes damit verbunden ist, etwa eine Smartphone-App oder ein anderer Tab.",
  "status.reading": "Messwerte von {name} werden empfangen.",
  "status.readingUnnamed": "Messwerte von einem Messgerät ohne Bluetooth-Namen werden empfangen.",
  "status.readingUnknown":
    "Messwerte von {name} werden empfangen. Diese Seite kennt den Namen noch nicht. Melden Sie ihn über die Hilfe als „{exact}“, damit er aufgenommen werden kann.",
  "status.lost":
    "Die Verbindung zum Messgerät wurde getrennt. Wählen Sie „Messgerät verbinden“, um sie wiederherzustellen.",
  "status.disconnected":
    "Verbindung getrennt. Die aufgezeichneten Messwerte sind unten weiterhin zu sehen.",
  "status.demo":
    "Angezeigt werden erfundene Messwerte eines simulierten Ladegeräts. Es ist nichts verbunden.",
  "status.failed": "Verbindung fehlgeschlagen: {reason}",
  "error.noGatt": "Dieses Gerät bietet keine GATT-Verbindung an.",
  "error.noSerialService":
    "Dieses Gerät hat keinen seriellen Bluetooth-Dienst (0xFFE0), der Messwerte überträgt. Möglicherweise ist es kein unterstütztes Messgerät.",

  "hint.notListed":
    "Messgerät nicht in der Liste? <b>Ziehen Sie es ab, stecken Sie es wieder ein und wählen Sie sofort erneut „Messgerät verbinden“.</b> Manche Messgeräte lassen sich nur finden, kurz nachdem sie Strom bekommen haben. Fehlt es immer noch? <all>Alle Bluetooth-Geräte anzeigen</all>",
  "note.checksum":
    "Dieses Messgerät verwendet nicht die ATorch-Prüfsumme, daher werden die Messwerte angezeigt, ohne dass die Prüfsumme überprüft wird.",
  "note.unsupported":
    "Dieser Browser kann nicht mit Bluetooth-Geräten kommunizieren. Verwenden Sie Chrome oder Edge auf einem Computer oder einem Android-Smartphone; unter Linux muss in Chrome zuerst eine Einstellung aktiviert werden (siehe Hilfe). Die Demo funktioniert überall.",

  "range.legend": "Zeitraum",
  "range.1min": "1 min",
  "range.10min": "10 min",
  "range.1h": "1 h",
  "range.all": "Alles",
  "action.csv": "CSV herunterladen",
  "action.aiExport": "Export für KI",
  "action.clear": "Löschen",

  "panels.title": "Live-Messwerte und Verlauf",
  "metric.voltage": "Spannung",
  "metric.current": "Strom",
  "metric.power": "Leistung",
  "metric.temperature": "Temperatur",
  "metric.frequency": "Frequenz",
  "metric.pf": "Leistungsfaktor",
  "panel.dataLines": "Datenleitungen",
  "panel.overTime": "{name} im Zeitverlauf",
  "stat.min": "Min",
  "stat.avg": "Mittel",
  "stat.max": "Max",
  "plot.empty": "Noch keine Daten",
  "totals.title": "Gesamtwerte",
  "totals.capacity": "Kapazität",
  "totals.energy": "Energie",
  "totals.elapsed": "Dauer",

  "export.about":
    "Lädt eine ZIP-Datei herunter, die Ihre Messwerte und eine erklärende README-Datei enthält – bereit zur Weitergabe an Claude, ChatGPT oder einen anderen KI-Assistenten. Geben Sie an, was Sie gemessen haben, damit der Assistent weiß, worauf er achten soll.",
  "export.purpose": "Was haben Sie gemessen?",
  "export.notes": "Hinweise für den Assistenten <optional>optional</optional>",
  "export.notesExample": "65-W-Ladegerät, 1-m-Kabel, Smartphone anfangs bei 20 %",
  "export.cancel": "Abbrechen",
  "export.download": "ZIP herunterladen",
  "purpose.charging": "Gerät laden",
  "purpose.charger": "Ladegerät oder Netzteil testen",
  "purpose.powerBank": "Powerbank oder Akku messen",
  "purpose.cable": "Kabel prüfen",
  "purpose.draw": "Leistungsaufnahme eines Geräts oder Projekts",
  "purpose.appliance": "Stromverbrauch eines Haushaltsgeräts",
  "purpose.other": "Etwas anderes",

  "help.title": "Über diesen Viewer",
  "help.about":
    "Viele günstige USB-Tester haben Bluetooth, doch ihre Smartphone-Apps brauchen lange zum Koppeln, sind voller Werbung oder werden nicht mehr aktualisiert. Diese Seite liest denselben Bluetooth-Datenstrom direkt aus und zeigt alle Messwerte auf einem einzigen Dashboard: Spannung, Strom, Leistung, Temperatur und die USB-Datenleitungen erhalten je ein Diagramm, alle auf derselben Zeitachse. Bewegen Sie den Mauszeiger über ein Diagramm, um alle Werte zu diesem Zeitpunkt abzulesen, und laden Sie die gesamte Aufzeichnung als CSV oder als ZIP für KI-Assistenten herunter. Sie müssen nichts installieren und brauchen kein Konto.",

  "help.use.title": "So gehen Sie vor",
  "help.use.open": "Öffnen Sie diese Seite in Chrome oder Edge.",
  "help.use.plug":
    "Stecken Sie das Messgerät zwischen ein Ladegerät und das Gerät, das Sie messen möchten. War es bereits eingesteckt, ziehen Sie es ab und stecken Sie es wieder ein: Manche Messgeräte, darunter das J7-C, lassen sich nur finden, kurz nachdem sie Strom bekommen haben.",
  "help.use.connect":
    "Wählen Sie sofort <b>Messgerät verbinden</b> und dann das Messgerät in der Liste aus. Ein J7-C erscheint als UC96_BLE, ATorch-Messgeräte erscheinen unter ihrem Modellnamen, etwa UD18-BLE oder AT24-BLE. Die Messwerte werden unmittelbar danach angezeigt.",

  "help.ai.title": "Aufzeichnung mit KI auswerten",
  "help.ai.about":
    "<b>Export für KI</b> lädt eine ZIP-Datei mit zwei Dateien herunter: Ihre Messwerte als CSV und eine README-Datei, die einem KI-Assistenten erklärt, was aufgezeichnet wurde, was jede Spalte bedeutet, was ein solches Messgerät messen kann und was nicht und wie der von Ihnen durchgeführte Test auszuwerten ist: Ladevorgang, Ladegerät, Powerbank, Kabel oder Leistungsaufnahme eines Geräts. Geben Sie die ZIP-Datei an Claude, ChatGPT oder einen anderen Assistenten weiter und stellen Sie Ihre Frage, zum Beispiel wie lange der Ladevorgang gedauert hat, ob das Ladegerät die Spannung gehalten hat oder wie viel eine Powerbank tatsächlich liefert. Falls der Assistent keine ZIP-Dateien annimmt, entpacken Sie die Datei und geben Sie ihm beide Dateien.",
  "help.ai.language":
    "Die README-Datei ist auf Englisch verfasst. Fragen Sie in Ihrer eigenen Sprache, dann antwortet der Assistent auch in dieser Sprache.",
  "help.ai.private":
    "Auch dabei sendet die Seite nichts nach außen. Die Datei gelangt nur dorthin, wohin Sie sie selbst weitergeben.",
  "help.ai.skill":
    "Für Claude gibt es außerdem einen Skill mit derselben Anleitung, damit Claude sie auch dann zur Hand hat, wenn nur die CSV-Datei vorliegt. <download>Laden Sie den Claude-Skill herunter</download> und fügen Sie diese ZIP-Datei in Claude hinzu (<how>so fügen Sie einen Skill hinzu</how>).",

  "help.meters.title": "Unterstützte Messgeräte",
  "help.meters.meter": "Messgerät",
  "help.meters.type": "Typ",
  "help.meters.status": "Status",
  "help.meters.ud18": "ATorch UD18 und andere USB-Messgeräte derselben Familie",
  "help.meters.acModels": "ATorch-AC-Messgeräte (AT24, AT3010)",
  "help.meters.dcModels":
    "ATorch-DC-Messgeräte (DT24, DT3010) und andere Modelle mit demselben Protokoll",
  "help.meters.ac": "Netzstrom (AC)",
  "help.meters.j7cStatus": "Anhand aufgezeichneter Frames eines echten J7-C geprüft",
  "help.meters.samples": "Anhand veröffentlichter Beispielpakete geprüft",
  "help.meters.dcStatus":
    "Experimentell: Spannung, Strom, Leistung, Temperatur und Zeit. Kapazität und Energie werden noch nicht dekodiert",
  "help.meters.report":
    "Wenn sich Ihr Messgerät verbindet, aber keine Messwerte erscheinen, <issue>erstellen Sie bitte ein Issue</issue> mit dem Namen und Modell des Messgeräts.",

  "help.browsers.title": "Unterstützte Browser",
  "help.browsers.about":
    "Die Seite nutzt Web Bluetooth, das Chrome und Edge unter Windows, macOS, ChromeOS und Android bereitstellen. Unter Linux bleibt es in Chrome deaktiviert, bis Sie chrome://flags/#enable-experimental-web-platform-features aktivieren. Firefox und Safari (einschließlich aller Browser auf iPhone und iPad, ausgenommen Apps wie Bluefy, die Web Bluetooth nachrüsten) unterstützen es nicht.",

  "help.privacy.title": "Datenschutz",
  "help.privacy.about":
    "Alles geschieht in Ihrem Browser. Die Messwerte bleiben im Arbeitsspeicher, solange die Seite geöffnet ist, und werden nirgendwohin gesendet. Es gibt keine Cookies, keine Analysedienste und keine Werbung. Wie jede Website wird die Seite von einem Hosting-Anbieter ausgeliefert, der beim Laden Ihre IP-Adresse sieht.",

  "help.faq.title": "Häufige Fragen",
  "help.faq.missing.q": "Das Messgerät erscheint nicht in der Liste.",
  "help.faq.missing.replug":
    "Ziehen Sie das Messgerät ab, stecken Sie es wieder ein und wählen Sie sofort erneut <b>Messgerät verbinden</b>. Manche Messgeräte, darunter das J7-C, lassen sich nur finden, kurz nachdem sie Strom bekommen haben. Ein Messgerät, das schon eine Weile läuft, fehlt deshalb in der Liste.",
  "help.faq.missing.other":
    "Wenn das nicht hilft: Die Liste zeigt ein Messgerät nur, solange der Browser es empfangen kann. Das Messgerät muss also in der Nähe sein, sein Bluetooth muss eingeschaltet sein und es darf keine andere Verbindung bestehen. Trennen Sie es zuerst von jeder Smartphone-App und jedem anderen Tab, denn diese Messgeräte lassen immer nur eine Bluetooth-Verbindung zu. Achten Sie unter Windows und Linux darauf, dass Bluetooth eingeschaltet ist.",
  "help.faq.missing.all":
    "Die Liste lässt außerdem Geräte aus, die nicht wie ein unterstütztes Messgerät aussehen. Fehlt Ihres weiterhin, brechen Sie die Auswahl ab und wählen Sie <b>Alle Bluetooth-Geräte anzeigen</b>. Kennt die Seite den Namen eines so verbundenen Messgeräts nicht, weist sie darauf hin, und über ein <issue>Issue</issue> mit diesem Namen wird er aufgenommen.",
  "help.faq.checksum.q": "Warum steht dort, dass die Prüfsumme nicht überprüft wird?",
  "help.faq.checksum.a":
    "Manche Messgeräte, darunter das J7-C, verwenden eine andere Prüfsumme als die von ATorch. Die Messwerte werden trotzdem angezeigt, sofern der Frame ansonsten korrekt aufgebaut ist.",
  "help.faq.settings.q": "Kann der Viewer die Zähler zurücksetzen oder Einstellungen ändern?",
  "help.faq.settings.a": "Noch nicht. Der Viewer liest nur.",

  "footer.text":
    "MIT-Lizenz · <source>Quellcode auf GitHub</source> · Keine Verbindung zu ATorch, zu Messgeräteherstellern oder zu KI-Anbietern. Produktnamen gehören ihren jeweiligen Inhabern und werden nur genannt, um zu zeigen, womit diese Seite funktioniert.",
  "footer.warranty":
    "Diese Seite wird von koedame betrieben und in der vorliegenden Form ohne Gewährleistung bereitgestellt. Die Messwerte können falsch sein: Dies ist weder ein kalibriertes Messinstrument noch eine Sicherheitseinrichtung. Nutzen Sie die Seite daher nicht, um zu entscheiden, ob ein Stromkreis, ein Ladegerät oder ein Haushaltsgerät sicher ist.",
};
