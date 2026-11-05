// =========================================================
// 문법 오류 검사기
//  - 줄 단위: 태그 이름 오타(</butten>), 여닫는 태그 짝 불일치, 슬래시 누락(<h1>..<h1>),
//            꺾쇠(<, >) 누락, 따옴표 짝, 변수 선언 실수
//  - 문서 전체: 열린 적 없는 닫는 태그, 괄호 (), {}, [] 짝 (여러 줄에 걸친 것까지)
// =========================================================
import { josa } from './korean.ts';
import { checkInlineJs, checkJsTypos } from './jsTypoChecker.ts';

export interface SyntaxError {
  detail: string; // 어디가 왜 틀렸는지 (쉬운 말)
  fixed?: string; // 고친 코드 (알 수 있을 때)
}

const KNOWN_TAGS = new Set(
  (
    'html head body title meta link script style noscript base main header footer nav section article aside ' +
    'div span p h1 h2 h3 h4 h5 h6 a img button input textarea label form select option optgroup ul ol li dl dt dd ' +
    'table thead tbody tfoot tr th td caption colgroup col strong b em i u s small mark sub sup br hr code pre kbd ' +
    'blockquote q cite abbr time address iframe video audio source track canvas svg path circle rect g line ' +
    'polyline polygon ellipse use defs text tspan picture figure figcaption details summary dialog progress meter ' +
    'fieldset legend output template slot embed object param map area wbr data datalist center font'
  ).split(' ')
);

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

// 편집 거리 (글자 두 개 자리 바뀜 dvi↔div 도 1번으로 셈)
function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
    }
  return dp[a.length][b.length];
}

// 오타로 보이는 태그 이름이면 가장 비슷한 진짜 태그를 돌려줌
function closestTag(name: string): string | undefined {
  if (name.length < 2) return undefined;
  let best: string | undefined;
  let bestD = 99;
  for (const t of KNOWN_TAGS) {
    if (Math.abs(t.length - name.length) > 2) continue;
    const d = levenshtein(name, t);
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  }
  const limit = name.length <= 3 ? 1 : 2;
  return bestD <= limit ? best : undefined;
}

interface TagToken {
  name: string;
  closing: boolean;
  selfClosing: boolean;
  raw: string;
  index: number;
}

function tagTokens(line: string): TagToken[] {
  const out: TagToken[] = [];
  const re = /<(\/?)([a-zA-Z][\w-]*)\b([^<>]*?)(\/?)>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    out.push({ name: m[2], closing: m[1] === '/', selfClosing: m[4] === '/', raw: m[0], index: m.index });
  }
  return out;
}

const isHtmlTagName = (n: string) => /^[a-z][a-z0-9]*$/.test(n); // 대문자 컴포넌트, 사용자 정의(-) 태그 제외

// ---------------- 한 줄 검사 ----------------
//  js: 이 줄을 자바스크립트로 보고 오타 검사를 할지 (HTML 본문 글자, CSS 줄은 false)
//  declared: 코드에서 사용자가 직접 만든 이름들 (오타로 오해하지 않도록)
export function checkLine(line: string, opts: { js?: boolean; declared?: Set<string> } = {}): SyntaxError | null {
  const t = line.trim();
  if (!t) return null;
  const jsOn = opts.js !== false;
  const declared = opts.declared ?? new Set<string>();

  if (t.startsWith('<') && !t.startsWith('<!--')) {
    // 1) 꺾쇠(>) 누락
    if (!t.includes('>')) {
      return { detail: '태그 끝을 닫는 꺾쇠(>)가 빠졌습니다. <태그> 모양으로 완성해야 합니다.', fixed: `${t}>` };
    }

    const tokens = tagTokens(t);

    // 2) 태그 이름 오타: </butten> → </button>
    for (const tk of tokens) {
      const lower = tk.name.toLowerCase();
      if (!isHtmlTagName(tk.name) || KNOWN_TAGS.has(lower)) continue;
      const near = closestTag(lower);
      if (near) {
        const wrong = tk.closing ? `</${tk.name}>` : `<${tk.name}>`;
        const right = tk.closing ? `</${near}>` : `<${near}>`;
        return {
          detail: `${josa(wrong, '은/는')} HTML에 없는 태그 이름입니다. 철자가 틀렸어요. ${josa(right, '으로/로')} 고쳐야 합니다.`,
          fixed: t.replace(tk.raw, tk.raw.replace(tk.name, near)),
        };
      }
    }

    // 3) 같은 줄 안에서 여는 태그 / 닫는 태그 짝 확인
    const stack: TagToken[] = [];
    for (const tk of tokens) {
      const name = tk.name.toLowerCase();
      if (tk.closing) {
        const top = stack[stack.length - 1];
        if (top && top.name.toLowerCase() === name) {
          stack.pop();
        } else if (top) {
          const inStack = stack.some((s) => s.name.toLowerCase() === name);
          return {
            detail: inStack
              ? `<${top.name}> 태그를 먼저 닫아야 하는데 </${tk.name}>가 먼저 나왔습니다. 태그는 연 순서의 반대로 닫아야 합니다.`
              : `여는 태그는 <${top.name}>인데 닫는 태그가 </${tk.name}>로 되어 있어 짝이 맞지 않습니다. </${top.name}>로 고쳐야 합니다.`,
            fixed: inStack ? undefined : t.replace(tk.raw, `</${top.name}>`),
          };
        }
      } else if (!tk.selfClosing && !VOID_TAGS.has(name)) {
        stack.push(tk);
      }
    }

    // 4) 닫는 태그의 슬래시(/) 누락: <h1>환영합니다<h1>
    for (let i = 1; i < tokens.length; i++) {
      const a = tokens[i - 1];
      const b = tokens[i];
      if (!a.closing && !b.closing && a.name.toLowerCase() === b.name.toLowerCase() && !VOID_TAGS.has(a.name.toLowerCase())) {
        const between = t.slice(a.index + a.raw.length, b.index).trim();
        const after = t.slice(b.index + b.raw.length).trim();
        if (between && !after && b.raw === `<${b.name}>`) {
          return {
            detail: `마지막 ${josa(`<${b.name}>`, '은/는')} 닫는 태그여야 하는데 슬래시(/)가 빠졌습니다. </${b.name}>로 써야 내용이 끝났다는 것이 브라우저에 전달됩니다.`,
            fixed: t.slice(0, b.index) + `</${b.name}>`,
          };
        }
      }
    }

    // 5) 태그 안 속성 따옴표 짝
    for (const tk of tokens) {
      if ((tk.raw.match(/"/g)?.length || 0) % 2 !== 0 || (tk.raw.match(/'/g)?.length || 0) % 2 !== 0) {
        const q = (tk.raw.match(/"/g)?.length || 0) % 2 !== 0 ? '"' : "'";
        const fixedTag = tk.raw.replace(/(\s*\/?>)$/, `${q}$1`);
        return {
          detail: `${tk.raw} 안의 속성 값 따옴표(" 또는 ') 짝이 맞지 않습니다. 여는 따옴표와 닫는 따옴표를 모두 써야 합니다.`,
          fixed: t.replace(tk.raw, fixedTag),
        };
      }
    }
    const lastTagStart = t.lastIndexOf('<');
    if (t.indexOf('>', lastTagStart) === -1) {
      return { detail: '마지막 태그 끝의 꺾쇠(>)가 빠졌습니다.', fixed: `${t}>` };
    }

    // 6) 태그 안에 들어 있는 자바스크립트 오타 (onclick="documnet.write(...)", <script>Break;</script>)
    const inline = checkInlineJs(t, declared);
    if (inline) return inline;
    return null;
  }

  // 6) 여는 꺾쇠(<) 누락: div>, /div>
  if (/^\/?[a-zA-Z][\w-]*(\s[^<>]*)?>$/.test(t) && KNOWN_TAGS.has(t.replace(/^\//, '').match(/^[a-zA-Z][\w-]*/)![0].toLowerCase())) {
    return { detail: `태그를 시작하는 꺾쇠(<)가 빠졌습니다. <${t} 모양으로 써야 합니다.`, fixed: `<${t}` };
  }

  // 주석 줄은 검사하지 않음
  if (/^(\/\/|\/\*|\*|#(?![\w-]+\s*[{,]))/.test(t)) return null;

  // 7) 문자열 따옴표가 줄 안에서 닫히지 않음 ('안녕, "abc)
  let quote: string | null = null;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '/' && t[i + 1] === '/') break;
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '`') return null; // 템플릿 문자열은 여러 줄일 수 있어 건너뜀
  }
  if (quote) {
    return {
      detail: `문자열을 연 따옴표(${quote})가 이 줄에서 닫히지 않았습니다. 글자 끝에도 ${quote}를 써야 합니다.`,
      fixed: /[;,)]\s*$/.test(t) ? t.replace(/(\s*[;,)]+\s*)$/, `${quote}$1`) : `${t}${quote}`,
    };
  }

  // 8) 변수 선언 실수
  if (/^(let|const|var)\s*=/.test(t)) {
    return { detail: '변수 키워드(let/const) 뒤에 변수 이름이 빠졌습니다. 예: const 이름 = 값;' };
  }
  const eqeq = t.match(/^(let|const|var)\s+([a-zA-Z0-9_$]+)\s*===?\s*/);
  if (eqeq) {
    return {
      detail: '변수에 값을 넣을 때는 ==(같은지 비교)가 아니라 =(넣기)를 써야 합니다.',
      fixed: t.replace(/\s*===?\s*/, ' = '),
    };
  }

  // 9) 자바스크립트 키워드·내장 기능 오타 (Break, retrun, document.wirte, .lenght ...)
  if (jsOn) {
    const typo = checkJsTypos(t, declared);
    if (typo) return typo;
  }
  return null;
}

// ---------------- 문서 전체 검사 ----------------
const CLOSE_OF: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
const OPEN_OF: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

export function checkDocument(rawLines: string[], language: string): Map<number, SyntaxError> {
  const errs = new Map<number, SyntaxError>();

  // A) HTML: 열린 적 없는 닫는 태그
  const tagStack: string[] = [];
  rawLines.forEach((line, idx) => {
    const t = line.trim();
    if (!t.startsWith('<') || t.startsWith('<!--')) return;
    for (const tk of tagTokens(t)) {
      const name = tk.name.toLowerCase();
      if (!isHtmlTagName(tk.name)) continue;
      if (tk.closing) {
        const pos = tagStack.lastIndexOf(name);
        if (pos === -1) {
          if (!errs.has(idx) && KNOWN_TAGS.has(name)) {
            errs.set(idx, { detail: `위에서 <${name}> 태그를 연 적이 없는데 </${name}> 닫는 태그가 나왔습니다. 여는 태그가 빠졌거나 닫는 태그가 하나 더 들어갔습니다.` });
          }
        } else {
          tagStack.splice(pos);
        }
      } else if (!tk.selfClosing && !VOID_TAGS.has(name)) {
        tagStack.push(name);
      }
    }
  });

  // B) 괄호 짝 (HTML 문서는 제외 — 본문 글자 속 괄호와 섞이기 때문)
  if (language !== 'HTML') {
    const stack: { ch: string; line: number }[] = [];
    let inTemplate = false;
    let inBlockComment = false;
    rawLines.forEach((raw, idx) => {
      const t = raw.trim();
      if (/^#(?![\w-]+\s*[{,])/.test(t)) return; // 파이썬 주석
      let quote: string | null = inTemplate ? '`' : null;
      for (let i = 0; i < raw.length; i++) {
        const ch = raw[i];
        const nx = raw[i + 1];
        if (inBlockComment) {
          if (ch === '*' && nx === '/') {
            inBlockComment = false;
            i++;
          }
          continue;
        }
        if (quote) {
          if (ch === '\\') i++;
          else if (ch === quote) quote = null;
          continue;
        }
        if (ch === '/' && nx === '/') break;
        if (ch === '/' && nx === '*') {
          inBlockComment = true;
          i++;
          continue;
        }
        if (ch === '"' || ch === "'" || ch === '`') {
          quote = ch;
          continue;
        }
        if (CLOSE_OF[ch]) stack.push({ ch, line: idx });
        else if (OPEN_OF[ch]) {
          const top = stack[stack.length - 1];
          if (!top) {
            if (!errs.has(idx)) errs.set(idx, { detail: `여는 괄호 없이 닫는 괄호 '${ch}'가 나왔습니다. 위쪽에 짝이 되는 '${OPEN_OF[ch]}'가 빠졌거나, 닫는 괄호가 하나 더 들어갔습니다.` });
          } else if (top.ch !== OPEN_OF[ch]) {
            if (!errs.has(idx))
              errs.set(idx, {
                detail: `${top.line + 1}번째 줄에서 '${top.ch}'로 연 괄호를 여기서 '${ch}'로 닫았습니다. '${CLOSE_OF[top.ch]}'로 닫아야 짝이 맞습니다.`,
                fixed: (raw.slice(0, i) + CLOSE_OF[top.ch] + raw.slice(i + 1)).trim(),
              });
            stack.pop();
          } else {
            stack.pop();
          }
        }
      }
      inTemplate = quote === '`';
    });
    for (const s of stack) {
      if (!errs.has(s.line)) {
        errs.set(s.line, { detail: `이 줄에서 연 괄호 '${s.ch}'가 코드 끝까지 닫히지 않았습니다. 짝이 되는 '${CLOSE_OF[s.ch]}'를 알맞은 위치에 추가해야 합니다.` });
      }
    }
  }
  return errs;
}
