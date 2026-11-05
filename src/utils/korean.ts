// 한글 받침에 맞춰 조사 고르기
//  - 끝에 붙은 괄호 설명은 빼고 그 앞 단어로 판단: 묶음(객체) → 묶음
//  - 영어는 우리말 발음 기준: name(네임)·item(아이템)·click(클릭)·table(테이블)은 받침 O,
//    numbers(넘버스)·result(리절트)·dark(다크)·data(데이터)는 받침 X
export type JosaPair = '을/를' | '이/가' | '으로/로' | '은/는' | '과/와' | '이라는/라는' | '이라고/라고';

export function josa(word: string, pair: JosaPair): string {
  let chars = word.trim();
  for (let i = 0; i < 3 && /\)$/.test(chars) && /\S\(/.test(chars); i++) {
    chars = chars.replace(/\s*\((?:[^()]|\([^()]*\))*\)$/, '');
  }
  chars = chars.replace(/['"`\s.,!?…)\]}>]+$/g, '');
  const last = chars.charCodeAt(chars.length - 1);
  let hasBatchim = false;
  let isRieul = false;
  if (last >= 0xac00 && last <= 0xd7a3) {
    const jong = (last - 0xac00) % 28;
    hasBatchim = jong !== 0;
    isRieul = jong === 8;
  } else if (/[0-9]$/.test(chars)) {
    hasBatchim = /[013678]$/.test(chars);
    isRieul = /[178]$/.test(chars);
  } else if (/[a-zA-Z]$/.test(chars)) {
    const w = chars.toLowerCase();
    if (/(ng|m|n|ck|p|b)$/.test(w) || /(me|ne)$/.test(w)) hasBatchim = true;
    // -l, -le 로 끝나면 ㄹ 받침: console(콘솔) · table(테이블) · file(파일) · style(스타일)
    if (/l$/.test(w) || /le$/.test(w)) {
      hasBatchim = true;
      isRieul = true;
    }
  }
  const [withB, withoutB] = pair.split('/');
  if (pair === '으로/로') return word + (hasBatchim && !isRieul ? withB : withoutB);
  return word + (hasBatchim ? withB : withoutB);
}
