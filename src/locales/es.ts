import type { Messages } from "./en.ts";

export const es: Messages = {
  "meta.title": "USB Meter Web – Visor de testers USB Bluetooth para ATorch UD18, J7-C",

  "top.tagline": "Lecturas en tiempo real de tu tester USB Bluetooth, en el navegador",
  "top.connect": "Conectar medidor",
  "top.demo": "Probar la demo",
  "top.disconnect": "Desconectar",
  "top.help": "Ayuda",
  "top.language": "Idioma",

  "pill.idle": "No conectado",
  "pill.connecting": "Conectando…",
  "pill.live": "Conectado",
  "pill.demo": "Demo",

  "status.start": "Enchufa el medidor, selecciona “Conectar medidor” y elígelo en la lista.",
  "status.choosing": "Elige tu medidor en la lista de Bluetooth del navegador…",
  "status.noneChosen":
    "No has elegido ningún medidor. Un medidor solo aparece en la lista mientras está cerca y encendido, tiene el Bluetooth activado y no hay nada más conectado a él, como una aplicación del teléfono u otra pestaña.",
  "status.reading": "Leyendo datos de {name}.",
  "status.readingUnnamed": "Leyendo datos de un medidor sin nombre de Bluetooth.",
  "status.readingUnknown":
    "Leyendo datos de {name}. Esta página aún no conoce ese nombre; comunícalo como “{exact}” a través de “Ayuda” para que se pueda añadir.",
  "status.lost":
    "El medidor se ha desconectado. Selecciona “Conectar medidor” para volver a conectarlo.",
  "status.disconnected": "Desconectado. Las lecturas registradas siguen abajo.",
  "status.demo": "Mostrando lecturas inventadas de un cargador ficticio. No hay nada conectado.",
  "status.failed": "Error al conectar: {reason}",
  "error.noGatt": "Este dispositivo no ofrece conexión GATT.",
  "error.noSerialService":
    "Este dispositivo no tiene un servicio serie por Bluetooth (0xFFE0) que transmita lecturas. Puede que no sea un medidor compatible.",
  "error.timeout":
    "El medidor no respondió. Comprueba que tenga alimentación y esté cerca, y vuelve a elegir Conectar medidor.",

  "hint.notListed":
    "¿El medidor no aparece en la lista? <b>Desenchúfalo, vuelve a enchufarlo y selecciona de inmediato “Conectar medidor” otra vez.</b> Algunos medidores solo se pueden detectar justo después de encenderse. ¿Sigue sin aparecer? <all>Mostrar todos los dispositivos Bluetooth</all>",
  "note.checksum":
    "Este medidor no usa la suma de verificación de ATorch, así que las lecturas se muestran sin comprobarla.",
  "note.unsupported":
    "Este navegador no puede comunicarse con dispositivos Bluetooth. Usa Chrome o Edge en una computadora o en un teléfono Android; en Linux, antes hay que activar una opción de Chrome (consulta “Ayuda”). La demo funciona en cualquier navegador.",

  "range.legend": "Intervalo de tiempo",
  "range.1min": "1 min",
  "range.10min": "10 min",
  "range.1h": "1 h",
  "range.all": "Todo",
  "action.csv": "Descargar CSV",
  "action.aiExport": "Exportar para IA",
  "action.clear": "Borrar",
  "action.clearConfirm":
    "¿Borrar la grabación? Solo existe en esta pestaña y no se puede recuperar. Descarga antes el CSV si quieres conservarla.",

  "panels.title": "Lecturas en tiempo real e historial",
  "metric.voltage": "Voltaje",
  "metric.current": "Corriente",
  "metric.power": "Potencia",
  "metric.temperature": "Temperatura",
  "metric.frequency": "Frecuencia",
  "metric.pf": "Factor de potencia",
  "panel.dataLines": "Líneas de datos",
  "panel.overTime": "{name} a lo largo del tiempo",
  "stat.min": "Mín.",
  "stat.avg": "Media",
  "stat.max": "Máx.",
  "plot.empty": "Aún no hay datos",
  "totals.title": "Totales",
  "totals.capacity": "Capacidad",
  "totals.energy": "Energía",
  "totals.elapsed": "Duración",

  "export.about":
    "Descarga un ZIP con tus lecturas y un README que las explica, listo para dárselo a Claude, ChatGPT u otro asistente de IA. Indica qué has medido para que sepa qué buscar.",
  "export.purpose": "¿Qué has medido?",
  "export.notes": "Notas para el asistente <optional>opcional</optional>",
  "export.notesExample": "Cargador de 65 W, cable de 1 m, teléfono al 20 % al empezar",
  "export.cancel": "Cancelar",
  "export.download": "Descargar ZIP",
  "purpose.charging": "Carga de un dispositivo",
  "purpose.charger": "Cargador o fuente de alimentación",
  "purpose.powerBank": "Batería externa u otra batería",
  "purpose.cable": "Cable",
  "purpose.draw": "Consumo de un dispositivo o proyecto",
  "purpose.appliance": "Consumo de un electrodoméstico",
  "purpose.other": "Otra cosa",

  "help.title": "Acerca de este visor",
  "help.about":
    "Muchos testers USB baratos tienen Bluetooth, pero sus aplicaciones para el teléfono tardan en vincularse, están llenas de anuncios o ya no se actualizan. Esta página lee directamente el mismo flujo de datos Bluetooth y reúne todas las lecturas en un solo panel: el voltaje, la corriente, la potencia, la temperatura y las líneas de datos USB tienen cada uno su gráfico, todos con el mismo eje de tiempo. Pasa el puntero por cualquier gráfico para ver todos los valores de ese instante, y descarga el registro completo como CSV o como un ZIP pensado para asistentes de IA. No hay que instalar nada ni crear ninguna cuenta.",

  "help.use.title": "Cómo se usa",
  "help.use.open": "Abre esta página en Chrome o Edge.",
  "help.use.plug":
    "Enchufa el medidor entre un cargador y el dispositivo que quieras medir. Si ya estaba enchufado, desenchúfalo y vuelve a enchufarlo: algunos medidores, entre ellos el J7-C, solo se pueden detectar justo después de encenderse.",
  "help.use.connect":
    "Selecciona de inmediato <b>Conectar medidor</b> y elige el medidor en la lista. Un J7-C aparece como UC96_BLE; los medidores ATorch, con el nombre de su modelo, como UD18-BLE o AT24-BLE. Las lecturas empiezan al instante.",

  "help.ai.title": "Analizar un registro con IA",
  "help.ai.about":
    "<b>Exportar para IA</b> descarga un ZIP con dos archivos: tus lecturas en CSV y un README que explica a un asistente de IA qué se registró, qué significa cada columna, qué puede medir y qué no un medidor como este, y cómo analizar el tipo de prueba realizada: una sesión de carga, un cargador, una batería externa, un cable o el consumo de un dispositivo. Dale el ZIP a Claude, ChatGPT u otro asistente y hazle tu pregunta; por ejemplo, cuánto duró la carga, si el cargador mantuvo el voltaje o cuánto entrega realmente una batería externa. Si el asistente no acepta archivos ZIP, descomprímelo y dale los dos archivos.",
  "help.ai.language":
    "El README está escrito en inglés. Pregunta en tu propio idioma y el asistente te responderá en él.",
  "help.ai.private":
    "La página sigue sin enviar nada a ninguna parte. El archivo solo va adonde tú lo lleves.",
  "help.ai.skill":
    "Para Claude hay además una skill con la misma guía, de modo que Claude la tiene a mano incluso cuando solo recibe el CSV. <download>Descarga la skill de Claude</download> y añade ese ZIP a Claude (<how>cómo añadir una skill</how>).",

  "help.meters.title": "Medidores compatibles",
  "help.meters.meter": "Medidor",
  "help.meters.type": "Tipo",
  "help.meters.status": "Estado",
  "help.meters.ud18": "ATorch UD18 y otros medidores USB de la misma familia",
  "help.meters.acModels": "Medidores AC de ATorch (AT24, AT3010)",
  "help.meters.dcModels":
    "Medidores DC de ATorch (DT24, DT3010) y otros modelos que usan el mismo protocolo",
  "help.meters.ac": "AC (red eléctrica)",
  "help.meters.j7cStatus": "Comprobado con tramas registradas de un J7-C real",
  "help.meters.samples": "Comprobado con paquetes de ejemplo publicados",
  "help.meters.dcStatus":
    "Experimental: voltaje, corriente, potencia, temperatura y tiempo. La capacidad y la energía aún no se decodifican",
  "help.meters.report":
    "Si tu medidor se conecta pero no aparecen lecturas, <issue>abre una incidencia</issue> con su nombre y modelo.",

  "help.browsers.title": "Navegadores compatibles",
  "help.browsers.about":
    "La página usa Web Bluetooth, que Chrome y Edge ofrecen en Windows, macOS, ChromeOS y Android. En Linux, Chrome lo mantiene desactivado: abre chrome://flags/#enable-experimental-web-platform-features en Chrome y activa primero esa opción. Firefox y Safari (incluidos todos los navegadores del iPhone y del iPad, salvo aplicaciones como Bluefy que incorporan Web Bluetooth) no lo admiten.",

  "help.privacy.title": "Privacidad",
  "help.privacy.about":
    "Todo ocurre en tu navegador. Las lecturas se mantienen en memoria mientras la página está abierta y nunca se envían a ninguna parte. No hay cookies, ni analítica ni anuncios. Como en cualquier sitio web, la página la sirve un proveedor de alojamiento, que ve tu dirección IP cuando la cargas.",

  "help.faq.title": "Preguntas frecuentes",
  "help.faq.missing.q": "El medidor no aparece en la lista.",
  "help.faq.missing.replug":
    "Desenchufa el medidor, vuelve a enchufarlo y selecciona de inmediato <b>Conectar medidor</b> otra vez. Algunos medidores, entre ellos el J7-C, solo se pueden detectar justo después de encenderse, así que uno que lleva un rato encendido no aparece en la lista.",
  "help.faq.missing.other":
    "Si eso no funciona: la lista solo muestra un medidor mientras el navegador capta su señal, así que el medidor debe estar cerca, con el Bluetooth activado y sin ninguna otra conexión. Antes, desconéctalo de cualquier aplicación del teléfono o de otra pestaña, porque estos medidores solo aceptan una conexión Bluetooth a la vez. En Windows y Linux, asegúrate de que el Bluetooth esté activado.",
  "help.faq.missing.all":
    "La lista también omite los dispositivos que no parecen un medidor compatible. Si el tuyo sigue sin aparecer, cancela la lista y selecciona <b>Mostrar todos los dispositivos Bluetooth</b>. Cuando la página no conoce el nombre de un medidor conectado de esa forma, lo indica, y basta una <issue>incidencia</issue> con ese nombre para que se añada.",
  "help.faq.checksum.q": "¿Por qué dice que la suma de verificación no se comprueba?",
  "help.faq.checksum.a":
    "Algunos medidores, entre ellos el J7-C, usan una suma de verificación distinta de la de ATorch. Las lecturas se muestran igualmente siempre que, por lo demás, la trama esté bien formada.",
  "help.faq.settings.q": "¿Puede poner a cero los contadores o cambiar la configuración?",
  "help.faq.settings.a": "Aún no. El visor solo lee.",

  "footer.text":
    "Licencia MIT · <source>Código fuente en GitHub</source> · Sin vinculación con ATorch ni con ningún fabricante de medidores o proveedor de IA. Los nombres de los productos pertenecen a sus propietarios y solo se usan para indicar con qué funciona esta página.",
  "footer.warranty":
    "Esta página la gestiona koedame y se ofrece “tal cual”, sin garantías. Las lecturas pueden ser incorrectas: esto no es un instrumento calibrado ni un dispositivo de seguridad, así que no lo uses para decidir si un circuito, un cargador o un electrodoméstico es seguro.",
};
