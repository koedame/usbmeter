import type { Messages } from "./en.ts";

export const ko: Messages = {
  "meta.title": "USB Meter Web – ATorch UD18, J7-C용 블루투스 USB 테스터 뷰어",

  "top.tagline": "블루투스 USB 테스터 측정값을 브라우저에서 실시간으로",
  "top.connect": "측정기 연결",
  "top.demo": "데모 보기",
  "top.disconnect": "연결 해제",
  "top.help": "도움말",
  "top.language": "언어",

  "pill.idle": "연결 안 됨",
  "pill.connecting": "연결 중…",
  "pill.live": "연결됨",
  "pill.demo": "데모",

  "status.start": "측정기를 꽂은 다음 ‘측정기 연결’을 누르고 목록에서 측정기를 선택하세요.",
  "status.choosing": "브라우저의 블루투스 목록에서 측정기를 선택하세요…",
  "status.noneChosen":
    "측정기를 선택하지 않았습니다. 측정기는 가까이 있고 전원이 들어와 있으며, 블루투스가 켜져 있고, 휴대전화 앱이나 다른 탭 등 다른 곳에 연결되어 있지 않을 때만 목록에 표시됩니다.",
  "status.reading": "{name}에서 측정값을 읽는 중입니다.",
  "status.readingUnnamed": "블루투스 이름이 없는 측정기에서 측정값을 읽는 중입니다.",
  "status.readingUnknown":
    "{name}에서 측정값을 읽는 중입니다. 이 페이지가 아직 인식하지 못하는 이름입니다. 추가될 수 있도록 도움말을 통해 이 이름을 “{exact}” 그대로 알려 주세요.",
  "status.lost": "측정기와의 연결이 끊어졌습니다. 다시 연결하려면 ‘측정기 연결’을 누르세요.",
  "status.disconnected": "연결이 해제되었습니다. 기록된 측정값은 아래에 그대로 남아 있습니다.",
  "status.demo":
    "가상 충전기를 가정해 임의로 만든 측정값을 표시하고 있습니다. 아무것도 연결되어 있지 않습니다.",
  "status.failed": "연결하지 못했습니다: {reason}",
  "error.noGatt": "이 기기는 GATT 연결을 지원하지 않습니다.",
  "error.noSerialService":
    "이 기기에는 측정값을 전송하는 블루투스 시리얼 서비스(0xFFE0)가 없습니다. 지원되는 측정기가 아닐 수 있습니다.",
  "error.timeout":
    "측정기가 응답하지 않았습니다. 전원이 켜져 있고 가까이 있는지 확인한 뒤 측정기 연결을 다시 선택하세요.",

  "hint.notListed":
    "목록에 측정기가 없나요? <b>측정기를 뽑았다가 다시 꽂고 곧바로 ‘측정기 연결’을 다시 누르세요.</b> 일부 측정기는 전원이 들어온 직후 잠시 동안만 찾을 수 있습니다. 그래도 없나요? <all>모든 블루투스 기기 표시</all>",
  "note.checksum":
    "이 측정기는 ATorch 체크섬을 사용하지 않으므로 체크섬 검증 없이 측정값을 표시합니다.",
  "note.unsupported":
    "이 브라우저는 블루투스 기기와 통신할 수 없습니다. 컴퓨터나 Android 휴대전화에서 Chrome 또는 Edge를 사용하세요. Linux에서는 Chrome 설정을 먼저 바꿔야 합니다(도움말 참고). 데모는 어디서나 작동합니다.",

  "range.legend": "시간 범위",
  "range.1min": "1분",
  "range.10min": "10분",
  "range.1h": "1시간",
  "range.all": "전체",
  "action.csv": "CSV 다운로드",
  "action.aiExport": "AI용 내보내기",
  "action.clear": "지우기",
  "action.clearConfirm":
    "기록을 지울까요? 기록은 이 탭에만 있으며 되돌릴 수 없습니다. 보관하려면 먼저 CSV를 내려받으세요.",

  "panels.title": "실시간 측정값 및 기록",
  "metric.voltage": "전압",
  "metric.current": "전류",
  "metric.power": "전력",
  "metric.temperature": "온도",
  "metric.frequency": "주파수",
  "metric.pf": "역률",
  "panel.dataLines": "데이터 라인",
  "panel.overTime": "시간에 따른 {name} 변화",
  "stat.min": "최소",
  "stat.avg": "평균",
  "stat.max": "최대",
  "plot.empty": "아직 데이터가 없습니다",
  "totals.title": "누적값",
  "totals.capacity": "용량",
  "totals.energy": "전력량",
  "totals.elapsed": "경과 시간",

  "export.about":
    "측정값과 이를 설명하는 README가 담긴 ZIP 파일을 다운로드합니다. Claude, ChatGPT 또는 다른 AI 어시스턴트에게 바로 전달할 수 있습니다. 어시스턴트가 어떤 점을 살펴봐야 할지 알 수 있도록 무엇을 측정했는지 알려 주세요.",
  "export.purpose": "무엇을 측정했나요?",
  "export.notes": "어시스턴트에게 남길 메모 <optional>선택사항</optional>",
  "export.notesExample": "65 W 충전기, 1 m 케이블, 휴대전화 배터리 20%에서 시작",
  "export.cancel": "취소",
  "export.download": "ZIP 다운로드",
  "purpose.charging": "기기 충전",
  "purpose.charger": "충전기 또는 전원 공급 장치 테스트",
  "purpose.powerBank": "보조배터리 또는 배터리 측정",
  "purpose.cable": "케이블 점검",
  "purpose.draw": "기기 또는 프로젝트의 소비 전력",
  "purpose.appliance": "가전제품의 전력 사용량",
  "purpose.other": "기타",

  "help.title": "이 뷰어 소개",
  "help.about":
    "저렴한 USB 테스터 중에는 블루투스를 지원하는 제품이 많지만, 전용 휴대전화 앱은 페어링이 느리거나 광고가 가득하거나 업데이트가 끊긴 경우가 많습니다. 이 페이지는 같은 블루투스 데이터를 직접 읽어 모든 측정값을 하나의 대시보드에 보여 줍니다. 전압, 전류, 전력, 온도, USB 데이터 라인이 각각 그래프로 표시되며 모두 같은 시간축을 사용합니다. 그래프 위에 포인터를 올리면 그 시점의 모든 값을 확인할 수 있고, 전체 기록을 CSV 또는 AI 어시스턴트용 ZIP 파일로 다운로드할 수 있습니다. 설치도 계정도 필요 없습니다.",

  "help.use.title": "사용 방법",
  "help.use.open": "Chrome 또는 Edge에서 이 페이지를 여세요.",
  "help.use.plug":
    "충전기와 측정할 기기 사이에 측정기를 꽂으세요. 이미 꽂혀 있었다면 뽑았다가 다시 꽂으세요. J7-C를 비롯한 일부 측정기는 전원이 들어온 직후 잠시 동안만 찾을 수 있습니다.",
  "help.use.connect":
    "곧바로 <b>측정기 연결</b>을 누르고 목록에서 측정기를 선택하세요. J7-C는 UC96_BLE로, ATorch 측정기는 UD18-BLE나 AT24-BLE 같은 모델명으로 표시됩니다. 측정값이 바로 표시됩니다.",

  "help.ai.title": "AI로 기록 분석하기",
  "help.ai.about":
    "<b>AI용 내보내기</b>를 누르면 파일 두 개가 담긴 ZIP 파일이 다운로드됩니다. 하나는 측정값이 담긴 CSV이고, 다른 하나는 README입니다. README는 무엇을 기록했는지, 각 열이 무엇을 뜻하는지, 이런 측정기로 측정할 수 있는 것과 없는 것이 무엇인지, 그리고 충전 과정, 충전기, 보조배터리, 케이블, 기기의 소비 전력 등 진행한 테스트 종류에 맞는 분석 방법을 AI 어시스턴트에게 알려 줍니다. ZIP 파일을 Claude, ChatGPT 또는 다른 어시스턴트에게 전달하고 궁금한 점을 물어보세요. 예를 들어 충전에 얼마나 걸렸는지, 충전기가 전압을 유지했는지, 보조배터리가 실제로 공급하는 용량이 얼마인지 물어볼 수 있습니다. 어시스턴트가 ZIP 파일을 지원하지 않으면 압축을 풀어 두 파일을 모두 전달하세요.",
  "help.ai.language":
    "README는 영어로 작성되어 있습니다. 사용하는 언어로 질문하면 어시스턴트도 그 언어로 답합니다.",
  "help.ai.private":
    "이때에도 이 페이지는 아무것도 외부로 전송하지 않습니다. 파일은 직접 보낸 곳으로만 전달됩니다.",
  "help.ai.skill":
    "Claude용으로는 같은 안내가 담긴 스킬도 있어서, Claude가 CSV만 받아도 이 안내를 참고할 수 있습니다. <download>Claude 스킬 다운로드</download>를 눌러 받은 ZIP 파일을 Claude에 추가하세요(<how>스킬 추가 방법</how>).",

  "help.meters.title": "지원되는 측정기",
  "help.meters.meter": "측정기",
  "help.meters.type": "유형",
  "help.meters.status": "상태",
  "help.meters.ud18": "ATorch UD18 및 같은 계열의 다른 USB 측정기",
  "help.meters.acModels": "ATorch AC 측정기(AT24, AT3010)",
  "help.meters.dcModels": "ATorch DC 측정기(DT24, DT3010) 및 같은 프로토콜을 사용하는 다른 모델",
  "help.meters.ac": "AC 전원",
  "help.meters.j7cStatus": "실제 J7-C에서 기록한 프레임으로 검증됨",
  "help.meters.samples": "공개된 샘플 패킷으로 검증됨",
  "help.meters.dcStatus":
    "실험적 지원: 전압, 전류, 전력, 온도, 시간. 용량과 전력량은 아직 디코딩되지 않음",
  "help.meters.report":
    "측정기가 연결되었는데도 측정값이 표시되지 않으면 측정기의 이름과 모델을 적어 <issue>이슈를 등록</issue>해 주세요.",

  "help.browsers.title": "지원 브라우저",
  "help.browsers.about":
    "이 페이지는 Web Bluetooth를 사용합니다. 이 기능은 Windows, macOS, ChromeOS, Android의 Chrome과 Edge에서 제공됩니다. Linux의 Chrome에서는 이 기능이 꺼져 있으며, chrome://flags/#enable-experimental-web-platform-features 플래그를 사용 설정해야 켜집니다. Firefox와 Safari에서는 지원되지 않으며, iPhone과 iPad에서는 Bluefy처럼 Web Bluetooth를 추가한 앱을 제외한 모든 브라우저에서 지원되지 않습니다.",

  "help.privacy.title": "개인정보 보호",
  "help.privacy.about":
    "모든 처리는 브라우저 안에서 이루어집니다. 측정값은 페이지가 열려 있는 동안 메모리에 보관되며 어디로도 전송되지 않습니다. 쿠키도, 분석 도구도, 광고도 없습니다. 다른 웹사이트와 마찬가지로 이 페이지는 호스팅 업체를 통해 제공되며, 페이지를 불러올 때 호스팅 업체가 사용자의 IP 주소를 알게 됩니다.",

  "help.faq.title": "자주 묻는 질문",
  "help.faq.missing.q": "측정기가 목록에 표시되지 않습니다.",
  "help.faq.missing.replug":
    "측정기를 뽑았다가 다시 꽂고 곧바로 <b>측정기 연결</b>을 다시 누르세요. J7-C를 비롯한 일부 측정기는 전원이 들어온 직후 잠시 동안만 찾을 수 있으므로, 한동안 전원이 들어와 있던 측정기는 목록에 나타나지 않습니다.",
  "help.faq.missing.other":
    "그래도 해결되지 않으면 측정기가 가까이 있는지, 측정기의 블루투스가 켜져 있는지, 다른 곳에 연결되어 있지 않은지 확인하세요. 목록에는 브라우저가 신호를 감지할 수 있는 측정기만 표시됩니다. 이런 측정기는 블루투스 연결을 한 번에 하나만 허용하므로, 휴대전화 앱이나 다른 탭에 연결되어 있다면 먼저 연결을 해제하세요. Windows와 Linux에서는 블루투스가 켜져 있는지 확인하세요.",
  "help.faq.missing.all":
    "목록에는 지원되는 측정기로 보이지 않는 기기도 표시되지 않습니다. 그래도 측정기가 없으면 목록을 닫고 <b>모든 블루투스 기기 표시</b>를 누르세요. 이렇게 연결한 측정기의 이름을 페이지가 인식하지 못하면 그 사실을 알려 주며, 그 이름을 적어 <issue>이슈</issue>를 등록하면 추가됩니다.",
  "help.faq.checksum.q": "체크섬을 검증하지 않는다고 표시되는 이유는 무엇인가요?",
  "help.faq.checksum.a":
    "J7-C를 비롯한 일부 측정기는 ATorch와 다른 체크섬을 사용합니다. 프레임의 나머지 형식이 올바르면 측정값은 그대로 표시됩니다.",
  "help.faq.settings.q": "누적값을 초기화하거나 설정을 변경할 수 있나요?",
  "help.faq.settings.a": "아직은 안 됩니다. 이 뷰어는 읽기만 합니다.",

  "footer.text":
    "MIT 라이선스 · <source>GitHub 소스 코드</source> · ATorch를 비롯한 어떤 측정기 제조업체나 AI 제공업체와도 제휴 관계가 없습니다. 제품명은 각 소유자의 자산이며, 이 페이지와 호환되는 제품을 알리기 위해서만 사용됩니다.",
  "footer.warranty":
    "koedame에서 운영하며, 어떠한 보증도 없이 ‘있는 그대로’ 제공됩니다. 측정값은 틀릴 수 있습니다. 이 페이지는 교정된 계측기나 안전 장치가 아니므로 회로, 충전기, 가전제품의 안전 여부를 판단하는 데 사용하지 마세요.",
};
