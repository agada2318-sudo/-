// =========================================================
// 초급자(비전공자)용 코드 "정의" 해설기 — JavaScript / React / CSS / Python
//  "이 줄의 명령을 실행합니다" 같은 뭉뚱그린 문장 대신,
//  실제 코드에 적힌 이름과 값을 그대로 넣어 그 줄이 무슨 뜻인지 풀어 씁니다.
// =========================================================

export interface BeginnerDescription {
  role: string; // 이 줄의 역할 (짧은 제목)
  easy: string; // 이 줄은 무슨 의미인가요?
  why: string; // 왜 여기서 사용되었나요?
  definition?: string; // 일반적인 정의
  tokens?: { token: string; meaning: string }[]; // 조각별 뜻풀이
}

import { josa } from './korean.ts';
import { CSS_PROPS, describeCssLine } from './cssDescriber.ts';
export { josa };

// 괄호/따옴표 깊이를 고려해 최상위 구분자로만 자르기
function splitTopLevel(s: string, sep = ','): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  let quote: string | null = null;
  for (const ch of s) {
    if (quote) {
      cur += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      cur += ch;
      continue;
    }
    if ('([{'.includes(ch)) depth++;
    if (')]}'.includes(ch)) depth--;
    if (ch === sep && depth === 0) {
      out.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function stripSemi(s: string): string {
  return s.trim().replace(/;+\s*$/, '').trim();
}

function unquote(s: string): string | null {
  const m = s.trim().match(/^(['"`])([\s\S]*)\1$/);
  return m ? m[2] : null;
}

// 화살표 함수 "x => x * 2" / "(a, b) => a + b" 분해
function parseArrow(s: string): { params: string; body: string } | null {
  const m = s.trim().match(/^(?:async\s+)?(\(([^)]*)\)|[\w$]+)\s*=>\s*([\s\S]*)$/);
  if (!m) return null;
  return { params: (m[2] ?? m[1]).trim(), body: m[3].trim() };
}

// 값(오른쪽 식)을 쉬운 말로
export function explainValue(raw: string): string {
  const v = stripSemi(raw);
  const known = matchKnown(v);
  if (known?.entry.value) return known.entry.value(known.m);
  const prop = explainProperty(v);
  if (prop) return prop;
  if (/^-?\d+(\.\d+)?$/.test(v)) return `숫자 ${v}`;
  const str = unquote(v);
  if (str !== null) return str ? `글자 '${str}'` : "빈 글자('')";
  if (v === 'true') return '참(true) 값';
  if (v === 'false') return '거짓(false) 값';
  if (v === 'null') return '비어 있음(null) 값';
  if (v === 'undefined') return '아직 정해지지 않음(undefined) 값';
  if (v === '[]') return '아무것도 들어있지 않은 빈 목록(배열)';
  if (v === '{}') return '아무것도 들어있지 않은 빈 묶음(객체)';
  if (/^\[[\s\S]*\]$/.test(v)) {
    const items = splitTopLevel(v.slice(1, -1));
    const shown = items.length > 5 ? [...items.slice(0, 5), '…'] : items;
    return `${josa(shown.join(', '), '이/가')} 순서대로 담긴 목록(배열)`;
  }
  if (/^\{[\s\S]*\}$/.test(v)) {
    const keys = splitTopLevel(v.slice(1, -1)).map((k) => k.split(':')[0].trim());
    return keys.length ? `${josa(keys.join(', '), '을/를')} 한데 묶은 묶음(객체)` : '묶음(객체)';
  }
  const arr = v.match(/^([\w$.]+)\.(map|filter|find|some|every|forEach)\(([\s\S]*)\)$/);
  if (arr) {
    const [, list, method, inner] = arr;
    const fn = parseArrow(inner);
    const p = fn?.params || '값';
    const body = fn?.body || inner;
    if (method === 'map') return `${list} 목록의 값을 하나씩 꺼내(${p}) ${josa(body, '으로/로')} 바꾼 새 목록`;
    if (method === 'filter') return `${list} 목록에서 ${josa(body, '이라는/라는')} 조건에 맞는 값만 골라낸 새 목록`;
    if (method === 'find') return `${list} 목록에서 ${josa(body, '이라는/라는')} 조건에 맞는 첫 번째 값`;
    if (method === 'some') return `${list} 목록에 ${josa(body, '이라는/라는')} 조건에 맞는 값이 하나라도 있는지(참/거짓)`;
    if (method === 'every') return `${list} 목록의 값이 모두 ${josa(body, '이라는/라는')} 조건에 맞는지(참/거짓)`;
  }
  if (/^await\s+/.test(v)) return `${v.replace(/^await\s+/, '')} 작업이 끝날 때까지 기다려서 받은 결과`;
  const nw = v.match(/^new\s+([\w$.]+)/);
  if (nw) return `새로 만든 ${nw[1]} 물건(객체)`;
  if (parseArrow(v) || /^(async\s+)?function\b/.test(v)) return '나중에 불러서 쓸 수 있는 함수(기능 묶음)';
  const doc = v.match(/^document\.(getElementById|querySelector|querySelectorAll)\((.*)\)$/);
  if (doc) {
    const target = unquote(doc[2]) ?? doc[2];
    return doc[1] === 'querySelectorAll'
      ? `화면에서 '${target}'에 해당하는 요소를 모두 찾아 모은 목록`
      : `화면에서 '${target}'에 해당하는 요소를 찾아낸 것`;
  }
  const call = v.match(/^([\w$.]+)\(([\s\S]*)\)$/);
  if (call) return `${call[1]}(${call[2]}) 기능을 실행해서 나온 결과`;
  if (/^[\w$.]+$/.test(v)) return `${v}에 들어있는 값`;
  if (/[+\-*/%]/.test(v)) return `${josa(v, '을/를')} 계산한 결과`;
  return `${v}의 결과`;
}

// "if (조건) 명령;" 한 줄을 조건과 명령으로 나누기 (괄호 짝을 세어서)
function splitIfOneLiner(t: string): { cond: string; body: string } | null {
  const head = t.match(/^if\s*\(/);
  if (!head) return null;
  let depth = 0;
  for (let i = head[0].length - 1; i < t.length; i++) {
    if (t[i] === '(') depth++;
    else if (t[i] === ')') {
      depth--;
      if (depth === 0) {
        const body = t.slice(i + 1).trim();
        if (!body || body === '{') return null;
        return { cond: t.slice(head[0].length, i), body };
      }
    }
  }
  return null;
}

// 조건식을 "만약 ~면"의 "~면" 부분으로
function explainSingleCondition(c: string): string {
  c = c.trim();
  while (c.startsWith('(') && c.endsWith(')')) c = c.slice(1, -1).trim();
  let m: RegExpMatchArray | null;
  if ((m = c.match(/^!\s*([\w$.]+)\.trim\(\)$/))) return `${m[1]}에 공백 말고 실제 글자가 하나도 없으면`;
  if ((m = c.match(/^!\s*([\w$.]+)\.length$/)) || (m = c.match(/^([\w$.]+)\.length\s*===?\s*0$/)))
    return `${josa(m[1], '이/가')} 비어 있으면`;
  if ((m = c.match(/^!\s*([\w$.[\]'"]+)$/))) return `${m[1]} 값이 없거나 비어 있으면`;
  if ((m = c.match(/^([\w$.]+)\.includes\((.+)\)$/))) return `${m[1]} 안에 ${josa(m[2], '이/가')} 들어 있으면`;
  if ((m = c.match(/^(.+?)\s*(===|!==|==|!=|>=|<=|>|<)\s*(.+)$/))) {
    const [, a, op, b] = m;
    const A = josa(a.trim(), '이/가');
    const B = b.trim();
    switch (op) {
      case '===':
      case '==':
        return `${A} ${josa(B, '과/와')} 같으면`;
      case '!==':
      case '!=':
        return `${A} ${josa(B, '과/와')} 다르면`;
      case '>':
        return `${A} ${B}보다 크면`;
      case '<':
        return `${A} ${B}보다 작으면`;
      case '>=':
        return `${A} ${B} 이상이면`;
      case '<=':
        return `${A} ${B} 이하이면`;
    }
  }
  if (/^[\w$.]+$/.test(c)) return `${c} 값이 있으면(참이면)`;
  return `'${c}' 조건이 맞으면`;
}

function toConnective(clause: string, kind: 'and' | 'or'): string {
  const stem = clause.replace(/면$/, '').replace(/으$/, '');
  return stem + (kind === 'and' ? '고' : '거나');
}

export function explainCondition(c: string): string {
  const orParts = c.split(/\s*\|\|\s*/);
  if (orParts.length > 1) {
    const parts = orParts.map(explainSingleCondition);
    return parts.map((p, i) => (i < parts.length - 1 ? toConnective(p, 'or') : p)).join(' ');
  }
  const andParts = c.split(/\s*&&\s*/);
  if (andParts.length > 1) {
    const parts = andParts.map(explainSingleCondition);
    return parts.map((p, i) => (i < parts.length - 1 ? toConnective(p, 'and') : p)).join(' ');
  }
  return explainSingleCondition(c);
}

const REACT_HOOKS: Record<string, string> = {
  useState: '화면에 보여줄 값을 기억해 두는 기능',
  useEffect: '화면이 나타나거나 값이 바뀔 때 자동으로 할 일을 정하는 기능',
  useRef: '화면을 다시 그리지 않고 값을 보관하거나 화면 요소를 직접 가리키는 기능',
  useMemo: '계산 결과를 기억해 두고 필요할 때만 다시 계산하는 기능',
  useCallback: '함수를 기억해 두고 필요할 때만 새로 만드는 기능',
  useContext: '여러 화면이 함께 쓰는 공용 값을 꺼내오는 기능',
  useReducer: '복잡한 값 변경 규칙을 한곳에 모아 관리하는 기능',
};

// 알려진 함수/메서드 호출을 쉬운 말로
function explainCall(expr: string): { easy: string; why: string } | null {
  const e = stripSemi(expr);
  let m: RegExpMatchArray | null;
  const known = matchKnown(e);
  if (known?.entry.stmt) {
    return { easy: known.entry.stmt(known.m), why: known.entry.why || '이 기능이 맡은 일을 이 시점에 처리하기 위해 사용되었습니다.' };
  }

  if ((m = e.match(/^console\.(log|info|warn|error)\(([\s\S]*)\)$/))) {
    const args = splitTopLevel(m[2]);
    const what = args.map((a) => (unquote(a) !== null ? `'${unquote(a)}'` : a)).join(', ');
    const kind = m[1] === 'error' ? '빨간 오류 메시지로' : m[1] === 'warn' ? '노란 경고 메시지로' : '글자로';
    return {
      easy: `괄호 안의 ${josa(what || '값', '을/를')} 개발자 도구(F12)의 콘솔 창에 ${kind} 출력하는 명령어입니다.`,
      why: `코드가 제대로 동작하는지, ${what || '값'}에 무엇이 들어있는지 개발자가 눈으로 확인(디버깅)하기 위해 사용되었습니다.`,
    };
  }
  if ((m = e.match(/^alert\(([\s\S]*)\)$/))) {
    const msg = unquote(m[1]) ?? m[1];
    return {
      easy: `화면 가운데에 ${josa(`'${msg}'`, '이라는/라는')} 내용이 적힌 알림 창을 띄우는 명령어입니다.`,
      why: '사용자에게 꼭 알려야 할 내용을 확실하게 보여주기 위해 사용되었습니다.',
    };
  }
  if ((m = e.match(/^fetch\(([\s\S]*?)(?:,\s*\{[\s\S]*\})?\)$/))) {
    const parts = m[1].split(/\s*\+\s*/);
    const base = unquote(parts[0]) ?? parts[0];
    const extra = parts
      .slice(1)
      .map((p) => {
        const enc = p.match(/^encodeURIComponent\((.+)\)$/);
        return enc ? `${enc[1]} 값(주소에 넣을 수 있게 변환한 것)` : unquote(p) ?? p;
      })
      .join(', ');
    return {
      easy: `'${base}' 주소${extra ? ` 뒤에 ${josa(extra, '을/를')} 붙인 주소` : ''}의 서버에 데이터를 달라고 요청을 보내는 명령어입니다.`,
      why: '화면에 보여줄 데이터(검색 결과, 목록 등)를 서버에서 받아오기 위해 사용되었습니다.',
    };
  }
  if ((m = e.match(/^\.then\(([\s\S]*)\)$/)) || (m = e.match(/^[\w$.]+\)?\.then\(([\s\S]*)\)$/))) {
    const fn = parseArrow(m[1]);
    if (fn && /\.json\(\)$/.test(fn.body)) {
      return {
        easy: `바로 앞의 요청이 끝나면, 서버가 보낸 응답(${fn.params})을 JSON이라는 데이터 형식에서 꺼내 쓸 수 있는 값으로 바꾸는 명령어입니다.`,
        why: '서버가 보낸 응답은 그대로는 쓸 수 없어서, 자바스크립트에서 다룰 수 있는 값으로 풀어내기 위해 사용되었습니다.',
      };
    }
    if (fn) {
      const set = fn.body.match(/^(set([A-Z]\w*))\((.*)\)$/);
      const doWhat = set
        ? `${set[1]}로 ${set[2].charAt(0).toLowerCase() + set[2].slice(1)} 값을 ${josa(set[3], '으로/로')} 바꾸는`
        : `${josa(fn.body, '을/를')} 실행하는`;
      return {
        easy: `바로 앞의 작업이 끝나면, 그 결과를 ${josa(fn.params, '이라는/라는')} 이름으로 받아서 ${doWhat} 명령어입니다.`,
        why: '서버 요청처럼 시간이 걸리는 작업은 끝나는 순간을 기다렸다가 다음 일을 해야 해서 사용되었습니다.',
      };
    }
  }
  if ((m = e.match(/^\.catch\(([\s\S]*)\)$/))) {
    const fn = parseArrow(m[1]);
    return {
      easy: `앞의 작업 중에 오류가 나면, 그 오류를 ${fn ? `${josa(fn.params, '이라는/라는')} 이름으로 받아 ${josa(fn.body, '을/를')}` : '받아 처리 코드를'} 실행하는 명령어입니다.`,
      why: '인터넷이 끊기는 등 문제가 생겨도 화면이 멈추지 않고 대처할 수 있게 하기 위해 사용되었습니다.',
    };
  }
  if ((m = e.match(/^(set([A-Z]\w*))\(([\s\S]*)\)$/))) {
    const stateName = m[2].charAt(0).toLowerCase() + m[2].slice(1);
    return {
      easy: `${josa(stateName, '이라는/라는')} 값을 ${josa(m[3] || '새 값', '으로/로')} 바꾸는 명령어입니다. 값이 바뀌면 화면이 자동으로 다시 그려집니다.`,
      why: `바뀐 ${stateName} 값을 화면에 바로 반영하기 위해 사용되었습니다.`,
    };
  }
  if ((m = e.match(/^(clearTimeout|clearInterval)\((.+)\)$/))) {
    return {
      easy: `예약해 둔 ${josa(m[2], '을/를')} 취소해서, 아직 실행되지 않았다면 실행되지 않도록 하는 명령어입니다.`,
      why: '더 이상 필요 없어진 예약 작업이 뒤늦게 실행되는 것을 막기 위해 사용되었습니다.',
    };
  }
  if ((m = e.match(/^([\w$.]+)\.addEventListener\(\s*(['"])(\w+)\2\s*,\s*([\s\S]*?)\)?$/))) {
    const evName: Record<string, string> = {
      click: '클릭', submit: '제출', input: '글자 입력', change: '값 변경', keydown: '키보드 누름',
      load: '불러오기 완료', scroll: '스크롤', mouseover: '마우스 올림',
    };
    return {
      easy: `${m[1]} 요소에 '${m[3]}'(${evName[m[3]] || m[3]}) 일이 생기면 뒤에 적은 함수를 실행하도록 연결하는 명령어입니다.`,
      why: `사용자가 ${evName[m[3]] || m[3]} 행동을 했을 때 화면이 반응하도록 만들기 위해 사용되었습니다.`,
    };
  }
  if ((m = e.match(/^([\w$.]+)\.preventDefault\(\)$/))) {
    return {
      easy: '브라우저가 원래 하려던 기본 동작(예: 양식 제출 시 페이지 새로고침, 링크 이동)을 막는 명령어입니다.',
      why: '페이지가 새로고침되지 않고, 대신 직접 작성한 코드대로 처리하기 위해 사용되었습니다.',
    };
  }
  if ((m = e.match(/^([\w$.]+)\.push\(([\s\S]*)\)$/))) {
    return {
      easy: `${m[1]} 목록의 맨 뒤에 ${josa(m[2], '을/를')} 하나 더 추가하는 명령어입니다.`,
      why: '목록에 새 항목을 쌓아 가기 위해 사용되었습니다.',
    };
  }
  if ((m = e.match(/^([\w$.]+)\.forEach\(([\s\S]*)\)$/))) {
    const fn = parseArrow(m[2]);
    return {
      easy: `${m[1]} 목록의 값을 처음부터 끝까지 하나씩 꺼내${fn ? `(${fn.params})` : ''} 각각에 대해 같은 명령을 실행하는 명령어입니다.`,
      why: '목록에 든 모든 항목에 같은 일을 한 번씩 해주기 위해 사용되었습니다.',
    };
  }
  if ((m = e.match(/^(useEffect|useLayoutEffect)\(/))) {
    return {
      easy: '아래 { } 안에 적힌 명령을, 화면이 처음 나타날 때와 지정한 값이 바뀔 때마다 자동으로 실행하도록 등록하는 명령어입니다.',
      why: '사용자가 버튼을 누르지 않아도 특정 순간(화면 등장, 값 변경)에 알아서 해야 할 일(예: 데이터 불러오기)을 처리하기 위해 사용되었습니다.',
    };
  }
  if ((m = e.match(/^(setTimeout|setInterval)\(/))) {
    return {
      easy:
        m[1] === 'setTimeout'
          ? '아래 { } 안의 명령을 바로 실행하지 않고, 정해진 시간이 지난 뒤에 한 번 실행하도록 예약하는 명령어입니다.'
          : '아래 { } 안의 명령을 정해진 시간마다 계속 반복해서 실행하도록 예약하는 명령어입니다.',
      why: '일정 시간 기다렸다가 실행해야 하는 일을 처리하기 위해 사용되었습니다.',
    };
  }
  if ((m = e.match(/^print\(([\s\S]*)\)$/))) {
    return {
      easy: `괄호 안의 ${josa(m[1], '을/를')} 화면(터미널)에 글자로 출력하는 명령어입니다.`,
      why: '계산 결과나 안내 문구를 눈으로 확인하기 위해 사용되었습니다.',
    };
  }
  if ((m = e.match(/^([\w$.]+)\(([\s\S]*)\)$/))) {
    const args = m[2].trim();
    return {
      easy: `${josa(m[1], '이라는/라는')} 기능(함수)을 ${args ? `${josa(args, '을/를')} 넣어서 ` : ''}실행하는 명령어입니다.`,
      why: `${m[1]} 기능에 미리 정해 둔 일을 이 시점에 처리하기 위해 사용되었습니다.`,
    };
  }
  return null;
}

// 여는 줄(“{”가 있는 줄)을 보고 그 묶음의 이름 짓기
export function describeOpener(opener: string): string {
  const t = opener.trim();
  let m: RegExpMatchArray | null;
  if (/\buse(Layout)?Effect\(/.test(t)) return 'useEffect 자동 실행 묶음';
  if (/\bsetTimeout\(/.test(t)) return 'setTimeout 예약 묶음';
  if (/\bsetInterval\(/.test(t)) return 'setInterval 반복 예약 묶음';
  if ((m = t.match(/^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*([\w$]*)/))) return m[1] ? `${m[1]} 함수` : '함수';
  if ((m = t.match(/^(?:export\s+)?(?:const|let|var)\s+([\w$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[\w$]+)\s*=>/))) return `${m[1]} 함수`;
  if (/^(\}\s*)?else\s+if\b|^if\b/.test(t)) return 'if 조건 묶음';
  if (/^(\}\s*)?else\b/.test(t)) return 'else 묶음';
  if (/^(for|while)\b/.test(t)) return '반복 묶음';
  if (/^try\b/.test(t)) return 'try 묶음';
  if (/^switch\b/.test(t)) return 'switch 묶음';
  if (/^(\}\s*)?catch\b/.test(t)) return 'catch 오류 처리 묶음';
  if ((m = t.match(/^(?:export\s+)?(?:default\s+)?class\s+([\w$]+)/))) return `${m[1]} 클래스`;
  if (/addEventListener\(/.test(t)) return '이벤트 처리 묶음';
  if (/\.then\(/.test(t)) return '후속 처리 묶음';
  if (/return\s*\($/.test(t)) return '화면 모양(JSX) 묶음';
  if (/=>\s*\{$/.test(t)) return '함수 묶음';
  if (/=\s*\{$/.test(t)) return '묶음(객체)';
  if (/=\s*\[$/.test(t)) return '목록(배열)';
  if (/^[.#a-zA-Z*:\[][^=(){};]*\{$/.test(t)) return `'${t.replace(/\s*\{$/, '')}' 꾸밈 규칙 묶음`;
  return '{ } 묶음';
}


export function describeCodeForBeginner(line: string, opener?: string, stack: string[] = []): BeginnerDescription | null {
  const t = line.trim();
  const css = describeCssLine(line, stack);
  if (css) return { role: css.role, definition: css.definition, easy: css.easy, why: css.why, tokens: css.tokens };
  const d = describeKeyword(t, stack) || describeLine(line, opener);
  if (!d) return null;
  if (!d.definition) {
    const rhs = t.match(/^(?:(?:export\s+)?(?:const|let|var)\s+[^=]+=|return\s+|[\w$.]+\s*=)\s*(?:await\s+)?([\s\S]+?);?$/)?.[1];
    const known = (rhs && matchKnown(rhs)) || matchKnown(t);
    d.definition = known?.entry.def || definitionFor(t);
  }
  return d;
}

function describeLine(line: string, opener?: string): BeginnerDescription | null {
  const t = line.trim();
  if (!t) return null;
  let m: RegExpMatchArray | null;

  // 주석
  if ((m = t.match(/^(\/\/|#(?![\w-]+\s*\{)|\/\*+|\*)\s*(.*?)\s*(\*\/)?$/))) {
    const memo = m[2] || '(내용 없음)';
    return {
      role: '설명 메모 (주석)',
      easy: `컴퓨터는 무시하고 사람만 읽는 설명 메모(주석)입니다. 적힌 내용은 ${josa(`'${memo}'`, '이라는/라는')} 뜻입니다.`,
      why: '나중에 코드를 읽는 사람이 이 부분이 무슨 일을 하는지 빨리 알아볼 수 있도록 남겨 둔 것입니다.',
    };
  }

  // 닫는 괄호로 시작하는 줄: }, }); }, 300); }, [query]);
  if (/^[\]})]/.test(t)) {
    const name = opener ? describeOpener(opener) : '{ } 묶음';
    const rest = t.replace(/^[\]})]+/, '');
    let easy = `위에서 시작한 ${josa(name, '을/를')} 여기서 닫는`;
    let why = '어디까지가 한 묶음인지 컴퓨터에게 정확히 알려주기 위해 사용되었습니다.';
    const delay = rest.match(/^\s*,\s*(\d+)\s*\)/);
    const deps = rest.match(/^\s*,\s*\[([^\]]*)\]\s*\)/);
    const elseNext = rest.match(/^\s*else\b(\s+if\s*\((.*)\))?/);
    const catchNext = rest.match(/^\s*catch\b/);
    if (delay && opener && /setTimeout|setInterval/.test(opener)) {
      const ms = Number(delay[1]);
      const sec = ms / 1000;
      easy += /setInterval/.test(opener)
        ? ` 동시에, 그 안의 명령을 ${ms}밀리초(${sec}초)마다 반복 실행하도록 시간을 정하는`
        : ` 동시에, 그 안의 명령을 ${ms}밀리초(${sec}초) 뒤에 한 번 실행하도록 시간을 정하는`;
      why = `바로 실행하지 않고 ${sec}초 기다렸다가 실행하도록 시간 간격을 두기 위해 사용되었습니다.`;
    } else if (deps && opener && /use(Layout)?Effect|useMemo|useCallback/.test(opener)) {
      const list = deps[1].trim();
      if (list) {
        easy += ` 동시에, ${list} 값이 바뀔 때마다 이 묶음을 다시 실행하라고 정하는`;
        why = `${list} 값이 바뀔 때만 필요한 작업을 다시 하도록 해서, 쓸데없이 반복 실행되는 것을 막기 위해 사용되었습니다.`;
      } else {
        easy += ' 동시에, 이 묶음을 화면이 처음 나타날 때 딱 한 번만 실행하라고 정하는';
        why = '처음 한 번만 하면 되는 일(예: 첫 데이터 불러오기)을 반복하지 않기 위해 사용되었습니다.';
      }
    } else if (elseNext) {
      easy += elseNext[1]
        ? ` 동시에, 위 조건이 맞지 않았을 때 다시 ${explainCondition(elseNext[2])} 아래 { } 안의 명령을 실행하라고 이어서 정하는`
        : ' 동시에, 위 조건이 맞지 않았을 때는 아래 { } 안의 명령을 대신 실행하라고 정하는';
      why = '조건에 따라 서로 다른 일을 하도록 갈림길을 만들기 위해 사용되었습니다.';
    } else if (catchNext) {
      easy += ' 동시에, 위에서 오류가 나면 아래 { } 안의 명령으로 대신 처리하라고 정하는';
      why = '오류가 나도 프로그램이 멈추지 않고 대처할 수 있게 하기 위해 사용되었습니다.';
    }
    return { role: `${name} 닫기`, easy: `${easy} 줄입니다.`, why };
  }

  // import (JavaScript)
  if ((m = t.match(/^import\s+(.+?)\s+from\s+['"](.+?)['"];?$/))) {
    const what = m[1].trim();
    const from = m[2];
    const names = what.startsWith('{')
      ? splitTopLevel(what.replace(/^\{|\}$/g, '')).map((n) => n.split(/\s+as\s+/)[0].trim())
      : [what.replace(/^\*\s+as\s+/, '')];
    const lib = from.startsWith('.') ? `같은 프로젝트 안의 '${from}' 파일` : `'${from}'라는 이미 만들어진 도구 모음(라이브러리)`;
    const known = names.filter((n) => REACT_HOOKS[n]).map((n) => `${n}(${REACT_HOOKS[n]})`);
    return {
      role: `${names.join(', ')} 가져오기`,
      easy: `${lib}에서 ${josa(names.join(', '), '이라는/라는')} 기능을 가져와 이 파일에서 쓸 수 있게 하는 명령어입니다.${known.length ? ` 가져온 기능은 ${known.join(', ')}입니다.` : ''}`,
      why: `아래 코드에서 ${josa(names.join(', '), '을/를')} 사용하기 위해, 직접 만들지 않고 이미 만들어진 것을 미리 불러온 것입니다.`,
    };
  }
  if ((m = t.match(/^import\s+['"](.+?)['"];?$/))) {
    return {
      role: '파일 불러오기',
      easy: `'${m[1]}' 파일을 불러와서 이 화면에 적용하는 명령어입니다.`,
      why: m[1].endsWith('.css')
        ? '이 화면을 꾸미는 디자인 규칙(색, 크기, 배치)을 적용하기 위해 사용되었습니다.'
        : '그 파일에 들어있는 코드를 미리 실행해 두기 위해 사용되었습니다.',
    };
  }
  // import (Python)
  if ((m = t.match(/^from\s+([\w.]+)\s+import\s+(.+)$/)) || (m = t.match(/^import\s+([\w., ]+)$/))) {
    const lib = m[1];
    const names = m[2] ? m[2] : m[1];
    return {
      role: `${names} 가져오기`,
      easy: m[2]
        ? `'${lib}'라는 도구 모음에서 ${josa(names, '이라는/라는')} 기능을 가져와 이 파일에서 쓸 수 있게 하는 명령어입니다.`
        : `${josa(`'${lib}'`, '이라는/라는')} 도구 모음(라이브러리)을 통째로 가져와 이 파일에서 쓸 수 있게 하는 명령어입니다.`,
      why: '필요한 기능을 직접 만들지 않고 이미 만들어진 것을 가져다 쓰기 위해 사용되었습니다.',
    };
  }

  // 함수 선언: export function name(params) {
  if ((m = t.match(/^(export\s+)?(default\s+)?(async\s+)?function\s*([\w$]*)\s*\(([^)]*)\)\s*\{?$/))) {
    const [, exp, , isAsync, name, params] = m;
    return describeFunction(name || '(이름 없는)', params, Boolean(exp), Boolean(isAsync));
  }
  // 함수 선언: const name = (params) => {
  if ((m = t.match(/^(export\s+)?(const|let|var)\s+([\w$]+)\s*=\s*(async\s*)?(?:\(([^)]*)\)|([\w$]+))\s*=>\s*\{?$/))) {
    return describeFunction(m[3], m[5] ?? m[6] ?? '', Boolean(m[1]), Boolean(m[4]));
  }
  // Python 함수: def name(params):
  if ((m = t.match(/^def\s+(\w+)\s*\(([^)]*)\)\s*:$/))) {
    return describeFunction(m[1], m[2], false, false, true);
  }

  // 리액트 상태: const [a, setA] = useState(x)
  if ((m = t.match(/^(const|let)\s+\[\s*([\w$]+)\s*,\s*([\w$]+)\s*\]\s*=\s*useState(?:<[^>]*>)?\(([\s\S]*)\);?$/))) {
    const [, , val, setter, init] = m;
    return {
      role: `${val} 상태(기억 값) 만들기`,
      easy: `${josa(val, '이라는/라는')} 값과, 그 값을 바꿀 때 쓰는 ${josa(setter, '이라는/라는')} 기능을 한 쌍으로 만들고, ${val}의 처음 값은 ${init.trim() ? josa(explainValue(init), '으로/로') : '비어 있는 값으로'} 정하는 명령어입니다.`,
      why: `화면에 보여줄 ${josa(val, '을/를')} 기억해 두었다가, ${josa(setter, '으로/로')} 값이 바뀌면 화면이 자동으로 다시 그려지게 하기 위해 사용되었습니다.`,
    };
  }
  // 구조 분해: const { a, b } = obj / const [a, b] = arr
  if ((m = t.match(/^(const|let|var)\s+([{[])\s*([^=]+?)\s*[}\]]\s*=\s*([\s\S]+?);?$/))) {
    const names = splitTopLevel(m[3]).map((n) => n.split(/[:=]/)[0].trim()).join(', ');
    const src = m[4];
    return {
      role: `${names} 꺼내기`,
      easy: m[2] === '{'
        ? `${src} 묶음(객체) 안에서 ${josa(names, '이라는/라는')} 이름의 값을 각각 꺼내, 같은 이름의 상자에 하나씩 담는 명령어입니다.`
        : `${src} 목록(배열)의 앞에서부터 값을 순서대로 꺼내 ${names} 상자에 하나씩 담는 명령어입니다.`,
      why: `${src}.${names.split(', ')[0]}처럼 길게 쓰지 않고 짧은 이름으로 바로 쓰기 위해 사용되었습니다.`,
    };
  }
  // 타이머 예약을 변수에 담기
  if ((m = t.match(/^(const|let|var)\s+([\w$]+)\s*=\s*(setTimeout|setInterval)\(/))) {
    const [, , name, fn] = m;
    return {
      role: `${fn} 예약 (${name})`,
      easy:
        fn === 'setTimeout'
          ? `아래 { } 안의 명령을 정해진 시간이 지난 뒤에 한 번 실행하도록 예약하고, 그 예약 번호를 ${josa(name, '이라는/라는')} 이름표 상자에 담아 두는 명령어입니다.`
          : `아래 { } 안의 명령을 정해진 시간마다 반복 실행하도록 예약하고, 그 예약 번호를 ${josa(name, '이라는/라는')} 이름표 상자에 담아 두는 명령어입니다.`,
      why: `나중에 ${fn === 'setTimeout' ? 'clearTimeout' : 'clearInterval'}(${name})으로 이 예약을 취소할 수 있도록 예약 번호를 저장해 두려고 사용되었습니다.`,
    };
  }
  // 일반 변수: const x = value
  if ((m = t.match(/^(const|let|var)\s+([\w$]+)(?:\s*:\s*[^=]+)?\s*=\s*([\s\S]+?);?$/))) {
    const [, kw, name, value] = m;
    const changeable = kw === 'const' ? '한 번 넣으면 다른 값으로 바꿀 수 없는' : '나중에 다른 값으로 바꿀 수 있는';
    return {
      role: `${name} 변수 만들기`,
      easy: `${josa(name, '이라는/라는')} 이름표를 붙인 상자(${changeable} 변수)를 만들고, 그 안에 ${josa(explainValue(value), '을/를')} 넣어두는 명령어입니다.`,
      why: `이 값을 ${josa(name, '이라는/라는')} 이름으로 기억해 두었다가, 아래 코드에서 이름만 불러 다시 쓰기 위해 사용되었습니다.`,
    };
  }
  // Python 변수: x = value
  if ((m = t.match(/^([a-zA-Z_]\w*)\s*=\s*([^=][\s\S]*)$/)) && !t.endsWith(';') && !t.includes('=>')) {
    return {
      role: `${m[1]} 값 저장`,
      easy: `${josa(m[1], '이라는/라는')} 이름표 상자에 ${josa(explainValue(m[2]), '을/를')} 넣어두는 명령어입니다.`,
      why: `이 값을 ${josa(m[1], '이라는/라는')} 이름으로 기억해 두었다가 다시 쓰기 위해 사용되었습니다.`,
    };
  }

  // 조건문 — 한 줄짜리: if (조건) return / continue / break / 명령;
  const oneLine = splitIfOneLiner(t);
  if (oneLine) {
    const cond = explainCondition(oneLine.cond);
    const body = oneLine.body;
    let r: RegExpMatchArray | null;
    if ((r = body.match(/^return\s*([^;]*);?$/))) {
      return {
        role: '조건이 맞으면 멈추기',
        easy: `만약 ${cond} 여기서 바로 멈추고${r[1] ? ` ${josa(r[1], '을/를')} 결과로 돌려주며` : ''}, 아래에 있는 명령은 실행하지 않는 조건문입니다.`,
        why: '할 필요가 없는 상황(예: 입력값이 비어 있을 때)에는 아래 작업을 아예 하지 않도록 미리 걸러내기 위해 사용되었습니다.',
      };
    }
    if (/^continue;?$/.test(body)) {
      return {
        role: '조건이 맞으면 이번 차례 건너뛰기',
        easy: `만약 ${cond} 이번 차례의 남은 명령은 건너뛰고 바로 다음 차례 반복으로 넘어가는 조건문입니다.`,
        why: '조건에 맞지 않는 항목(예: 비어 있는 값)은 처리하지 않고 넘어가기 위해 사용되었습니다.',
      };
    }
    if (/^break;?$/.test(body)) {
      return {
        role: '조건이 맞으면 반복 끝내기',
        easy: `만약 ${cond} 반복을 그 자리에서 바로 끝내고 반복 묶음 다음 코드로 넘어가는 조건문입니다.`,
        why: '원하는 것을 찾았거나 더 반복할 필요가 없을 때 바로 끝내기 위해 사용되었습니다.',
      };
    }
    const inner = describeLine(body) || describeKeyword(body);
    return {
      role: '조건이 맞으면 한 가지 실행',
      easy: `만약 ${cond} 뒤에 적힌 명령 하나를 실행하는 조건문입니다.${inner ? ` 그 명령은 ${inner.easy}` : ''}`,
      why: '특정 상황에서만 그 명령을 실행하기 위해 사용되었습니다.',
    };
  }
  if ((m = t.match(/^if\s*\((.+)\)\s*\{?$/)) || (m = t.match(/^if\s+(.+):$/))) {
    return {
      role: '조건 검사 (if)',
      easy: `만약 ${explainCondition(m[1])} 아래 { } 안의 명령을 실행하고, 아니면 건너뛰라는 조건문입니다.`,
      why: '상황에 따라 해야 할 일이 다를 때, 조건이 맞는 경우에만 특정 작업을 하기 위해 사용되었습니다.',
    };
  }
  if ((m = t.match(/^(?:\}\s*)?else\s+if\s*\((.+)\)\s*\{?$/)) || (m = t.match(/^elif\s+(.+):$/))) {
    return {
      role: '다른 조건 검사 (else if)',
      easy: `위 조건이 맞지 않았을 때, 다시 ${explainCondition(m[1])} 아래 { } 안의 명령을 실행하라는 조건문입니다.`,
      why: '여러 경우를 차례대로 검사해서 경우마다 다른 일을 하기 위해 사용되었습니다.',
    };
  }
  if (/^(\}\s*)?else\s*\{?$/.test(t) || t === 'else:') {
    return {
      role: '나머지 경우 (else)',
      easy: '위의 조건들이 하나도 맞지 않았을 때 아래 { } 안의 명령을 대신 실행하라는 뜻입니다.',
      why: '조건에 해당하지 않는 나머지 모든 경우를 빠짐없이 처리하기 위해 사용되었습니다.',
    };
  }

  // 반복문
  if ((m = t.match(/^for\s*\(\s*(?:const|let|var)\s+([\w$[\]{}, ]+?)\s+of\s+(.+?)\)\s*\{?$/)) || (m = t.match(/^for\s+(\w+)\s+in\s+(.+):$/))) {
    return {
      role: `${m[2]} 하나씩 반복`,
      easy: `${m[2]} 목록에서 값을 처음부터 하나씩 꺼내 ${josa(m[1].trim(), '이라고/라고')} 부르면서, 아래 명령을 목록 개수만큼 반복하는 반복문입니다.`,
      why: '목록에 든 모든 항목에 같은 일을 하나씩 해주기 위해 사용되었습니다.',
    };
  }
  if ((m = t.match(/^for\s*\(\s*(?:let|var)\s+(\w+)\s*=\s*([^;]+);\s*([^;]+);\s*([^)]+)\)\s*\{?$/))) {
    const [, i, start, cond, step] = m;
    const stepKo = /\+\+|\+=\s*1\b/.test(step) ? '1씩 늘려가며' : /--|-=\s*1\b/.test(step) ? '1씩 줄여가며' : `${step} 규칙으로 바꿔가며`;
    return {
      role: '횟수만큼 반복 (for)',
      easy: `${josa(i, '을/를')} ${start.trim()}부터 시작해서 ${stepKo}, ${explainCondition(cond)} 아래 명령을 계속 반복하는 반복문입니다. 조건이 맞지 않게 되면 반복이 끝납니다.`,
      why: '같은 일을 정해진 횟수만큼 여러 번 반복하기 위해 사용되었습니다.',
    };
  }
  if ((m = t.match(/^while\s*\((.+)\)\s*\{?$/)) || (m = t.match(/^while\s+(.+):$/))) {
    return {
      role: '조건 동안 반복 (while)',
      easy: `${explainCondition(m[1])} 아래 명령을 계속 반복하고, 조건이 맞지 않게 되면 반복을 멈추는 반복문입니다.`,
      why: '몇 번 반복할지 미리 모를 때, 조건이 맞는 동안 계속 반복하기 위해 사용되었습니다.',
    };
  }

  // return
  if ((m = t.match(/^return\s*\(?\s*$/))) {
    return {
      role: '화면 모양 돌려주기',
      easy: t === 'return' || t === 'return;'
        ? '이 함수를 여기서 끝내고 빠져나가는 명령어입니다.'
        : '이 함수의 결과로, 아래 괄호 안에 적힌 화면 모양(JSX)을 돌려주는 명령어입니다.',
      why: '이 부품이 화면에 어떤 모양으로 보여야 하는지 알려주기 위해 사용되었습니다.',
    };
  }
  if ((m = t.match(/^return\s+([\s\S]+?);?$/))) {
    const val = m[1];
    const fn = parseArrow(val);
    if (fn) {
      const inner = explainCall(fn.body);
      return {
        role: '정리 함수 돌려주기',
        easy: `결과로 '나중에 실행할 함수'를 돌려주는 명령어입니다. 그 함수는 ${josa(fn.body, '을/를')} 실행합니다${inner ? ` — ${inner.easy.replace(/ 명령어입니다\.$/, '')} 일입니다` : ''}.`,
        why: 'useEffect 안이라면, 화면이 사라지거나 다시 실행되기 직전에 앞에서 해 둔 일(예약, 연결)을 깨끗이 정리하기 위해 사용되었습니다.',
      };
    }
    return {
      role: '결과 돌려주기 (return)',
      easy: `이 함수의 결과로 ${josa(explainValue(val), '을/를')} 돌려주고, 함수를 여기서 끝내는 명령어입니다.`,
      why: '이 함수를 부른 곳에서 결과값을 받아 쓸 수 있게 하기 위해 사용되었습니다.',
    };
  }

  // try / catch
  if (/^try\s*\{?$/.test(t) || t === 'try:') {
    return {
      role: '오류 대비 시작 (try)',
      easy: '아래 { } 안의 명령을 일단 시도해 보고, 도중에 오류가 나면 catch 부분으로 넘어가라는 뜻입니다.',
      why: '오류가 날 수 있는 작업(서버 요청 등) 때문에 프로그램 전체가 멈추지 않도록 하기 위해 사용되었습니다.',
    };
  }
  if ((m = t.match(/^(?:\}\s*)?catch\s*(?:\((\w+)\))?\s*\{?$/)) || (m = t.match(/^except\b.*:$/))) {
    return {
      role: '오류 처리 (catch)',
      easy: `위 try 부분에서 오류가 나면, 그 오류 내용을 ${m[1] ? josa(m[1], '이라는/라는') : ''} 이름으로 받아서 아래 { } 안의 명령으로 처리하라는 뜻입니다.`,
      why: '오류가 났을 때 사용자에게 안내하거나 대신할 동작을 하기 위해 사용되었습니다.',
    };
  }

  // 클래스
  if ((m = t.match(/^(?:export\s+)?(?:default\s+)?class\s+([\w$]+)(?:\s+extends\s+([\w$.]+))?\s*\{?$/))) {
    return {
      role: `${m[1]} 클래스 만들기`,
      easy: `${josa(m[1], '이라는/라는')} 이름의 설계도(클래스)를 만드는 명령어입니다.${m[2] ? ` 이 설계도는 ${m[2]} 설계도의 기능을 물려받습니다.` : ''}`,
      why: '같은 구조의 물건(객체)을 여러 개 찍어낼 수 있도록 공통 설계도를 정해 두기 위해 사용되었습니다.',
    };
  }

  // 값 바꾸기
  if ((m = t.match(/^([\w$.[\]]+)\s*(\+\+|--);?$/))) {
    return {
      role: `${m[1]} 1 ${m[2] === '++' ? '늘리기' : '줄이기'}`,
      easy: `${m[1]}에 들어있는 숫자를 1만큼 ${m[2] === '++' ? '늘리는' : '줄이는'} 명령어입니다.`,
      why: '개수를 세거나 순서를 하나씩 옮기기 위해 사용되었습니다.',
    };
  }
  if ((m = t.match(/^([\w$.[\]]+)\s*([+\-*/])=\s*([\s\S]+?);?$/))) {
    const opKo: Record<string, string> = { '+': '더한', '-': '뺀', '*': '곱한', '/': '나눈' };
    return {
      role: `${m[1]} 값 바꾸기`,
      easy: `${m[1]}에 들어있는 값에 ${josa(m[3], '을/를')} ${opKo[m[2]]} 결과를 다시 ${m[1]}에 넣는 명령어입니다.`,
      why: '기존 값을 바탕으로 새 값을 계속 쌓아가기 위해 사용되었습니다.',
    };
  }
  if ((m = t.match(/^([\w$.[\]]+)\s*=\s*([^=>][\s\S]*?);?$/))) {
    const target = m[1];
    const dom = target.match(/\.(textContent|innerText|innerHTML|value|src|href|className)$/);
    const domKo: Record<string, string> = {
      textContent: '안에 보이는 글자', innerText: '안에 보이는 글자', innerHTML: '안쪽 HTML 내용',
      value: '입력칸의 값', src: '불러올 파일 주소', href: '이동할 주소', className: '꾸밈 이름표(class)',
    };
    return {
      role: `${target} 값 바꾸기`,
      easy: dom
        ? `${target.replace(/\.[^.]+$/, '')} 요소의 ${josa(domKo[dom[1]], '을/를')} ${josa(explainValue(m[2]), '으로/로')} 바꾸는 명령어입니다.`
        : `${target}에 들어있던 값을 ${josa(explainValue(m[2]), '으로/로')} 바꿔 넣는 명령어입니다.`,
      why: dom ? '화면에 보이는 내용을 코드로 바꿔서 사용자에게 새 정보를 보여주기 위해 사용되었습니다.' : '상황이 바뀐 것에 맞춰 저장된 값을 새로 고치기 위해 사용되었습니다.',
    };
  }

  // await 단독
  if ((m = t.match(/^await\s+([\s\S]+?);?$/))) {
    const inner = explainCall(m[1]);
    return {
      role: '끝날 때까지 기다리기 (await)',
      easy: `${inner ? inner.easy.replace(/ 명령어입니다\.$/, '') + ' 작업을' : `${m[1]} 작업을`} 시작하고, 그 작업이 끝날 때까지 다음 줄로 넘어가지 않고 기다리는 명령어입니다.`,
      why: '앞의 작업 결과가 있어야 다음 일을 할 수 있어서, 순서를 지키기 위해 사용되었습니다.',
    };
  }

  // 함수 호출 (알려진 것 + 일반)
  const call = explainCall(t);
  if (call) {
    const nameMatch = t.match(/^\.?([\w$.]+)\(/);
    return { role: `${nameMatch ? nameMatch[1] : '기능'} 실행`, ...call };
  }

  // CSS 선택자 시작: .box {
  if ((m = t.match(/^([.#a-zA-Z*:\[][^=(){};]*?)\s*\{$/))) {
    const sel = m[1];
    const selKo = sel.startsWith('.')
      ? `${josa(sel.slice(1), '이라는/라는')} class 이름표가 붙은 요소들`
      : sel.startsWith('#')
      ? `${josa(sel.slice(1), '이라는/라는')} id를 가진 요소`
      : `모든 <${sel}> 요소`;
    return {
      role: `'${sel}' 꾸밈 규칙 시작`,
      easy: `${josa(selKo, '을/를')} 어떻게 꾸밀지 아래 { } 안에 규칙을 적기 시작하는 줄입니다.`,
      why: '해당 요소들의 색, 크기, 위치 같은 디자인을 한곳에서 정하기 위해 사용되었습니다.',
    };
  }
  // CSS 속성: color: red;
  if ((m = t.match(/^([a-z-]+)\s*:\s*([^;{}]+);?$/)) && CSS_PROPS[m[1]]) {
    const label = CSS_PROPS[m[1]];
    const value = m[2].trim();
    return {
      role: `${label} 정하기`,
      easy: `이 요소의 ${label}(${m[1]})${josa(label, '을/를').slice(label.length)} ${josa(value, '으로/로')} 정하는 명령어입니다.`,
      why: `화면에서 이 요소의 ${josa(label, '을/를')} 원하는 모양으로 보이게 꾸미기 위해 사용되었습니다.`,
    };
  }

  return null;
}

function describeFunction(name: string, params: string, exported: boolean, isAsync: boolean, python = false): BeginnerDescription {
  const ps = splitTopLevel(params).filter(Boolean);
  const paramText = ps
    .map((p) => {
      const [pn, def] = p.split('=').map((x) => x.trim());
      return def !== undefined ? `${pn}(값을 안 주면 ${explainValue(def)})` : pn;
    })
    .join(', ');
  const kind = /^use[A-Z]/.test(name)
    ? '리액트에서 직접 만든 기능 묶음(커스텀 훅)'
    : /^[A-Z]/.test(name)
    ? '화면의 한 조각을 그려주는 부품(컴포넌트)'
    : '여러 명령을 하나로 묶어 이름을 붙인 기능(함수)';
  return {
    role: `${name} 함수 만들기`,
    easy: `${josa(name, '이라는/라는')} 이름의 ${josa(kind, '을/를')} 만드는 명령어입니다.${
      ps.length ? ` 이 기능을 쓸 때는 ${josa(paramText, '을/를')} 전달받습니다.` : ''
    }${exported ? ' export가 붙어 있어 다른 파일에서도 가져다 쓸 수 있습니다.' : ''}${
      isAsync ? ' async가 붙어 있어 안에서 오래 걸리는 작업을 기다릴(await) 수 있습니다.' : ''
    } ${python ? '아래 들여 쓴 줄들에' : '아래 { } 안에'} 이 기능이 할 일이 적혀 있습니다.`,
    why: `같은 동작을 여러 곳에서 반복해서 쓰기 쉽도록 ${josa(name, '이라는/라는')} 하나의 이름으로 묶어 두기 위해 사용되었습니다.`,
  };
}

// =========================================================
// 코드 "정의" 사전
//  - 키워드(break, continue, switch ...)
//  - 자주 쓰는 내장 기능(localStorage, JSON, Math, 문자열/배열 메서드 ...)
//  - HTML 태그
//  각 항목은 "일반적인 정의" + "이 줄에서는 무엇을 하는지"를 함께 만듭니다.
// =========================================================

function uq(s: string): string {
  return unquote(s) ?? s.trim();
}

interface KnownEntry {
  re: RegExp;
  def: string; // 일반 정의
  value?: (m: RegExpMatchArray) => string; // 값으로 쓰일 때: "~한 것/값"
  stmt?: (m: RegExpMatchArray) => string; // 한 줄 명령으로 쓰일 때: "~하는 명령어입니다."
  why?: string;
}

const KNOWN: KnownEntry[] = [
  // ---- 브라우저 저장 공간 ----
  {
    re: /^localStorage\.setItem\((.+?),\s*([\s\S]+)\)$/,
    def: 'localStorage.setItem은 브라우저 안의 저장 공간에 값을 이름(키)과 함께 저장하는 기능입니다. 브라우저를 껐다 켜도 지워지지 않습니다.',
    stmt: (m) => `${josa(explainValue(m[2]), '을/를')} '${uq(m[1])}'라는 이름으로 브라우저 저장 공간에 저장하는 명령어입니다.`,
    why: '새로고침하거나 다시 방문해도 값(로그인 상태, 설정 등)이 사라지지 않게 보관하기 위해 사용되었습니다.',
  },
  {
    re: /^localStorage\.getItem\((.+)\)$/,
    def: 'localStorage.getItem은 브라우저 저장 공간에 저장해 둔 값을 이름(키)으로 찾아 꺼내는 기능입니다.',
    value: (m) => `브라우저 저장 공간에 '${uq(m[1])}'라는 이름으로 저장해 둔 값`,
  },
  {
    re: /^localStorage\.removeItem\((.+)\)$/,
    def: 'localStorage.removeItem은 브라우저 저장 공간에서 값을 지우는 기능입니다.',
    stmt: (m) => `브라우저 저장 공간에서 '${uq(m[1])}'라는 이름으로 저장된 값을 지우는 명령어입니다.`,
    why: '더 이상 필요 없는 정보(예: 로그아웃 시 로그인 정보)를 남겨 두지 않기 위해 사용되었습니다.',
  },
  // ---- JSON ----
  {
    re: /^JSON\.parse\(([\s\S]+)\)$/,
    def: 'JSON.parse는 JSON이라는 글자 형식의 데이터를 자바스크립트에서 쓸 수 있는 값(객체·배열)으로 바꾸는 기능입니다.',
    value: (m) => `글자로 된 ${josa(m[1], '을/를')} 자바스크립트 값(객체·배열)으로 바꾼 것`,
  },
  {
    re: /^JSON\.stringify\(([\s\S]+?)\)$/,
    def: 'JSON.stringify는 자바스크립트 값(객체·배열)을 저장하거나 보내기 쉬운 JSON 글자 형식으로 바꾸는 기능입니다.',
    value: (m) => `${josa(splitTopLevel(m[1])[0], '을/를')} JSON 글자로 바꾼 것`,
  },
  // ---- 숫자 계산 ----
  { re: /^Math\.random\(\)$/, def: 'Math.random은 0 이상 1 미만의 숫자를 무작위로 하나 뽑아 주는 기능입니다.', value: () => '0 이상 1 미만의 무작위 숫자' },
  { re: /^Math\.floor\(([\s\S]+)\)$/, def: 'Math.floor는 숫자의 소수점 아래를 버리고 정수로 만드는 기능입니다. (3.7 → 3)', value: (m) => `${m[1]}의 소수점 아래를 버린 정수` },
  { re: /^Math\.ceil\(([\s\S]+)\)$/, def: 'Math.ceil은 숫자의 소수점 아래를 올려서 정수로 만드는 기능입니다. (3.2 → 4)', value: (m) => `${m[1]}의 소수점 아래를 올린 정수` },
  { re: /^Math\.round\(([\s\S]+)\)$/, def: 'Math.round는 숫자를 반올림해서 정수로 만드는 기능입니다. (3.5 → 4)', value: (m) => `${josa(m[1], '을/를')} 반올림한 정수` },
  { re: /^Math\.max\(([\s\S]+)\)$/, def: 'Math.max는 여러 숫자 중 가장 큰 값을 골라 주는 기능입니다.', value: (m) => `${m[1]} 중에서 가장 큰 값` },
  { re: /^Math\.min\(([\s\S]+)\)$/, def: 'Math.min은 여러 숫자 중 가장 작은 값을 골라 주는 기능입니다.', value: (m) => `${m[1]} 중에서 가장 작은 값` },
  { re: /^Math\.abs\(([\s\S]+)\)$/, def: 'Math.abs는 숫자의 마이너스(-) 부호를 없앤 절댓값을 구하는 기능입니다.', value: (m) => `${m[1]}의 절댓값(부호를 뗀 값)` },
  { re: /^parseInt\(([\s\S]+?)(?:,\s*\d+)?\)$/, def: 'parseInt는 글자로 된 숫자("42")를 계산할 수 있는 정수(42)로 바꾸는 기능입니다.', value: (m) => `${josa(m[1], '을/를')} 정수 숫자로 바꾼 값` },
  { re: /^parseFloat\(([\s\S]+)\)$/, def: 'parseFloat는 글자로 된 숫자("3.14")를 소수점이 있는 숫자(3.14)로 바꾸는 기능입니다.', value: (m) => `${josa(m[1], '을/를')} 소수점 숫자로 바꾼 값` },
  { re: /^Number\(([\s\S]+)\)$/, def: 'Number는 값을 숫자로 바꾸는 기능입니다. 숫자로 바꿀 수 없으면 NaN(숫자 아님)이 됩니다.', value: (m) => `${josa(m[1], '을/를')} 숫자로 바꾼 값` },
  { re: /^String\(([\s\S]+)\)$/, def: 'String은 값을 글자(문자열)로 바꾸는 기능입니다.', value: (m) => `${josa(m[1], '을/를')} 글자로 바꾼 값` },
  { re: /^([\w$.]+)\.toFixed\((\d+)\)$/, def: 'toFixed는 숫자를 소수점 아래 정해진 자리까지만 남겨 글자로 바꾸는 기능입니다.', value: (m) => `${josa(m[1], '을/를')} 소수점 ${m[2]}자리까지 반올림한 글자` },
  // ---- 글자(문자열) 다루기 ----
  { re: /^([\w$.]+)\.toUpperCase\(\)$/, def: 'toUpperCase는 영어 글자를 모두 대문자로 바꾸는 기능입니다.', value: (m) => `${m[1]}의 영어 글자를 모두 대문자로 바꾼 글자` },
  { re: /^([\w$.]+)\.toLowerCase\(\)$/, def: 'toLowerCase는 영어 글자를 모두 소문자로 바꾸는 기능입니다.', value: (m) => `${m[1]}의 영어 글자를 모두 소문자로 바꾼 글자` },
  { re: /^([\w$.]+)\.trim\(\)$/, def: 'trim은 글자의 앞뒤에 붙은 공백(띄어쓰기, 줄바꿈)을 없애는 기능입니다.', value: (m) => `${m[1]}의 앞뒤 공백을 없앤 글자` },
  { re: /^([\w$.]+)\.split\((.+)\)$/, def: 'split은 글자를 정해진 기호를 기준으로 잘라서 여러 조각의 목록(배열)으로 만드는 기능입니다.', value: (m) => `${m[1]} 글자를 ${uq(m[2]) === '' ? '한 글자씩' : `'${uq(m[2])}' 기준으로`} 잘라 만든 목록` },
  { re: /^([\w$.]+)\.join\((.*)\)$/, def: 'join은 목록(배열)에 든 값들을 하나의 글자로 이어 붙이는 기능입니다.', value: (m) => `${m[1]} 목록의 값들을 ${m[2] ? `'${uq(m[2])}'로` : '쉼표(,)로'} 이어 붙인 글자` },
  { re: /^([\w$.]+)\.(replace|replaceAll)\((.+?),\s*(.+)\)$/, def: 'replace는 글자 안에서 특정 부분을 찾아 다른 글자로 바꾸는 기능입니다. (replaceAll은 모두 바꿈)', value: (m) => `${m[1]} 안의 ${m[3]}${m[2] === 'replaceAll' ? '를 모두' : '를'} ${josa(m[4], '으로/로')} 바꾼 글자` },
  { re: /^([\w$.]+)\.includes\((.+)\)$/, def: 'includes는 글자나 목록 안에 특정 값이 들어 있는지 확인해서 참(true)/거짓(false)으로 알려주는 기능입니다.', value: (m) => `${m[1]} 안에 ${josa(m[2], '이/가')} 들어 있는지 여부(참/거짓)` },
  { re: /^([\w$.]+)\.indexOf\((.+)\)$/, def: 'indexOf는 글자나 목록에서 특정 값이 몇 번째에 처음 나오는지 위치 번호를 알려주는 기능입니다. 없으면 -1입니다.', value: (m) => `${m[1]}에서 ${josa(m[2], '이/가')} 처음 나오는 위치 번호(없으면 -1)` },
  { re: /^([\w$.]+)\.slice\(([^,]+)(?:,\s*(.+))?\)$/, def: 'slice는 글자나 목록의 일부분만 잘라서 새로 만드는 기능입니다. 원본은 그대로 남습니다.', value: (m) => `${m[1]}의 ${m[2]}번째부터 ${m[3] ? `${m[3]}번째 앞까지` : '끝까지'} 잘라낸 부분` },
  // ---- 목록(배열) 다루기 ----
  { re: /^([\w$.]+)\.reduce\(([\s\S]+)\)$/, def: 'reduce는 목록(배열)의 값을 처음부터 하나씩 차례로 합쳐서 하나의 결과(합계 등)로 만드는 기능입니다.', value: (m) => `${m[1]} 목록의 값을 하나씩 차례로 합쳐 만든 하나의 결과` },
  { re: /^([\w$.]+)\.sort\(([\s\S]*)\)$/, def: 'sort는 목록(배열)의 값을 정해진 순서대로 다시 정렬하는 기능입니다. 원본 목록이 바뀝니다.', value: (m) => `${josa(m[1], '을/를')} 순서대로 정렬한 목록`, stmt: (m) => `${m[1]} 목록의 값을 순서대로 정렬하는 명령어입니다.` },
  { re: /^([\w$.]+)\.reverse\(\)$/, def: 'reverse는 목록(배열)의 순서를 거꾸로 뒤집는 기능입니다.', value: (m) => `${m[1]} 목록의 순서를 거꾸로 뒤집은 것`, stmt: (m) => `${m[1]} 목록의 순서를 거꾸로 뒤집는 명령어입니다.` },
  { re: /^([\w$.]+)\.concat\(([\s\S]+)\)$/, def: 'concat은 두 개 이상의 목록(배열)이나 글자를 이어 붙여 새로 만드는 기능입니다.', value: (m) => `${m[1]} 뒤에 ${josa(m[2], '을/를')} 이어 붙인 새 목록` },
  { re: /^([\w$.]+)\.pop\(\)$/, def: 'pop은 목록(배열)의 맨 마지막 값을 빼내는 기능입니다.', value: (m) => `${m[1]} 목록에서 빼낸 맨 마지막 값`, stmt: (m) => `${m[1]} 목록의 맨 마지막 값을 빼내서 없애는 명령어입니다.` },
  { re: /^([\w$.]+)\.shift\(\)$/, def: 'shift는 목록(배열)의 맨 첫 번째 값을 빼내는 기능입니다.', value: (m) => `${m[1]} 목록에서 빼낸 맨 첫 번째 값`, stmt: (m) => `${m[1]} 목록의 맨 첫 번째 값을 빼내서 없애는 명령어입니다.` },
  { re: /^([\w$.]+)\.unshift\(([\s\S]+)\)$/, def: 'unshift는 목록(배열)의 맨 앞에 새 값을 끼워 넣는 기능입니다.', stmt: (m) => `${m[1]} 목록의 맨 앞에 ${josa(m[2], '을/를')} 끼워 넣는 명령어입니다.` },
  { re: /^([\w$.]+)\.splice\(([^,]+),\s*([^,)]+)(?:,\s*([\s\S]+))?\)$/, def: 'splice는 목록(배열)의 원하는 위치에서 값을 빼내거나 새 값을 끼워 넣는 기능입니다. 원본 목록이 바뀝니다.', stmt: (m) => `${m[1]} 목록의 ${m[2]}번째 자리부터 ${m[3]}개를 빼내${m[4] ? `고, 그 자리에 ${josa(m[4], '을/를')} 넣`: ''}는 명령어입니다.` },
  { re: /^Object\.keys\(([\s\S]+)\)$/, def: 'Object.keys는 묶음(객체)에 들어 있는 이름(키)들만 모아 목록으로 만들어 주는 기능입니다.', value: (m) => `${m[1]} 묶음에 들어 있는 이름(키)들의 목록` },
  { re: /^Object\.values\(([\s\S]+)\)$/, def: 'Object.values는 묶음(객체)에 들어 있는 값들만 모아 목록으로 만들어 주는 기능입니다.', value: (m) => `${m[1]} 묶음에 들어 있는 값들의 목록` },
  { re: /^Object\.entries\(([\s\S]+)\)$/, def: 'Object.entries는 묶음(객체)의 [이름, 값] 짝들을 목록으로 만들어 주는 기능입니다.', value: (m) => `${m[1]} 묶음의 [이름, 값] 짝 목록` },
  { re: /^Array\.isArray\(([\s\S]+)\)$/, def: 'Array.isArray는 어떤 값이 목록(배열)인지 확인해서 참/거짓으로 알려주는 기능입니다.', value: (m) => `${josa(m[1], '이/가')} 목록(배열)인지 여부(참/거짓)` },
  { re: /^Promise\.all\(([\s\S]+)\)$/, def: 'Promise.all은 여러 개의 오래 걸리는 작업을 동시에 시작하고, 모두 끝날 때까지 기다리는 기능입니다.', value: (m) => `${m[1]}에 든 작업이 모두 끝난 결과 목록` },
  // ---- 화면(문서) 다루기 ----
  { re: /^document\.createElement\((.+)\)$/, def: 'document.createElement는 새 HTML 요소를 코드로 만들어 내는 기능입니다. 만든 직후에는 아직 화면에 붙어 있지 않습니다.', value: (m) => `새로 만든 <${uq(m[1])}> 요소(아직 화면에 붙기 전)` },
  { re: /^([\w$.]+)\.classList\.add\((.+)\)$/, def: 'classList.add는 요소에 class 이름표를 붙이는 기능입니다. CSS에서 그 이름표에 정한 디자인이 적용됩니다.', stmt: (m) => `${m[1]} 요소에 ${josa(`'${uq(m[2])}'`, '이라는/라는')} class 이름표를 붙이는 명령어입니다.`, why: '이름표에 연결된 디자인(색, 보이기/숨기기 등)을 이 요소에 적용하기 위해 사용되었습니다.' },
  { re: /^([\w$.]+)\.classList\.remove\((.+)\)$/, def: 'classList.remove는 요소에 붙어 있던 class 이름표를 떼어내는 기능입니다.', stmt: (m) => `${m[1]} 요소에서 ${josa(`'${uq(m[2])}'`, '이라는/라는')} class 이름표를 떼어내는 명령어입니다.`, why: '그 이름표에 연결된 디자인을 더 이상 적용하지 않기 위해 사용되었습니다.' },
  { re: /^([\w$.]+)\.classList\.toggle\((.+)\)$/, def: 'classList.toggle은 class 이름표가 붙어 있으면 떼고, 없으면 붙이는 스위치 같은 기능입니다.', stmt: (m) => `${m[1]} 요소에 ${josa(`'${uq(m[2])}'`, '이라는/라는')} class 이름표가 있으면 떼고, 없으면 붙이는 명령어입니다.`, why: '버튼을 누를 때마다 메뉴 열기/닫기처럼 상태를 번갈아 바꾸기 위해 사용되었습니다.' },
  { re: /^([\w$.]+)\.(appendChild)\(([\s\S]+)\)$/, def: 'appendChild는 어떤 요소 안의 맨 끝에 다른 요소를 넣어 화면에 붙이는 기능입니다.', stmt: (m) => `${m[1]} 요소 안의 맨 끝에 ${josa(m[3], '을/를')} 넣어서 화면에 보이게 하는 명령어입니다.`, why: '코드로 만든 새 요소를 실제 화면에 나타나게 하기 위해 사용되었습니다.' },
  { re: /^([\w$.]+)\.remove\(\)$/, def: 'remove는 요소를 화면에서 완전히 지우는 기능입니다.', stmt: (m) => `${m[1]} 요소를 화면에서 지우는 명령어입니다.`, why: '더 이상 필요 없는 요소(닫은 알림창 등)를 화면에서 없애기 위해 사용되었습니다.' },
  { re: /^([\w$.]+)\.setAttribute\((.+?),\s*(.+)\)$/, def: 'setAttribute는 요소의 속성(예: src, href, disabled) 값을 정하는 기능입니다.', stmt: (m) => `${m[1]} 요소의 ${uq(m[2])} 속성 값을 ${josa(m[3], '으로/로')} 정하는 명령어입니다.`, why: '요소의 설정(주소, 비활성화 여부 등)을 코드로 바꾸기 위해 사용되었습니다.' },
  { re: /^([\w$.]+)\.focus\(\)$/, def: 'focus는 입력칸이나 버튼을 선택된 상태로 만들어 바로 입력할 수 있게 하는 기능입니다.', stmt: (m) => `${m[1]}에 커서를 옮겨서 사용자가 바로 입력할 수 있게 하는 명령어입니다.`, why: '사용자가 직접 클릭하지 않아도 바로 입력을 시작할 수 있게 하기 위해 사용되었습니다.' },
  { re: /^(?:window\.)?scrollTo\(([\s\S]+)\)$/, def: 'scrollTo는 화면을 원하는 위치로 스크롤(이동)하는 기능입니다.', stmt: () => '화면을 지정한 위치로 스크롤해서 이동시키는 명령어입니다.' },
  // ---- 서버(Node.js / Express) ----
  { re: /^require\((.+)\)$/, def: 'require는 Node.js에서 다른 파일이나 라이브러리를 불러오는 기능입니다.', value: (m) => `'${uq(m[1])}' 모듈(라이브러리)을 불러온 것` },
  { re: /^(app|router|server)\.(get|post|put|patch|delete)\(\s*(['"`])(.+?)\3\s*,[\s\S]*$/, def: 'app.get / app.post 등은 서버에서 "어떤 주소로 요청이 오면 무엇을 할지" 정하는 기능(라우트)입니다.', stmt: (m) => `누군가 '${m[4]}' 주소로 ${m[2].toUpperCase()} 요청을 보내면, 뒤에 적은 함수를 실행해서 응답하도록 정하는 명령어입니다.`, why: '웹사이트나 앱이 서버에 데이터를 요청했을 때 알맞게 대답해 주기 위해 사용되었습니다.' },
  { re: /^(app|router|server)\.use\(([\s\S]+)\)$/, def: 'app.use는 서버로 들어오는 모든 요청이 거쳐 가는 공통 처리 단계(미들웨어)를 등록하는 기능입니다.', stmt: (m) => `서버로 들어오는 요청마다 ${josa(m[2], '을/를')} 먼저 거치도록 등록하는 명령어입니다.`, why: '모든 요청에 공통으로 필요한 일(데이터 해석, 로그인 확인 등)을 한곳에서 처리하기 위해 사용되었습니다.' },
  { re: /^(app|server)\.listen\(([\s\S]+)\)$/, def: 'listen은 서버를 켜서 정해진 번호의 문(포트)으로 들어오는 요청을 기다리기 시작하는 기능입니다.', stmt: (m) => `서버를 켜고 ${splitTopLevel(m[2])[0]}번 포트(문)로 들어오는 요청을 기다리기 시작하는 명령어입니다.`, why: '사용자가 접속할 수 있도록 서버를 실제로 동작시키기 위해 사용되었습니다.' },
  { re: /^res\.status\((\d+)\)\.(json|send)\(([\s\S]*)\)$/, def: 'res.status(...).json(...)은 요청한 사람에게 상태 번호와 함께 데이터를 응답으로 보내는 기능입니다.', stmt: (m) => `요청한 사람에게 ${m[1]}번 상태(${m[1].startsWith('2') ? '성공' : m[1].startsWith('4') ? '요청 오류' : m[1].startsWith('5') ? '서버 오류' : '응답'})와 함께 ${josa(m[3] || '빈 내용', '을/를')} 응답으로 보내는 명령어입니다.`, why: '요청이 성공했는지 실패했는지와 결과 데이터를 함께 알려주기 위해 사용되었습니다.' },
  { re: /^res\.(json|send)\(([\s\S]*)\)$/, def: 'res.json / res.send는 서버에 요청한 사람에게 결과를 응답으로 보내는 기능입니다.', stmt: (m) => `요청한 사람에게 ${josa(m[2] || '빈 내용', '을/를')} 응답으로 보내는 명령어입니다.`, why: '요청에 대한 결과를 돌려주기 위해 사용되었습니다.' },
  // ---- 화면 이동 ----
  { re: /^(navigate|router\.push)\((.+)\)$/, def: 'navigate / router.push는 다른 페이지(주소)로 화면을 이동시키는 기능입니다.', stmt: (m) => `화면을 ${josa(`'${uq(m[2])}'`, '으로/로')} 이동시키는 명령어입니다.`, why: '사용자를 다음 단계 화면으로 보내기 위해 사용되었습니다.' },
  // ---- 파이썬 ----
  { re: /^len\(([\s\S]+)\)$/, def: 'len은 글자 수나 목록에 든 항목 개수를 세어 주는 기능입니다.', value: (m) => `${m[1]}의 길이(글자 수 또는 항목 개수)` },
  { re: /^range\(([\s\S]+)\)$/, def: 'range는 정해진 범위의 숫자들을 차례대로 만들어 주는 기능입니다. range(5)는 0, 1, 2, 3, 4입니다.', value: (m) => { const a = splitTopLevel(m[1]); return a.length === 1 ? `0부터 ${a[0]}-1까지의 숫자들` : `${a[0]}부터 ${a[1]}-1까지의 숫자들`; } },
  { re: /^input\(([\s\S]*)\)$/, def: 'input은 화면에 안내 문구를 보여주고, 사용자가 키보드로 입력한 글자를 받아오는 기능입니다.', value: (m) => `${m[1] ? `${josa(`'${uq(m[1])}'`, '이라는/라는')} 안내를 보여준 뒤 ` : ''}사용자가 키보드로 입력한 글자` },
  { re: /^int\(([\s\S]+)\)$/, def: 'int는 값을 정수 숫자로 바꾸는 기능입니다.', value: (m) => `${josa(m[1], '을/를')} 정수 숫자로 바꾼 값` },
  { re: /^str\(([\s\S]+)\)$/, def: 'str은 값을 글자(문자열)로 바꾸는 기능입니다.', value: (m) => `${josa(m[1], '을/를')} 글자로 바꾼 값` },
  { re: /^([\w$.]+)\.append\(([\s\S]+)\)$/, def: 'append는 목록(리스트)이나 요소의 맨 끝에 새 값을 추가하는 기능입니다.', stmt: (m) => `${m[1]} 목록의 맨 끝에 ${josa(m[2], '을/를')} 추가하는 명령어입니다.`, why: '목록에 새 항목을 하나씩 쌓아 가기 위해 사용되었습니다.' },
];

function matchKnown(expr: string): { entry: KnownEntry; m: RegExpMatchArray } | null {
  const e = stripSemi(expr);
  for (const entry of KNOWN) {
    const m = e.match(entry.re);
    if (m) return { entry, m };
  }
  return null;
}

// 값으로 쓰이는 속성(점으로 꺼내는 것)
function explainProperty(v: string): string | null {
  let m: RegExpMatchArray | null;
  if ((m = v.match(/^([\w$.]+)\.length$/))) return `${m[1]}의 길이(글자 수 또는 항목 개수)`;
  if (/^(e|event|evt)\.target\.value$/.test(v)) return '이벤트가 일어난 입력칸에 지금 적혀 있는 값';
  if (/^(e|event|evt)\.target\.checked$/.test(v)) return '이벤트가 일어난 체크박스가 체크되어 있는지 여부(참/거짓)';
  if (/^(e|event|evt)\.target$/.test(v)) return '이벤트가 일어난 바로 그 요소';
  if (/^(e|event|evt)\.key$/.test(v)) return '사용자가 누른 키보드 키의 이름';
  if (/^(window\.)?location\.href$/.test(v)) return '지금 열려 있는 페이지의 전체 주소';
  if ((m = v.match(/^process\.env\.(\w+)$/))) return `서버의 환경 설정(비밀값 등)에 저장된 ${m[1]} 값`;
  if ((m = v.match(/^typeof\s+([\w$.]+)$/))) return `${m[1]}의 자료형 이름(예: 'number', 'string')`;
  if ((m = v.match(/^([\w$.]+)\.(value)$/))) return `${m[1]} 입력칸에 지금 적혀 있는 값`;
  if ((m = v.match(/^([\w$.]+)\.(textContent|innerText)$/))) return `${m[1]} 요소 안에 보이는 글자`;
  return null;
}

// 키워드로 시작하는 한 줄 (break, continue, switch, case, throw ...)
function describeKeyword(t: string, stack: string[] = []): BeginnerDescription | null {
  let m: RegExpMatchArray | null;
  const nearest = (re: RegExp) => [...stack].reverse().find((l) => re.test(l.trim()));

  if (/^break;?$/.test(t)) {
    const loop = nearest(/^(for|while|do)\b|^switch\b|\.forEach\(/);
    const inSwitch = loop ? /^switch\b/.test(loop.trim()) : false;
    return {
      role: inSwitch ? 'switch 빠져나오기 (break)' : '반복 끝내기 (break)',
      definition: 'break는 반복문(for, while)이나 switch 문을 그 자리에서 즉시 끝내고 빠져나오는 명령어입니다.',
      easy: inSwitch
        ? '여기서 switch 문을 끝내고 빠져나옵니다. 그래서 아래에 있는 다른 case의 명령은 실행되지 않습니다.'
        : loop
        ? `반복 중이던 묶음(${loop.trim().replace(/\s*\{$/, '')})을 여기서 바로 종료하고, 반복 묶음 다음에 있는 코드로 넘어갑니다.`
        : '반복을 여기서 바로 종료하고, 반복 묶음 다음에 있는 코드로 넘어갑니다.',
      why: inSwitch
        ? '일치하는 case의 명령만 실행하고, 아래 case까지 이어서 실행되는 것을 막기 위해 사용되었습니다.'
        : '원하는 값을 찾았거나 더 이상 반복할 필요가 없을 때, 남은 반복을 건너뛰고 바로 끝내기 위해 사용되었습니다.',
    };
  }
  if (/^continue;?$/.test(t)) {
    return {
      role: '이번 차례 건너뛰기 (continue)',
      definition: 'continue는 반복문에서 이번 차례의 남은 명령을 건너뛰고, 곧바로 다음 차례 반복으로 넘어가는 명령어입니다.',
      easy: '이 줄 아래에 남은 명령은 이번 차례에만 실행하지 않고, 반복의 다음 차례로 바로 넘어갑니다. 반복 자체가 끝나지는 않습니다.',
      why: '조건에 맞지 않는 항목은 처리하지 않고 넘어가기 위해 사용되었습니다.',
    };
  }
  if (/^pass$/.test(t)) {
    return {
      role: '아무것도 안 하기 (pass)',
      definition: 'pass는 파이썬에서 아무 일도 하지 않고 그냥 지나가는 명령어입니다.',
      easy: '문법상 이 자리에 명령이 꼭 있어야 하지만 아직 할 일이 없어서, 빈자리를 채워 둔 줄입니다.',
      why: '나중에 채울 부분의 자리를 미리 잡아 두기 위해 사용되었습니다.',
    };
  }
  if ((m = t.match(/^switch\s*\((.+)\)\s*\{?$/))) {
    return {
      role: `${m[1]} 값에 따라 나누기 (switch)`,
      definition: 'switch는 하나의 값을 여러 경우(case)와 차례로 비교해서, 일치하는 경우의 명령만 실행하는 조건문입니다.',
      easy: `${m[1]} 값이 무엇인지에 따라, 아래 case 중 값이 같은 곳으로 가서 그 명령을 실행합니다.`,
      why: 'if ~ else if를 여러 번 쓰는 대신, 한 값의 여러 경우를 보기 좋게 정리하기 위해 사용되었습니다.',
    };
  }
  if ((m = t.match(/^case\s+(.+?)\s*:$/))) {
    const sw = nearest(/^switch\b/);
    const subject = sw?.match(/^switch\s*\((.+)\)/)?.[1] || '검사하는 값';
    return {
      role: `경우: ${m[1]}`,
      definition: 'case는 switch 문 안에서 "값이 이것일 때"라는 하나의 경우를 나타냅니다.',
      easy: `${josa(subject, '이/가')} ${josa(m[1], '과/와')} 같으면 이 줄 아래의 명령부터 실행합니다.`,
      why: `${subject} 값이 ${m[1]}일 때 해야 할 일을 따로 정해 두기 위해 사용되었습니다.`,
    };
  }
  if (/^default\s*:$/.test(t)) {
    return {
      role: '나머지 경우 (default)',
      definition: 'default는 switch 문에서 위의 case가 하나도 맞지 않을 때 실행할 부분입니다.',
      easy: '위에 적은 어떤 경우에도 해당하지 않으면 이 줄 아래의 명령을 실행합니다.',
      why: '예상하지 못한 값이 들어와도 빠짐없이 처리하기 위해 사용되었습니다.',
    };
  }
  if ((m = t.match(/^throw\s+(?:new\s+)?(\w*Error)?\(?\s*([\s\S]*?)\)?;?$/))) {
    const msg = uq(m[2] || '');
    return {
      role: '오류 일으키기 (throw)',
      definition: 'throw는 오류를 일부러 발생시켜서 실행을 멈추고, 가까운 catch 부분으로 넘기는 명령어입니다.',
      easy: msg ? `${josa(`'${msg}'`, '이라는/라는')} 내용의 오류를 발생시켜, 이 아래 코드는 실행하지 않고 오류 처리 부분으로 넘어갑니다.` : '오류를 발생시켜 이 아래 코드는 실행하지 않고 오류 처리 부분으로 넘어갑니다.',
      why: '잘못된 값이 들어온 상황을 그냥 넘어가지 않고, 문제가 있다는 것을 확실히 알리기 위해 사용되었습니다.',
    };
  }
  if (/^do\s*\{?$/.test(t)) {
    return {
      role: '먼저 실행하고 반복 (do)',
      definition: 'do ... while은 아래 { } 안의 명령을 일단 한 번 실행한 뒤, while의 조건이 맞는 동안 계속 반복하는 반복문입니다.',
      easy: '아래 { } 안의 명령을 조건 검사 없이 먼저 한 번 실행합니다. 반복할지는 맨 끝의 while 조건으로 정합니다.',
      why: '최소한 한 번은 꼭 실행해야 하는 작업을 반복하기 위해 사용되었습니다.',
    };
  }
  if (/^['"]use strict['"];?$/.test(t)) {
    return {
      role: '엄격 모드 선언',
      definition: "'use strict'는 자바스크립트를 더 엄격한 규칙으로 실행하라고 알려주는 선언입니다.",
      easy: '실수하기 쉬운 코드(선언하지 않은 변수 사용 등)를 오류로 바로 알려주도록 엄격 모드를 켭니다.',
      why: '눈에 잘 띄지 않는 실수를 미리 잡아내기 위해 사용되었습니다.',
    };
  }
  if (/^debugger;?$/.test(t)) {
    return {
      role: '디버깅 멈춤점',
      definition: 'debugger는 개발자 도구가 열려 있을 때 그 줄에서 실행을 잠깐 멈추는 명령어입니다.',
      easy: '개발자 도구(F12)가 열려 있으면 여기서 실행이 멈춰서, 그 순간의 변수 값을 하나씩 살펴볼 수 있습니다.',
      why: '코드가 어디서 잘못되는지 찾기 위해 임시로 넣어 둔 것입니다. 완성된 코드에서는 지워야 합니다.',
    };
  }
  if ((m = t.match(/^export\s+default\s+([\w$]+);?$/))) {
    return {
      role: `${m[1]} 내보내기`,
      definition: 'export default는 이 파일의 대표 기능 하나를 다른 파일에서 가져다 쓸 수 있게 내보내는 명령어입니다.',
      easy: `이 파일의 대표로 ${josa(m[1], '을/를')} 내보내서, 다른 파일에서 import로 가져다 쓸 수 있게 합니다.`,
      why: `여기서 만든 ${josa(m[1], '을/를')} 다른 화면이나 파일에서도 사용하기 위해 사용되었습니다.`,
    };
  }
  if ((m = t.match(/^module\.exports\s*=\s*([\s\S]+?);?$/))) {
    return {
      role: '내보내기 (module.exports)',
      definition: 'module.exports는 Node.js에서 이 파일의 기능을 다른 파일이 require로 가져다 쓸 수 있게 내보내는 방법입니다.',
      easy: `${josa(m[1], '을/를')} 이 파일의 결과물로 내보냅니다.`,
      why: '여기서 만든 기능을 다른 파일에서도 재사용하기 위해 사용되었습니다.',
    };
  }
  if ((m = t.match(/^delete\s+([\w$.[\]'"]+);?$/))) {
    return {
      role: '항목 지우기 (delete)',
      definition: 'delete는 묶음(객체) 안의 항목 하나를 지우는 명령어입니다.',
      easy: `${m[1].replace(/\.[^.]+$/, '')} 묶음에서 ${m[1].split('.').pop()} 항목을 지웁니다.`,
      why: '더 이상 필요 없는 정보를 묶음에서 없애기 위해 사용되었습니다.',
    };
  }
  if ((m = t.match(/^(window\.)?location\.href\s*=\s*([\s\S]+?);?$/))) {
    return {
      role: '페이지 이동',
      definition: 'location.href에 주소를 넣으면 브라우저가 그 주소의 페이지로 이동합니다.',
      easy: `지금 창을 ${josa(explainValue(m[2]), '으로/로')} 이동시키는 명령어입니다.`,
      why: '사용자를 다른 페이지로 보내기 위해 사용되었습니다.',
    };
  }
  if ((m = t.match(/^document\.title\s*=\s*([\s\S]+?);?$/))) {
    return {
      role: '탭 제목 바꾸기',
      definition: 'document.title은 브라우저 탭에 보이는 페이지 제목입니다.',
      easy: `브라우저 탭에 보이는 제목을 ${josa(explainValue(m[1]), '으로/로')} 바꾸는 명령어입니다.`,
      why: '지금 보고 있는 화면에 맞게 탭 제목을 알려주기 위해 사용되었습니다.',
    };
  }
  if ((m = t.match(/^([\w$.]+)\.style\.([a-zA-Z]+)\s*=\s*([\s\S]+?);?$/))) {
    const kebab = m[2].replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
    const label = CSS_PROPS[kebab] || kebab;
    return {
      role: `${label} 디자인 바꾸기`,
      definition: '요소.style.속성 = 값 은 자바스크립트로 그 요소의 디자인(CSS)을 직접 바꾸는 방법입니다.',
      easy: `${m[1]} 요소의 ${label}(${kebab})${josa(label, '을/를').slice(label.length)} ${josa(uq(m[3]), '으로/로')} 바꾸는 명령어입니다.`,
      why: '사용자 행동에 따라 화면의 모양(색, 크기, 보이기/숨기기)을 바로 바꾸기 위해 사용되었습니다.',
    };
  }
  return null;
}

// 키워드/함수 이름별 "일반 정의" (설명 맨 앞에 붙임)
function definitionFor(t: string): string | undefined {
  if (/^import\b/.test(t) || /^from\s+\S+\s+import\b/.test(t)) return 'import는 다른 파일이나 라이브러리에 있는 기능을 이 파일로 가져오는 명령어입니다.';
  if (/^(export\s+)?(default\s+)?(async\s+)?function\b/.test(t) || /^def\s/.test(t)) return '함수는 여러 명령을 하나로 묶어 이름을 붙여 둔 기능입니다. 이름을 불러야(호출해야) 안의 명령이 실행됩니다.';
  if (/=\s*(async\s*)?(\([^)]*\)|[\w$]+)\s*=>/.test(t) && /^(export\s+)?(const|let|var)\s/.test(t)) return '화살표 함수(=>)는 함수를 짧게 쓰는 방법입니다. 이름을 불러야(호출해야) 안의 명령이 실행됩니다.';
  if (/useState(<[^>]*>)?\(/.test(t)) return 'useState는 화면에 보여줄 값을 기억해 두고, 그 값이 바뀌면 화면을 자동으로 다시 그려 주는 리액트 기능입니다.';
  if (/^(const|let|var)\s/.test(t)) {
    const kw = t.split(/\s/)[0];
    return kw === 'const'
      ? 'const는 한 번 넣은 값을 다시 바꿀 수 없는 변수(이름표를 붙인 상자)를 만드는 명령어입니다.'
      : kw === 'let'
      ? 'let은 나중에 다른 값으로 바꿀 수 있는 변수(이름표를 붙인 상자)를 만드는 명령어입니다.'
      : 'var는 변수를 만드는 옛날 방식의 명령어입니다. 요즘은 const나 let을 씁니다.';
  }
  if (/^if\b/.test(t)) return 'if는 괄호 안의 조건이 맞을 때만 아래 명령을 실행하는 조건문입니다.';
  if (/^(\}\s*)?else\s+if\b|^elif\b/.test(t)) return 'else if는 앞의 조건이 맞지 않았을 때 다른 조건을 한 번 더 검사하는 조건문입니다.';
  if (/^(\}\s*)?else\b/.test(t)) return 'else는 앞의 조건들이 모두 맞지 않을 때 실행할 부분입니다.';
  if (/^for\b/.test(t)) return 'for는 같은 명령을 정해진 횟수나 목록의 개수만큼 반복하는 반복문입니다.';
  if (/^while\b/.test(t)) return 'while은 괄호 안의 조건이 맞는 동안 명령을 계속 반복하는 반복문입니다.';
  if (/^return\b/.test(t)) return 'return은 함수의 결과값을 돌려주면서 함수를 그 자리에서 끝내는 명령어입니다.';
  if (/^try\b/.test(t)) return 'try는 오류가 날 수 있는 명령을 시도해 보고, 오류가 나면 catch로 넘겨 처리하게 하는 문법입니다.';
  if (/^(\}\s*)?catch\b|^except\b/.test(t)) return 'catch는 try 부분에서 오류가 났을 때 그 오류를 받아 처리하는 부분입니다.';
  if (/^(export\s+)?(default\s+)?class\b/.test(t)) return 'class는 같은 구조의 물건(객체)을 여러 개 만들 수 있는 설계도를 정의하는 명령어입니다.';
  if (/^console\./.test(t)) return 'console.log는 괄호 안의 값을 개발자 도구(F12)의 콘솔 창에 출력하는 명령어입니다.';
  if (/^alert\(/.test(t)) return 'alert는 화면에 확인 버튼이 있는 알림 창을 띄우는 명령어입니다.';
  if (/^print\(/.test(t)) return 'print는 괄호 안의 값을 화면(터미널)에 글자로 출력하는 명령어입니다.';
  if (/^fetch\(|=\s*(await\s+)?fetch\(/.test(t)) return 'fetch는 인터넷 주소(서버)에 데이터를 요청하고 응답을 받아오는 기능입니다.';
  if (/^\.then\(/.test(t)) return '.then은 앞의 오래 걸리는 작업(서버 요청 등)이 끝난 뒤에 이어서 할 일을 정하는 기능입니다.';
  if (/^\.catch\(/.test(t)) return '.catch는 앞의 작업에서 오류가 났을 때 할 일을 정하는 기능입니다.';
  if (/^use(Layout)?Effect\(/.test(t)) return 'useEffect는 화면이 나타나거나 특정 값이 바뀔 때 자동으로 실행할 일을 등록하는 리액트 기능입니다.';
  if (/setTimeout\(/.test(t)) return 'setTimeout은 정해진 시간(밀리초)이 지난 뒤에 명령을 한 번 실행하도록 예약하는 기능입니다. 1000밀리초 = 1초입니다.';
  if (/setInterval\(/.test(t)) return 'setInterval은 정해진 시간(밀리초)마다 명령을 계속 반복 실행하도록 예약하는 기능입니다.';
  if (/^clear(Timeout|Interval)\(/.test(t)) return 'clearTimeout / clearInterval은 setTimeout·setInterval로 예약해 둔 작업을 취소하는 기능입니다.';
  if (/\.addEventListener\(/.test(t)) return 'addEventListener는 요소에 클릭·입력 같은 일(이벤트)이 생겼을 때 실행할 함수를 연결하는 기능입니다.';
  if (/\.preventDefault\(\)/.test(t)) return 'preventDefault는 브라우저가 원래 하려던 기본 동작(새로고침, 링크 이동 등)을 막는 기능입니다.';
  if (/document\.(getElementById|querySelector)/.test(t)) return 'document.querySelector / getElementById는 화면(HTML)에서 원하는 요소를 찾아오는 기능입니다.';
  if (/^set[A-Z]\w*\(/.test(t)) return 'set으로 시작하는 이 기능은 useState로 만든 값을 새 값으로 바꾸는 리액트 기능입니다. 값이 바뀌면 화면이 다시 그려집니다.';
  if (/\.map\(/.test(t)) return 'map은 목록(배열)의 값을 하나씩 꺼내 규칙대로 바꾼 새 목록을 만드는 기능입니다.';
  if (/\.filter\(/.test(t)) return 'filter는 목록(배열)에서 조건에 맞는 값만 골라 새 목록을 만드는 기능입니다.';
  if (/\.forEach\(/.test(t)) return 'forEach는 목록(배열)의 값을 하나씩 꺼내 같은 명령을 실행하는 기능입니다.';
  if (/\.push\(/.test(t)) return 'push는 목록(배열)의 맨 끝에 새 값을 추가하는 기능입니다.';
  if (/^(\/\/|#|\/\*|\*)/.test(t)) return '주석은 컴퓨터가 실행하지 않고 무시하는, 사람을 위한 설명 메모입니다.';
  if (/^[\]})]/.test(t)) return '닫는 괄호( }, ), ] )는 앞에서 여는 괄호로 시작한 묶음이 여기서 끝났다는 것을 알려주는 기호입니다.';
  if (/\+\+|--/.test(t)) return '++는 숫자를 1 늘리고, --는 숫자를 1 줄이는 기호입니다.';
  if (/[+\-*/]=/.test(t)) return '+=, -= 같은 기호는 기존 값에 계산을 한 뒤 그 결과를 다시 같은 변수에 넣는 기호입니다.';
  if (/^[.#a-zA-Z*:\[][^=(){};]*\{$/.test(t)) return 'CSS 선택자는 "어떤 요소를 꾸밀지" 고르는 부분이고, { } 안에 꾸밈 규칙을 적습니다.';
  const css = t.match(/^([a-z-]+)\s*:/);
  if (css && CSS_PROPS[css[1]]) return `${css[1]}은 CSS에서 요소의 ${josa(CSS_PROPS[css[1]], '을/를')} 정하는 속성입니다.`;
  return undefined;
}

// HTML 태그별 일반 정의
export const TAG_DEFINITIONS: Record<string, string> = {
  '!doctype': '<!DOCTYPE html>은 이 문서가 최신 HTML5 규칙으로 만든 웹페이지라고 브라우저에 알려주는 선언입니다.',
  html: '<html>은 웹페이지 전체를 감싸는 가장 바깥 태그입니다.',
  head: '<head>는 화면에 보이지 않는 페이지 정보(제목, 글자 설정, 디자인 파일 연결 등)를 담는 태그입니다.',
  body: '<body>는 화면에 실제로 보이는 모든 내용을 담는 태그입니다.',
  meta: '<meta>는 글자 방식, 화면 크기 같은 페이지의 설정 정보를 브라우저에 알려주는 태그입니다.',
  title: '<title>은 브라우저 탭에 표시되는 페이지 제목을 정하는 태그입니다.',
  link: '<link>는 CSS 디자인 파일이나 아이콘 같은 외부 파일을 페이지에 연결하는 태그입니다.',
  script: '<script>는 자바스크립트 코드를 넣거나 불러와서 실행하는 태그입니다.',
  style: '<style>은 이 페이지 안에 CSS 디자인 규칙을 직접 적는 태그입니다.',
  h1: '<h1>은 웹페이지에 가장 큰 제목을 표시하는 코드입니다.',
  h2: '<h2>는 웹페이지에 두 번째로 큰 제목(소제목)을 표시하는 코드입니다.',
  h3: '<h3>은 웹페이지에 세 번째 크기의 작은 제목을 표시하는 코드입니다.',
  h4: '<h4>는 웹페이지에 네 번째 크기의 작은 제목을 표시하는 코드입니다.',
  h5: '<h5>는 웹페이지에 다섯 번째 크기의 작은 제목을 표시하는 코드입니다.',
  h6: '<h6>은 웹페이지에 가장 작은 제목을 표시하는 코드입니다.',
  p: '<p>는 웹페이지에 한 덩어리의 문장(문단)을 표시하는 코드입니다.',
  span: '<span>은 글자의 일부분만 따로 꾸미기 위해 감싸는 작은 상자 태그입니다.',
  div: '<div>는 여러 요소를 하나로 묶는 보이지 않는 상자 태그입니다.',
  section: '<section>은 페이지의 내용을 주제별로 나누는 구역 태그입니다.',
  main: '<main>은 페이지에서 가장 중요한 본문 내용을 담는 태그입니다.',
  article: '<article>은 하나의 글(게시글, 기사)을 통째로 담는 태그입니다.',
  aside: '<aside>는 본문 옆에 붙는 보조 내용(광고, 관련 글 등)을 담는 태그입니다.',
  header: '<header>는 페이지나 구역의 맨 위 머리 부분(로고, 메뉴 등)을 담는 태그입니다.',
  footer: '<footer>는 페이지나 구역의 맨 아래 꼬리 부분(저작권, 연락처 등)을 담는 태그입니다.',
  nav: '<nav>는 다른 페이지로 이동하는 메뉴 링크들을 담는 태그입니다.',
  a: '<a>는 누르면 다른 페이지나 주소로 이동하는 링크를 만드는 태그입니다.',
  img: '<img>는 웹페이지에 그림(이미지)을 표시하는 태그입니다.',
  button: '<button>은 사용자가 누를 수 있는 버튼을 만드는 태그입니다.',
  input: '<input>은 사용자가 글자를 입력하거나 값을 고를 수 있는 입력칸을 만드는 태그입니다.',
  textarea: '<textarea>는 여러 줄의 긴 글을 입력할 수 있는 큰 입력칸을 만드는 태그입니다.',
  label: '<label>은 입력칸 옆에 "무엇을 입력하는 칸인지" 알려주는 이름표 글자를 만드는 태그입니다.',
  form: '<form>은 입력칸과 버튼을 하나로 묶어 입력한 내용을 서버로 보내는 신청서(양식)를 만드는 태그입니다.',
  select: '<select>는 여러 항목 중 하나를 고르는 펼침 목록(드롭다운)을 만드는 태그입니다.',
  option: '<option>은 펼침 목록(<select>) 안의 선택 항목 하나를 만드는 태그입니다.',
  ul: '<ul>은 앞에 점(•)이 찍히는 순서 없는 목록을 만드는 태그입니다.',
  ol: '<ol>은 앞에 1, 2, 3 번호가 붙는 순서 있는 목록을 만드는 태그입니다.',
  li: '<li>는 목록(<ul>, <ol>) 안의 항목 한 줄을 만드는 태그입니다.',
  table: '<table>은 가로줄과 세로줄로 된 표를 만드는 태그입니다.',
  thead: '<thead>는 표의 맨 위 제목 줄 부분을 묶는 태그입니다.',
  tbody: '<tbody>는 표의 본문 내용 줄들을 묶는 태그입니다.',
  tr: '<tr>은 표의 가로줄 한 줄을 만드는 태그입니다.',
  th: '<th>는 표의 제목 칸(굵은 글씨) 하나를 만드는 태그입니다.',
  td: '<td>는 표의 내용 칸 하나를 만드는 태그입니다.',
  strong: '<strong>은 중요한 글자를 굵은 글씨로 강조하는 태그입니다.',
  b: '<b>는 글자를 굵게 표시하는 태그입니다.',
  em: '<em>은 강조할 글자를 기울어진 글씨로 표시하는 태그입니다.',
  i: '<i>는 글자를 기울어진 글씨로 표시하는 태그입니다.',
  u: '<u>는 글자에 밑줄을 긋는 태그입니다.',
  small: '<small>은 글자를 작게 표시하는 태그입니다. 주로 안내문이나 저작권 문구에 씁니다.',
  br: '<br>은 글자를 다음 줄로 넘기는(줄바꿈) 태그입니다.',
  hr: '<hr>은 화면에 가로로 구분선을 긋는 태그입니다.',
  code: '<code>는 글자를 코드처럼 고정폭 글씨로 보여주는 태그입니다.',
  pre: '<pre>는 띄어쓰기와 줄바꿈을 적은 그대로 보여주는 태그입니다.',
  blockquote: '<blockquote>는 다른 곳에서 가져온 긴 인용문을 표시하는 태그입니다.',
  iframe: '<iframe>은 웹페이지 안에 다른 웹페이지(유튜브, 지도 등)를 창처럼 끼워 넣는 태그입니다.',
  video: '<video>는 웹페이지에 동영상을 넣는 태그입니다.',
  audio: '<audio>는 웹페이지에 소리(음악)를 넣는 태그입니다.',
  source: '<source>는 동영상이나 소리 파일의 위치를 알려주는 태그입니다.',
  canvas: '<canvas>는 자바스크립트로 그림을 그릴 수 있는 도화지 영역을 만드는 태그입니다.',
  svg: '<svg>는 확대해도 깨지지 않는 그림(아이콘, 도형)을 코드로 그리는 태그입니다.',
  figure: '<figure>는 그림과 그 설명을 한 묶음으로 담는 태그입니다.',
  figcaption: '<figcaption>은 <figure> 안의 그림에 붙는 설명 글자를 만드는 태그입니다.',
  details: '<details>는 눌러서 펼치고 접을 수 있는 내용 상자를 만드는 태그입니다.',
  summary: '<summary>는 <details> 상자의 항상 보이는 제목 부분을 만드는 태그입니다.',
  dialog: '<dialog>는 화면 위에 뜨는 대화 상자(팝업 창)를 만드는 태그입니다.',
  progress: '<progress>는 진행 정도를 보여주는 막대(진행 바)를 만드는 태그입니다.',
  fieldset: '<fieldset>은 양식 안의 관련된 입력칸들을 테두리로 묶는 태그입니다.',
  legend: '<legend>는 <fieldset> 묶음의 제목을 붙이는 태그입니다.',
  noscript: '<noscript>는 자바스크립트가 꺼져 있을 때만 보여줄 내용을 담는 태그입니다.',
};

// 정의 사전에는 있지만 상세 문장 생성기가 없는 태그를 위한 기본 해설
export function describeHtmlByDefinition(trimmed: string, tagName: string): { easy: string; why: string } | null {
  const isComponent = /^<[A-Z]/.test(trimmed);
  if (isComponent) {
    const name = trimmed.match(/^<([A-Z][\w.]*)/)?.[1] || tagName;
    const props = [...trimmed.matchAll(/\s([a-zA-Z]+)=\{?["']?([^"'}\s>]+)/g)].map((m) => `${m[1]}=${m[2]}`);
    return {
      easy: `${josa(name, '이라는/라는')}, 직접 만든 화면 부품(컴포넌트)을 이 자리에 넣는 코드입니다.${props.length ? ` 부품에 ${props.join(', ')} 값을 전달합니다.` : ''}`,
      why: `${name} 부품에 미리 만들어 둔 화면 조각을 여기서 다시 사용하기 위해 사용되었습니다.`,
    };
  }
  const def = TAG_DEFINITIONS[tagName];
  if (!def) return null;
  const text = trimmed.match(/^<[^>]+>([^<]+)</)?.[1]?.trim();
  if (text) {
    return {
      easy: `${josa(`'${text}'`, '이라는/라는')} 글자에 <${tagName}> 태그를 적용해서, 위 정의에 적힌 모양으로 화면에 표시합니다.`,
      why: `${josa(`'${text}'`, '을/를')} 다른 글자와 구분되는 알맞은 모양으로 보여주기 위해 사용되었습니다.`,
    };
  }
  const ACTIONS: Record<string, { easy: string; why: string }> = {
    br: { easy: '이 자리에서 줄을 바꿔서, 뒤에 오는 글자가 다음 줄부터 시작되게 합니다.', why: '문장을 원하는 위치에서 줄바꿈하기 위해 사용되었습니다.' },
    hr: { easy: '이 자리에 가로 구분선을 그어서 위 내용과 아래 내용을 나눕니다.', why: '서로 다른 주제의 내용을 눈으로 구분하기 쉽게 하기 위해 사용되었습니다.' },
    table: { easy: '여기서부터 표가 시작됩니다. 아래에 오는 <tr>(가로줄)과 <td>(칸)들이 이 표의 줄과 칸이 됩니다.', why: '여러 정보를 가로·세로 칸에 맞춰 한눈에 비교할 수 있게 정리하기 위해 사용되었습니다.' },
    tr: { easy: '표 안에 가로줄 하나를 새로 시작합니다. 아래의 <td> 칸들이 이 줄에 나란히 들어갑니다.', why: '표에 새 줄(한 건의 데이터)을 추가하기 위해 사용되었습니다.' },
    ul: { easy: '여기서부터 점(•)이 붙는 목록이 시작되고, 아래의 <li> 줄들이 목록 항목이 됩니다.', why: '여러 항목을 순서 없이 가지런히 나열하기 위해 사용되었습니다.' },
    ol: { easy: '여기서부터 번호가 붙는 목록이 시작되고, 아래의 <li> 줄들이 1, 2, 3 순서로 표시됩니다.', why: '순서가 중요한 항목(단계, 순위)을 번호와 함께 나열하기 위해 사용되었습니다.' },
    select: { easy: '여기서부터 펼침 목록(드롭다운)이 시작되고, 아래의 <option> 줄들이 고를 수 있는 항목이 됩니다.', why: '정해진 보기 중 하나를 사용자가 고르게 하기 위해 사용되었습니다.' },
  };
  if (ACTIONS[tagName]) return ACTIONS[tagName];
  return {
    easy: `여기서부터 <${tagName}> 영역이 시작되고, 닫는 </${tagName}>가 나올 때까지의 내용이 그 안에 들어갑니다.`,
    why: '웹페이지의 화면 구조와 내용을 알맞은 모양으로 보여주기 위해 사용되었습니다.',
  };
}
