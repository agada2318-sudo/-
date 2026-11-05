// =========================================================
// 자바스크립트 오타 검사기
//  - 키워드 대소문자: Break → break, Return → return, Const → const
//  - 키워드 철자: retrun → return, fucntion → function, cosnt → const, esle → else, brake → break
//  - 내장 객체 철자/대소문자: documnet → document, Console → console, math → Math
//  - 내장 기능 철자: document.wirte → document.write, console.lgo → console.log
//  - 자주 쓰는 속성/메서드: .lenght → .length, .innerHtml → .innerHTML, .addEventListner → .addEventListener
//  문자열("...")과 주석 안의 글자는 검사하지 않습니다.
// =========================================================
import { josa } from './korean.ts';

export interface TypoIssue {
  detail: string;
  fixed: string; // 고친 코드 (입력한 코드 전체 기준)
}

// 편집 거리 (자리 바뀜 1회 = 1)
function dist(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
    }
  return dp[a.length][b.length];
}

const isPlural = (a: string, b: string) => a === b + 's' || b === a + 's' || a === b + 'es' || b === a + 'es';

function nearest(word: string, pool: Iterable<string>, maxDist: (len: number) => number): string | undefined {
  let best: string | undefined;
  let bestD = 99;
  for (const c of pool) {
    if (c === word) return undefined;
    if (c.toLowerCase() === word.toLowerCase()) return c; // 대소문자만 다름
    if (Math.abs(c.length - word.length) > 2 || isPlural(c, word)) continue;
    const d = dist(word.toLowerCase(), c.toLowerCase());
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best && bestD <= maxDist(word.length) ? best : undefined;
}

const KEYWORDS = [
  'break', 'case', 'catch', 'class', 'const', 'continue', 'default', 'delete', 'do', 'else', 'export', 'extends',
  'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'return', 'switch', 'this', 'throw',
  'try', 'typeof', 'var', 'void', 'while', 'async', 'await', 'yield', 'of', 'null', 'undefined', 'true', 'false',
];
const KEYWORD_SET = new Set(KEYWORDS);

const ROOT_MEMBERS: Record<string, string[]> = {
  document: [
    'write', 'writeln', 'getElementById', 'getElementsByClassName', 'getElementsByTagName', 'getElementsByName',
    'querySelector', 'querySelectorAll', 'createElement', 'createTextNode', 'createDocumentFragment', 'body', 'head',
    'title', 'cookie', 'addEventListener', 'removeEventListener', 'documentElement', 'forms', 'images', 'links',
    'location', 'readyState', 'activeElement', 'URL', 'domain', 'referrer', 'open', 'close', 'hidden',
  ],
  console: ['log', 'error', 'warn', 'info', 'debug', 'table', 'dir', 'clear', 'time', 'timeEnd', 'group', 'groupEnd', 'count', 'assert', 'trace'],
  window: [
    'alert', 'confirm', 'prompt', 'location', 'localStorage', 'sessionStorage', 'setTimeout', 'setInterval', 'clearTimeout',
    'clearInterval', 'addEventListener', 'removeEventListener', 'open', 'close', 'scrollTo', 'scrollBy', 'scrollY', 'scrollX',
    'innerWidth', 'innerHeight', 'document', 'navigator', 'history', 'fetch', 'requestAnimationFrame', 'onload', 'print',
    'matchMedia', 'getComputedStyle',
  ],
  Math: ['random', 'floor', 'ceil', 'round', 'max', 'min', 'abs', 'pow', 'sqrt', 'PI', 'trunc', 'sign', 'log', 'sin', 'cos', 'tan', 'E', 'cbrt', 'hypot'],
  JSON: ['parse', 'stringify'],
  localStorage: ['getItem', 'setItem', 'removeItem', 'clear', 'key', 'length'],
  sessionStorage: ['getItem', 'setItem', 'removeItem', 'clear', 'key', 'length'],
  Object: ['keys', 'values', 'entries', 'assign', 'freeze', 'create', 'fromEntries', 'defineProperty', 'getPrototypeOf', 'is'],
  Array: ['isArray', 'from', 'of'],
  Number: ['parseInt', 'parseFloat', 'isNaN', 'isInteger', 'isFinite', 'MAX_SAFE_INTEGER', 'MIN_SAFE_INTEGER', 'EPSILON'],
  Promise: ['all', 'allSettled', 'race', 'any', 'resolve', 'reject'],
  location: ['href', 'reload', 'replace', 'assign', 'pathname', 'search', 'hash', 'host', 'hostname', 'origin', 'protocol', 'port'],
  history: ['back', 'forward', 'go', 'pushState', 'replaceState', 'length', 'state'],
  navigator: ['userAgent', 'language', 'languages', 'clipboard', 'geolocation', 'onLine', 'platform', 'share', 'vibrate'],
};
const ROOTS = Object.keys(ROOT_MEMBERS);

const COMMON_MEMBERS = new Set([
  'length', 'push', 'pop', 'shift', 'unshift', 'slice', 'splice', 'concat', 'join', 'reverse', 'sort', 'indexOf',
  'lastIndexOf', 'includes', 'find', 'findIndex', 'filter', 'map', 'forEach', 'reduce', 'some', 'every', 'flat',
  'flatMap', 'fill', 'keys', 'values', 'entries', 'toString', 'toUpperCase', 'toLowerCase', 'trim', 'trimStart',
  'trimEnd', 'split', 'replace', 'replaceAll', 'substring', 'charAt', 'charCodeAt', 'startsWith', 'endsWith',
  'padStart', 'padEnd', 'repeat', 'match', 'matchAll', 'toFixed', 'then', 'catch', 'finally', 'json', 'text',
  'addEventListener', 'removeEventListener', 'preventDefault', 'stopPropagation', 'appendChild', 'removeChild',
  'insertBefore', 'replaceChild', 'append', 'prepend', 'remove', 'setAttribute', 'getAttribute', 'removeAttribute',
  'hasAttribute', 'classList', 'add', 'toggle', 'contains', 'innerHTML', 'innerText', 'textContent', 'outerHTML',
  'value', 'style', 'className', 'children', 'parentNode', 'parentElement', 'firstChild', 'lastChild',
  'firstElementChild', 'lastElementChild', 'nextSibling', 'previousSibling', 'nextElementSibling', 'querySelector',
  'querySelectorAll', 'getElementById', 'getElementsByClassName', 'getElementsByTagName', 'focus', 'blur', 'click',
  'submit', 'reset', 'checked', 'disabled', 'selected', 'src', 'href', 'target', 'currentTarget', 'dataset',
  'offsetWidth', 'offsetHeight', 'clientWidth', 'clientHeight', 'scrollTop', 'scrollIntoView',
  'getBoundingClientRect', 'display', 'color', 'backgroundColor', 'fontSize', 'fontWeight', 'width', 'height',
  'visibility', 'opacity', 'onclick', 'onload', 'onchange', 'oninput', 'onsubmit', 'onkeydown', 'key', 'keyCode',
  'status', 'headers', 'body', 'message', 'name', 'type', 'files', 'data', 'write', 'writeln', 'log', 'error',
  'warn', 'info', 'getItem', 'setItem', 'removeItem', 'parse', 'stringify', 'random', 'floor', 'ceil', 'round',
  'current', 'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'Component', 'Fragment', 'createElement',
]);

const GLOBAL_FUNCS = [
  'alert', 'prompt', 'confirm', 'parseInt', 'parseFloat', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
  'fetch', 'isNaN', 'encodeURIComponent', 'decodeURIComponent', 'require', 'print',
  // useState 같은 리액트 훅은 useStore·useQuery 등 비슷한 이름의 사용자 훅이 많아서 검사하지 않음
];

interface Tok {
  text: string;
  start: number;
  end: number;
  afterDot: boolean;
}

// 문자열·주석을 건너뛰고 이름(식별자)만 뽑기
function identifiers(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  let quote: string | null = null;
  while (i < src.length) {
    const ch = src[i];
    if (quote) {
      if (ch === '\\') i += 2;
      else {
        if (ch === quote) quote = null;
        i++;
      }
      continue;
    }
    if (ch === '/' && src[i + 1] === '/') break;
    if (ch === '/' && src[i + 1] === '*') {
      const endC = src.indexOf('*/', i + 2);
      i = endC === -1 ? src.length : endC + 2;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      i++;
      continue;
    }
    if (/[A-Za-z_$]/.test(ch)) {
      let j = i + 1;
      while (j < src.length && /[\w$]/.test(src[j])) j++;
      let k = i - 1;
      while (k >= 0 && src[k] === ' ') k--;
      out.push({ text: src.slice(i, j), start: i, end: j, afterDot: k >= 0 && src[k] === '.' && src[k - 1] !== '.' });
      i = j;
      continue;
    }
    i++;
  }
  return out;
}

const nextNonSpace = (s: string, from: number) => {
  let i = from;
  while (i < s.length && /\s/.test(s[i])) i++;
  return { ch: s[i] ?? '', at: i };
};
const prevNonSpace = (s: string, from: number) => {
  let i = from - 1;
  while (i >= 0 && /\s/.test(s[i])) i--;
  return s[i] ?? '';
};

const replaceAt = (s: string, t: Tok, word: string) => s.slice(0, t.start) + word + s.slice(t.end);

// 줄(또는 코드 조각) 하나 검사. declared: 사용자가 직접 만든 이름들 (오타로 오해하지 않도록)
export function checkJsTypos(code: string, declared: Set<string> = new Set()): TypoIssue | null {
  const toks = identifiers(code);
  const trimmedEnd = code.trimEnd();

  for (let idx = 0; idx < toks.length; idx++) {
    const t = toks[idx];
    const prevTok = toks[idx - 1];
    const lower = t.text.toLowerCase();
    if (declared.has(t.text)) continue;
    const after = nextNonSpace(code, t.end);
    const before = prevNonSpace(code, t.start);
    const isStatementStart = before === '' || before === '}' || before === ';' || before === '{' || before === ')';

    // 1) 키워드 대소문자: Break / Return / Const / If ...
    if (!t.afterDot && KEYWORD_SET.has(lower) && t.text !== lower) {
      const pythonLiteral = /^(True|False)$/.test(t.text) && !/;\s*$/.test(trimmedEnd);
      const constructorUse = prevTok?.text === 'new';
      if (!pythonLiteral && !constructorUse) {
        return {
          detail: `${josa(t.text, '은/는')} 대소문자가 틀렸습니다. 자바스크립트는 대문자와 소문자를 다른 글자로 보기 때문에 ${josa(lower, '으로/로')} 써야 명령어로 인식됩니다.`,
          fixed: replaceAt(code, t, lower),
        };
      }
    }

    // 2) 내장 객체 이름: documnet.write / Console.log / math.random
    if (!t.afterDot && after.ch === '.' && !ROOTS.includes(t.text) && !KEYWORD_SET.has(t.text)) {
      const root = nearest(t.text, ROOTS, (len) => (len >= 7 ? 2 : len >= 5 ? 1 : 0));
      if (root) {
        const caseOnly = root.toLowerCase() === lower;
        return {
          detail: caseOnly
            ? `${josa(t.text, '은/는')} 대소문자가 틀렸습니다. 자바스크립트는 대소문자를 구분하므로 ${josa(root, '으로/로')} 써야 합니다.`
            : `${josa(t.text, '은/는')} 철자가 틀렸습니다. ${josa(root, '으로/로')} 써야 합니다. (지금처럼 쓰면 "${t.text} is not defined" 오류가 납니다)`,
          fixed: replaceAt(code, t, root),
        };
      }
    }

    // 3) 내장 객체의 기능 이름: document.wirte / console.lgo / Math.radnom
    if (t.afterDot && prevTok && ROOT_MEMBERS[prevTok.text]) {
      const members = ROOT_MEMBERS[prevTok.text];
      if (!members.includes(t.text)) {
        // 내장 객체의 기능 목록은 작아서 짧은 이름(lgo → log)도 1글자 차이까지 고쳐 줌
        const m = nearest(t.text, members, (len) => (len >= 8 ? 2 : len >= 3 ? 1 : 0));
        if (m) {
          return {
            detail: `${prevTok.text}.${josa(t.text, '은/는')} 철자가 틀렸습니다. ${prevTok.text}에는 ${josa(t.text, '이라는/라는')} 기능이 없어요. ${prevTok.text}.${josa(m, '으로/로')} 고쳐야 합니다.`,
            fixed: replaceAt(code, t, m),
          };
        }
      }
      continue;
    }

    // 4) 자주 쓰는 속성/메서드: .lenght / .innerHtml / .addEventListner / .foreach
    if (t.afterDot && !COMMON_MEMBERS.has(t.text)) {
      const m = nearest(t.text, COMMON_MEMBERS, (len) => (len >= 9 ? 2 : len >= 6 ? 1 : 0));
      if (m) {
        return {
          detail:
            m.toLowerCase() === lower
              ? `.${josa(t.text, '은/는')} 대소문자가 틀렸습니다. 자바스크립트는 대소문자를 구분하므로 .${josa(m, '으로/로')} 써야 합니다.`
              : `.${josa(t.text, '은/는')} 철자가 틀린 것 같습니다. .${josa(m, '을/를')} 쓰려던 거라면 고쳐야 합니다.`,
          fixed: replaceAt(code, t, m),
        };
      }
      continue;
    }

    if (t.afterDot) continue;

    // 5) 전역 기능 이름: alret("hi") / Alert() / setTimout(...)
    if (after.ch === '(' && !GLOBAL_FUNCS.includes(t.text) && !KEYWORD_SET.has(lower)) {
      const f = nearest(t.text, GLOBAL_FUNCS, (len) => (len >= 8 ? 2 : len >= 5 ? 1 : 0));
      if (f && (prevTok?.text !== 'function')) {
        return {
          detail: `${josa(t.text, '은/는')} ${f.toLowerCase() === lower ? '대소문자가' : '철자가'} 틀렸습니다. ${josa(f, '으로/로')} 써야 합니다.`,
          fixed: replaceAt(code, t, f),
        };
      }
    }

    // 6) 문장 맨 앞 키워드 철자: retrun / fucntion / cosnt / esle / brake / whlie ...
    if (isStatementStart && !KEYWORD_SET.has(lower)) {
      const rest = code.slice(t.end);
      const guess = (kw: string, ok: boolean, maxD: number) =>
        ok && dist(lower, kw) <= maxD && lower !== kw ? kw : undefined;
      const kw =
        guess('const', /^\s+[A-Za-z_$[{][\w$, \]}]*\s*=/.test(rest), 2) ||
        guess('let', /^\s+[A-Za-z_$[{][\w$, \]}]*\s*=/.test(rest) && lower.length === 3, 1) ||
        guess('var', /^\s+[A-Za-z_$][\w$]*\s*=/.test(rest) && lower.length === 3, 1) ||
        guess('function', /^\s*[A-Za-z_$]?[\w$]*\s*\(/.test(rest) && /\)\s*\{?\s*$/.test(code), 2) ||
        guess('return', /^\s+[^=\s(.]/.test(rest) || /^\s*;/.test(rest), 2) ||
        guess('break', /^\s*;?\s*$/.test(rest), 2) ||
        guess('continue', /^\s*;?\s*$/.test(rest), 2) ||
        guess('else', /^\s*(\{|if\b)/.test(rest), 1) ||
        guess('while', /^\s*\(.*\)\s*\{\s*$/.test(rest), 2) ||
        guess('switch', /^\s*\(.*\)\s*\{\s*$/.test(rest), 2) ||
        guess('if', /^\s*\(.*\)\s*\{\s*$/.test(rest) && lower.length === 2, 1) ||
        guess('for', /^\s*\(.*(;|\bof\b|\bin\b).*\)\s*\{?\s*$/.test(rest) && lower.length === 3, 1) ||
        guess('import', /^\s+.+\s+from\s+['"]/.test(rest), 2) ||
        guess('export', /^\s+(default|function|const|let|class)\b/.test(rest), 2);
      if (kw) {
        return {
          detail: `${josa(t.text, '은/는')} 철자가 틀린 명령어입니다. ${josa(kw, '으로/로')} 써야 자바스크립트가 알아듣습니다.`,
          fixed: replaceAt(code, t, kw),
        };
      }
    }
  }
  return null;
}

// HTML 줄 안의 자바스크립트(onclick="...", <script>...</script>)만 꺼내 검사
export function checkInlineJs(line: string, declared: Set<string> = new Set()): TypoIssue | null {
  const parts: { start: number; end: number }[] = [];
  const attrRe = /\son[a-z]+\s*=\s*(["'])([\s\S]*?)\1/gi;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(line)) !== null) {
    const valueStart = m.index + m[0].indexOf(m[1]) + 1;
    parts.push({ start: valueStart, end: valueStart + m[2].length });
  }
  const scriptRe = /<script\b[^>]*>([\s\S]*?)(<\/script>|$)/gi;
  while ((m = scriptRe.exec(line)) !== null) {
    const s = m.index + m[0].indexOf('>') + 1;
    parts.push({ start: s, end: s + m[1].length });
  }
  for (const p of parts) {
    const snippet = line.slice(p.start, p.end);
    const issue = checkJsTypos(snippet, declared);
    if (issue) return { detail: issue.detail, fixed: (line.slice(0, p.start) + issue.fixed + line.slice(p.end)).trim() };
  }
  return null;
}

// 코드 전체에서 사용자가 직접 만든 이름 모으기 (function foo, const bar, class Baz, 매개변수 ...)
export function collectDeclared(code: string): Set<string> {
  const names = new Set<string>();
  const add = (s: string) => s.split(/[\s,{}[\]=:]+/).filter((w) => /^[A-Za-z_$][\w$]*$/.test(w)).forEach((w) => names.add(w));
  let m: RegExpExecArray | null;
  const re1 = /\b(?:function|class)\s+([A-Za-z_$][\w$]*)/g;
  while ((m = re1.exec(code)) !== null) names.add(m[1]);
  const re2 = /\b(?:const|let|var)\s+([^=;]+?)\s*=/g;
  while ((m = re2.exec(code)) !== null) add(m[1]);
  const re3 = /\bfunction\s*[\w$]*\s*\(([^)]*)\)/g;
  while ((m = re3.exec(code)) !== null) add(m[1]);
  const re4 = /\(([^()]*)\)\s*=>/g;
  while ((m = re4.exec(code)) !== null) add(m[1]);
  const re5 = /\b([A-Za-z_$][\w$]*)\s*=>/g;
  while ((m = re5.exec(code)) !== null) names.add(m[1]);
  const re6 = /\bdef\s+([A-Za-z_]\w*)/g;
  while ((m = re6.exec(code)) !== null) names.add(m[1]);
  const re7 = /\bimport\s+(?:\{([^}]*)\}|([\w$]+))/g;
  while ((m = re7.exec(code)) !== null) add(m[1] || m[2] || '');
  return names;
}
