import type { Messages } from "./en.ts";

export const zhHant: Messages = {
  "meta.title": "USB Meter Web – 藍牙 USB 測試儀檢視器，支援 ATorch UD18、J7-C",

  "top.tagline": "在瀏覽器中即時查看藍牙 USB 測試儀的讀數",
  "top.connect": "連線到測試儀",
  "top.demo": "試用示範模式",
  "top.disconnect": "中斷連線",
  "top.help": "說明",
  "top.language": "語言",

  "pill.idle": "未連線",
  "pill.connecting": "連線中…",
  "pill.live": "已連線",
  "pill.demo": "示範模式",

  "status.start": "插上測試儀，然後按一下「連線到測試儀」，再從清單中選取。",
  "status.choosing": "請在瀏覽器的藍牙清單中選取你的測試儀…",
  "status.noneChosen":
    "未選取任何測試儀。測試儀必須在附近且已通電、藍牙已開啟，而且沒有與手機應用程式或其他分頁等連線，才會出現在清單中。",
  "status.reading": "正在從 {name} 讀取資料。",
  "status.readingUnnamed": "正在從沒有藍牙名稱的測試儀讀取資料。",
  "status.readingUnknown":
    "正在從 {name} 讀取資料。本頁面還不認得這個名稱，請透過「說明」回報「{exact}」，以便日後加入。",
  "status.lost": "測試儀已中斷連線。按一下「連線到測試儀」即可重新連線。",
  "status.disconnected": "已中斷連線。記錄下來的讀數仍保留在下方。",
  "status.demo": "正在顯示虛擬充電器的模擬讀數，目前未連線到任何裝置。",
  "status.failed": "無法連線：{reason}",
  "error.noGatt": "這個裝置不提供 GATT 連線。",
  "error.noSerialService":
    "這個裝置沒有可持續傳送讀數的藍牙序列埠服務（0xFFE0），可能不是受支援的測試儀。",
  "error.timeout": "測試儀沒有回應。請確認它已通電且在附近，然後再次選擇「連線到測試儀」。",

  "hint.notListed":
    "清單中沒有你的測試儀？<b>請將它拔下再重新插上，然後立刻再按一下「連線到測試儀」。</b>有些測試儀只有在剛通電後的短時間內才找得到。還是沒出現？<all>顯示所有藍牙裝置</all>",
  "note.checksum": "這台測試儀不使用 ATorch 的總和檢查碼，因此顯示的讀數未經總和檢查碼驗證。",
  "note.unsupported":
    "這個瀏覽器無法與藍牙裝置通訊。請在電腦或 Android 手機上使用 Chrome 或 Edge；在 Linux 上，Chrome 需要先開啟一項設定（請參閱「說明」）。示範模式在任何瀏覽器上都能使用。",

  "range.legend": "時間範圍",
  "range.1min": "1 分鐘",
  "range.10min": "10 分鐘",
  "range.1h": "1 小時",
  "range.all": "全部",
  "action.csv": "下載 CSV",
  "action.aiExport": "匯出給 AI",
  "action.clear": "清除",
  "action.clearConfirm":
    "要清除記錄嗎？記錄只存在於這個分頁，清除後無法復原。如要保留，請先下載 CSV。",

  "panels.title": "即時讀數與歷史記錄",
  "metric.voltage": "電壓",
  "metric.current": "電流",
  "metric.power": "功率",
  "metric.temperature": "溫度",
  "metric.frequency": "頻率",
  "metric.pf": "功率因數",
  "panel.dataLines": "資料腳位",
  "panel.overTime": "{name}隨時間的變化",
  "stat.min": "最小",
  "stat.avg": "平均",
  "stat.max": "最大",
  "plot.empty": "尚無資料",
  "totals.title": "累計",
  "totals.capacity": "容量",
  "totals.energy": "能量",
  "totals.elapsed": "經過時間",

  "export.about":
    "下載一個 ZIP，內含你的讀數和一份說明這些讀數的 README，可直接交給 Claude、ChatGPT 或其他 AI 助理。請說明你測量的是什麼，讓它知道該注意哪些地方。",
  "export.purpose": "你測量的是什麼？",
  "export.notes": "給 AI 助理的備註 <optional>選填</optional>",
  "export.notesExample": "65 W 充電器、1 m 傳輸線，手機從 20% 開始充電",
  "export.cancel": "取消",
  "export.download": "下載 ZIP",
  "purpose.charging": "為裝置充電",
  "purpose.charger": "測試充電器或電源供應器",
  "purpose.powerBank": "測量行動電源或電池",
  "purpose.cable": "檢查傳輸線",
  "purpose.draw": "裝置或自製專案的功耗",
  "purpose.appliance": "電器的用電量",
  "purpose.other": "其他",

  "help.title": "關於這個檢視器",
  "help.about":
    "許多平價 USB 測試儀都有藍牙功能，但搭配的手機應用程式不是配對緩慢、充斥廣告，就是早已停止更新。本頁面直接讀取相同的藍牙資料串流，並將所有讀數集中在同一個儀表板上：電壓、電流、功率、溫度和 USB 資料腳位各有一張圖表，全部共用同一條時間軸。將游標移到任一張圖表上，即可查看該時間點的所有數值；你也可以將整段記錄下載為 CSV，或下載為專供 AI 助理使用的 ZIP。不需要安裝任何東西，也不需要帳號。",

  "help.use.title": "使用方式",
  "help.use.open": "用 Chrome 或 Edge 開啟本頁面。",
  "help.use.plug":
    "將測試儀接在充電器與要測量的裝置之間。如果測試儀原本就插著，請拔下再重新插上：有些測試儀（包括 J7-C）只有在剛通電後的短時間內才找得到。",
  "help.use.connect":
    "立刻按一下「<b>連線到測試儀</b>」，然後在清單中選取測試儀。J7-C 會顯示為 UC96_BLE，ATorch 的測試儀則會以型號顯示，例如 UD18-BLE 或 AT24-BLE。讀數會立即開始顯示。",

  "help.ai.title": "用 AI 分析記錄",
  "help.ai.about":
    "「<b>匯出給 AI</b>」會下載一個 ZIP，內含兩個檔案：CSV 格式的讀數，以及一份 README，用來告訴 AI 助理記錄了什麼、每個欄位代表什麼、這類測試儀能測量和不能測量什麼，以及該如何分析你所做的測試類型：充電過程、充電器、行動電源、傳輸線，或裝置的功耗。將 ZIP 交給 Claude、ChatGPT 或其他 AI 助理，再提出你的問題，例如充電花了多久、充電器的電壓是否穩定，或行動電源實際能輸出多少電量。如果 AI 助理不接受 ZIP 檔，請先解壓縮，再把兩個檔案都交給它。",
  "help.ai.language": "README 以英文撰寫。用你自己的語言提問，AI 助理就會用同樣的語言回答。",
  "help.ai.private": "本頁面依然不會將任何資料傳送到任何地方。檔案要交給誰，完全由你決定。",
  "help.ai.skill":
    "另外還有專供 Claude 使用的技能，內含相同的指南，因此 Claude 即使只拿到 CSV 也能參考。<download>下載 Claude 技能</download>，然後將該 ZIP 加入 Claude（<how>如何新增技能</how>）。",

  "help.meters.title": "支援的測試儀",
  "help.meters.meter": "測試儀",
  "help.meters.type": "類型",
  "help.meters.status": "狀態",
  "help.meters.ud18": "ATorch UD18 及同系列的其他 USB 測試儀",
  "help.meters.acModels": "ATorch 交流電測試儀（AT24、AT3010）",
  "help.meters.dcModels": "ATorch 直流電測試儀（DT24、DT3010），以及其他使用相同通訊協定的機型",
  "help.meters.ac": "交流市電",
  "help.meters.j7cStatus": "已用 J7-C 實機錄下的訊框驗證",
  "help.meters.samples": "已用公開的範例封包驗證",
  "help.meters.dcStatus": "實驗性支援：電壓、電流、功率、溫度和時間。容量和能量尚未解碼",
  "help.meters.report":
    "如果你的測試儀可以連線，卻沒有顯示讀數，請<issue>回報問題</issue>，並附上測試儀的名稱和型號。",

  "help.browsers.title": "瀏覽器支援",
  "help.browsers.about":
    "本頁面使用 Web Bluetooth。Chrome 和 Edge 在 Windows、macOS、ChromeOS 和 Android 上都提供這項功能。在 Linux 上，Chrome 預設會關閉這項功能，必須先啟用 chrome://flags/#enable-experimental-web-platform-features 才能使用。Firefox 和 Safari 則不支援（iPhone 和 iPad 上的所有瀏覽器也是如此，但 Bluefy 這類自行加入 Web Bluetooth 的應用程式除外）。",

  "help.privacy.title": "隱私權",
  "help.privacy.about":
    "一切都在你的瀏覽器中進行。讀數只會在頁面開啟期間保留在記憶體中，絕不會傳送到任何地方。沒有 Cookie、沒有流量分析，也沒有廣告。和任何網站一樣，本頁面是透過網站代管服務供應商傳送，你載入頁面時，該供應商會看到你的 IP 位址。",

  "help.faq.title": "常見問題",
  "help.faq.missing.q": "測試儀沒有出現在清單中。",
  "help.faq.missing.replug":
    "請拔下測試儀再重新插上，然後立刻再按一下「<b>連線到測試儀</b>」。有些測試儀（包括 J7-C）只有在剛通電後的短時間內才找得到，所以已經通電一段時間的測試儀不會出現在清單中。",
  "help.faq.missing.other":
    "如果還是不行：清單只會顯示瀏覽器偵測得到的測試儀，因此測試儀必須在附近、藍牙已開啟，而且沒有其他連線。這類測試儀一次只接受一個藍牙連線，所以請先中斷它與手機應用程式或其他分頁的連線。在 Windows 和 Linux 上，請確認藍牙已開啟。",
  "help.faq.missing.all":
    "清單也不會列出看起來不像受支援測試儀的裝置。如果還是找不到你的測試儀，請關閉清單，然後按一下「<b>顯示所有藍牙裝置</b>」。以這種方式連線後，如果本頁面不認得測試儀的名稱，會在頁面上說明；只要<issue>回報問題</issue>並附上該名稱，就能將它加入。",
  "help.faq.checksum.q": "為什麼顯示總和檢查碼未經驗證？",
  "help.faq.checksum.a":
    "有些測試儀（包括 J7-C）使用的總和檢查碼與 ATorch 的不同。只要訊框的其餘部分格式正確，讀數仍會顯示。",
  "help.faq.settings.q": "可以將累計值歸零或變更設定嗎？",
  "help.faq.settings.a": "目前還不行。這個檢視器只會讀取資料。",

  "footer.text":
    "採用 MIT 授權 · <source>GitHub 上的原始碼</source> · 與 ATorch、任何測試儀製造商及任何 AI 服務供應商皆無關聯。各產品名稱均為其所屬公司所有，僅用於說明本頁面可搭配使用的產品。",
  "footer.warranty":
    "由 koedame 營運，依「現狀」提供，不附帶任何擔保。讀數可能有誤：本頁面並非經過校正的儀器，也不是安全裝置，請勿用來判斷電路、充電器或電器是否安全。",
};
