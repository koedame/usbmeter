import type { Messages } from "./en.ts";

export const zhHans: Messages = {
  "meta.title": "USB Meter Web – 蓝牙 USB 测试仪查看器，支持 ATorch UD18、J7-C",

  "top.tagline": "在浏览器中实时查看蓝牙 USB 测试仪的读数",
  "top.connect": "连接测试仪",
  "top.demo": "体验演示",
  "top.disconnect": "断开连接",
  "top.help": "帮助",
  "top.language": "语言",

  "pill.idle": "未连接",
  "pill.connecting": "正在连接…",
  "pill.live": "已连接",
  "pill.demo": "演示",

  "status.start": "插上测试仪，然后点击“连接测试仪”并从列表中选择它。",
  "status.choosing": "请在浏览器的蓝牙列表中选择您的测试仪…",
  "status.noneChosen":
    "未选择测试仪。只有当测试仪就在附近、已通电、蓝牙已开启，并且没有被手机应用或其他标签页等连接时，它才会出现在列表中。",
  "status.reading": "正在从 {name} 读取数据。",
  "status.readingUnnamed": "正在从一台没有蓝牙名称的测试仪读取数据。",
  "status.readingUnknown":
    "正在从 {name} 读取数据。本页面尚不认识此名称；请通过“帮助”反馈，并将名称写作“{exact}”，以便将其收录。",
  "status.lost": "测试仪已断开连接。点击“连接测试仪”可重新连接。",
  "status.disconnected": "已断开连接。已记录的读数仍显示在下方。",
  "status.demo": "正在显示虚拟充电器的模拟读数。未连接任何设备。",
  "status.failed": "无法连接：{reason}",
  "error.noGatt": "此设备不提供 GATT 连接。",
  "error.noSerialService":
    "此设备没有用于传输读数的蓝牙串口服务（0xFFE0）。它可能不是受支持的测试仪。",
  "error.timeout": "测试仪没有响应。请确认它已通电且在附近，然后再次选择“连接测试仪”。",

  "hint.notListed":
    "列表中没有测试仪？<b>请将它拔下再重新插上，然后立即再次点击“连接测试仪”。</b>有些测试仪只有在通电后的短时间内才能被发现。仍然找不到？<all>显示所有蓝牙设备</all>",
  "note.checksum": "此测试仪未使用 ATorch 校验和，因此显示的读数未经校验和验证。",
  "note.unsupported":
    "此浏览器无法与蓝牙设备通信。请在电脑或 Android 手机上使用 Chrome 或 Edge；在 Linux 上，Chrome 需要先开启一项设置（参见“帮助”）。演示在任何浏览器中都能使用。",

  "range.legend": "时间范围",
  "range.1min": "1 分钟",
  "range.10min": "10 分钟",
  "range.1h": "1 小时",
  "range.all": "全部",
  "action.csv": "下载 CSV",
  "action.aiExport": "导出给 AI",
  "action.clear": "清空",
  "action.clearConfirm": "清除记录？记录只存在于此标签页，清除后无法恢复。如需保留，请先下载 CSV。",

  "panels.title": "实时读数与历史记录",
  "metric.voltage": "电压",
  "metric.current": "电流",
  "metric.power": "功率",
  "metric.temperature": "温度",
  "metric.frequency": "频率",
  "metric.pf": "功率因数",
  "panel.dataLines": "数据引脚",
  "panel.overTime": "{name}随时间的变化",
  "stat.min": "最小",
  "stat.avg": "平均",
  "stat.max": "最大",
  "plot.empty": "暂无数据",
  "totals.title": "累计",
  "totals.capacity": "容量",
  "totals.energy": "能量",
  "totals.elapsed": "时长",

  "export.about":
    "将下载一个 ZIP，内含您的读数和一份说明这些读数的 README，可直接交给 Claude、ChatGPT 或其他 AI 助手。请说明您测量的是什么，让它知道该关注哪些方面。",
  "export.purpose": "您测量的是什么？",
  "export.notes": "给助手的备注 <optional>选填</optional>",
  "export.notesExample": "65 W 充电器，1 m 数据线，手机初始电量 20%",
  "export.cancel": "取消",
  "export.download": "下载 ZIP",
  "purpose.charging": "给设备充电",
  "purpose.charger": "测试充电器或电源",
  "purpose.powerBank": "测量充电宝或电池",
  "purpose.cable": "检测数据线",
  "purpose.draw": "设备或自制项目的功耗",
  "purpose.appliance": "电器的耗电量",
  "purpose.other": "其他",

  "help.title": "关于本查看器",
  "help.about":
    "许多便宜的 USB 测试仪都带蓝牙，但配套的手机应用要么配对缓慢，要么满屏广告，要么已不再更新。本页面直接读取同样的蓝牙数据流，并把所有读数汇集到一个仪表盘上：电压、电流、功率、温度和 USB 数据引脚各有一张图表，共用同一条时间轴。将指针移到任意图表上，即可查看该时刻的所有数值；还可以把整段记录下载为 CSV，或下载为专供 AI 助手使用的 ZIP。无需安装，也无需注册账号。",

  "help.use.title": "使用方法",
  "help.use.open": "在 Chrome 或 Edge 中打开本页面。",
  "help.use.plug":
    "将测试仪接在充电器和要测量的设备之间。如果它之前已经插着，请拔下再重新插上：有些测试仪（包括 J7-C）只有在通电后的短时间内才能被发现。",
  "help.use.connect":
    "立即点击<b>连接测试仪</b>，并在列表中选择测试仪。J7-C 显示为 UC96_BLE，ATorch 测试仪则以型号名称显示，例如 UD18-BLE 或 AT24-BLE。读数会立刻开始显示。",

  "help.ai.title": "用 AI 分析记录",
  "help.ai.about":
    "点击<b>导出给 AI</b>，即可下载一个包含两个文件的 ZIP：CSV 格式的读数，以及一份 README。README 会告诉 AI 助手记录了什么、每一列的含义、这类测试仪能测什么和不能测什么，以及如何分析您所做的这类测试：充电过程、充电器、充电宝、数据线，或设备的功耗。把这个 ZIP 交给 Claude、ChatGPT 或其他助手，然后提出您的问题，例如充电用了多长时间、充电器的电压是否保持稳定，或者充电宝实际能输出多少电量。如果助手不接受 ZIP 文件，请将其解压，再把两个文件都交给它。",
  "help.ai.language": "README 是用英文写的。用您自己的语言提问，助手也会用这种语言回答。",
  "help.ai.private": "本页面依然不会向任何地方发送任何数据。文件的去向完全由您决定。",
  "help.ai.skill":
    "此外，还有一个面向 Claude 的技能，内含同一份指南，这样 Claude 即使只拿到 CSV 也能随时参考。<download>下载 Claude 技能</download>，并将该 ZIP 添加到 Claude（<how>如何添加技能</how>）。",

  "help.meters.title": "支持的测试仪",
  "help.meters.meter": "测试仪",
  "help.meters.type": "类型",
  "help.meters.status": "状态",
  "help.meters.ud18": "ATorch UD18 及同系列的其他 USB 测试仪",
  "help.meters.acModels": "ATorch 交流测试仪（AT24、AT3010）",
  "help.meters.dcModels": "ATorch 直流测试仪（DT24、DT3010）及使用相同协议的其他型号",
  "help.meters.ac": "交流市电",
  "help.meters.j7cStatus": "已对照从真实 J7-C 录制的数据帧验证",
  "help.meters.samples": "已对照公开的示例数据包验证",
  "help.meters.dcStatus": "实验性支持：电压、电流、功率、温度和时间。容量和能量尚未解码",
  "help.meters.report":
    "如果您的测试仪能连接但没有读数显示，请<issue>提交 issue</issue>，并附上它的名称和型号。",

  "help.browsers.title": "浏览器支持",
  "help.browsers.about":
    "本页面使用 Web Bluetooth，Chrome 和 Edge 在 Windows、macOS、ChromeOS 和 Android 上均提供这一功能。在 Linux 上，Chrome 默认关闭这一功能，需要先启用 chrome://flags/#enable-experimental-web-platform-features 才能使用。Firefox 和 Safari（包括 iPhone 和 iPad 上的所有浏览器，但 Bluefy 等自行加入 Web Bluetooth 的应用除外）则不支持。",

  "help.privacy.title": "隐私",
  "help.privacy.about":
    "一切都在您的浏览器中完成。读数仅在页面打开期间保存在内存中，绝不会发送到任何地方。没有 Cookie，没有统计分析，也没有广告。与任何网站一样，本页面通过托管服务商分发，您加载页面时，该服务商会看到您的 IP 地址。",

  "help.faq.title": "常见问题",
  "help.faq.missing.q": "测试仪没有出现在列表中。",
  "help.faq.missing.replug":
    "将测试仪拔下再重新插上，然后立即再次点击<b>连接测试仪</b>。有些测试仪（包括 J7-C）只有在通电后的短时间内才能被发现，因此已经通电一段时间的测试仪不会出现在列表中。",
  "help.faq.missing.other":
    "如果仍然不行：只有当浏览器能接收到测试仪的信号时，列表才会显示它，因此测试仪需要在附近、蓝牙已开启，并且没有其他连接。请先断开它与手机应用或其他标签页的连接，因为这类测试仪同一时间只接受一个蓝牙连接。在 Windows 和 Linux 上，请确保蓝牙已开启。",
  "help.faq.missing.all":
    "列表也不会列出看起来不像受支持测试仪的设备。如果仍然找不到您的测试仪，请关闭该列表，然后点击<b>显示所有蓝牙设备</b>。如果本页面不认识以这种方式连接的测试仪的名称，会给出提示；提交一个包含该名称的 <issue>issue</issue>，即可将其收录。",
  "help.faq.checksum.q": "为什么提示未验证校验和？",
  "help.faq.checksum.a":
    "有些测试仪（包括 J7-C）使用的校验和与 ATorch 的不同。只要数据帧的其他部分格式正确，读数仍会显示。",
  "help.faq.settings.q": "可以将累计数据清零或更改设置吗？",
  "help.faq.settings.a": "目前还不行。本查看器只读取数据。",

  "footer.text":
    "采用 MIT 许可证 · <source>GitHub 上的源代码</source> · 与 ATorch、任何测试仪制造商或任何 AI 提供商均无关联。产品名称归其各自所有者所有，仅用于说明本页面可与哪些产品配合使用。",
  "footer.warranty":
    "由 koedame 运营，按“原样”提供，不作任何担保。读数可能有误：本页面不是经过校准的仪器，也不是安全装置，请勿据此判断电路、充电器或电器是否安全。",
};
