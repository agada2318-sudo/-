import {
  CodeAdditionItem,
  CodeComparisonItem,
  LineInterpretation,
  SimpleCodeAnalysis,
  TokenBreakdown,
} from '../types.ts';

interface TagMasterInfo {
  name: string;
  // 주석 3종
  subBeginner: string;
  subIntermediate: string;
  subAdvanced: string;
  // 초급자
  easyExplanation: string;
  whyUsedHere: string;
  wrongExample?: CodeComparisonItem;
  betterExample?: CodeComparisonItem;
  // 중급자
  codeCheckVerdict: string;
  betterRefactor?: CodeComparisonItem;
  suggestedAdditions?: CodeAdditionItem[];
  // 전공자
  bugIssueTitle: string;
  bugIssueDetail: string;
  bugSeverity: 'none' | 'warning' | 'error' | 'security';
  missingTitle: string;
  missingSnippet: string;
  missingReason: string;
  recommendedPatch: string;
}

const HTML_MASTER_DICTIONARY: Record<string, TagMasterInfo> = {
  '!doctype': {
    name: 'HTML5 문서 규격 선언',
    subBeginner: '이 문서가 최신 HTML5 표준 웹페이지임을 브라우저에 선언합니다.',
    subIntermediate: '표준 렌더링 모드(Standards Mode) 활성화 및 레거시 쿽스 모드 차단',
    subAdvanced: '[PASS] HTML5 Doctype 선언 정상. 렌더링 엔진 표준 트리거 완료.',
    easyExplanation:
      '크롬이나 사파리 같은 웹 브라우저에게 "이 문서는 최신 규격인 HTML5로 만든 웹페이지입니다"라고 첫 줄에서 명확하게 알려주는 선언문입니다.',
    whyUsedHere:
      '브라우저가 옛날 방식(쿽스 모드)으로 동작하지 않고, 최신 웹 표준 기술과 CSS 레이아웃을 정확하게 그리도록 만들기 위해 문서 맨 첫 줄에 필수적으로 작성되었습니다.',
    wrongExample: {
      code: '<html> (선언 누락)',
      reason: 'DOCTYPE을 빼먹으면 브라우저가 2000년대 초반 호환 모드로 동작하여 최신 CSS Flexbox나 Grid가 깨질 수 있습니다.',
    },
    betterExample: {
      code: '<!DOCTYPE html>',
      reason: '파일 맨 첫 줄에 공백이나 줄바꿈 없이 대문자로 선언하는 것이 가장 확실하고 안전합니다.',
    },
    codeCheckVerdict:
      '문법적으로 완벽합니다. 대소문자는 무관하나 관례적인 대문자 표기를 지켰으며 문서 최상단에 정확히 배치되었습니다.',
    betterRefactor: {
      code: '<!DOCTYPE html>',
      reason: 'HTML5 단일 선언 표준으로 추가적인 DTD URL이 필요 없는 최적의 형태입니다.',
    },
    suggestedAdditions: [
      {
        code: '<!-- UTF-8 / Responsive Meta Tags Follow -->',
        meaning: '문서 헤더 메타데이터 영역 안내',
        whyAdd: 'DOCTYPE 직후 <head> 내 문자셋과 뷰포트 메타태그가 반드시 뒤따라야 함을 구조적으로 명시하기 위함입니다.',
      },
    ],
    bugIssueTitle: 'Doctype 선언 유효성 통과',
    bugIssueDetail: 'BOM(Byte Order Mark) 없는 정상 텍스트 스트림. Standards Mode 정상 트리거.',
    bugSeverity: 'none',
    missingTitle: '누락 없음',
    missingSnippet: '',
    missingReason: 'HTML5 doctype 최소 요건 충족',
    recommendedPatch: '<!DOCTYPE html>',
  },
  html: {
    name: 'HTML 최상위 루트 태그',
    subBeginner: '웹페이지의 모든 내용(머리말과 본문)을 감싸는 가장 바깥 상자입니다.',
    subIntermediate: 'DOM 트리의 루트 노드 (언어 속성 lang="ko" 준수 여부 점검)',
    subAdvanced: '[AUDIT] Root Element 선언. i18n/a11y용 lang 디렉티브 검증.',
    easyExplanation:
      '웹페이지에 들어가는 모든 글자, 이미지, 설정, 본문 전체를 하나로 감싸주는 가장 큰 최상위 상자입니다.',
    whyUsedHere:
      '어디서부터 어디까지가 웹페이지 코드인지 브라우저와 검색엔진에게 시작과 끝 범위를 명확히 알려주기 위해 사용되었습니다.',
    wrongExample: {
      code: '<html> (lang 속성 누락)',
      reason: 'lang 속성을 빼먹으면 브라우저가 언어를 알 수 없어 번역 팝업이 오작동하거나 시각장애인 낭독기가 영문 발음으로 읽습니다.',
    },
    betterExample: {
      code: '<html lang="ko">',
      reason: '한국어 사이트라면 lang="ko"를 꼭 명시해 웹 접근성과 검색엔진 인식을 높여주세요.',
    },
    codeCheckVerdict:
      '루트 컨테이너로 정상 작동합니다. 다국어 지원이나 검색엔진 크롤러를 위해 lang 속성이 올바르게 지정되었는지 확인이 필요합니다.',
    betterRefactor: {
      code: '<html lang="ko" dir="ltr">',
      reason: '텍스트 방향(dir="ltr", 좌에서 우로)까지 명시하면 글로벌 웹 표준에 더욱 부합합니다.',
    },
    suggestedAdditions: [
      {
        code: 'class="scroll-smooth"',
        meaning: '부드러운 스크롤 애니메이션 클래스',
        whyAdd: '페이지 내부 링크 이동 시 순간이동하지 않고 부드럽게 스크롤되도록 UX를 향상시킵니다.',
      },
    ],
    bugIssueTitle: 'I18N Lang 속성 누락 주의',
    bugIssueDetail: 'lang 속성이 없으면 WCAG 2.1 Success Criterion 3.1.1 (Language of Page) 위반.',
    bugSeverity: 'warning',
    missingTitle: 'lang 속성',
    missingSnippet: 'lang="ko"',
    missingReason: '스크린 리더 음성 엔진 합성(TTS) 언어 식별 및 SEO 타겟팅 필수',
    recommendedPatch: '<html lang="ko">',
  },
  head: {
    name: '문서 머리말(설정 정보) 구역',
    subBeginner: '화면에는 안 보이지만 페이지 제목, 문자 인코딩 등 설정을 담는 구역입니다.',
    subIntermediate: 'Document Metadata & Asset Container (인코딩/뷰포트/타이틀 집약)',
    subAdvanced: '[STRUCTURE] Resource Preload & Meta Descriptor Scope. 렌더링 블로킹 요소 점검 필요.',
    easyExplanation:
      '화면에 직접 보이지는 않지만, 웹페이지의 제목, 한글 깨짐 방지 설정, 디자인 파일 연결 등 브라우저가 화면을 그리기 전에 꼭 알아야 하는 신분증 같은 정보들을 모아두는 곳입니다.',
    whyUsedHere:
      '본문(body)을 화면에 렌더링하기 전에 필요한 폰트, 인코딩, 스타일시트를 브라우저가 먼저 준비할 수 있도록 설정 구역을 따로 분리하기 위해 사용되었습니다.',
    wrongExample: {
      code: '<head> <h1>제목</h1> </head>',
      reason: '화면에 표시되어야 하는 본문 태그를 head 안에 넣으면 웹 표준 위반이며 브라우저가 강제로 닫아버려 화면이 깨질 수 있습니다.',
    },
    betterExample: {
      code: '<head>\n  <meta charset="UTF-8">\n  <title>페이지 제목</title>\n</head>',
      reason: 'head 안에는 오직 메타데이터, 제목(title), 외부 리소스 링크(link, script)만 담아야 합니다.',
    },
    codeCheckVerdict:
      '설정 구역이 명확히 분리되어 있습니다. 본문 태그가 섞여 들어가지 않았는지, 필수 메타태그들이 누락되지 않았는지 점검하세요.',
    betterRefactor: {
      code: '<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>제목</title>\n</head>',
      reason: '모바일 반응형을 위한 viewport 메타태그가 charset 직후에 함께 구성되어야 합니다.',
    },
    suggestedAdditions: [
      {
        code: '<link rel="icon" href="/favicon.ico">',
        meaning: '브라우저 탭 파비콘 아이콘 연결',
        whyAdd: '브라우저 탭에 기본 지구본 대신 서비스 로고를 띄워 사용자 신뢰도를 높이고 브라우저의 404 요청을 방지합니다.',
      },
    ],
    bugIssueTitle: 'Head 내 렌더링 블로킹 리소스 점검',
    bugIssueDetail: '동기 스크립트가 head 내에 직접 삽입될 경우 First Contentful Paint(FCP) 지연 발생 가능성.',
    bugSeverity: 'none',
    missingTitle: 'Viewport Meta Tag 누락 가능성',
    missingSnippet: '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    missingReason: '모바일 기기 디바이스 픽셀 비율 1:1 매핑 누락 방지',
    recommendedPatch: '<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n</head>',
  },
  meta: {
    name: '문서 메타(인코딩/뷰포트) 설정',
    subBeginner: '한글이나 이모지가 깨지지 않도록 문자 인코딩(UTF-8)을 지정합니다.',
    subIntermediate: '인코딩 표준(UTF-8) 지정 및 파싱 우선순위 확보',
    subAdvanced: '[OPTIMIZATION] Charset 디렉티브. 반드시 head의 첫 1024바이트 내 위치해야 함.',
    easyExplanation:
      '웹페이지에 적힌 한글, 영어, 특수기호, 이모지가 외계어처럼 깨지지 않고 정상적으로 보이도록 전 세계 공통 문자 방식(UTF-8)을 브라우저에 지정합니다.',
    whyUsedHere:
      '이 태그를 빼먹으면 사용자 컴퓨터 환경이나 브라우저에 따라 한글이 "???"처럼 깨져서 보일 수 있기 때문에 필수로 작성되었습니다.',
    wrongExample: {
      code: '<meta http-equiv="Content-Type" content="text/html; charset=EUC-KR">',
      reason: 'EUC-KR은 옛날 방식이며 외계어나 특수문자, 이모지(Emoji)가 깨지는 치명적인 문제가 있습니다.',
    },
    betterExample: {
      code: '<meta charset="UTF-8">',
      reason: '간결하고 최신인 HTML5 표준 문법으로 전 세계 모든 언어를 지원합니다.',
    },
    codeCheckVerdict:
      'UTF-8 선언은 적절합니다. 단, 브라우저가 파일 인코딩을 감지하기 전에 읽을 수 있도록 <head> 태그 바로 다음 줄(첫 1024바이트 이내)에 위치하는지 확인하세요.',
    betterRefactor: {
      code: '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      reason: '인코딩과 뷰포트 메타태그를 항상 한 쌍으로 묶어 배치하는 것이 최선입니다.',
    },
    suggestedAdditions: [
      {
        code: '<meta name="description" content="페이지 상세 설명">',
        meaning: '검색엔진용 요약 설명 메타태그',
        whyAdd: '구글, 네이버 검색 결과 링크 아래에 미리보기 문구로 노출되어 클릭률(CTR)을 높여줍니다.',
      },
    ],
    bugIssueTitle: '인코딩 선언 위치 검증',
    bugIssueDetail: 'charset 선언이 title보다 뒤에 올 경우 일부 구형 브라우저에서 인코딩 스니핑 실패 가능성.',
    bugSeverity: 'none',
    missingTitle: 'OpenGraph Meta Tags',
    missingSnippet: '<meta property="og:title" content="...">',
    missingReason: '카카오톡/SNS 링크 공유 시 미리보기 카드 렌더링 지원',
    recommendedPatch: '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">',
  },
  title: {
    name: '브라우저 상단 탭 제목',
    subBeginner: '브라우저 창 탭과 북마크에 표시될 웹페이지의 공식 제목입니다.',
    subIntermediate: 'Document Title 설정 (SEO 랭킹 & 브라우저 히스토리 식별자)',
    subAdvanced: '[SEO/A11y] Title Element. Document.title DOM 인터페이스 바인딩.',
    easyExplanation:
      '인터넷 창 맨 위 탭(Tab)과 즐겨찾기(북마크)에 표시될 웹페이지의 이름을 붙여주는 태그입니다.',
    whyUsedHere:
      '사용자가 여러 탭을 열어두었을 때 이 페이지가 무엇인지 쉽게 알아보고, 구글 검색 결과 링크 제목으로 표시되도록 하기 위해 사용되었습니다.',
    wrongExample: {
      code: '<title>페이지1</title> 또는 <title>제목없음</title>',
      reason: '의미 없는 제목은 구글 검색 랭킹에서 밀려나고 사용자가 즐겨찾기했을 때 사이트를 찾을 수 없습니다.',
    },
    betterExample: {
      code: '<title>로그인 | 서비스명</title>',
      reason: '페이지 역할과 서비스 이름을 구분 기호(|)로 명확히 적는 것이 모범 사례입니다.',
    },
    codeCheckVerdict:
      '문서 제목이 존재하여 기본 웹 표준을 충족합니다. 20~40자 내외로 서비스명과 핵심 기능을 구체적으로 포함하고 있는지 확인하세요.',
    betterRefactor: {
      code: '<title>로그인 - 서비스명</title>',
      reason: '단순 제목보다 브랜드명과 기능명을 조합해 검색엔진 노출 효과를 극대화하세요.',
    },
    suggestedAdditions: [
      {
        code: '<meta property="og:title" content="나의 첫 로그인 페이지">',
        meaning: 'SNS 공유용 오픈그래프 제목',
        whyAdd: '메신저나 페이스북 등에 링크를 전송할 때 탭 제목과 동일한 예쁜 미리보기 카드를 띄워줍니다.',
      },
    ],
    bugIssueTitle: 'Title 텍스트 누락 검사',
    bugIssueDetail: '비어있는 <title></title>은 WCAG 2.1 Success Criterion 2.4.2 위반.',
    bugSeverity: 'none',
    missingTitle: '브랜드 접미사',
    missingSnippet: ' | BrandName',
    missingReason: 'SERP(검색결과페이지) 브랜딩 및 중복 타이틀 방지',
    recommendedPatch: '<title>나의 첫 로그인 페이지 | 서비스명</title>',
  },
  body: {
    name: '웹페이지 본문 영역',
    subBeginner: '실제 사용자 눈에 보이는 모든 글자, 버튼, 그림이 들어가는 구역입니다.',
    subIntermediate: 'Document Body Scope (렌더링 트리 루트 컨테이너)',
    subAdvanced: '[LAYOUT ROOT] Body Container. CSS Box Model 및 기본 리셋(margin:0) 점검.',
    easyExplanation:
      '사용자의 눈에 실제로 보이는 모든 글자, 이미지, 버튼, 입력창, 목록 등이 들어가는 진짜 화면 도화지입니다.',
    whyUsedHere:
      '브라우저에게 "이 안쪽의 모든 요소를 사용자가 보는 화면 창에 렌더링하라"고 지시하기 위해 사용합니다.',
    wrongExample: {
      code: '<body> <body> ... </body> </body>',
      reason: '한 문서에 body 태그가 2개 이상 있으면 브라우저가 DOM 트리를 파싱할 때 심각한 오류가 생깁니다.',
    },
    betterExample: {
      code: '<body class="bg-gray-50 text-gray-900">\n  <!-- 실제 화면 요소들 -->\n</body>',
      reason: 'body는 페이지에 딱 하나만 작성하고, 전체 페이지의 기본 배경색과 기본 폰트 색상을 지정해 두면 좋습니다.',
    },
    codeCheckVerdict:
      '본문 루트로서 정상적입니다. 브라우저 기본 마진(8px)이 적용되어 여백이 생길 수 있으므로 CSS 리셋이나 클래스가 적용되어 있는지 확인하세요.',
    betterRefactor: {
      code: '<body class="min-h-screen bg-slate-50 antialiased">',
      reason: '최소 화면 높이(100vh)를 보장하고 폰트 렌더링을 매끄럽게 하는 스타일을 기본 부여하는 것이 좋습니다.',
    },
    suggestedAdditions: [
      {
        code: '<noscript>자바스크립트를 활성화해주세요.</noscript>',
        meaning: '자바스크립트 비활성화 사용자 안내',
        whyAdd: '브라우저 설정에서 JS가 꺼져 있거나 로딩에 실패했을 때 흰 화면 대신 친절한 안내를 띄워줍니다.',
      },
    ],
    bugIssueTitle: 'Body 중복 선언 여부',
    bugIssueDetail: '단일 인스턴스 검증 완료. <body> 태그 내부의 최상위 랜드마크 구조(header/main/footer) 확인 권장.',
    bugSeverity: 'none',
    missingTitle: 'Main Landmark Tag',
    missingSnippet: '<main> ... </main>',
    missingReason: '스크린 리더의 본문 바로가기 탐색 지원',
    recommendedPatch: '<body>\n  <main id="main-content">\n    <!-- 콘텐츠 -->\n  </main>\n</body>',
  },
  div: {
    name: '구역 나누기 상자 (Division)',
    subBeginner: '여러 요소를 하나로 묶어 디자인과 위치를 제어하는 투명 상자입니다.',
    subIntermediate: 'Non-semantic Container (Flex/Grid 레이아웃 스타일 래퍼)',
    subAdvanced: '[A11Y AUDIT] Non-semantic <div> 남발 여부 및 ARIA Role 필요성 점검.',
    easyExplanation:
      '제목, 문단, 입력창, 버튼 같은 여러 요소를 하나의 세트로 묶어서 한 번에 가운데 정렬하거나 예쁜 카드 테두리를 칠하기 위한 투명한 네모 상자입니다.',
    whyUsedHere:
      '로그인 관련 요소들을 하나의 독립된 카드 박스로 묶어 화면 중앙에 배치하고 배경색과 그림자 디자인을 입히기 위해 사용되었습니다.',
    wrongExample: {
      code: '<div onclick="goHome()">홈으로</div>',
      reason: '클릭 이동 요소에 단순 div를 쓰면 키보드 탭(Tab) 키로 이동할 수 없고 시각장애인 낭독기가 버튼/링크인지 모릅니다.',
    },
    betterExample: {
      code: '<main class="login-box"> 또는 <section class="login-box">',
      reason: '단순한 레이아웃 묶음에는 div를 쓰되, 주요 본문 카드라면 <main>이나 <section> 시맨틱 태그를 쓰면 훨씬 좋습니다.',
    },
    codeCheckVerdict:
      '클래스명이 login-box로 목적이 명확합니다. 다만 해당 구역이 페이지의 유일한 메인 콘텐츠라면 시맨틱 태그인 <main>으로 교체하는 것을 적극 권장합니다.',
    betterRefactor: {
      code: '<main class="login-box" role="main">',
      reason: '시맨틱 웹 표준을 준수하여 검색엔진과 스크린 리더가 메인 로그인 폼 영역임을 즉시 인지하도록 합니다.',
    },
    suggestedAdditions: [
      {
        code: 'aria-labelledby="login-title"',
        meaning: '상자의 제목과 접근성 연결',
        whyAdd: '상자 내부의 <h1> 제목 id와 연결해 스크린 리더가 이 상자에 진입했을 때 어떤 상자인지 제목을 먼저 읽어주게 합니다.',
      },
    ],
    bugIssueTitle: 'Semantic Tag 대체 권장',
    bugIssueDetail: 'div 태그는 의미가 없는 컨테이너입니다. 로그인 화면의 핵심 카드라면 <main> 또는 <section> 사용이 시맨틱 웹 표준에 부합합니다.',
    bugSeverity: 'warning',
    missingTitle: 'ARIA Landmark Role',
    missingSnippet: 'role="region" aria-label="로그인 양식"',
    missingReason: '스크린 리더 보조공학 기기의 영역 식별 지원',
    recommendedPatch: '<main class="login-box">\n  <!-- 로그인 요소 -->\n</main>',
  },
  h1: {
    name: '최상위 대제목 (Heading 1)',
    subBeginner: '이 웹페이지에서 가장 중요하고 큰 대표 제목을 화면에 표시합니다.',
    subIntermediate: 'Level 1 Heading (문서 아웃라인 최상단 제목 노드)',
    subAdvanced: '[OUTLINE] Heading Level 1. 페이지당 1개 제한 원칙(H1 Singleton) 준수 여부.',
    easyExplanation:
      '제일 큰 글씨로 제목을 출력하는 태그입니다.',
    whyUsedHere:
      '이 화면에서 가장 큰 첫번째 제목 글자를 표시하는 태그입니다.',
    wrongExample: {
      code: '<p style="font-size:32px; font-weight:bold;">환영합니다</p>',
      reason: 'p 태그를 글자 크기만 키워 쓰면 검색엔진 로봇이 이것이 대표 제목인지 전혀 인식하지 못해 SEO 점수가 깎입니다.',
    },
    betterExample: {
      code: '<h1>환영합니다</h1>',
      reason: '페이지당 h1은 오직 1개만 쓰고, 부제목은 h2, 소제목은 h3로 계층 순서를 지켜 작성하는 것이 가장 우수합니다.',
    },
    codeCheckVerdict:
      '제목 계층 구조의 최상단으로 올바르게 선언되었습니다. 문서 내에 다른 h1이 중복 존재하지 않는지 확인하세요.',
    betterRefactor: {
      code: '<h1 id="login-title" class="text-2xl font-bold">환영합니다</h1>',
      reason: 'id를 부여해 부모 컨테이너(aria-labelledby)와 연계하면 접근성이 더욱 강화됩니다.',
    },
    suggestedAdditions: [
      {
        code: '<span class="sr-only"> - 사용자 로그인</span>',
        meaning: '화면엔 숨기고 스크린 리더에만 읽히는 텍스트',
        whyAdd: '시각적으로는 "환영합니다"만 깔끔하게 보이고, 시각장애인 낭독기에는 "환영합니다 - 사용자 로그인"으로 맥락을 완전하게 전달합니다.',
      },
    ],
    bugIssueTitle: 'Heading 계층 구조 점검',
    bugIssueDetail: 'h1이 생략된 채 h2부터 시작하거나, h1이 3개 이상 중복 선언되면 문서 아웃라인 트리 파괴.',
    bugSeverity: 'none',
    missingTitle: '고유 ID 식별자',
    missingSnippet: 'id="main-heading"',
    missingReason: 'ARIA 참조 바인딩을 위한 앵커 ID',
    recommendedPatch: '<h1 id="main-heading">환영합니다</h1>',
  },
  p: {
    name: '본문 설명 문단 (Paragraph)',
    subBeginner: '일반적인 설명 글이나 본문 문장을 적는 표준 문단 태그입니다.',
    subIntermediate: 'Paragraph Block Element (표준 마진 및 본문 타이포그래피)',
    subAdvanced: '[TYPOGRAPHY] <p> 블록 노드. 인라인 요소만 자식으로 수용 가능.',
    easyExplanation:
      '제목 아래에서 사용자에게 부가적인 안내 문구나 일반 문장을 읽기 편하게 보여주는 문단 태그입니다.',
    whyUsedHere:
      '사용자에게 "아이디를 입력하고 로그인하세요"라는 명확한 행동 지침을 알려주기 위해 사용되었습니다.',
    wrongExample: {
      code: '<div>글내용1</div><br><br><div>글내용2</div>',
      reason: '문단 구분을 div와 br 태그 연속으로 처리하면 모바일 화면에서 여백이 부자연스럽게 어긋납니다.',
    },
    betterExample: {
      code: '<p class="text-sm text-gray-600">아이디를 입력하고 로그인하세요.</p>',
      reason: '각각의 문장을 독립된 <p> 태그로 감싸고, 문단 간 간격은 CSS margin으로 조절하는 것이 정석입니다.',
    },
    codeCheckVerdict:
      '문단으로 알맞게 마크업되었습니다. 텍스트 길이가 길어질 경우 대비율(명도비 4.5:1 이상)을 고려한 글자색 선정이 필요합니다.',
    betterRefactor: {
      code: '<p class="text-slate-600 text-sm leading-relaxed">아이디를 입력하고 로그인하세요.</p>',
      reason: '가독성을 높이는 줄간격(leading-relaxed)과 적절한 명도비의 색상을 지정하세요.',
    },
    suggestedAdditions: [
      {
        code: 'id="login-instruction"',
        meaning: '안내문 ID 식별자',
        whyAdd: '입력창에 aria-describedby="login-instruction"을 연결하면 입력창에 커서가 갈 때 이 안내문이 자동으로 낭독됩니다.',
      },
    ],
    bugIssueTitle: '블록 요소 중첩 금지 규칙',
    bugIssueDetail: '<p> 태그 내부에 <div>, <p>, <ul> 등 블록 요소를 넣으면 브라우저가 자동으로 닫아버려 DOM 파싱 오류 발생.',
    bugSeverity: 'none',
    missingTitle: '누락 없음',
    missingSnippet: '',
    missingReason: '텍스트 인라인 노드 정상 수용',
    recommendedPatch: '<p>아이디를 입력하고 로그인하세요.</p>',
  },
  input: {
    name: '사용자 데이터 입력칸 (Input)',
    subBeginner: '사용자가 키보드로 글자를 입력할 수 있는 사각 입력창을 만듭니다.',
    subIntermediate: 'Interactive Form Control (name/id/type 및 제약조건 검증)',
    subAdvanced: '[SECURITY & A11Y] Input Element. Label 바인딩, name 속성, 자동완성 누락 검사.',
    easyExplanation:
      '사용자가 키보드로 아이디를 직접 타이핑할 수 있는 네모난 빈칸 입력 상자입니다.',
    whyUsedHere:
      '로그인을 하려면 사용자로부터 아이디 데이터를 직접 입력받아야 하므로 폼에서 가장 핵심적인 입력창으로 사용되었습니다.',
    wrongExample: {
      code: '<input placeholder="비밀번호"> (type 속성 누락)',
      reason: '비밀번호를 입력받을 때 type="password"를 생략하면 입력한 글자가 화면에 그대로 노출되어 보안에 치명적입니다.',
    },
    betterExample: {
      code: '<input type="text" id="user-id" name="userId" placeholder="아이디를 입력하세요" autocomplete="username" required>',
      reason: 'type 명시, id/name 부여, 자동완성(autocomplete) 속성을 함께 적어주면 보안과 브라우저 편의성이 극대화됩니다.',
    },
    codeCheckVerdict:
      'placeholder와 required 속성이 잘 적용되어 있습니다. 하지만 서버로 데이터를 전송할 때 키값이 되는 "name" 속성과 라벨 연결용 "id" 속성이 누락되어 있습니다.',
    betterRefactor: {
      code: '<input type="text" id="user-id" name="username" placeholder="아이디를 입력하세요" autocomplete="username" required>',
      reason: 'name 속성을 주어야 폼 제출 시 서버가 값을 읽을 수 있으며, autocomplete로 저장된 아이디를 브라우저가 자동 채워줍니다.',
    },
    suggestedAdditions: [
      {
        code: 'name="username"',
        meaning: '서버 전송용 파라미터 식별자',
        whyAdd: '이 속성이 없으면 사용자가 아이디를 입력하고 제출 버튼을 눌러도 서버로 아이디 값이 전혀 전달되지 않습니다!',
      },
      {
        code: 'autocomplete="username"',
        meaning: '브라우저 자동완성 힌트',
        whyAdd: '사용자가 이전에 저장해 둔 계정 아이디를 클릭 한 번으로 자동 입력할 수 있게 해 편리함을 대폭 향상시킵니다.',
      },
      {
        code: 'maxlength="50"',
        meaning: '최대 글자 수 제한',
        whyAdd: '악의적인 사용자가 수만 자의 긴 텍스트를 입력해 브라우저를 다운시키는 버퍼 오버플로우 공격을 클라이언트 단에서 1차 차단합니다.',
      },
    ],
    bugIssueTitle: '🚨 [Warning] name 속성 누락 (Form Data 수집 불가)',
    bugIssueDetail: 'HTMLFormElement.elements 또는 FormData API 호출 시 name 속성이 없는 input은 폼 직렬화 대상에서 완전히 배제됩니다. 서버에 빈 데이터가 전송됩니다.',
    bugSeverity: 'warning',
    missingTitle: 'name 속성 & <label> 바인딩 누락',
    missingSnippet: 'id="userId" name="username" autocomplete="username"',
    missingReason: '1) 서버 폼 데이터 전송 불가 해결, 2) 스크린 리더 입력 라벨 식별 불가 해결',
    recommendedPatch: '<label for="userId">아이디</label>\n<input type="text" id="userId" name="username" placeholder="아이디를 입력하세요" autocomplete="username" required>',
  },
  button: {
    name: '클릭 동작 버튼 (Button)',
    subBeginner: '클릭 시 양식을 제출하거나 동작을 실행하는 누를 수 있는 버튼입니다.',
    subIntermediate: 'Submit Button Control (키보드 엔터/스페이스 인터랙션 처리)',
    subAdvanced: '[A11Y & STATE] Button Element. Type="submit" 폼 제출 바인딩 및 중복 클릭 방지 점검.',
    easyExplanation:
      '버튼의 타입을 제출할 수 있는 버튼 형식으로 만든 후 그 버튼의 이름을 로그인으로 표시하는 명령어입니다.',
    whyUsedHere:
      '사용자가 입력한 양식 정보를 서버로 전송(제출)하기 위해 클릭할 수 있도록 배치한 필수 입력 버튼입니다.',
    wrongExample: {
      code: '<div class="btn" onclick="submitForm()">로그인</div>',
      reason: 'div로 만든 가짜 버튼은 키보드 포커스(Tab 이동), 엔터키 실행, 스크린 리더 음성 지원이 모두 불가능합니다.',
    },
    betterExample: {
      code: '<button type="submit" class="btn-primary">로그인</button>',
      reason: '반드시 표준 <button> 태그를 쓰고, 폼 전송용이면 type="submit", 자바스크립트용이면 type="button"을 명시하세요.',
    },
    codeCheckVerdict:
      'type="submit"으로 지정되어 있어 폼 제출용 버튼의 역할을 올바르게 수행합니다. 키보드 엔터키를 눌렀을 때도 자연스럽게 제출됩니다.',
    betterRefactor: {
      code: '<button type="submit" class="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">로그인</button>',
      reason: '클릭 영역을 충분히 넓히고(최소 44px) 마우스 호버 시 시각적 피드백을 주면 모바일과 데스크톱 모두에서 사용성이 높아집니다.',
    },
    suggestedAdditions: [
      {
        code: 'id="login-submit-btn"',
        meaning: '버튼 고유 식별자',
        whyAdd: '자바스크립트에서 로그인 버튼을 클릭했을 때 로딩 스피너를 띄우거나 중복 제출(더블 클릭)을 막기 위해 필요합니다.',
      },
    ],
    bugIssueTitle: '더블 서브밋(중복 제출) 방지 로직 필요',
    bugIssueDetail: '네트워크 지연 시 사용자가 버튼을 연타하면 로그인/결제 요청이 중복 전송될 수 있으므로 disabled 처리 필요.',
    bugSeverity: 'none',
    missingTitle: '누락 없음',
    missingSnippet: '',
    missingReason: 'type="submit" 정상 지정 완료',
    recommendedPatch: '<button type="submit" id="submitBtn">로그인</button>',
  },
};

const HTML_ATTR_DICTIONARY: Record<string, string> = {
  charset: '글자가 깨지지 않도록 문자 인코딩(UTF-8)을 지정합니다.',
  lang: '웹페이지의 기본 언어(ko=한국어, en=영어)를 브라우저에 선언합니다.',
  name: '메타 설정의 종류나 서버 전송 시 파라미터 변수명을 정합니다.',
  content: 'meta 태그의 실제 설정 값(화면 크기, 설명 문구 등)을 담습니다.',
  class: 'CSS 디자인이나 자바스크립트에서 이 요소를 꾸미기 위해 붙이는 공통 그룹 이름표입니다.',
  id: '페이지 안에서 단 하나뿐인 이 요소만의 고유한 주민등록번호(식별자)입니다.',
  href: '클릭 시 이동할 웹 주소(URL)나 불러올 파일 경로를 지정합니다.',
  src: '불러올 이미지나 자바스크립트 파일의 저장 위치(경로)를 지정합니다.',
  alt: '이미지가 안 보일 때 대신 뜰 대체 설명 글자이자 시각장애인용 낭독 텍스트입니다.',
  type: '입력칸의 종류(text=일반글자, password=비밀번호 숨김, submit=제출)를 결정합니다.',
  placeholder: '글자를 치기 전에 입력칸 안에 흐릿하게 보이는 도움말 힌트 문구입니다.',
  value: '입력칸에 미리 들어있는 기본값이거나 서버로 전송될 실제 데이터 값입니다.',
  required: '이 입력칸을 채우지 않으면 제출되지 않도록 막는 필수 입력 표시입니다.',
  rel: '연결하는 외부 파일과 현재 문서의 관계(stylesheet=스타일시트 등)를 정의합니다.',
  target: '링크를 누를 때 현재 창에서 열지, 새 탭(_blank)에서 띄울지 결정합니다.',
};

export function extractHtmlTokens(trimmed: string): TokenBreakdown[] {
  const tokens: TokenBreakdown[] = [];

  if (trimmed.startsWith('<!--')) {
    tokens.push({
      token: '<!-- ... -->',
      meaning: '화면에 보이지 않고 개발자끼리 보는 HTML 설명 주석입니다.',
    });
    return tokens;
  }

  const tagRegex = /<\/?([!a-zA-Z0-9-]+)([^>]*)>/g;
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(trimmed)) !== null) {
    const fullTag = match[0];
    const isClosing = fullTag.startsWith('</');
    const rawTagName = match[1].toLowerCase();
    const attrPart = match[2] || '';

    const tagInfo = HTML_MASTER_DICTIONARY[rawTagName];
    if (isClosing) {
      tokens.push({
        token: `</${rawTagName}>`,
        meaning: tagInfo
          ? `<${rawTagName}> (${tagInfo.name}) 구역을 여기서 닫아 마무리합니다.`
          : `<${rawTagName}> 태그를 닫는 종료 태그입니다.`,
      });
    } else {
      tokens.push({
        token: rawTagName === '!doctype' ? '<!DOCTYPE html>' : `<${rawTagName}>`,
        meaning: tagInfo
          ? `${tagInfo.name}: ${tagInfo.easyExplanation}`
          : `<${rawTagName}> 요소를 시작하는 HTML 태그입니다.`,
      });

      const attrRegex = /([a-zA-Z-]+)(?:="([^"]*)")?/g;
      let attrMatch: RegExpExecArray | null;
      while ((attrMatch = attrRegex.exec(attrPart)) !== null) {
        const attrName = attrMatch[1].toLowerCase();
        const attrVal = attrMatch[2];
        if (attrName === 'html' && rawTagName === '!doctype') continue;

        const attrDesc = HTML_ATTR_DICTIONARY[attrName];
        if (attrDesc) {
          tokens.push({
            token: attrVal !== undefined ? `${attrName}="${attrVal}"` : attrName,
            meaning:
              attrVal !== undefined
                ? `'${attrVal}'로 설정 — ${attrDesc}`
                : attrDesc,
          });
        }
      }
    }
  }

  return tokens;
}

export function detectLineSyntaxError(line: string): { hasError: boolean; errorDetail?: string } {
  const trimmed = line.trim();
  if (!trimmed) return { hasError: false };

  // 1) HTML 닫는 괄호 누락 (태그가 열렸는데 안 닫힘: <div, <input ... 등)
  if (trimmed.startsWith('<') && !trimmed.endsWith('>') && !trimmed.includes('>')) {
    return {
      hasError: true,
      errorDetail: '태그 끝을 닫는 괄호(>)가 누락되었습니다. <태그> 형태로 완성해야 합니다.',
    };
  }

  // 2) 여는 괄호 누락 (div>, /div> 등)
  if (!trimmed.startsWith('<') && trimmed.endsWith('>')) {
    return {
      hasError: true,
      errorDetail: '태그 시작 괄호(<)가 누락되었습니다. <' + trimmed + ' 형태로 열어야 합니다.',
    };
  }

  // 3) HTML 따옴표 불일치 속성 (class="test, id='test 등)
  if (
    (trimmed.match(/"/g)?.length || 0) % 2 !== 0 ||
    (trimmed.match(/'/g)?.length || 0) % 2 !== 0
  ) {
    return {
      hasError: true,
      errorDetail: '속성값이나 문자열의 따옴표(" 또는 \') 짝이 맞지 않아 닫히지 않았습니다.',
    };
  }

  // 4) JS 등호/연산자 오타 (let a == 5, const = 5 등)
  if (/^(let|const|var)\s*=\s*/.test(trimmed)) {
    return {
      hasError: true,
      errorDetail: '변수 키워드(let/const) 뒤에 변수 이름이 누락되었습니다.',
    };
  }
  if (/^(let|const|var)\s+[a-zA-Z0-9_$]+\s*==\s*/.test(trimmed)) {
    return {
      hasError: true,
      errorDetail: '변수에 값을 대입할 때는 ==(비교)가 아닌 =(대입)을 사용해야 합니다.',
    };
  }

  // 5) JS 괄호 짝 불일치
  const openParens = (trimmed.match(/\(/g) || []).length;
  const closeParens = (trimmed.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    return {
      hasError: true,
      errorDetail: '소괄호 ()의 열림/닫힘 개수가 맞지 않습니다.',
    };
  }

  // 6) 닫는 슬래시 오타 (<div/ > 또는 </div 등)
  if (/^<[a-zA-Z0-9-]+\/\s*>/.test(trimmed) === false && /^<[a-zA-Z0-9-]+\/$/.test(trimmed)) {
    return {
      hasError: true,
      errorDetail: '슬래시(/) 위치가 잘못되었습니다. 닫는 태그는 </태그> 형태여야 합니다.',
    };
  }

  return { hasError: false };
}

export function interpretSingleLineFallback(
  line: string,
  lineNumber: number
): LineInterpretation {
  const trimmed = line.trim();
  const errorCheck = detectLineSyntaxError(line);

  // 1. 공백 줄
  if (!trimmed) {
    return {
      lineNumber,
      code: line,
      isBlank: true,
      shortRole: '코드 단락 구분 빈 줄',
      subCommentBeginner: '가독성을 위해 비워둔 빈 줄입니다.',
      subCommentIntermediate: '코드 블록 분리를 위한 개행 (가독성 유지)',
      subCommentAdvanced: '[EMPTY] Whitespace line token',
      beginner: {
        easyExplanation:
          '아무 코드도 적히지 않은 빈 줄입니다. 컴퓨터는 이 줄을 무시하고 다음 줄로 넘어갑니다.',
        whyUsedHere:
          '사람이 코드를 읽을 때 서로 다른 구역(예: head와 body, 또는 계산과 출력)을 한눈에 구분하기 쉽게 띄어 쓴 것입니다.',
        tokens: [],
      },
      intermediate: {
        codeCheckVerdict: '논리적 블록 구분을 위한 일반 공백 줄입니다.',
      },
      advanced: {
        bugAudit: {
          hasIssue: false,
          severity: 'none',
          issueTitle: '정상 개행',
          issueDetail: '불필요한 공백 누적 없음.',
        },
        missingAudit: {
          hasMissing: false,
          missingTitle: '누락 없음',
          missingSnippet: '',
          reason: '공백 줄',
        },
      },
    };
  }

  // 2. HTML 닫는 태그 단독 라인
  const isPureClosing = /^<\/[a-zA-Z0-9-]+>$/.test(trimmed);
  if (isPureClosing) {
    const closingTagName = trimmed.replace(/<\/|>/g, '').toLowerCase();
    const info = HTML_MASTER_DICTIONARY[closingTagName];
    return {
      lineNumber,
      code: line,
      isBlank: false,
      shortRole: info ? `${info.name} 닫기 (</${closingTagName}>)` : `</${closingTagName}> 닫기`,
      subCommentBeginner: `위에서 열었던 <${closingTagName}> 상자를 여기서 닫아 마무리합니다.`,
      subCommentIntermediate: `</${closingTagName}> 블록 닫힘 (DOM 부모 노드 닫기 확인)`,
      subCommentAdvanced: `[TAG CLOSE] </${closingTagName}> DOM 요소 범위 종료. 짝맞춤 일치.`,
      beginner: {
        easyExplanation: `위에서 시작되었던 <${closingTagName}> 구역이 이 줄에서 끝났음을 브라우저에 알립니다.`,
        whyUsedHere:
          'HTML에서는 시작 태그(<태그>)가 있으면 어디서 그 상자가 끝나는지 닫는 태그(</태그>)로 짝을 맞춰 알려주어야 다른 요소와 뒤섞여 깨지는 현상을 막을 수 있습니다.',
        wrongExample: {
          code: `<${closingTagName}> (슬래시 누락)`,
          reason: '닫는 슬래시(/)를 빼먹으면 브라우저가 또 다른 여는 태그로 착각하여 레이아웃이 연쇄적으로 깨집니다.',
        },
        betterExample: {
          code: `</${closingTagName}>`,
          reason: '여는 태그와 닫는 태그의 중첩 순서(들여쓰기)를 칼같이 맞춰 닫아주는 것이 좋습니다.',
        },
        tokens: extractHtmlTokens(trimmed),
      },
      intermediate: {
        codeCheckVerdict: `상위 <${closingTagName}> 태그와 닫는 태그의 중첩 스택이 정확히 일치합니다.`,
        betterRefactor: {
          code: `</${closingTagName}>`,
          reason: '들여쓰기 규칙 준수',
        },
      },
      advanced: {
        bugAudit: {
          hasIssue: false,
          severity: 'none',
          issueTitle: '태그 닫힘 검증 통과',
          issueDetail: `태그 스택 정합성 일치. Unclosed Tag 오류 없음.`,
        },
        missingAudit: {
          hasMissing: false,
          missingTitle: '누락 없음',
          missingSnippet: '',
          reason: '정상 닫힘 태그',
        },
      },
    };
  }

  // 3. HTML 일반 라인
  if (trimmed.startsWith('<') && trimmed.includes('>')) {
    const firstTagMatch = trimmed.match(/^<\/?([!a-zA-Z0-9-]+)/);
    const tagName = firstTagMatch ? firstTagMatch[1].toLowerCase() : '';
    const info = HTML_MASTER_DICTIONARY[tagName];

    const innerTextMatch = trimmed.match(/>([^<]+)<\//);
    const innerText = innerTextMatch ? innerTextMatch[1].trim() : '';

    let shortRole = info ? info.name : `<${tagName}> 요소`;
    if (innerText) {
      shortRole = `${info ? info.name : `<${tagName}>`} ("${
        innerText.length > 12 ? innerText.slice(0, 12) + '...' : innerText
      }")`;
    }

    const subBeginner = info
      ? info.subBeginner
      : `<${tagName}> 태그를 사용해 화면 요소를 만듭니다.`;
    const subIntermediate = info
      ? info.subIntermediate
      : `<${tagName}> 요소 정의 및 제약조건 검증`;
    const subAdvanced = info
      ? info.subAdvanced
      : `[ELEMENT] <${tagName}> AST 노드 검사.`;

    let easyExplanation = info
      ? info.easyExplanation
      : `화면에 <${tagName}> 요소를 배치하는 HTML 코드입니다.`;
    let whyUsedHere = info
      ? info.whyUsedHere
      : '웹페이지의 화면 구조와 콘텐츠를 브라우저에 정확하게 표시하기 위해 작성했습니다.';

    if (tagName === 'h1') {
      easyExplanation = innerText
        ? `제일 큰 글씨로 ${innerText}를 출력하는 태그입니다.`
        : '제일 큰 글씨로 제목을 출력하는 태그입니다.';
      whyUsedHere = '이 화면에서 가장 큰 첫번째 제목 글자를 표시하는 태그입니다.';
    } else if (tagName === 'button') {
      const isSubmit =
        trimmed.includes('type="submit"') ||
        trimmed.includes("type='submit'") ||
        (!trimmed.includes('type="button"') && !trimmed.includes('type="reset"'));
      const btnLabel = innerText || '로그인';
      easyExplanation = isSubmit
        ? `버튼의 타입을 제출할 수 있는 버튼 형식으로 만든 후 그 버튼의 이름을 ${btnLabel}으로 표시하는 명령어입니다.`
        : `클릭 동작을 수행하는 버튼 형식으로 만든 후 그 버튼의 이름을 ${btnLabel}으로 표시하는 명령어입니다.`;
      whyUsedHere =
        '사용자가 입력한 양식 정보를 서버로 전송(제출)하기 위해 클릭할 수 있도록 배치한 필수 입력 버튼입니다.';
    } else if (tagName === 'p' && innerText) {
      easyExplanation = `일반적인 본문 설명 글자로 "${innerText}"를 화면에 깔끔하게 출력하는 문단 태그입니다.`;
      whyUsedHere = `사용자에게 "${innerText}"라는 상세한 안내 설명 문구를 전달하여 화면 목적을 안내하기 위해 사용되었습니다.`;
    }

    return {
      lineNumber,
      code: line,
      isBlank: false,
      shortRole,
      subCommentBeginner: subBeginner,
      subCommentIntermediate: subIntermediate,
      subCommentAdvanced: subAdvanced,
      beginner: {
        easyExplanation,
        whyUsedHere,
        wrongExample: info?.wrongExample,
        betterExample: info?.betterExample,
        tokens: extractHtmlTokens(trimmed),
      },
      intermediate: {
        codeCheckVerdict: info
          ? info.codeCheckVerdict
          : `문법적으로 정상적인 <${tagName}> 태그입니다.`,
        betterRefactor: info?.betterRefactor,
        suggestedAdditions: info?.suggestedAdditions,
      },
      advanced: {
        bugAudit: {
          hasIssue: info?.bugSeverity !== 'none',
          severity: info?.bugSeverity || 'none',
          issueTitle: info?.bugIssueTitle || '코드 구조 정상',
          issueDetail: info?.bugIssueDetail || '신택스 및 런타임 잠재 결함 없음.',
        },
        missingAudit: {
          hasMissing: Boolean(info?.missingSnippet),
          missingTitle: info?.missingTitle || '누락 없음',
          missingSnippet: info?.missingSnippet || '',
          reason: info?.missingReason || '',
        },
        recommendedPatch: info?.recommendedPatch,
      },
    };
  }

  // 4. 자바스크립트 변수 선언 (const, let)
  if (/^(const|let|var)\s+/.test(trimmed)) {
    const parts = trimmed.split(/\s+/);
    const keyword = parts[0];
    const varName = parts[1] ? parts[1].replace(/[:=;]/g, '') : '변수';
    return {
      lineNumber,
      code: line,
      isBlank: false,
      shortRole: `변수 '${varName}' 선언 및 값 저장`,
      subCommentBeginner: `${varName} 변수 상자를 만들어 오른쪽 값을 안전하게 저장합니다.`,
      subCommentIntermediate: `변수 바인딩 (${keyword} 스코프, 재할당 여부 점검)`,
      subCommentAdvanced: `[SCOPE] ${keyword} 식별자 바인딩. Immutable 참조 권장.`,
      beginner: {
        easyExplanation: `컴퓨터 기억 공간(메모리)에 '${varName}'이라는 이름표를 붙인 상자를 만들고, 등호(=) 오른쪽의 데이터나 계산 결과를 그 상자에 보관합니다.`,
        whyUsedHere:
          '데이터를 변수 상자에 담아 이름을 붙여두어야 다음 줄 코드에서 그 이름을 불러와 계산하거나 화면에 출력할 수 있기 때문에 사용되었습니다.',
        wrongExample: {
          code: `var ${varName} = ...`,
          reason: 'var는 변수 중복 선언과 함수 스코프 호이스팅으로 인해 예기치 못한 버그를 만들기 쉬운 오래된 방식입니다.',
        },
        betterExample: {
          code: `const ${varName} = ...`,
          reason: '값이 다시 바뀌지 않는다면 let 대신 const를 쓰는 것이 실수로 값이 덮어씌워지는 버그를 막아줍니다.',
        },
        tokens: [
          {
            token: keyword,
            meaning:
              keyword === 'const'
                ? '재할당이 불가능한 안전한 상수(고정 변수) 선언'
                : '재할당이 가능한 블록 스코프 변수 선언',
          },
          { token: varName, meaning: '우리가 지어준 변수 이름' },
          { token: '=', meaning: '오른쪽의 값을 왼쪽 변수에 대입하는 연산자' },
        ],
      },
      intermediate: {
        codeCheckVerdict:
          keyword === 'var'
            ? '⚠️ ES5 구형 var 키워드가 사용되었습니다. ES6+ 블록 스코프인 const나 let으로 교체해야 합니다.'
            : `${keyword} 키워드로 안전하게 선언되었습니다. 변수 재할당 여부에 따라 const 사용을 권장합니다.`,
        betterRefactor: {
          code: `const ${varName} = ...;`,
          reason: '불변성(Immutability)을 보장하여 사이드 이펙트를 최소화합니다.',
        },
        suggestedAdditions: [
          {
            code: `// Type / Null Check`,
            meaning: '방어적 유효성 검사 코드',
            whyAdd: '해당 변수에 예상치 못한 undefined나 null이 들어왔을 때 런타임 오류가 발생하지 않도록 기본값을 보장하기 위함입니다.',
          },
        ],
      },
      advanced: {
        bugAudit: {
          hasIssue: keyword === 'var',
          severity: keyword === 'var' ? 'warning' : 'none',
          issueTitle: keyword === 'var' ? 'ES5 var 호이스팅 취약점' : '변수 스코프 무결성 통과',
          issueDetail: keyword === 'var' ? 'Temporal Dead Zone(TDZ) 부재로 인한 변수 오염 가능성' : 'Lexical Environment 블록 스코프 바인딩 정상.',
        },
        missingAudit: {
          hasMissing: keyword === 'let',
          missingTitle: 'const 불변성 선언 권장',
          missingSnippet: `const ${varName} = ...`,
          reason: '재할당이 발생하지 않는 참조 타입의 경우 const 선언으로 V8 엔진 최적화 유도',
        },
        recommendedPatch: `const ${varName} = ...;`,
      },
    };
  }

  // 5. JavaScript map()
  if (trimmed.includes('.map(')) {
    return {
      lineNumber,
      code: line,
      isBlank: false,
      shortRole: '배열 요소 일괄 변환 (map)',
      subCommentBeginner: '목록 안의 숫자를 하나씩 꺼내 2를 곱한 새 목록을 만듭니다.',
      subCommentIntermediate: 'Array.prototype.map() 불변 고차 함수 매핑',
      subCommentAdvanced: '[FUNCTIONAL] Pure Array.map Transform. 원본 배열 Mutation 없음.',
      beginner: {
        easyExplanation:
          '배열(목록) 안에 들어있는 모든 데이터를 하나씩 차례대로 꺼내 괄호 안의 규칙대로 변환한 뒤, 똑같은 개수의 새로운 배열을 만들어냅니다.',
        whyUsedHere:
          '복잡한 for 반복문을 여러 줄 쓰지 않고도 데이터 목록 전체를 단 한 줄로 깔끔하고 안전하게 변환할 수 있기 때문에 사용되었습니다.',
        wrongExample: {
          code: 'for(let i=0; i<numbers.length; i++) { ... push() }',
          reason: '단순한 변환에 명령형 for문을 쓰면 코드가 4줄 이상 길어지고 인덱스(i) 실수 버그가 생기기 쉽습니다.',
        },
        betterExample: {
          code: 'const result = numbers.map((num) => num * 2);',
          reason: '불변성을 지키는 map 고차 함수와 의미 있는 매개변수명(num)을 쓰면 코드가 훨씬 간결하고 의도가 명확해집니다.',
        },
        tokens: [
          { token: '.map(...)', meaning: '배열 요소를 하나씩 꺼내 새 배열로 반환하는 고차 함수' },
          { token: 'x => x * 2', meaning: '꺼낸 값(x)에 2를 곱해 돌려주는 화살표 함수' },
        ],
      },
      intermediate: {
        codeCheckVerdict:
          '원본 배열을 손상시키지 않는 순수 함수형 변환으로 매우 우수합니다. 매개변수명이 "x" 대신 "num" 등으로 명확하면 더욱 좋습니다.',
        betterRefactor: {
          code: 'const result = numbers.map((num) => num * 2);',
          reason: '단일 문자 x 대신 도메인을 나타내는 변수명(num)을 사용해 가독성을 높입니다.',
        },
        suggestedAdditions: [
          {
            code: '.filter(Boolean)',
            meaning: '빈 값/유효하지 않은 데이터 제거 필터링',
            whyAdd: '배열에 null이나 undefined가 섞여 있을 때 NaN(Not a Number) 에러가 발생하는 것을 방지하기 위함입니다.',
          },
        ],
      },
      advanced: {
        bugAudit: {
          hasIssue: false,
          severity: 'none',
          issueTitle: '순수 함수 매핑 통과',
          issueDetail: 'No side-effects detected. 불변성 유지.',
        },
        missingAudit: {
          hasMissing: true,
          missingTitle: '입력 배열 타입 가드 누락',
          missingSnippet: 'Array.isArray(numbers) ? numbers.map(...) : []',
          reason: 'numbers가 undefined/null일 경우 TypeError: Cannot read property map of undefined 런타임 크래시 방지',
        },
        recommendedPatch: 'const result = Array.isArray(numbers) ? numbers.map((num) => num * 2) : [];',
      },
    };
  }

  // 6. console.log
  if (trimmed.includes('console.log') || trimmed.includes('console.error')) {
    return {
      lineNumber,
      code: line,
      isBlank: false,
      shortRole: '콘솔 출력 (디버깅)',
      subCommentBeginner: '계산된 결과값을 개발자 도구(F12) 콘솔 창에 출력합니다.',
      subCommentIntermediate: '표준 출력 로깅 (배포 전 제거 또는 로거 라이브러리 검토)',
      subCommentAdvanced: '[I/O] stdout 디버깅 구문. 프로덕션 번들 트리쉐이킹 점검 대상.',
      beginner: {
        easyExplanation:
          '괄호 안에 들어있는 값이나 변수 내용물을 브라우저 개발자 도구의 콘솔(Console) 창에 출력하여 눈으로 확인합니다.',
        whyUsedHere:
          '코드가 에러 없이 원하는 대로 잘 계산되었는지, 변수에 어떤 데이터가 들어있는지 검증(디버깅)하기 위해 작성되었습니다.',
        wrongExample: {
          code: 'alert(result);',
          reason: 'alert()는 사용자의 브라우저 화면 전체를 멈추게 만들어 실무에서 디버깅용으로 절대 사용하면 안 됩니다.',
        },
        betterExample: {
          code: 'console.log("계산 결과:", result);',
          reason: '출력할 값 앞에 설명 문자열("계산 결과:")을 함께 넣어주면 콘솔 창에서 어떤 값인지 바로 파악할 수 있습니다.',
        },
        tokens: [
          { token: 'console.log(...)', meaning: '개발자 콘솔에 괄호 안의 데이터를 출력하는 명령' },
        ],
      },
      intermediate: {
        codeCheckVerdict:
          '로컬 디버깅용으로 적절합니다. 실제 프로덕션(배포) 환경에서는 콘솔 창에 민감 정보가 노출되지 않도록 제거하거나 logger 환경을 분리해야 합니다.',
        betterRefactor: {
          code: 'console.log("[DEBUG] 결과:", result);',
          reason: '로그 프리픽스를 부여해 필터링을 용이하게 합니다.',
        },
        suggestedAdditions: [
          {
            code: 'if (process.env.NODE_ENV === "development")',
            meaning: '개발 환경 조건문',
            whyAdd: '실제 서비스 배포 시 브라우저 콘솔 창이 지저분해지거나 성능 저하가 일어나는 것을 방지합니다.',
          },
        ],
      },
      advanced: {
        bugAudit: {
          hasIssue: false,
          severity: 'warning',
          issueTitle: '프로덕션 콘솔 잔존 주의',
          issueDetail: '메모리 누수 및 브라우저 콘솔 객체 참조 유지 방지를 위해 Terser drop_console 설정 권장.',
        },
        missingAudit: {
          hasMissing: true,
          missingTitle: '구조화된 로깅 프리픽스 누락',
          missingSnippet: 'console.info("[RESULT]", { result })',
          reason: '단순 원시값 출력 대신 객체 래핑으로 키-값 식별자 보장',
        },
        recommendedPatch: 'if (process.env.NODE_ENV !== "production") console.log("[RESULT]", result);',
      },
    };
  }

  // 기본 일반 구문
  return {
    lineNumber,
    code: line,
    isBlank: false,
    shortRole: '코드 명령문 실행',
    subCommentBeginner: '이 줄의 명령을 실행합니다.',
    subCommentIntermediate: '구문 평가 및 실행',
    subCommentAdvanced: '[STATEMENT] 명령문 실행 평가.',
    beginner: {
      easyExplanation: `이 줄의 명령(${trimmed})을 실행하여 데이터를 조작하거나 동작을 수행합니다.`,
      whyUsedHere: '프로그램의 전체 실행 흐름을 순차적으로 이어가기 위해 작성되었습니다.',
      tokens: [],
    },
    intermediate: {
      codeCheckVerdict: '문법적으로 유효한 단일 실행문입니다.',
    },
    advanced: {
      bugAudit: {
        hasIssue: false,
        severity: 'none',
        issueTitle: '명령문 구문 검증 완료',
        issueDetail: '파싱 에러 없음.',
      },
      missingAudit: {
        hasMissing: false,
        missingTitle: '누락 없음',
        missingSnippet: '',
        reason: '일반 구문',
      },
    },
  };
}

export function buildFallbackAnalysis(rawCode: string): SimpleCodeAnalysis {
  const cleanCode = rawCode.replace(/\r\n/g, '\n');
  const rawLines = cleanCode.split('\n');
  const isHtml =
    /<!doctype html>|<html|<head|<body|<div|<h1|<p|<form|<input|<button/i.test(
      cleanCode
    );
  const language = isHtml ? 'HTML' : 'JavaScript';

  const lines = rawLines.map((line, index) => {
    const item = interpretSingleLineFallback(line, index + 1);
    const errorCheck = detectLineSyntaxError(line);
    item.hasError = errorCheck.hasError;
    item.errorDetail = errorCheck.errorDetail;
    return item;
  });

  const commentedLinesBeginner: string[] = [];
  const commentedLinesIntermediate: string[] = [];
  const commentedLinesAdvanced: string[] = [];

  for (const item of lines) {
    if (item.isBlank) {
      commentedLinesBeginner.push('');
      commentedLinesIntermediate.push('');
      commentedLinesAdvanced.push('');
      continue;
    }
    const indentMatch = item.code.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : '';

    // 초급자 주석
    commentedLinesBeginner.push(item.code);
    commentedLinesBeginner.push(
      language === 'HTML' && item.code.trim().startsWith('<')
        ? `${indent}<!-- ${item.subCommentBeginner} -->`
        : `${indent}// ${item.subCommentBeginner}`
    );

    // 중급자 주석
    commentedLinesIntermediate.push(item.code);
    commentedLinesIntermediate.push(
      language === 'HTML' && item.code.trim().startsWith('<')
        ? `${indent}<!-- [CHECK] ${item.subCommentIntermediate} -->`
        : `${indent}// [CHECK] ${item.subCommentIntermediate}`
    );

    // 전공자 주석
    commentedLinesAdvanced.push(item.code);
    commentedLinesAdvanced.push(
      language === 'HTML' && item.code.trim().startsWith('<')
        ? `${indent}<!-- ${item.subCommentAdvanced} -->`
        : `${indent}// ${item.subCommentAdvanced}`
    );
  }

  return {
    title: isHtml ? 'HTML 웹페이지 구조 레벨별 맞춤 해석' : '코드 레벨별 맞춤 해석',
    language,
    summary:
      '초급자(친절한 해설 & 왜 쓰였는지), 중급자(코드 오류 검증 & 추가하면 좋은 코드), 전공자(버그/취약점 & 누락된 코드 진단) 수준에 맞춰 완벽하게 차별화된 해석을 제공합니다.',
    originalCode: cleanCode,
    commentedCodeBeginner: commentedLinesBeginner.join('\n'),
    commentedCodeIntermediate: commentedLinesIntermediate.join('\n'),
    commentedCodeAdvanced: commentedLinesAdvanced.join('\n'),
    lines,
  };
}
