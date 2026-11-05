// =========================================================
// CSS 해설기
//  #header { width:800px; margin: 0 auto; background:#accbe5; height: 150px; }
//  처럼 한 줄에 여러 규칙이 있어도 속성 하나하나를 레벨별로 풀어 줍니다.
// =========================================================
import { josa } from './korean.ts';

export const CSS_PROPS: Record<string, string> = {
  color: '글자 색',
  background: '배경',
  'background-color': '배경색',
  'background-image': '배경 그림',
  'background-size': '배경 그림 크기',
  'background-position': '배경 그림 위치',
  'background-repeat': '배경 그림 반복 여부',
  'font-size': '글자 크기',
  'font-weight': '글자 굵기',
  'font-family': '글꼴',
  'font-style': '글자 기울기',
  'text-decoration': '글자 꾸밈선',
  'text-align': '글자 정렬',
  'line-height': '줄 간격',
  'letter-spacing': '글자 사이 간격',
  'white-space': '공백·줄바꿈 처리 방식',
  margin: '바깥 여백',
  'margin-top': '위쪽 바깥 여백',
  'margin-bottom': '아래쪽 바깥 여백',
  'margin-left': '왼쪽 바깥 여백',
  'margin-right': '오른쪽 바깥 여백',
  padding: '안쪽 여백',
  'padding-top': '위쪽 안쪽 여백',
  'padding-bottom': '아래쪽 안쪽 여백',
  'padding-left': '왼쪽 안쪽 여백',
  'padding-right': '오른쪽 안쪽 여백',
  width: '가로 폭',
  height: '세로 높이',
  'max-width': '최대 가로 폭',
  'min-width': '최소 가로 폭',
  'max-height': '최대 세로 높이',
  'min-height': '최소 세로 높이',
  border: '테두리',
  'border-top': '위쪽 테두리',
  'border-bottom': '아래쪽 테두리',
  'border-left': '왼쪽 테두리',
  'border-right': '오른쪽 테두리',
  'border-radius': '모서리 둥글기',
  outline: '바깥 윤곽선',
  display: '배치 방식',
  'flex-direction': '안쪽 요소를 늘어놓는 방향',
  'flex-wrap': '안쪽 요소 줄바꿈 여부',
  flex: '남는 공간을 나눠 갖는 비율',
  'justify-content': '안쪽 요소의 가로 정렬',
  'align-items': '안쪽 요소의 세로 정렬',
  gap: '안쪽 요소 사이 간격',
  'grid-template-columns': '그리드 세로 칸 나누기',
  position: '위치를 정하는 방식',
  top: '위쪽 기준 위치',
  left: '왼쪽 기준 위치',
  right: '오른쪽 기준 위치',
  bottom: '아래쪽 기준 위치',
  'z-index': '겹칠 때 앞뒤 순서',
  float: '옆으로 띄우기',
  clear: '옆으로 띄우기 해제',
  opacity: '투명도',
  visibility: '보이기 여부',
  overflow: '내용이 넘칠 때 처리 방법',
  cursor: '마우스 커서 모양',
  'box-shadow': '그림자',
  'text-shadow': '글자 그림자',
  'box-sizing': '크기 계산 방식',
  transition: '바뀔 때의 부드러운 움직임',
  transform: '모양 변형',
  animation: '애니메이션',
  'list-style': '목록 앞 기호 모양',
  'vertical-align': '세로 정렬',
  'object-fit': '그림을 칸에 맞추는 방식',
  content: '앞뒤에 끼워 넣는 내용',
};

const NAMED_COLORS: Record<string, string> = {
  white: '흰색', black: '검은색', red: '빨간색', blue: '파란색', green: '초록색', yellow: '노란색',
  orange: '주황색', purple: '보라색', pink: '분홍색', gray: '회색', grey: '회색', navy: '남색',
  skyblue: '하늘색', brown: '갈색', gold: '금색', silver: '은색', transparent: '투명',
};

const VALUE_WORDS: Record<string, string> = {
  auto: '자동', none: '없음', block: '블록(한 줄 전체를 차지)', inline: '인라인(글자처럼 옆으로 이어짐)',
  'inline-block': '인라인 블록(옆으로 이어지면서 크기도 정할 수 있음)', flex: '플렉스(안쪽 요소를 한 줄로 나란히)',
  grid: '그리드(바둑판 모양 배치)', center: '가운데', left: '왼쪽', right: '오른쪽', justify: '양쪽 맞춤',
  bold: '굵게', bolder: '더 굵게', normal: '보통', italic: '기울임', underline: '밑줄', 'line-through': '가운데 줄',
  solid: '실선', dashed: '끊어진 선', dotted: '점선', double: '두 줄 선', hidden: '숨김', visible: '보임',
  scroll: '스크롤', absolute: '절대 위치(기준 요소 안에서 좌표로)', relative: '상대 위치(원래 자리 기준)',
  fixed: '화면 고정(스크롤해도 그 자리)', sticky: '스크롤하면 달라붙음', static: '기본 위치', pointer: '손가락 모양',
  'space-between': '양 끝에 붙이고 사이를 균등하게', 'space-around': '주변 간격을 균등하게', row: '가로 방향',
  column: '세로 방향', wrap: '넘치면 다음 줄로', nowrap: '줄바꿈 안 함', 'flex-start': '시작 쪽', 'flex-end': '끝 쪽',
  stretch: '꽉 차게 늘림', inherit: '부모와 같게', 'border-box': '테두리·안쪽 여백까지 포함한 크기',
  'content-box': '내용만의 크기', cover: '칸을 꽉 채우게', contain: '잘리지 않게 칸 안에 맞춤',
  'no-repeat': '반복 안 함', repeat: '반복', both: '양쪽', ease: '부드럽게', 'ease-in-out': '천천히 시작해 천천히 끝나게',
  'sans-serif': '고딕 계열 글꼴', serif: '명조 계열 글꼴', monospace: '고정폭 글꼴',
};

// #accbe5 → '연한 하늘색'
export function colorName(hex: string): string {
  let h = hex.replace('#', '');
  if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split('').map((c) => c + c).join('');
  if (h.length < 6) return '색';
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return rgbName(r, g, b);
}

function rgbName(r: number, g: number, b: number): string {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (l > 0.95) return '흰색';
  if (l < 0.08) return '검은색';
  if (s < 0.12) return l > 0.75 ? '밝은 회색' : l < 0.3 ? '어두운 회색' : '회색';
  let hue = 0;
  if (d !== 0) {
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  const light = l > 0.7;
  const dark = l < 0.3;
  let base: string;
  if (hue < 15 || hue >= 345) base = light ? '분홍색' : '빨간색';
  else if (hue < 40) base = dark ? '갈색' : '주황색';
  else if (hue < 65) base = '노란색';
  else if (hue < 160) base = '초록색';
  else if (hue < 195) base = '청록색';
  else if (hue < 250) base = light ? '하늘색' : '파란색';
  else if (hue < 290) base = dark ? '남색' : '보라색';
  else base = light ? '연분홍색' : '자주색';
  const prefix = light && !['하늘색', '분홍색', '연분홍색'].includes(base) ? '연한 ' : dark && !['갈색', '남색'].includes(base) ? '진한 ' : light ? '연한 ' : '';
  return prefix + base;
}

// 값 하나(800px, auto, #accbe5 ...)를 쉬운 말로
export function cssToken(tok: string): string {
  const t = tok.trim();
  let m: RegExpMatchArray | null;
  if (/^#[0-9a-f]{3,8}$/i.test(t)) return `${t}(${colorName(t)})`;
  if ((m = t.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i))) {
    const name = rgbName(+m[1] / 255, +m[2] / 255, +m[3] / 255);
    const alpha = m[4] !== undefined ? parseFloat(m[4]) / (m[4].endsWith('%') ? 100 : 1) : 1;
    return `${t}(${alpha < 1 ? `${Math.round((1 - alpha) * 100)}% 투명한 ` : ''}${name})`;
  }
  if (NAMED_COLORS[t.toLowerCase()]) return `${NAMED_COLORS[t.toLowerCase()]}(${t})`;
  if ((m = t.match(/^(-?[\d.]+)px$/))) return `${m[1]}픽셀(${t})`;
  if ((m = t.match(/^(-?[\d.]+)%$/))) return `부모 크기의 ${m[1]}%`;
  if ((m = t.match(/^(-?[\d.]+)rem$/))) return `기본 글자 크기의 ${m[1]}배(${t})`;
  if ((m = t.match(/^(-?[\d.]+)em$/))) return `현재 글자 크기의 ${m[1]}배(${t})`;
  if ((m = t.match(/^(-?[\d.]+)vh$/))) return `화면 높이의 ${m[1]}%(${t})`;
  if ((m = t.match(/^(-?[\d.]+)vw$/))) return `화면 너비의 ${m[1]}%(${t})`;
  if ((m = t.match(/^(-?[\d.]+)m?s$/))) return t.endsWith('ms') ? `${m[1]}밀리초` : `${m[1]}초`;
  if ((m = t.match(/^url\((.+)\)$/))) return `'${m[1].replace(/['"]/g, '')}' 그림 파일`;
  if (t === '0') return '0';
  const word = VALUE_WORDS[t.toLowerCase()];
  if (word) {
    const p = word.match(/^(.+?)\((.+)\)$/);
    return p ? `${p[1]}(${t}, ${p[2]})` : `${word}(${t})`;
  }
  return t;
}

function splitValues(v: string): string[] {
  return v.match(/(?:[\w-]+\([^)]*\)|"[^"]*"|'[^']*'|[^\s,]+)/g) || [v];
}

function sidesKo(vals: string[]): string {
  const k = vals.map(cssToken);
  if (k.length === 1) return `위·아래·왼쪽·오른쪽 모두 ${k[0]}`;
  if (k.length === 2) return `위아래 ${k[0]}, 왼쪽·오른쪽 ${k[1]}`;
  if (k.length === 3) return `위 ${k[0]}, 왼쪽·오른쪽 ${k[1]}, 아래 ${k[2]}`;
  return `위 ${k[0]}, 오른쪽 ${k[1]}, 아래 ${k[2]}, 왼쪽 ${k[3]}`;
}

export interface CssDecl {
  prop: string;
  value: string;
}

export function parseDeclarations(text: string): CssDecl[] {
  return text
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const i = p.indexOf(':');
      return i > 0 ? { prop: p.slice(0, i).trim().toLowerCase(), value: p.slice(i + 1).replace(/!important/, '').trim() } : null;
    })
    .filter((d): d is CssDecl => d !== null && /^-?[a-z-]+$/.test(d.prop));
}

// 선언 하나 → "가로 폭(width)을 800픽셀(800px)로 정합니다."
export function explainDecl({ prop, value }: CssDecl): { sentence: string; short: string } {
  const label = CSS_PROPS[prop] || `${prop} 속성`;
  const vals = splitValues(value);
  const head = `${label}(${prop})${josa(label, '을/를').slice(label.length)}`;
  let sentence: string;

  if (/^(margin|padding)$/.test(prop)) {
    sentence = `${head} ${sidesKo(vals)}${josa(sidesKo(vals), '으로/로').slice(sidesKo(vals).length)} 정합니다.`;
    if (prop === 'margin' && (vals.length === 2 || vals.length === 3) && vals[1] === 'auto') {
      sentence += ' 왼쪽·오른쪽 여백을 브라우저가 똑같이 나눠 주기 때문에, 이 요소가 가로 방향 가운데에 놓입니다.';
    } else if (prop === 'margin' && vals.length === 1 && vals[0] === 'auto') {
      sentence += ' 남는 공간을 양쪽에 똑같이 나눠서 이 요소를 가운데에 놓습니다.';
    }
  } else if (/^border(-top|-bottom|-left|-right)?$/.test(prop) && vals.length > 1) {
    const width = vals.find((v) => /^\d/.test(v));
    const style = vals.find((v) => /^(solid|dashed|dotted|double|none)$/.test(v));
    const color = vals.find((v) => v !== width && v !== style);
    sentence = `${head} ${[width && `두께 ${cssToken(width)}`, style && cssToken(style), color && `색 ${cssToken(color)}`].filter(Boolean).join(', ')}인 선으로 그립니다.`;
  } else if (prop === 'background' || prop === 'background-color' || prop === 'color') {
    const v = vals.map(cssToken).join(' ');
    sentence = prop === 'color' ? `${head} ${josa(v, '으로/로')} 정합니다.` : `${label}(${prop})을 ${josa(v, '으로/로')} 칠합니다.`;
  } else if (prop === 'font-weight' && /^\d+$/.test(value)) {
    const n = Number(value);
    sentence = `${head} ${value}(${n >= 700 ? '굵게' : n >= 500 ? '약간 굵게' : n <= 300 ? '얇게' : '보통'})로 정합니다.`;
  } else if (prop === 'line-height' && /^[\d.]+$/.test(value)) {
    sentence = `${head} 글자 크기의 ${value}배로 정해서, 줄과 줄 사이를 그만큼 띄웁니다.`;
  } else if (prop === 'opacity') {
    const pct = Math.round(parseFloat(value) * 100);
    sentence = `${head} ${value}로 정합니다. (${pct}%만 보이고 ${100 - pct}%는 투명해집니다)`;
  } else if (prop === 'transition') {
    const time = vals.find((v) => /\d(m?s)$/.test(v));
    const what = vals[0] && !/\d/.test(vals[0]) ? vals[0] : 'all';
    sentence = `${what === 'all' ? '모든 디자인 값이' : `${what} 값이`} 바뀔 때 ${time ? cssToken(time) : '잠깐'} 동안 부드럽게 변하도록 정합니다.`;
  } else if (prop === 'z-index') {
    sentence = `${head} ${value}로 정합니다. 숫자가 클수록 다른 요소보다 앞(위)에 보입니다.`;
  } else if (prop === 'box-shadow' && value !== 'none') {
    sentence = `${label}(${prop})를 ${value} 값으로 넣어, 요소 아래에 그림자가 생겨 떠 있는 것처럼 보이게 합니다.`;
  } else if (prop === 'font-family') {
    sentence = `${head} ${value} 순서로 정합니다. 앞의 글꼴이 없으면 그다음 글꼴을 씁니다.`;
  } else {
    const v = vals.map(cssToken).join(' ');
    sentence = `${head} ${josa(v, '으로/로')} 정합니다.`;
  }
  const short = `${label}: ${vals.map(cssToken).join(' ')}`;
  return { sentence, short };
}

const CIRCLED = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

function selectorKo(sel: string): string {
  const s = sel.trim();
  const parts = s.split(/\s*,\s*/);
  if (parts.length > 1) return parts.map(selectorKo).join(', ');
  const words = s.split(/\s+/);
  if (words.length > 1) {
    return `${selectorKo(words.slice(0, -1).join(' '))} 안에 들어 있는 ${selectorKo(words[words.length - 1])}`;
  }
  let m: RegExpMatchArray | null;
  if ((m = s.match(/^#([\w-]+)$/))) return `id가 ${m[1]}인 요소`;
  if ((m = s.match(/^\.([\w-]+)$/))) return `class가 ${m[1]}인 요소들`;
  if ((m = s.match(/^([a-z][\w-]*):(hover|focus|active|first-child|last-child)$/i))) {
    const st: Record<string, string> = { hover: '마우스를 올렸을 때의', focus: '선택(포커스)됐을 때의', active: '누르고 있을 때의', 'first-child': '첫 번째', 'last-child': '마지막' };
    return `${st[m[2]]} <${m[1]}> 요소`;
  }
  if (s === '*') return '모든 요소';
  if (/^[a-z][\w-]*$/i.test(s)) return `모든 <${s}> 요소`;
  return `'${s}'에 해당하는 요소`;
}

function selectorDefinition(sel: string): string {
  const s = sel.trim();
  if (/\s/.test(s) && !/,/.test(s)) return 'CSS에서 선택자 사이를 띄어 쓰면 "앞 요소 안에 들어 있는 뒤 요소"만 고르는 자손 선택자가 됩니다.';
  if (/,/.test(s)) return 'CSS에서 쉼표(,)로 선택자를 나열하면 여러 요소에 같은 꾸밈 규칙을 한 번에 적용합니다.';
  if (s.startsWith('#')) return 'CSS에서 #으로 시작하는 선택자는 id 이름으로 요소를 고르는 "id 선택자"입니다. id는 한 페이지에 하나뿐인 이름표입니다.';
  if (s.startsWith('.')) return 'CSS에서 점(.)으로 시작하는 선택자는 class 이름으로 요소를 고르는 "class 선택자"입니다. 같은 class를 가진 요소 모두에 적용됩니다.';
  if (/:/.test(s)) return 'CSS에서 콜론(:) 뒤에 붙는 hover, focus 등은 "특정 상태일 때"만 적용하는 가상 클래스입니다.';
  return 'CSS에서 태그 이름만 쓴 선택자는 페이지의 그 태그 모두를 고르는 "태그 선택자"입니다.';
}

export interface CssLineResult {
  role: string;
  definition: string;
  easy: string;
  why: string;
  tokens: { token: string; meaning: string }[];
  isCss: true;
  decls: CssDecl[];
  selector?: string;
}

const looksLikeDecls = (text: string) => {
  if (/,\s*$/.test(text)) return false; // 자바스크립트 객체 { color: 'red', } 와 구분
  const decls = parseDeclarations(text);
  return decls.length > 0 && decls.some((d) => CSS_PROPS[d.prop]) && /:\s*[^;]+;|:\s*[^;{}]+$/.test(text);
};

// 한 줄이 CSS라면 분석, 아니면 null
//  stack: 이 줄보다 위에서 열린 { 줄들 (가장 안쪽이 마지막)
export function describeCssLine(line: string, stack: string[] = []): CssLineResult | null {
  const t = line.trim();
  if (!t) return null;
  let selector: string | undefined;
  let body = t;
  let opens = false;
  let closes = false;

  const selMatch = t.match(/^([.#a-zA-Z*:\[][^=(){};]*?)\s*\{\s*([\s\S]*)$/);
  if (selMatch && !/^(if|for|while|switch|function|else|try|catch|class|do|return)\b/.test(selMatch[1]) && !/=>|\bconst\b|\blet\b/.test(t)) {
    selector = selMatch[1];
    body = selMatch[2];
    opens = true;
  }
  if (/\}\s*$/.test(body)) {
    closes = true;
    body = body.replace(/\}\s*$/, '').trim();
  }
  const enclosing = stack.length ? stack[stack.length - 1] : undefined;
  const enclosingIsCss =
    !!enclosing && /^[.#a-zA-Z*:\[][^=(){};]*\{/.test(enclosing.trim()) && !/^(if|for|while|switch|function|else|try|catch|class|do)\b/.test(enclosing.trim());
  const loneClose = !opens && closes && !body;
  if (loneClose && !enclosingIsCss) return null;
  if (!opens && !loneClose && !looksLikeDecls(body)) return null;
  if (opens && body && !looksLikeDecls(body)) return null;

  const decls = parseDeclarations(body);
  const sel = selector || (enclosingIsCss ? enclosing!.trim().replace(/\s*\{[\s\S]*$/, '') : undefined);
  const target = sel ? selectorKo(sel) : '이 요소';

  const explained = decls.map(explainDecl);
  const tokens = decls.map((d, i) => ({ token: `${d.prop}: ${d.value}`, meaning: explained[i].sentence }));

  const parts: string[] = [];
  if (opens) parts.push(`${josa(target, '을/를')} 어떻게 꾸밀지 정하는 규칙 묶음을 시작합니다.`);
  if (explained.length === 1) {
    parts.push(`${opens ? '그 안에서 ' : `${target}의 `}${explained[0].sentence}`);
  } else if (explained.length > 1) {
    parts.push(`${opens ? '그 안에' : `이 줄에는 ${target}에 대한`} 꾸밈 규칙 ${explained.length}개가 세미콜론(;)으로 나뉘어 한 줄에 적혀 있습니다.`);
    explained.forEach((e, i) => parts.push(`${CIRCLED[i] || `(${i + 1})`} ${e.sentence}`));
  }
  if (loneClose) parts.push(`이 }는 위에서 시작한 ${sel ? `'${sel}' ` : ''}꾸밈 규칙 묶음이 여기서 끝난다는 표시입니다.`);
  else if (closes) parts.push(`마지막의 }는 ${sel ? `'${sel}' ` : ''}꾸밈 규칙 묶음이 여기서 끝난다는 표시입니다.`);

  // 왜 사용했는지: 속성 조합으로 의도 추측 (동사 어간으로 모아서 "~하고, ~하기 위해"로 잇기)
  const has = (p: string) => decls.find((d) => d.prop === p);
  const nameOf = (v: string) => cssToken(v).match(/\(([^()]*)\)$/)?.[1] || cssToken(v);
  const intents: string[] = [];
  const w = has('width') || has('max-width');
  const mg = has('margin');
  if (w && mg && /\bauto\b/.test(mg.value)) intents.push(`가로 ${cssToken(w.value)} 크기로 만들어 화면 가운데에 배치하`);
  else if (w) intents.push(`가로 폭을 ${josa(cssToken(w.value), '으로/로')} 고정하`);
  else if (mg) intents.push('주변 요소와의 간격을 정하');
  const hgt = has('height');
  if (hgt) intents.push(`높이를 ${josa(cssToken(hgt.value), '으로/로')} 확보하`);
  const bg = has('background') || has('background-color');
  if (bg) intents.push(`${nameOf(splitValues(bg.value)[0])} 배경을 깔아 다른 영역과 눈에 띄게 구분하`);
  const c = has('color');
  if (c) intents.push(`글자를 ${nameOf(c.value)}으로 표시하`);
  if (has('display')) intents.push(`요소를 ${cssToken(has('display')!.value).replace(/\(.*$/, '')} 방식으로 배치하`);
  if (has('padding')) intents.push('안쪽에 여유 공간을 두');
  if (has('border') || has('border-radius')) intents.push('테두리와 모서리로 모양을 다듬');
  if (has('font-size') || has('font-weight') || has('line-height')) intents.push('글자 크기·굵기·줄 간격을 읽기 좋게 조절하');
  const td = has('text-decoration');
  if (td && td.value === 'none') intents.push('링크에 기본으로 생기는 밑줄을 없애');
  if (!intents.length && decls.length) intents.push(`${decls.map((d) => CSS_PROPS[d.prop] || d.prop).join(', ')} 값을 원하는 모양으로 정하`);
  const sectionGuess =
    sel && /header|top/i.test(sel) ? '페이지 맨 위 머리 영역(헤더)처럼 보이도록, '
    : sel && /footer/i.test(sel) ? '페이지 맨 아래 꼬리 영역(푸터)처럼 보이도록, '
    : sel && /nav|menu/i.test(sel) ? '메뉴처럼 보이도록, '
    : '';

  let why: string;
  if (intents.length) {
    const joined = intents.map((s, i) => (i < intents.length - 1 ? `${s}고` : `${s}기`)).join(', ');
    why = `${josa(target, '을/를')} ${sectionGuess}${joined} 위해 사용되었습니다.`;
  } else if (opens) why = `${josa(target, '을/를')} 원하는 모양으로 꾸밀 규칙을 한곳에 모아 두기 위해 사용되었습니다.`;
  else why = '꾸밈 규칙 묶음이 어디서 끝나는지 브라우저에 알려주기 위해 사용되었습니다.';

  const definition = opens
    ? selectorDefinition(sel || '')
    : decls.length > 1
    ? 'CSS 선언은 "속성: 값;" 모양으로 디자인 규칙 하나를 정하는 문장입니다. 세미콜론(;)으로 끝나기 때문에 한 줄에 여러 개를 이어 쓸 수 있습니다.'
    : decls.length === 1
    ? `${josa(decls[0].prop, '은/는')} CSS에서 요소의 ${josa(CSS_PROPS[decls[0].prop] || '디자인 값', '을/를')} 정하는 속성입니다.`
    : '닫는 중괄호 }는 CSS 꾸밈 규칙 묶음이 끝났다는 표시입니다.';

  const role = opens
    ? `'${sel}' 꾸밈 규칙${decls.length ? ` (${decls.length}개)` : ' 시작'}`
    : decls.length > 1
    ? `꾸밈 규칙 ${decls.length}개 (${decls.map((d) => CSS_PROPS[d.prop] || d.prop).join(', ')})`
    : decls.length === 1
    ? `${CSS_PROPS[decls[0].prop] || decls[0].prop} 정하기`
    : '꾸밈 규칙 끝';

  return { role, definition, easy: parts.join(' '), why, tokens, isCss: true, decls, selector: sel };
}

// ---------------- 중급자(작동 원리) / 전공자(기술 분석) ----------------
const HOW: Record<string, string> = {
  width: 'width는 요소의 내용 영역 폭을 고정합니다. box-sizing이 기본값(content-box)이면 padding과 border는 이 폭 바깥에 더해져서 실제 차지하는 폭이 더 커집니다.',
  height: 'height를 고정하면 내용이 그보다 많아질 때 상자 밖으로 넘쳐(overflow) 아래 요소와 겹칠 수 있습니다. 내용 길이가 변한다면 min-height가 더 안전합니다.',
  margin: 'margin은 상자 바깥 여백입니다. 좌우를 auto로 두면 부모 폭에서 요소 폭을 뺀 남는 공간을 양쪽에 똑같이 나눠 가운데 정렬이 됩니다(폭이 정해져 있어야 동작). 위아래로 붙은 두 요소의 margin은 더해지지 않고 큰 쪽 하나로 합쳐집니다(마진 상쇄).',
  padding: 'padding은 테두리 안쪽 여백으로, 배경색이 칠해지는 영역에 포함됩니다.',
  background: 'background 단축 속성은 배경색·그림·위치·반복을 한 번에 정하며, 여기 적지 않은 값은 기본값으로 초기화됩니다. 배경은 padding 영역까지 칠해집니다.',
  'background-color': '배경색은 내용과 padding 영역까지 칠해지고 margin 영역은 투명하게 남습니다.',
  color: 'color는 부모에서 자식으로 상속되는 속성이라, 안쪽 요소들도 따로 정하지 않으면 같은 글자 색을 씁니다.',
  display: 'display는 요소가 레이아웃에 참여하는 방식을 바꿉니다. block은 줄 전체를 차지하고, inline은 width/height가 무시되며, inline-block은 옆으로 이어지면서 크기를 가질 수 있습니다.',
  position: 'position: absolute는 원래 자리를 비우고, 가장 가까운 position이 지정된 조상 요소를 기준으로 top/left 좌표에 놓입니다. relative는 원래 자리를 유지한 채 조금 이동합니다.',
  'font-size': 'font-size는 상속되며, em 단위는 부모 글자 크기를 기준으로 계산됩니다.',
  border: 'border는 padding 바깥에 그려지며, 기본 box-sizing에서는 요소의 실제 크기를 늘립니다.',
  'border-radius': 'border-radius는 배경과 테두리의 모서리를 둥글게 깎습니다. 안쪽 내용이 삐져나오면 overflow: hidden으로 함께 잘라야 합니다.',
  'z-index': 'z-index는 position이 지정된 요소에서만 동작하며, 같은 쌓임 맥락(stacking context) 안에서 숫자가 큰 요소가 앞에 그려집니다.',
  transition: 'transition은 값이 바뀔 때 브라우저가 중간 단계를 자동으로 계산해 부드럽게 보여줍니다. transform과 opacity를 애니메이션하는 것이 가장 부드럽습니다.',
  'line-height': '단위 없는 line-height는 각 요소의 글자 크기에 곱해져 상속되므로, 글자 크기가 달라도 비율이 유지됩니다.',
};

const TECH: Record<string, string> = {
  width: 'width/height/margin/padding 변경은 Layout(reflow) 단계를 다시 실행시키는 비용이 큰 속성입니다. 고정 px 폭은 뷰포트가 좁은 모바일에서 가로 스크롤을 만들므로 width: 100%; max-width: 800px 패턴이 반응형에 적합합니다.',
  height: '고정 height는 콘텐츠 길이나 font-size 변화(접근성 확대)에 대응하지 못해 overflow 클리핑/겹침이 발생합니다. WCAG 1.4.4(Resize Text) 관점에서 min-height 사용이 권장됩니다.',
  margin: 'margin: 0 auto 중앙 정렬은 Block Formatting Context에서 used width가 확정된 블록 박스에만 적용됩니다. 수직 인접 margin은 margin collapsing 규칙(CSS 2.1 §8.3.1)에 따라 상쇄됩니다.',
  background: 'background shorthand는 background-image/position/size/repeat/attachment/origin/clip/color를 모두 initial로 리셋하므로 cascade 상 앞서 선언한 개별 속성을 덮어씁니다. 색 변경은 Paint 단계만 재실행합니다.',
  'background-color': '배경 변경은 Layout 없이 Paint만 재실행됩니다. 글자와 배경의 명도 대비는 WCAG 1.4.3 기준 4.5:1 이상이어야 합니다.',
  color: 'color는 inherited property로 computed value가 자손에 전달됩니다. 배경 대비 4.5:1(WCAG AA)을 충족해야 하며 currentColor 키워드로 border/svg fill에 재사용할 수 있습니다.',
  display: 'display 변경은 박스 생성(box generation)과 formatting context를 바꾸어 전체 Layout을 재계산합니다. display: none은 접근성 트리에서도 제거됩니다.',
  position: 'absolute/fixed는 normal flow에서 제외되고 containing block 기준으로 배치되며, position + z-index 조합은 새로운 stacking context를 생성합니다.',
  transition: 'transform/opacity 이외의 속성 transition은 매 프레임 Layout/Paint를 유발합니다. prefers-reduced-motion 미디어 쿼리로 모션 감소 설정을 존중해야 합니다.',
  'z-index': 'z-index는 positioned box 또는 flex/grid item에서만 적용되며, opacity<1·transform 등도 stacking context를 생성해 의도치 않은 레이어 순서 문제가 생길 수 있습니다.',
};

export function cssLevelDepth(r: CssLineResult): { isBasic: boolean; howItWorks: string; technicalDetail: string } {
  const sel = r.selector || '';
  const spec = sel.startsWith('#') ? '1-0-0' : sel.startsWith('.') ? '0-1-0' : sel ? '0-0-1' : '';
  if (!r.decls.length) {
    const opening = /\{/.test(r.role) || r.role.includes('시작');
    return {
      isBasic: !opening,
      howItWorks: opening
        ? `브라우저는 페이지의 요소들 중 ${selectorKo(sel)}를 찾아, 이 묶음 안의 규칙을 적용합니다. 같은 요소에 여러 규칙이 겹치면 더 구체적인 선택자(id > class > 태그)와 나중에 적은 규칙이 이깁니다.`
        : '꾸밈 규칙 묶음이 끝나는 기호입니다.',
      technicalDetail: opening
        ? `CSSOM에 style rule로 등록되며, 선택자 '${sel}'의 명시도(specificity)는 ${spec || '복합'}입니다. 브라우저는 선택자를 오른쪽(key selector)부터 매칭하므로 깊은 자손 선택자는 Style Recalc 비용을 키웁니다.`
        : 'Rule block 종료 토큰으로 CSS tokenizer가 해당 style rule의 declaration block을 닫습니다.',
    };
  }
  const how = r.decls.map((d) => HOW[d.prop]).filter(Boolean);
  const tech = r.decls.map((d) => TECH[d.prop]).filter(Boolean);
  return {
    isBasic: false,
    howItWorks:
      (how.length ? how.join(' ') : '브라우저는 선택자에 맞는 요소에 이 선언들을 적용해 크기와 위치(레이아웃)를 먼저 계산하고, 그다음 색과 그림자(페인트)를 칠합니다.') +
      (r.decls.length > 1 ? ' 한 줄에 적어도 세미콜론으로 구분되어 각각 따로 적용됩니다.' : ''),
    technicalDetail:
      (spec ? `선택자 '${sel}'의 specificity ${spec}. ` : '') +
      (tech.length ? tech.join(' ') : 'Declaration block의 각 property는 cascade(origin → specificity → 선언 순서)를 거쳐 computed value가 결정됩니다.'),
  };
}

export function looksLikeCss(code: string): boolean {
  if (/<\/?[a-z][\s\S]*>/i.test(code) && !/<style/i.test(code)) return false;
  if (/\b(function|const|let|var|=>|import|return)\b/.test(code)) return false;
  return /[^{}]+\{[^}]*:[^}]*\}/.test(code) || /^\s*[a-z-]+\s*:\s*[^;]+;/m.test(code);
}
