import type { Messages } from "./en.ts";

export const ja: Messages = {
  "meta.title": "USB Meter Web – ATorch UD18・J7-C 対応の Bluetooth USB テスター用ビューアー",

  "top.tagline": "Bluetooth USB テスターの測定値をブラウザでリアルタイム表示",
  "top.connect": "メーターに接続",
  "top.demo": "デモを試す",
  "top.disconnect": "切断",
  "top.help": "ヘルプ",
  "top.language": "言語",

  "pill.idle": "未接続",
  "pill.connecting": "接続中…",
  "pill.live": "接続済み",
  "pill.demo": "デモ",

  "status.start": "メーターを挿し、「メーターに接続」を押して一覧から選んでください。",
  "status.choosing": "ブラウザの Bluetooth デバイス一覧からメーターを選んでください…",
  "status.noneChosen":
    "メーターが選択されませんでした。メーターが一覧に表示されるのは、近くにあって電源が入っており、Bluetooth がオンで、スマートフォンのアプリや別のタブなど、ほかから接続されていないときだけです。",
  "status.reading": "{name} から測定値を読み取っています。",
  "status.readingUnnamed": "Bluetooth の名前がないメーターから測定値を読み取っています。",
  "status.readingUnknown":
    "{name} から測定値を読み取っています。このページがまだ知らない名前です。追加できるよう、「ヘルプ」から「{exact}」という名前で報告してください。",
  "status.lost": "メーターとの接続が切れました。再接続するには「メーターに接続」を押してください。",
  "status.disconnected": "切断しました。記録した測定値は下に残っています。",
  "status.demo": "架空の充電器によるダミーの測定値を表示しています。何も接続されていません。",
  "status.failed": "接続できませんでした: {reason}",
  "error.noGatt": "このデバイスは GATT 接続に対応していません。",
  "error.noSerialService":
    "このデバイスには、測定値を送信する Bluetooth シリアル通信サービス（0xFFE0）がありません。対応メーターではない可能性があります。",

  "hint.notListed":
    "メーターが一覧にありませんか？<b>いったん抜いて挿し直し、すぐにもう一度「メーターに接続」を押してください。</b>電源が入った直後しか見つからないメーターもあります。それでも見つかりませんか？<all>すべての Bluetooth デバイスを表示</all>",
  "note.checksum":
    "このメーターは ATorch のチェックサムを使っていないため、チェックサムを検証せずに測定値を表示しています。",
  "note.unsupported":
    "このブラウザは Bluetooth デバイスと通信できません。パソコンまたは Android スマートフォンの Chrome か Edge をお使いください（Linux の Chrome は先に設定が必要です。「ヘルプ」をご覧ください）。デモはどの環境でも動きます。",

  "range.legend": "時間範囲",
  "range.1min": "1 分",
  "range.10min": "10 分",
  "range.1h": "1 時間",
  "range.all": "すべて",
  "action.csv": "CSV をダウンロード",
  "action.aiExport": "AI 用にエクスポート",
  "action.clear": "クリア",

  "panels.title": "現在の測定値と履歴",
  "metric.voltage": "電圧",
  "metric.current": "電流",
  "metric.power": "電力",
  "metric.temperature": "温度",
  "metric.frequency": "周波数",
  "metric.pf": "力率",
  "panel.dataLines": "データ線",
  "panel.overTime": "{name}の推移",
  "stat.min": "最小",
  "stat.avg": "平均",
  "stat.max": "最大",
  "plot.empty": "データはまだありません",
  "totals.title": "積算",
  "totals.capacity": "容量",
  "totals.energy": "電力量",
  "totals.elapsed": "経過時間",

  "export.about":
    "測定値と、その見方を説明した README を ZIP にまとめてダウンロードします。Claude や ChatGPT などの AI アシスタントにそのまま渡せます。何を測定したかを伝えておくと、アシスタントは何に注目すればよいかがわかります。",
  "export.purpose": "何を測定しましたか？",
  "export.notes": "アシスタントへのメモ <optional>任意</optional>",
  "export.notesExample": "65 W の充電器、1 m のケーブル、スマートフォンは残量 20% から",
  "export.cancel": "キャンセル",
  "export.download": "ZIP をダウンロード",
  "purpose.charging": "機器の充電",
  "purpose.charger": "充電器や電源のテスト",
  "purpose.powerBank": "モバイルバッテリーや電池の測定",
  "purpose.cable": "ケーブルのチェック",
  "purpose.draw": "機器や電子工作の消費電力",
  "purpose.appliance": "家電の消費電力",
  "purpose.other": "その他",

  "help.title": "このビューアーについて",
  "help.about":
    "安価な USB メーターの多くは Bluetooth に対応していますが、専用のスマートフォンアプリはペアリングに時間がかかったり、広告が多かったり、更新が止まっていたりします。このページは同じ Bluetooth のデータを直接読み取り、すべての測定値を 1 つのダッシュボードにまとめます。電圧、電流、電力、温度、USB のデータ線をそれぞれグラフにし、同じ時間軸にそろえて表示します。どのグラフでも、ポインターを合わせるとその時点のすべての値を読み取れます。記録全体は、CSV または AI アシスタント向けの ZIP としてダウンロードできます。インストールもアカウントも不要です。",

  "help.use.title": "使い方",
  "help.use.open": "このページを Chrome か Edge で開きます。",
  "help.use.plug":
    "充電器と測定したい機器の間にメーターを挿します。すでに挿してある場合は、いったん抜いて挿し直します。J7-C など一部のメーターは、電源が入った直後しか見つからないためです。",
  "help.use.connect":
    "すぐに「<b>メーターに接続</b>」を押し、一覧からメーターを選びます。J7-C は UC96_BLE という名前で、ATorch のメーターは UD18-BLE や AT24-BLE のように型番の名前で表示されます。測定値の表示がすぐに始まります。",

  "help.ai.title": "記録を AI で分析する",
  "help.ai.about":
    "「<b>AI 用にエクスポート</b>」を押すと、2 つのファイルが入った ZIP がダウンロードされます。測定値の CSV と、AI アシスタント向けの README です。README には、何を記録したか、各列の意味、この種のメーターで測定できることとできないこと、そして行ったテストの種類（機器の充電、充電器、モバイルバッテリー、ケーブル、機器の消費電力）に合った分析の方法が書かれています。この ZIP を Claude や ChatGPT などのアシスタントに渡して、知りたいことを質問してください。たとえば、充電にどれくらい時間がかかったか、充電器が電圧を保てていたか、モバイルバッテリーから実際にどれだけ取り出せるか、といった質問です。アシスタントが ZIP を受け付けない場合は、展開して 2 つのファイルを両方とも渡してください。",
  "help.ai.language":
    "README は英語で書かれています。日本語で質問すれば、アシスタントは日本語で答えます。",
  "help.ai.private":
    "この場合も、このページからは何も送信されません。ファイルが届くのは、自分で渡した先だけです。",
  "help.ai.skill":
    "Claude 向けには、同じガイドを収めたスキルもあります。これがあれば、CSV だけを渡したときでも Claude がガイドを参照できます。<download>Claude スキルをダウンロード</download>して、その ZIP を Claude に追加してください（<how>スキルの追加方法</how>）。",

  "help.meters.title": "対応メーター",
  "help.meters.meter": "メーター",
  "help.meters.type": "種類",
  "help.meters.status": "対応状況",
  "help.meters.ud18": "ATorch UD18 および同系統の USB メーター",
  "help.meters.acModels": "ATorch の AC メーター（AT24、AT3010）",
  "help.meters.dcModels": "ATorch の DC メーター（DT24、DT3010）と、同じプロトコルを使う機種",
  "help.meters.ac": "AC（商用電源）",
  "help.meters.j7cStatus": "J7-C の実機から記録したフレームで確認済み",
  "help.meters.samples": "公開されているサンプルパケットで確認済み",
  "help.meters.dcStatus":
    "試験的な対応（電圧、電流、電力、温度、時間）。容量と電力量はまだ読み取れません",
  "help.meters.report":
    "メーターに接続できても測定値が表示されない場合は、メーターの名前と型番を添えて <issue>Issue を作成</issue>してください。",

  "help.browsers.title": "対応ブラウザ",
  "help.browsers.about":
    "このページは Web Bluetooth を使います。Web Bluetooth は、Windows、macOS、ChromeOS、Android の Chrome と Edge で利用できます。Linux の Chrome では既定で無効になっているので、chrome://flags/#enable-experimental-web-platform-features を有効にしてください。Firefox と Safari は対応していません。iPhone と iPad のブラウザもすべて非対応ですが、Bluefy のように Web Bluetooth を追加するアプリは例外です。",

  "help.privacy.title": "プライバシー",
  "help.privacy.about":
    "処理はすべてブラウザの中で行われます。測定値はページを開いている間だけメモリに保持され、どこにも送信されません。Cookie も、アクセス解析も、広告もありません。ほかの Web サイトと同じく、ページを配信するホスティング事業者には、ページを開いたときに IP アドレスが伝わります。",

  "help.faq.title": "よくある質問",
  "help.faq.missing.q": "メーターが一覧に表示されません。",
  "help.faq.missing.replug":
    "メーターをいったん抜いて挿し直し、すぐにもう一度「<b>メーターに接続</b>」を押してください。J7-C など一部のメーターは電源が入った直後しか見つからないため、しばらく電源が入ったままのメーターは一覧に表示されません。",
  "help.faq.missing.other":
    "それでも表示されないときは、メーターが近くにあり、メーター側の Bluetooth がオンで、ほかから接続されていないことを確かめてください。一覧に表示されるのは、ブラウザがメーターを検出できている間だけです。この種のメーターは同時に 1 つの Bluetooth 接続しか受け付けないので、スマートフォンのアプリや別のタブとつながっている場合は、先に切断してください。Windows と Linux では、Bluetooth がオンになっていることを確認してください。",
  "help.faq.missing.all":
    "対応メーターに見えないデバイスも、一覧には表示されません。それでも見つからない場合は、一覧をキャンセルして「<b>すべての Bluetooth デバイスを表示</b>」を押してください。この方法で接続したメーターの名前をページが知らないときは、その旨が表示されます。その名前を <issue>Issue</issue> で報告すると、対応メーターに追加されます。",
  "help.faq.checksum.q": "チェックサムを検証していないと表示されるのはなぜですか？",
  "help.faq.checksum.a":
    "J7-C など一部のメーターは、ATorch とは異なるチェックサムを使っています。その場合も、フレームがほかの点で正しい形式であれば測定値を表示します。",
  "help.faq.settings.q": "積算値のリセットや設定の変更はできますか？",
  "help.faq.settings.a": "まだできません。このビューアーは読み取り専用です。",

  "footer.text":
    "MIT ライセンス · <source>GitHub のソースコード</source> · ATorch をはじめとするメーターのメーカーや、AI の提供元とは一切関係ありません。製品名は各所有者に帰属し、このページが何に対応しているかを示すためにのみ使用しています。",
  "footer.warranty":
    "運営は koedame です。このページは現状のまま提供され、保証はありません。測定値が誤っていることもあります。校正された計測器でも安全装置でもないので、回路や充電器、家電が安全かどうかの判断には使わないでください。",
};
