import type { Messages } from "./en.ts";

export const it: Messages = {
  "meta.title": "USB Meter Web – Visualizzatore per tester USB Bluetooth ATorch UD18, J7-C",

  "top.tagline": "Le letture in tempo reale del tuo tester USB Bluetooth, nel browser",
  "top.connect": "Connetti il tester",
  "top.demo": "Prova la demo",
  "top.disconnect": "Disconnetti",
  "top.help": "Guida",
  "top.language": "Lingua",

  "pill.idle": "Non connesso",
  "pill.connecting": "Connessione…",
  "pill.live": "Connesso",
  "pill.demo": "Demo",

  "status.start":
    "Collega il tester all’alimentazione, poi scegli “Connetti il tester” e selezionalo dall’elenco.",
  "status.choosing": "Seleziona il tuo tester nell’elenco Bluetooth del browser…",
  "status.noneChosen":
    "Nessun tester selezionato. Un tester compare nell’elenco solo se è vicino e alimentato, ha il Bluetooth attivo e non è già connesso ad altro, ad esempio a un’app sul telefono o a un’altra scheda.",
  "status.reading": "Lettura da {name} in corso.",
  "status.readingUnnamed": "Lettura in corso da un tester senza nome Bluetooth.",
  "status.readingUnknown":
    "Lettura da {name} in corso. Questa pagina non conosce ancora questo nome: segnalalo come “{exact}” tramite la Guida, così potrà essere aggiunto.",
  "status.lost": "Il tester si è disconnesso. Scegli “Connetti il tester” per riconnetterlo.",
  "status.disconnected": "Disconnesso. Le letture registrate restano qui sotto.",
  "status.demo": "Letture inventate di un caricabatterie simulato. Non è connesso nulla.",
  "status.failed": "Impossibile connettersi: {reason}",
  "error.noGatt": "Questo dispositivo non offre una connessione GATT.",
  "error.noSerialService":
    "Questo dispositivo non ha un servizio seriale via Bluetooth (0xFFE0) che trasmetta le letture. Potrebbe non essere un tester supportato.",

  "hint.notListed":
    "Il tester non è nell’elenco? <b>Scollegalo, ricollegalo e subito dopo scegli di nuovo “Connetti il tester”.</b> Alcuni tester sono rilevabili solo per poco tempo dopo essere stati alimentati. Ancora niente? <all>Mostra tutti i dispositivi Bluetooth</all>",
  "note.checksum":
    "Questo tester non usa il checksum ATorch, quindi le letture sono mostrate senza verifica del checksum.",
  "note.unsupported":
    "Questo browser non può comunicare con i dispositivi Bluetooth. Usa Chrome o Edge su un computer o su un telefono Android; su Linux, in Chrome va prima attivata un’impostazione (vedi Guida). La demo funziona ovunque.",

  "range.legend": "Intervallo di tempo",
  "range.1min": "1 min",
  "range.10min": "10 min",
  "range.1h": "1 h",
  "range.all": "Tutto",
  "action.csv": "Scarica CSV",
  "action.aiExport": "Esporta per l’IA",
  "action.clear": "Cancella",

  "panels.title": "Letture in tempo reale e storico",
  "metric.voltage": "Tensione",
  "metric.current": "Corrente",
  "metric.power": "Potenza",
  "metric.temperature": "Temperatura",
  "metric.frequency": "Frequenza",
  "metric.pf": "Fattore di potenza",
  "panel.dataLines": "Linee dati",
  "panel.overTime": "{name} nel tempo",
  "stat.min": "Min",
  "stat.avg": "Media",
  "stat.max": "Max",
  "plot.empty": "Ancora nessun dato",
  "totals.title": "Totali",
  "totals.capacity": "Capacità",
  "totals.energy": "Energia",
  "totals.elapsed": "Durata",

  "export.about":
    "Scarica uno ZIP con le tue letture e un README che le spiega, pronto da passare a Claude, a ChatGPT o a un altro assistente IA. Indica che cosa hai misurato, così saprà che cosa cercare.",
  "export.purpose": "Che cosa hai misurato?",
  "export.notes": "Note per l’assistente <optional>facoltative</optional>",
  "export.notesExample": "Caricabatterie da 65 W, cavo da 1 m, telefono inizialmente al 20%",
  "export.cancel": "Annulla",
  "export.download": "Scarica ZIP",
  "purpose.charging": "Ricarica di un dispositivo",
  "purpose.charger": "Test di un caricabatterie o alimentatore",
  "purpose.powerBank": "Misura di un power bank o di una batteria",
  "purpose.cable": "Verifica di un cavo",
  "purpose.draw": "Assorbimento di un dispositivo o progetto",
  "purpose.appliance": "Consumo di un elettrodomestico",
  "purpose.other": "Altro",

  "help.title": "Informazioni su questo visualizzatore",
  "help.about":
    "Molti tester USB economici hanno il Bluetooth, ma le loro app per telefono sono lente nell’accoppiamento, piene di pubblicità o non più aggiornate. Questa pagina legge direttamente lo stesso flusso Bluetooth e riunisce tutte le letture in un’unica dashboard: tensione, corrente, potenza, temperatura e linee dati USB hanno ciascuna un proprio grafico, tutti sullo stesso asse temporale. Passa il puntatore su un grafico qualsiasi per leggere tutti i valori di quell’istante, e scarica l’intera registrazione come CSV o come ZIP pensato per gli assistenti IA. Non c’è nulla da installare e non serve un account.",

  "help.use.title": "Come si usa",
  "help.use.open": "Apri questa pagina in Chrome o Edge.",
  "help.use.plug":
    "Collega il tester tra un caricabatterie e il dispositivo da misurare. Se era già collegato, scollegalo e ricollegalo: alcuni tester, tra cui il J7-C, sono rilevabili solo per poco tempo dopo essere stati alimentati.",
  "help.use.connect":
    "Scegli subito <b>Connetti il tester</b> e seleziona il tester nell’elenco. Un J7-C compare come UC96_BLE, i tester ATorch con il nome del modello, ad esempio UD18-BLE o AT24-BLE. Le letture iniziano immediatamente.",

  "help.ai.title": "Analizzare una registrazione con l’IA",
  "help.ai.about":
    "<b>Esporta per l’IA</b> scarica uno ZIP con due file: le tue letture in formato CSV e un README che spiega a un assistente IA che cosa è stato registrato, che cosa significa ogni colonna, che cosa un tester come questo può e non può misurare e come analizzare il tipo di test eseguito: una ricarica, un caricabatterie, un power bank, un cavo o l’assorbimento di un dispositivo. Passa lo ZIP a Claude, a ChatGPT o a un altro assistente e fai la tua domanda, ad esempio quanto è durata la ricarica, se il caricabatterie ha mantenuto la tensione o quanto eroga davvero un power bank. Se l’assistente non accetta file ZIP, decomprimilo e passagli entrambi i file.",
  "help.ai.language":
    "Il README è in inglese. Chiedi nella tua lingua e l’assistente risponderà nella stessa lingua.",
  "help.ai.private":
    "La pagina continua a non inviare nulla da nessuna parte. Il file va solo dove lo metti tu.",
  "help.ai.skill":
    "Per Claude c’è anche una skill con la stessa guida, così Claude ce l’ha a portata di mano anche quando riceve solo il CSV. <download>Scarica la skill per Claude</download> e aggiungi quello ZIP a Claude (<how>come aggiungere una skill</how>).",

  "help.meters.title": "Tester supportati",
  "help.meters.meter": "Tester",
  "help.meters.type": "Tipo",
  "help.meters.status": "Stato",
  "help.meters.ud18": "ATorch UD18 e altri tester USB della stessa famiglia",
  "help.meters.acModels": "Tester AC ATorch (AT24, AT3010)",
  "help.meters.dcModels":
    "Tester DC ATorch (DT24, DT3010) e altri modelli che usano lo stesso protocollo",
  "help.meters.ac": "Rete elettrica (AC)",
  "help.meters.j7cStatus": "Verificato con frame registrati da un vero J7-C",
  "help.meters.samples": "Verificato con pacchetti di esempio pubblicati",
  "help.meters.dcStatus":
    "Sperimentale: tensione, corrente, potenza, temperatura e tempo. Capacità ed energia non vengono ancora decodificate",
  "help.meters.report":
    "Se il tuo tester si connette ma non compaiono letture, <issue>apri una segnalazione</issue> indicandone nome e modello.",

  "help.browsers.title": "Browser supportati",
  "help.browsers.about":
    "La pagina usa Web Bluetooth, che Chrome ed Edge offrono su Windows, macOS, ChromeOS e Android. Su Linux, Chrome lo tiene disattivato finché l’opzione chrome://flags/#enable-experimental-web-platform-features non viene attivata. Firefox e Safari (compresi tutti i browser su iPhone e iPad, tranne app come Bluefy che aggiungono Web Bluetooth) non lo supportano.",

  "help.privacy.title": "Privacy",
  "help.privacy.about":
    "Tutto avviene nel tuo browser. Le letture restano in memoria finché la pagina è aperta e non vengono mai inviate da nessuna parte. Non ci sono cookie, strumenti di analisi né pubblicità. Come qualsiasi sito web, la pagina è distribuita da un fornitore di servizi di hosting, che vede il tuo indirizzo IP quando la carichi.",

  "help.faq.title": "Domande frequenti",
  "help.faq.missing.q": "Il tester non compare nell’elenco.",
  "help.faq.missing.replug":
    "Scollega il tester, ricollegalo e subito dopo scegli di nuovo <b>Connetti il tester</b>. Alcuni tester, tra cui il J7-C, sono rilevabili solo per poco tempo dopo essere stati alimentati, quindi uno acceso già da un po’ resta fuori dall’elenco.",
  "help.faq.missing.other":
    "Se non basta: l’elenco mostra un tester solo finché il browser ne riceve il segnale, quindi il tester deve essere vicino, con il Bluetooth attivo e senza altre connessioni. Per prima cosa disconnettilo da eventuali app sul telefono o da altre schede, perché questi tester accettano una sola connessione Bluetooth alla volta. Su Windows e Linux, assicurati che il Bluetooth sia attivo.",
  "help.faq.missing.all":
    "L’elenco esclude anche i dispositivi che non sembrano un tester supportato. Se il tuo continua a non comparire, chiudi l’elenco e scegli <b>Mostra tutti i dispositivi Bluetooth</b>. Quando la pagina non conosce il nome di un tester connesso in questo modo, lo indica, e una <issue>segnalazione</issue> con quel nome permette di aggiungerlo.",
  "help.faq.checksum.q": "Perché dice che il checksum non è verificato?",
  "help.faq.checksum.a":
    "Alcuni tester, tra cui il J7-C, usano un checksum diverso da quello ATorch. Le letture vengono mostrate comunque, purché per il resto il frame sia ben formato.",
  "help.faq.settings.q": "Può azzerare i contatori o modificare le impostazioni?",
  "help.faq.settings.a": "Non ancora. Il visualizzatore legge soltanto.",

  "footer.text":
    "Licenza MIT · <source>Codice sorgente su GitHub</source> · Nessuna affiliazione con ATorch, con alcun produttore di tester né con alcun fornitore di IA. I nomi dei prodotti appartengono ai rispettivi proprietari e sono usati solo per indicare con che cosa funziona questa pagina.",
  "footer.warranty":
    "Pagina gestita da koedame e fornita “così com’è”, senza alcuna garanzia. Le letture possono essere errate: non è uno strumento di misura tarato né un dispositivo di sicurezza, quindi non usarla per stabilire se un circuito, un caricabatterie o un elettrodomestico sia sicuro.",
};
