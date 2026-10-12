import type { Messages } from "./en.ts";

export const fr: Messages = {
  "meta.title": "USB Meter Web – Visualiseur pour testeurs USB Bluetooth (ATorch UD18, J7-C)",

  "top.tagline": "Les mesures de votre testeur USB Bluetooth, en direct dans le navigateur",
  "top.connect": "Connecter le testeur",
  "top.demo": "Essayer la démo",
  "top.disconnect": "Déconnecter",
  "top.help": "Aide",
  "top.language": "Langue",

  "pill.idle": "Non connecté",
  "pill.connecting": "Connexion…",
  "pill.live": "Connecté",
  "pill.demo": "Démo",

  "status.start":
    "Branchez le testeur, sélectionnez « Connecter le testeur », puis choisissez-le dans la liste.",
  "status.choosing": "Choisissez votre testeur dans la liste Bluetooth du navigateur…",
  "status.noneChosen":
    "Aucun testeur sélectionné. Un testeur n’apparaît dans la liste que s’il est à proximité et sous tension, que son Bluetooth est activé et que rien d’autre (une application mobile ou un autre onglet, par exemple) n’y est connecté.",
  "status.reading": "Lecture des mesures du testeur {name}.",
  "status.readingUnnamed": "Lecture des mesures d’un testeur sans nom Bluetooth.",
  "status.readingUnknown":
    "Lecture des mesures du testeur {name}. Cette page ne connaît pas encore ce nom : signalez-le sous la forme « {exact} » via la rubrique Aide pour qu’il soit ajouté.",
  "status.lost":
    "Le testeur s’est déconnecté. Sélectionnez « Connecter le testeur » pour le reconnecter.",
  "status.disconnected": "Déconnecté. Les mesures enregistrées restent affichées ci-dessous.",
  "status.demo":
    "Affichage de mesures fictives provenant d’un chargeur simulé. Rien n’est connecté.",
  "status.failed": "Connexion impossible : {reason}",
  "error.noGatt": "Cet appareil ne propose pas de connexion GATT.",
  "error.noSerialService":
    "Cet appareil n’a pas de service série Bluetooth (0xFFE0) pour transmettre les mesures en continu. Ce n’est peut-être pas un testeur compatible.",
  "error.timeout":
    "Le testeur n’a pas répondu. Vérifiez qu’il est alimenté et proche, puis choisissez de nouveau Connecter le testeur.",

  "hint.notListed":
    "Le testeur n’est pas dans la liste ? <b>Débranchez-le, rebranchez-le, puis sélectionnez de nouveau « Connecter le testeur » sans attendre.</b> Certains testeurs ne restent détectables que quelques instants après leur mise sous tension. Toujours introuvable ? <all>Afficher tous les appareils Bluetooth</all>",
  "note.checksum":
    "Ce testeur n’utilise pas la somme de contrôle ATorch : les mesures sont donc affichées sans vérification de la somme de contrôle.",
  "note.unsupported":
    "Ce navigateur ne peut pas communiquer avec les appareils Bluetooth. Utilisez Chrome ou Edge sur un ordinateur ou un téléphone Android ; sous Linux, un paramètre doit d’abord être activé dans Chrome (voir la rubrique Aide). La démo fonctionne partout.",

  "range.legend": "Période",
  "range.1min": "1 min",
  "range.10min": "10 min",
  "range.1h": "1 h",
  "range.all": "Tout",
  "action.csv": "Télécharger le CSV",
  "action.aiExport": "Exporter pour l’IA",
  "action.clear": "Effacer",
  "action.clearConfirm":
    "Effacer l’enregistrement ? Il n’existe que dans cet onglet et ne peut pas être récupéré. Téléchargez d’abord le CSV pour le conserver.",

  "panels.title": "Mesures en direct et historique",
  "metric.voltage": "Tension",
  "metric.current": "Courant",
  "metric.power": "Puissance",
  "metric.temperature": "Température",
  "metric.frequency": "Fréquence",
  "metric.pf": "Facteur de puissance",
  "panel.dataLines": "Lignes de données",
  "panel.overTime": "{name} en fonction du temps",
  "stat.min": "Min.",
  "stat.avg": "Moy.",
  "stat.max": "Max.",
  "plot.empty": "Pas encore de données",
  "totals.title": "Totaux",
  "totals.capacity": "Capacité",
  "totals.energy": "Énergie",
  "totals.elapsed": "Durée",

  "export.about":
    "Télécharge un fichier ZIP contenant vos mesures et un README qui les explique, prêt à être transmis à Claude, à ChatGPT ou à un autre assistant IA. Indiquez ce que vous avez mesuré pour qu’il sache quoi chercher.",
  "export.purpose": "Qu’avez-vous mesuré ?",
  "export.notes": "Notes pour l’assistant <optional>facultatif</optional>",
  "export.notesExample": "Chargeur 65 W, câble de 1 m, téléphone à 20 % au départ",
  "export.cancel": "Annuler",
  "export.download": "Télécharger le ZIP",
  "purpose.charging": "Charge d’un appareil",
  "purpose.charger": "Test d’un chargeur ou d’une alimentation",
  "purpose.powerBank": "Mesure d’une batterie externe ou d’une autre batterie",
  "purpose.cable": "Vérification d’un câble",
  "purpose.draw": "Consommation d’un appareil ou d’un montage",
  "purpose.appliance": "Consommation d’un appareil électroménager",
  "purpose.other": "Autre",

  "help.title": "À propos de ce visualiseur",
  "help.about":
    "De nombreux testeurs USB bon marché sont dotés du Bluetooth, mais leurs applications mobiles mettent du temps à s’associer, regorgent de publicités ou ne sont plus mises à jour. Cette page lit directement le même flux Bluetooth et réunit toutes les mesures sur un seul tableau de bord : la tension, le courant, la puissance, la température et les lignes de données USB ont chacun leur graphique, tous sur le même axe temporel. Passez le pointeur sur n’importe quel graphique pour lire toutes les valeurs à cet instant, et téléchargez l’enregistrement complet au format CSV ou sous forme de fichier ZIP conçu pour les assistants IA. Rien à installer, aucun compte à créer.",

  "help.use.title": "Mode d’emploi",
  "help.use.open": "Ouvrez cette page dans Chrome ou Edge.",
  "help.use.plug":
    "Branchez le testeur entre un chargeur et l’appareil à mesurer. S’il était déjà branché, débranchez-le puis rebranchez-le : certains testeurs, dont le J7-C, ne restent détectables que quelques instants après leur mise sous tension.",
  "help.use.connect":
    "Sélectionnez sans attendre <b>Connecter le testeur</b>, puis choisissez le testeur dans la liste. Un J7-C y apparaît sous le nom UC96_BLE, les testeurs ATorch sous le nom de leur modèle, par exemple UD18-BLE ou AT24-BLE. Les mesures s’affichent aussitôt.",

  "help.ai.title": "Analyser un enregistrement avec l’IA",
  "help.ai.about":
    "Le bouton <b>Exporter pour l’IA</b> télécharge un fichier ZIP qui en contient deux : vos mesures au format CSV et un README qui indique à un assistant IA ce qui a été enregistré, ce que signifie chaque colonne, ce qu’un testeur de ce type peut mesurer ou non, et comment analyser le type de test effectué (charge d’un appareil, chargeur, batterie externe, câble ou consommation d’un appareil). Transmettez le ZIP à Claude, à ChatGPT ou à un autre assistant et posez votre question : par exemple, combien de temps la charge a duré, si le chargeur a maintenu sa tension ou ce qu’une batterie externe fournit réellement. Si l’assistant n’accepte pas les fichiers ZIP, décompressez l’archive et donnez-lui les deux fichiers.",
  "help.ai.language":
    "Le README est rédigé en anglais. Posez votre question dans votre langue et l’assistant vous répondra dans cette même langue.",
  "help.ai.private":
    "La page n’envoie toujours rien nulle part. Le fichier ne va que là où vous le déposez.",
  "help.ai.skill":
    "Pour Claude, il existe aussi une compétence contenant le même guide : Claude l’a ainsi sous la main même s’il ne reçoit que le CSV. <download>Téléchargez la compétence pour Claude</download>, puis ajoutez ce ZIP à Claude (<how>comment ajouter une compétence</how>).",

  "help.meters.title": "Testeurs compatibles",
  "help.meters.meter": "Testeur",
  "help.meters.type": "Type",
  "help.meters.status": "État",
  "help.meters.ud18": "ATorch UD18 et autres testeurs USB de la même famille",
  "help.meters.acModels": "Testeurs ATorch pour courant alternatif (AT24, AT3010)",
  "help.meters.dcModels":
    "Testeurs ATorch pour courant continu (DT24, DT3010) et autres modèles utilisant le même protocole",
  "help.meters.ac": "Secteur (AC)",
  "help.meters.j7cStatus": "Vérifié avec des trames enregistrées sur un vrai J7-C",
  "help.meters.samples": "Vérifié avec des exemples de paquets publiés",
  "help.meters.dcStatus":
    "Expérimental : tension, courant, puissance, température et durée. La capacité et l’énergie ne sont pas encore décodées",
  "help.meters.report":
    "Si votre testeur se connecte mais qu’aucune mesure ne s’affiche, veuillez <issue>ouvrir un ticket</issue> en indiquant son nom et son modèle.",

  "help.browsers.title": "Navigateurs compatibles",
  "help.browsers.about":
    "La page utilise Web Bluetooth, que Chrome et Edge proposent sous Windows, macOS, ChromeOS et Android. Sous Linux, Chrome le laisse désactivé tant que l’option chrome://flags/#enable-experimental-web-platform-features n’est pas activée. Firefox et Safari (y compris tous les navigateurs sur iPhone et iPad, hormis les applications comme Bluefy qui ajoutent Web Bluetooth) ne le prennent pas en charge.",

  "help.privacy.title": "Confidentialité",
  "help.privacy.about":
    "Tout se passe dans votre navigateur. Les mesures sont conservées en mémoire tant que la page est ouverte et ne sont jamais envoyées nulle part. Ni cookies, ni mesure d’audience, ni publicité. Comme tout site web, la page est hébergée par un prestataire, qui voit votre adresse IP lorsque vous la chargez.",

  "help.faq.title": "Questions",
  "help.faq.missing.q": "Le testeur n’apparaît pas dans la liste.",
  "help.faq.missing.replug":
    "Débranchez le testeur, rebranchez-le, puis sélectionnez de nouveau <b>Connecter le testeur</b> sans attendre. Certains testeurs, dont le J7-C, ne restent détectables que quelques instants après leur mise sous tension : un testeur allumé depuis un moment n’apparaît donc plus dans la liste.",
  "help.faq.missing.other":
    "Si cela ne suffit pas : la liste n’affiche un testeur que lorsque le navigateur le capte. Il doit donc se trouver à proximité, avec son Bluetooth activé et sans autre connexion en cours. Déconnectez-le d’abord de toute application mobile ou de tout autre onglet, car ces testeurs n’acceptent qu’une seule connexion Bluetooth à la fois. Sous Windows et Linux, vérifiez que le Bluetooth est activé.",
  "help.faq.missing.all":
    "La liste écarte aussi les appareils qui ne ressemblent pas à un testeur compatible. Si le vôtre reste introuvable, fermez la liste et sélectionnez <b>Afficher tous les appareils Bluetooth</b>. Lorsque la page ne connaît pas le nom d’un testeur connecté de cette façon, elle le signale, et un <issue>ticket</issue> mentionnant ce nom permettra de l’ajouter.",
  "help.faq.checksum.q":
    "Pourquoi la page indique-t-elle que la somme de contrôle n’est pas vérifiée ?",
  "help.faq.checksum.a":
    "Certains testeurs, dont le J7-C, utilisent une somme de contrôle différente de celle d’ATorch. Les mesures sont tout de même affichées lorsque la trame est par ailleurs bien formée.",
  "help.faq.settings.q": "Peut-on remettre les compteurs à zéro ou modifier les réglages ?",
  "help.faq.settings.a": "Pas encore. Le visualiseur ne fait que lire.",

  "footer.text":
    "Sous licence MIT · <source>Code source sur GitHub</source> · Sans affiliation avec ATorch, ni avec aucun fabricant de testeurs ou fournisseur d’IA. Les noms de produits appartiennent à leurs propriétaires respectifs et ne servent qu’à indiquer avec quoi cette page fonctionne.",
  "footer.warranty":
    "Page exploitée par koedame et fournie en l’état, sans garantie. Les mesures peuvent être erronées : ce n’est ni un instrument de mesure étalonné ni un dispositif de sécurité. Ne l’utilisez donc pas pour déterminer si un circuit, un chargeur ou un appareil électroménager est sans danger.",
};
