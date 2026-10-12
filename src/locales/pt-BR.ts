import type { Messages } from "./en.ts";

export const ptBR: Messages = {
  "meta.title": "USB Meter Web – Visualizador para testadores USB Bluetooth (ATorch UD18, J7-C)",

  "top.tagline": "Leituras em tempo real do seu testador USB Bluetooth, direto no navegador",
  "top.connect": "Conectar ao medidor",
  "top.demo": "Ver demonstração",
  "top.disconnect": "Desconectar",
  "top.help": "Ajuda",
  "top.language": "Idioma",

  "pill.idle": "Não conectado",
  "pill.connecting": "Conectando…",
  "pill.live": "Conectado",
  "pill.demo": "Demonstração",

  "status.start":
    "Conecte o medidor a uma porta USB, depois selecione “Conectar ao medidor” e escolha-o na lista.",
  "status.choosing": "Escolha seu medidor na lista de dispositivos Bluetooth do navegador…",
  "status.noneChosen":
    "Nenhum medidor escolhido. Um medidor só aparece na lista enquanto está por perto e ligado, com o Bluetooth ativado e sem que nada mais, como um app de celular ou outra guia, esteja conectado a ele.",
  "status.reading": "Lendo dados de {name}.",
  "status.readingUnnamed": "Lendo dados de um medidor sem nome Bluetooth.",
  "status.readingUnknown":
    "Lendo dados de {name}. Esta página ainda não conhece esse nome; informe-o como “{exact}” pela Ajuda para que ele seja adicionado.",
  "status.lost": "O medidor se desconectou. Selecione “Conectar ao medidor” para reconectar.",
  "status.disconnected": "Desconectado. As leituras gravadas continuam abaixo.",
  "status.demo": "Mostrando leituras fictícias de um carregador simulado. Não há nada conectado.",
  "status.failed": "Não foi possível conectar: {reason}",
  "error.noGatt": "Este dispositivo não oferece conexão GATT.",
  "error.noSerialService":
    "Este dispositivo não tem um serviço serial por Bluetooth (0xFFE0) que transmita leituras. Talvez não seja um medidor compatível.",

  "hint.notListed":
    "O medidor não aparece na lista? <b>Retire-o da porta USB, recoloque-o e volte a selecionar “Conectar ao medidor” imediatamente.</b> Alguns medidores só podem ser encontrados logo depois de receberem energia. Ainda não aparece? <all>Mostrar todos os dispositivos Bluetooth</all>",
  "note.checksum":
    "Este medidor não usa o checksum da ATorch, por isso as leituras são mostradas sem verificação de checksum.",
  "note.unsupported":
    "Este navegador não consegue se comunicar com dispositivos Bluetooth. Use o Chrome ou o Edge em um computador ou em um celular Android; no Linux, antes é preciso ativar uma configuração do Chrome (consulte a Ajuda). A demonstração funciona em qualquer navegador.",

  "range.legend": "Período",
  "range.1min": "1 min",
  "range.10min": "10 min",
  "range.1h": "1 h",
  "range.all": "Tudo",
  "action.csv": "Baixar CSV",
  "action.aiExport": "Exportar para IA",
  "action.clear": "Limpar",

  "panels.title": "Leituras em tempo real e histórico",
  "metric.voltage": "Tensão",
  "metric.current": "Corrente",
  "metric.power": "Potência",
  "metric.temperature": "Temperatura",
  "metric.frequency": "Frequência",
  "metric.pf": "Fator de potência",
  "panel.dataLines": "Linhas de dados",
  "panel.overTime": "{name} ao longo do tempo",
  "stat.min": "Mín.",
  "stat.avg": "Méd.",
  "stat.max": "Máx.",
  "plot.empty": "Ainda sem dados",
  "totals.title": "Totais",
  "totals.capacity": "Capacidade",
  "totals.energy": "Energia",
  "totals.elapsed": "Tempo",

  "export.about":
    "Baixa um ZIP com suas leituras e um README que as explica, pronto para enviar ao Claude, ao ChatGPT ou a outro assistente de IA. Diga o que você mediu para que ele saiba o que procurar.",
  "export.purpose": "O que você mediu?",
  "export.notes": "Observações para o assistente <optional>opcional</optional>",
  "export.notesExample": "Carregador de 65 W, cabo de 1 m, celular começando em 20%",
  "export.cancel": "Cancelar",
  "export.download": "Baixar ZIP",
  "purpose.charging": "Carregamento de um aparelho",
  "purpose.charger": "Teste de um carregador ou fonte de alimentação",
  "purpose.powerBank": "Medição de um power bank ou bateria",
  "purpose.cable": "Verificação de um cabo",
  "purpose.draw": "Consumo de energia de um aparelho ou projeto",
  "purpose.appliance": "Consumo de energia de um eletrodoméstico",
  "purpose.other": "Outra coisa",

  "help.title": "Sobre este visualizador",
  "help.about":
    "Muitos testadores USB baratos têm Bluetooth, mas os apps de celular deles demoram para parear, são cheios de anúncios ou não são mais atualizados. Esta página lê diretamente o mesmo fluxo de dados Bluetooth e reúne todas as leituras em um único painel: tensão, corrente, potência, temperatura e as linhas de dados USB ganham um gráfico cada, todos no mesmo eixo de tempo. Passe o cursor sobre qualquer gráfico para ver todos os valores daquele instante e baixe a gravação inteira em CSV ou em um ZIP feito para assistentes de IA. Não há nada para instalar nem conta para criar.",

  "help.use.title": "Como usar",
  "help.use.open": "Abra esta página no Chrome ou no Edge.",
  "help.use.plug":
    "Conecte o medidor entre um carregador e o aparelho que você quer medir. Se ele já estava conectado ao carregador, retire-o e recoloque-o: alguns medidores, entre eles o J7-C, só podem ser encontrados logo depois de receberem energia.",
  "help.use.connect":
    "Selecione <b>Conectar ao medidor</b> imediatamente e escolha o medidor na lista. Um J7-C aparece como UC96_BLE, e os medidores ATorch aparecem com o nome do modelo, como UD18-BLE ou AT24-BLE. As leituras começam na mesma hora.",

  "help.ai.title": "Analisar uma gravação com IA",
  "help.ai.about":
    "<b>Exportar para IA</b> baixa um ZIP com dois arquivos: suas leituras em CSV e um README que explica a um assistente de IA o que foi gravado, o que significa cada coluna, o que um medidor como este consegue ou não medir e como analisar o tipo de teste que você fez: uma sessão de carregamento, um carregador, um power bank, um cabo ou o consumo de energia de um aparelho. Envie o ZIP ao Claude, ao ChatGPT ou a outro assistente e faça sua pergunta: por exemplo, quanto tempo o carregamento levou, se o carregador manteve a tensão ou quanto um power bank realmente entrega. Se o assistente não aceitar arquivos ZIP, descompacte-o e envie os dois arquivos.",
  "help.ai.language":
    "O README está escrito em inglês. Pergunte no seu idioma e o assistente responderá nele.",
  "help.ai.private":
    "A página continua sem enviar nada para lugar nenhum. O arquivo só vai para onde você o levar.",
  "help.ai.skill":
    "Para o Claude, também há uma skill com o mesmo guia, para que ele o tenha à mão mesmo quando receber só o CSV. <download>Baixe a skill do Claude</download> e adicione esse ZIP ao Claude (<how>como adicionar uma skill</how>).",

  "help.meters.title": "Medidores compatíveis",
  "help.meters.meter": "Medidor",
  "help.meters.type": "Tipo",
  "help.meters.status": "Status",
  "help.meters.ud18": "ATorch UD18 e outros medidores USB da mesma família",
  "help.meters.acModels": "Medidores AC da ATorch (AT24, AT3010)",
  "help.meters.dcModels":
    "Medidores DC da ATorch (DT24, DT3010) e outros modelos que usam o mesmo protocolo",
  "help.meters.ac": "Rede elétrica (AC)",
  "help.meters.j7cStatus": "Verificado com quadros gravados de um J7-C real",
  "help.meters.samples": "Verificado com pacotes de exemplo publicados",
  "help.meters.dcStatus":
    "Experimental: tensão, corrente, potência, temperatura e tempo. Capacidade e energia ainda não são decodificadas",
  "help.meters.report":
    "Se o seu medidor conectar, mas nenhuma leitura aparecer, <issue>abra uma issue</issue> informando o nome e o modelo dele.",

  "help.browsers.title": "Navegadores compatíveis",
  "help.browsers.about":
    "A página usa o Web Bluetooth, que o Chrome e o Edge oferecem no Windows, macOS, ChromeOS e Android. No Linux, o Chrome o mantém desativado: abra chrome://flags/#enable-experimental-web-platform-features no Chrome e ative essa opção primeiro. O Firefox e o Safari (incluindo todos os navegadores no iPhone e no iPad, exceto apps que adicionam o Web Bluetooth, como o Bluefy) não oferecem suporte a ele.",

  "help.privacy.title": "Privacidade",
  "help.privacy.about":
    "Tudo acontece no seu navegador. As leituras ficam na memória enquanto a página está aberta e nunca são enviadas para lugar nenhum. Não há cookies, ferramentas de análise nem anúncios. Como acontece com qualquer site, a página é servida por um provedor de hospedagem, que vê seu endereço IP quando você a carrega.",

  "help.faq.title": "Perguntas frequentes",
  "help.faq.missing.q": "O medidor não aparece na lista.",
  "help.faq.missing.replug":
    "Retire o medidor da porta USB, recoloque-o e volte a selecionar <b>Conectar ao medidor</b> imediatamente. Alguns medidores, entre eles o J7-C, só podem ser encontrados logo depois de receberem energia; por isso, um medidor que já está ligado há algum tempo fica fora da lista.",
  "help.faq.missing.other":
    "Se isso não resolver: a lista só mostra um medidor enquanto o navegador consegue detectá-lo, então ele precisa estar por perto, com o Bluetooth ativado e sem nenhuma outra conexão. Antes, desconecte-o de qualquer app de celular ou de outra guia, porque esses medidores aceitam só uma conexão Bluetooth por vez. No Windows e no Linux, verifique se o Bluetooth está ativado.",
  "help.faq.missing.all":
    "A lista também deixa de fora dispositivos que não parecem ser um medidor compatível. Se o seu ainda não aparecer, cancele a lista e selecione <b>Mostrar todos os dispositivos Bluetooth</b>. Quando a página não conhece o nome de um medidor conectado dessa forma, ela avisa, e basta uma <issue>issue</issue> com esse nome para que ele seja adicionado.",
  "help.faq.checksum.q": "Por que a página diz que o checksum não é verificado?",
  "help.faq.checksum.a":
    "Alguns medidores, entre eles o J7-C, usam um checksum diferente do da ATorch. As leituras são mostradas mesmo assim, desde que o restante do quadro esteja bem formado.",
  "help.faq.settings.q": "É possível zerar os contadores ou alterar as configurações?",
  "help.faq.settings.a": "Ainda não. O visualizador só faz a leitura.",

  "footer.text":
    "Licença MIT · <source>Código-fonte no GitHub</source> · Sem vínculo com a ATorch, nem com qualquer fabricante de medidores ou provedor de IA. Os nomes dos produtos pertencem aos respectivos proprietários e são usados apenas para indicar com o que esta página funciona.",
  "footer.warranty":
    "Esta página é operada por koedame e fornecida “no estado em que se encontra”, sem garantias. As leituras podem estar erradas: isto não é um instrumento calibrado nem um dispositivo de segurança, portanto não o use para decidir se um circuito, um carregador ou um eletrodoméstico é seguro.",
};
