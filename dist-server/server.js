// server.ts
import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

// src/utils/korean.ts
function josa(word, pair) {
  let chars = word.trim();
  for (let i = 0; i < 3 && /\)$/.test(chars) && /\S\(/.test(chars); i++) {
    chars = chars.replace(/\s*\((?:[^()]|\([^()]*\))*\)$/, "");
  }
  chars = chars.replace(/['"`\s.,!?…)\]}>]+$/g, "");
  const last = chars.charCodeAt(chars.length - 1);
  let hasBatchim = false;
  let isRieul = false;
  if (last >= 44032 && last <= 55203) {
    const jong = (last - 44032) % 28;
    hasBatchim = jong !== 0;
    isRieul = jong === 8;
  } else if (/[0-9]$/.test(chars)) {
    hasBatchim = /[013678]$/.test(chars);
    isRieul = /[178]$/.test(chars);
  } else if (/[a-zA-Z]$/.test(chars)) {
    const w = chars.toLowerCase();
    if (/(ng|m|n|ck|p|b)$/.test(w) || /(me|ne)$/.test(w)) hasBatchim = true;
    if (/l$/.test(w) || /le$/.test(w)) {
      hasBatchim = true;
      isRieul = true;
    }
  }
  const [withB, withoutB] = pair.split("/");
  if (pair === "\uC73C\uB85C/\uB85C") return word + (hasBatchim && !isRieul ? withB : withoutB);
  return word + (hasBatchim ? withB : withoutB);
}

// src/utils/cssDescriber.ts
var CSS_PROPS = {
  color: "\uAE00\uC790 \uC0C9",
  background: "\uBC30\uACBD",
  "background-color": "\uBC30\uACBD\uC0C9",
  "background-image": "\uBC30\uACBD \uADF8\uB9BC",
  "background-size": "\uBC30\uACBD \uADF8\uB9BC \uD06C\uAE30",
  "background-position": "\uBC30\uACBD \uADF8\uB9BC \uC704\uCE58",
  "background-repeat": "\uBC30\uACBD \uADF8\uB9BC \uBC18\uBCF5 \uC5EC\uBD80",
  "font-size": "\uAE00\uC790 \uD06C\uAE30",
  "font-weight": "\uAE00\uC790 \uAD75\uAE30",
  "font-family": "\uAE00\uAF34",
  "font-style": "\uAE00\uC790 \uAE30\uC6B8\uAE30",
  "text-decoration": "\uAE00\uC790 \uAFB8\uBC08\uC120",
  "text-align": "\uAE00\uC790 \uC815\uB82C",
  "line-height": "\uC904 \uAC04\uACA9",
  "letter-spacing": "\uAE00\uC790 \uC0AC\uC774 \uAC04\uACA9",
  "white-space": "\uACF5\uBC31\xB7\uC904\uBC14\uAFC8 \uCC98\uB9AC \uBC29\uC2DD",
  margin: "\uBC14\uAE65 \uC5EC\uBC31",
  "margin-top": "\uC704\uCABD \uBC14\uAE65 \uC5EC\uBC31",
  "margin-bottom": "\uC544\uB798\uCABD \uBC14\uAE65 \uC5EC\uBC31",
  "margin-left": "\uC67C\uCABD \uBC14\uAE65 \uC5EC\uBC31",
  "margin-right": "\uC624\uB978\uCABD \uBC14\uAE65 \uC5EC\uBC31",
  padding: "\uC548\uCABD \uC5EC\uBC31",
  "padding-top": "\uC704\uCABD \uC548\uCABD \uC5EC\uBC31",
  "padding-bottom": "\uC544\uB798\uCABD \uC548\uCABD \uC5EC\uBC31",
  "padding-left": "\uC67C\uCABD \uC548\uCABD \uC5EC\uBC31",
  "padding-right": "\uC624\uB978\uCABD \uC548\uCABD \uC5EC\uBC31",
  width: "\uAC00\uB85C \uD3ED",
  height: "\uC138\uB85C \uB192\uC774",
  "max-width": "\uCD5C\uB300 \uAC00\uB85C \uD3ED",
  "min-width": "\uCD5C\uC18C \uAC00\uB85C \uD3ED",
  "max-height": "\uCD5C\uB300 \uC138\uB85C \uB192\uC774",
  "min-height": "\uCD5C\uC18C \uC138\uB85C \uB192\uC774",
  border: "\uD14C\uB450\uB9AC",
  "border-top": "\uC704\uCABD \uD14C\uB450\uB9AC",
  "border-bottom": "\uC544\uB798\uCABD \uD14C\uB450\uB9AC",
  "border-left": "\uC67C\uCABD \uD14C\uB450\uB9AC",
  "border-right": "\uC624\uB978\uCABD \uD14C\uB450\uB9AC",
  "border-radius": "\uBAA8\uC11C\uB9AC \uB465\uAE00\uAE30",
  outline: "\uBC14\uAE65 \uC724\uACFD\uC120",
  display: "\uBC30\uCE58 \uBC29\uC2DD",
  "flex-direction": "\uC548\uCABD \uC694\uC18C\uB97C \uB298\uC5B4\uB193\uB294 \uBC29\uD5A5",
  "flex-wrap": "\uC548\uCABD \uC694\uC18C \uC904\uBC14\uAFC8 \uC5EC\uBD80",
  flex: "\uB0A8\uB294 \uACF5\uAC04\uC744 \uB098\uB220 \uAC16\uB294 \uBE44\uC728",
  "justify-content": "\uC548\uCABD \uC694\uC18C\uC758 \uAC00\uB85C \uC815\uB82C",
  "align-items": "\uC548\uCABD \uC694\uC18C\uC758 \uC138\uB85C \uC815\uB82C",
  gap: "\uC548\uCABD \uC694\uC18C \uC0AC\uC774 \uAC04\uACA9",
  "grid-template-columns": "\uADF8\uB9AC\uB4DC \uC138\uB85C \uCE78 \uB098\uB204\uAE30",
  position: "\uC704\uCE58\uB97C \uC815\uD558\uB294 \uBC29\uC2DD",
  top: "\uC704\uCABD \uAE30\uC900 \uC704\uCE58",
  left: "\uC67C\uCABD \uAE30\uC900 \uC704\uCE58",
  right: "\uC624\uB978\uCABD \uAE30\uC900 \uC704\uCE58",
  bottom: "\uC544\uB798\uCABD \uAE30\uC900 \uC704\uCE58",
  "z-index": "\uACB9\uCE60 \uB54C \uC55E\uB4A4 \uC21C\uC11C",
  float: "\uC606\uC73C\uB85C \uB744\uC6B0\uAE30",
  clear: "\uC606\uC73C\uB85C \uB744\uC6B0\uAE30 \uD574\uC81C",
  opacity: "\uD22C\uBA85\uB3C4",
  visibility: "\uBCF4\uC774\uAE30 \uC5EC\uBD80",
  overflow: "\uB0B4\uC6A9\uC774 \uB118\uCE60 \uB54C \uCC98\uB9AC \uBC29\uBC95",
  cursor: "\uB9C8\uC6B0\uC2A4 \uCEE4\uC11C \uBAA8\uC591",
  "box-shadow": "\uADF8\uB9BC\uC790",
  "text-shadow": "\uAE00\uC790 \uADF8\uB9BC\uC790",
  "box-sizing": "\uD06C\uAE30 \uACC4\uC0B0 \uBC29\uC2DD",
  transition: "\uBC14\uB014 \uB54C\uC758 \uBD80\uB4DC\uB7EC\uC6B4 \uC6C0\uC9C1\uC784",
  transform: "\uBAA8\uC591 \uBCC0\uD615",
  animation: "\uC560\uB2C8\uBA54\uC774\uC158",
  "list-style": "\uBAA9\uB85D \uC55E \uAE30\uD638 \uBAA8\uC591",
  "vertical-align": "\uC138\uB85C \uC815\uB82C",
  "object-fit": "\uADF8\uB9BC\uC744 \uCE78\uC5D0 \uB9DE\uCD94\uB294 \uBC29\uC2DD",
  content: "\uC55E\uB4A4\uC5D0 \uB07C\uC6CC \uB123\uB294 \uB0B4\uC6A9"
};
var NAMED_COLORS = {
  white: "\uD770\uC0C9",
  black: "\uAC80\uC740\uC0C9",
  red: "\uBE68\uAC04\uC0C9",
  blue: "\uD30C\uB780\uC0C9",
  green: "\uCD08\uB85D\uC0C9",
  yellow: "\uB178\uB780\uC0C9",
  orange: "\uC8FC\uD669\uC0C9",
  purple: "\uBCF4\uB77C\uC0C9",
  pink: "\uBD84\uD64D\uC0C9",
  gray: "\uD68C\uC0C9",
  grey: "\uD68C\uC0C9",
  navy: "\uB0A8\uC0C9",
  skyblue: "\uD558\uB298\uC0C9",
  brown: "\uAC08\uC0C9",
  gold: "\uAE08\uC0C9",
  silver: "\uC740\uC0C9",
  transparent: "\uD22C\uBA85"
};
var VALUE_WORDS = {
  auto: "\uC790\uB3D9",
  none: "\uC5C6\uC74C",
  block: "\uBE14\uB85D(\uD55C \uC904 \uC804\uCCB4\uB97C \uCC28\uC9C0)",
  inline: "\uC778\uB77C\uC778(\uAE00\uC790\uCC98\uB7FC \uC606\uC73C\uB85C \uC774\uC5B4\uC9D0)",
  "inline-block": "\uC778\uB77C\uC778 \uBE14\uB85D(\uC606\uC73C\uB85C \uC774\uC5B4\uC9C0\uBA74\uC11C \uD06C\uAE30\uB3C4 \uC815\uD560 \uC218 \uC788\uC74C)",
  flex: "\uD50C\uB809\uC2A4(\uC548\uCABD \uC694\uC18C\uB97C \uD55C \uC904\uB85C \uB098\uB780\uD788)",
  grid: "\uADF8\uB9AC\uB4DC(\uBC14\uB451\uD310 \uBAA8\uC591 \uBC30\uCE58)",
  center: "\uAC00\uC6B4\uB370",
  left: "\uC67C\uCABD",
  right: "\uC624\uB978\uCABD",
  justify: "\uC591\uCABD \uB9DE\uCDA4",
  bold: "\uAD75\uAC8C",
  bolder: "\uB354 \uAD75\uAC8C",
  normal: "\uBCF4\uD1B5",
  italic: "\uAE30\uC6B8\uC784",
  underline: "\uBC11\uC904",
  "line-through": "\uAC00\uC6B4\uB370 \uC904",
  solid: "\uC2E4\uC120",
  dashed: "\uB04A\uC5B4\uC9C4 \uC120",
  dotted: "\uC810\uC120",
  double: "\uB450 \uC904 \uC120",
  hidden: "\uC228\uAE40",
  visible: "\uBCF4\uC784",
  scroll: "\uC2A4\uD06C\uB864",
  absolute: "\uC808\uB300 \uC704\uCE58(\uAE30\uC900 \uC694\uC18C \uC548\uC5D0\uC11C \uC88C\uD45C\uB85C)",
  relative: "\uC0C1\uB300 \uC704\uCE58(\uC6D0\uB798 \uC790\uB9AC \uAE30\uC900)",
  fixed: "\uD654\uBA74 \uACE0\uC815(\uC2A4\uD06C\uB864\uD574\uB3C4 \uADF8 \uC790\uB9AC)",
  sticky: "\uC2A4\uD06C\uB864\uD558\uBA74 \uB2EC\uB77C\uBD99\uC74C",
  static: "\uAE30\uBCF8 \uC704\uCE58",
  pointer: "\uC190\uAC00\uB77D \uBAA8\uC591",
  "space-between": "\uC591 \uB05D\uC5D0 \uBD99\uC774\uACE0 \uC0AC\uC774\uB97C \uADE0\uB4F1\uD558\uAC8C",
  "space-around": "\uC8FC\uBCC0 \uAC04\uACA9\uC744 \uADE0\uB4F1\uD558\uAC8C",
  row: "\uAC00\uB85C \uBC29\uD5A5",
  column: "\uC138\uB85C \uBC29\uD5A5",
  wrap: "\uB118\uCE58\uBA74 \uB2E4\uC74C \uC904\uB85C",
  nowrap: "\uC904\uBC14\uAFC8 \uC548 \uD568",
  "flex-start": "\uC2DC\uC791 \uCABD",
  "flex-end": "\uB05D \uCABD",
  stretch: "\uAF49 \uCC28\uAC8C \uB298\uB9BC",
  inherit: "\uBD80\uBAA8\uC640 \uAC19\uAC8C",
  "border-box": "\uD14C\uB450\uB9AC\xB7\uC548\uCABD \uC5EC\uBC31\uAE4C\uC9C0 \uD3EC\uD568\uD55C \uD06C\uAE30",
  "content-box": "\uB0B4\uC6A9\uB9CC\uC758 \uD06C\uAE30",
  cover: "\uCE78\uC744 \uAF49 \uCC44\uC6B0\uAC8C",
  contain: "\uC798\uB9AC\uC9C0 \uC54A\uAC8C \uCE78 \uC548\uC5D0 \uB9DE\uCDA4",
  "no-repeat": "\uBC18\uBCF5 \uC548 \uD568",
  repeat: "\uBC18\uBCF5",
  both: "\uC591\uCABD",
  ease: "\uBD80\uB4DC\uB7FD\uAC8C",
  "ease-in-out": "\uCC9C\uCC9C\uD788 \uC2DC\uC791\uD574 \uCC9C\uCC9C\uD788 \uB05D\uB098\uAC8C",
  "sans-serif": "\uACE0\uB515 \uACC4\uC5F4 \uAE00\uAF34",
  serif: "\uBA85\uC870 \uACC4\uC5F4 \uAE00\uAF34",
  monospace: "\uACE0\uC815\uD3ED \uAE00\uAF34"
};
function colorName(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split("").map((c) => c + c).join("");
  if (h.length < 6) return "\uC0C9";
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return rgbName(r, g, b);
}
function rgbName(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (l > 0.95) return "\uD770\uC0C9";
  if (l < 0.08) return "\uAC80\uC740\uC0C9";
  if (s < 0.12) return l > 0.75 ? "\uBC1D\uC740 \uD68C\uC0C9" : l < 0.3 ? "\uC5B4\uB450\uC6B4 \uD68C\uC0C9" : "\uD68C\uC0C9";
  let hue = 0;
  if (d !== 0) {
    if (max === r) hue = (g - b) / d % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  const light = l > 0.7;
  const dark = l < 0.3;
  let base;
  if (hue < 15 || hue >= 345) base = light ? "\uBD84\uD64D\uC0C9" : "\uBE68\uAC04\uC0C9";
  else if (hue < 40) base = dark ? "\uAC08\uC0C9" : "\uC8FC\uD669\uC0C9";
  else if (hue < 65) base = "\uB178\uB780\uC0C9";
  else if (hue < 160) base = "\uCD08\uB85D\uC0C9";
  else if (hue < 195) base = "\uCCAD\uB85D\uC0C9";
  else if (hue < 250) base = light ? "\uD558\uB298\uC0C9" : "\uD30C\uB780\uC0C9";
  else if (hue < 290) base = dark ? "\uB0A8\uC0C9" : "\uBCF4\uB77C\uC0C9";
  else base = light ? "\uC5F0\uBD84\uD64D\uC0C9" : "\uC790\uC8FC\uC0C9";
  const prefix = light && !["\uD558\uB298\uC0C9", "\uBD84\uD64D\uC0C9", "\uC5F0\uBD84\uD64D\uC0C9"].includes(base) ? "\uC5F0\uD55C " : dark && !["\uAC08\uC0C9", "\uB0A8\uC0C9"].includes(base) ? "\uC9C4\uD55C " : light ? "\uC5F0\uD55C " : "";
  return prefix + base;
}
function cssToken(tok) {
  const t = tok.trim();
  let m;
  if (/^#[0-9a-f]{3,8}$/i.test(t)) return `${t}(${colorName(t)})`;
  if (m = t.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i)) {
    const name = rgbName(+m[1] / 255, +m[2] / 255, +m[3] / 255);
    const alpha = m[4] !== void 0 ? parseFloat(m[4]) / (m[4].endsWith("%") ? 100 : 1) : 1;
    return `${t}(${alpha < 1 ? `${Math.round((1 - alpha) * 100)}% \uD22C\uBA85\uD55C ` : ""}${name})`;
  }
  if (NAMED_COLORS[t.toLowerCase()]) return `${NAMED_COLORS[t.toLowerCase()]}(${t})`;
  if (m = t.match(/^(-?[\d.]+)px$/)) return `${m[1]}\uD53D\uC140(${t})`;
  if (m = t.match(/^(-?[\d.]+)%$/)) return `\uBD80\uBAA8 \uD06C\uAE30\uC758 ${m[1]}%`;
  if (m = t.match(/^(-?[\d.]+)rem$/)) return `\uAE30\uBCF8 \uAE00\uC790 \uD06C\uAE30\uC758 ${m[1]}\uBC30(${t})`;
  if (m = t.match(/^(-?[\d.]+)em$/)) return `\uD604\uC7AC \uAE00\uC790 \uD06C\uAE30\uC758 ${m[1]}\uBC30(${t})`;
  if (m = t.match(/^(-?[\d.]+)vh$/)) return `\uD654\uBA74 \uB192\uC774\uC758 ${m[1]}%(${t})`;
  if (m = t.match(/^(-?[\d.]+)vw$/)) return `\uD654\uBA74 \uB108\uBE44\uC758 ${m[1]}%(${t})`;
  if (m = t.match(/^(-?[\d.]+)m?s$/)) return t.endsWith("ms") ? `${m[1]}\uBC00\uB9AC\uCD08` : `${m[1]}\uCD08`;
  if (m = t.match(/^url\((.+)\)$/)) return `'${m[1].replace(/['"]/g, "")}' \uADF8\uB9BC \uD30C\uC77C`;
  if (t === "0") return "0";
  const word = VALUE_WORDS[t.toLowerCase()];
  if (word) {
    const p = word.match(/^(.+?)\((.+)\)$/);
    return p ? `${p[1]}(${t}, ${p[2]})` : `${word}(${t})`;
  }
  return t;
}
function splitValues(v) {
  return v.match(/(?:[\w-]+\([^)]*\)|"[^"]*"|'[^']*'|[^\s,]+)/g) || [v];
}
function sidesKo(vals) {
  const k = vals.map(cssToken);
  if (k.length === 1) return `\uC704\xB7\uC544\uB798\xB7\uC67C\uCABD\xB7\uC624\uB978\uCABD \uBAA8\uB450 ${k[0]}`;
  if (k.length === 2) return `\uC704\uC544\uB798 ${k[0]}, \uC67C\uCABD\xB7\uC624\uB978\uCABD ${k[1]}`;
  if (k.length === 3) return `\uC704 ${k[0]}, \uC67C\uCABD\xB7\uC624\uB978\uCABD ${k[1]}, \uC544\uB798 ${k[2]}`;
  return `\uC704 ${k[0]}, \uC624\uB978\uCABD ${k[1]}, \uC544\uB798 ${k[2]}, \uC67C\uCABD ${k[3]}`;
}
function parseDeclarations(text) {
  return text.split(";").map((p) => p.trim()).filter(Boolean).map((p) => {
    const i = p.indexOf(":");
    return i > 0 ? { prop: p.slice(0, i).trim().toLowerCase(), value: p.slice(i + 1).replace(/!important/, "").trim() } : null;
  }).filter((d) => d !== null && /^-?[a-z-]+$/.test(d.prop));
}
function explainDecl({ prop, value }) {
  const label = CSS_PROPS[prop] || `${prop} \uC18D\uC131`;
  const vals = splitValues(value);
  const head = `${label}(${prop})${josa(label, "\uC744/\uB97C").slice(label.length)}`;
  let sentence;
  if (/^(margin|padding)$/.test(prop)) {
    sentence = `${head} ${sidesKo(vals)}${josa(sidesKo(vals), "\uC73C\uB85C/\uB85C").slice(sidesKo(vals).length)} \uC815\uD569\uB2C8\uB2E4.`;
    if (prop === "margin" && (vals.length === 2 || vals.length === 3) && vals[1] === "auto") {
      sentence += " \uC67C\uCABD\xB7\uC624\uB978\uCABD \uC5EC\uBC31\uC744 \uBE0C\uB77C\uC6B0\uC800\uAC00 \uB611\uAC19\uC774 \uB098\uB220 \uC8FC\uAE30 \uB54C\uBB38\uC5D0, \uC774 \uC694\uC18C\uAC00 \uAC00\uB85C \uBC29\uD5A5 \uAC00\uC6B4\uB370\uC5D0 \uB193\uC785\uB2C8\uB2E4.";
    } else if (prop === "margin" && vals.length === 1 && vals[0] === "auto") {
      sentence += " \uB0A8\uB294 \uACF5\uAC04\uC744 \uC591\uCABD\uC5D0 \uB611\uAC19\uC774 \uB098\uB220\uC11C \uC774 \uC694\uC18C\uB97C \uAC00\uC6B4\uB370\uC5D0 \uB193\uC2B5\uB2C8\uB2E4.";
    }
  } else if (/^border(-top|-bottom|-left|-right)?$/.test(prop) && vals.length > 1) {
    const width = vals.find((v) => /^\d/.test(v));
    const style = vals.find((v) => /^(solid|dashed|dotted|double|none)$/.test(v));
    const color = vals.find((v) => v !== width && v !== style);
    sentence = `${head} ${[width && `\uB450\uAED8 ${cssToken(width)}`, style && cssToken(style), color && `\uC0C9 ${cssToken(color)}`].filter(Boolean).join(", ")}\uC778 \uC120\uC73C\uB85C \uADF8\uB9BD\uB2C8\uB2E4.`;
  } else if (prop === "background" || prop === "background-color" || prop === "color") {
    const v = vals.map(cssToken).join(" ");
    sentence = prop === "color" ? `${head} ${josa(v, "\uC73C\uB85C/\uB85C")} \uC815\uD569\uB2C8\uB2E4.` : `${label}(${prop})\uC744 ${josa(v, "\uC73C\uB85C/\uB85C")} \uCE60\uD569\uB2C8\uB2E4.`;
  } else if (prop === "font-weight" && /^\d+$/.test(value)) {
    const n = Number(value);
    sentence = `${head} ${value}(${n >= 700 ? "\uAD75\uAC8C" : n >= 500 ? "\uC57D\uAC04 \uAD75\uAC8C" : n <= 300 ? "\uC587\uAC8C" : "\uBCF4\uD1B5"})\uB85C \uC815\uD569\uB2C8\uB2E4.`;
  } else if (prop === "line-height" && /^[\d.]+$/.test(value)) {
    sentence = `${head} \uAE00\uC790 \uD06C\uAE30\uC758 ${value}\uBC30\uB85C \uC815\uD574\uC11C, \uC904\uACFC \uC904 \uC0AC\uC774\uB97C \uADF8\uB9CC\uD07C \uB744\uC6C1\uB2C8\uB2E4.`;
  } else if (prop === "opacity") {
    const pct = Math.round(parseFloat(value) * 100);
    sentence = `${head} ${value}\uB85C \uC815\uD569\uB2C8\uB2E4. (${pct}%\uB9CC \uBCF4\uC774\uACE0 ${100 - pct}%\uB294 \uD22C\uBA85\uD574\uC9D1\uB2C8\uB2E4)`;
  } else if (prop === "transition") {
    const time = vals.find((v) => /\d(m?s)$/.test(v));
    const what = vals[0] && !/\d/.test(vals[0]) ? vals[0] : "all";
    sentence = `${what === "all" ? "\uBAA8\uB4E0 \uB514\uC790\uC778 \uAC12\uC774" : `${what} \uAC12\uC774`} \uBC14\uB014 \uB54C ${time ? cssToken(time) : "\uC7A0\uAE50"} \uB3D9\uC548 \uBD80\uB4DC\uB7FD\uAC8C \uBCC0\uD558\uB3C4\uB85D \uC815\uD569\uB2C8\uB2E4.`;
  } else if (prop === "z-index") {
    sentence = `${head} ${value}\uB85C \uC815\uD569\uB2C8\uB2E4. \uC22B\uC790\uAC00 \uD074\uC218\uB85D \uB2E4\uB978 \uC694\uC18C\uBCF4\uB2E4 \uC55E(\uC704)\uC5D0 \uBCF4\uC785\uB2C8\uB2E4.`;
  } else if (prop === "box-shadow" && value !== "none") {
    sentence = `${label}(${prop})\uB97C ${value} \uAC12\uC73C\uB85C \uB123\uC5B4, \uC694\uC18C \uC544\uB798\uC5D0 \uADF8\uB9BC\uC790\uAC00 \uC0DD\uACA8 \uB5A0 \uC788\uB294 \uAC83\uCC98\uB7FC \uBCF4\uC774\uAC8C \uD569\uB2C8\uB2E4.`;
  } else if (prop === "font-family") {
    sentence = `${head} ${value} \uC21C\uC11C\uB85C \uC815\uD569\uB2C8\uB2E4. \uC55E\uC758 \uAE00\uAF34\uC774 \uC5C6\uC73C\uBA74 \uADF8\uB2E4\uC74C \uAE00\uAF34\uC744 \uC501\uB2C8\uB2E4.`;
  } else {
    const v = vals.map(cssToken).join(" ");
    sentence = `${head} ${josa(v, "\uC73C\uB85C/\uB85C")} \uC815\uD569\uB2C8\uB2E4.`;
  }
  const short = `${label}: ${vals.map(cssToken).join(" ")}`;
  return { sentence, short };
}
var CIRCLED = ["\u2460", "\u2461", "\u2462", "\u2463", "\u2464", "\u2465", "\u2466", "\u2467", "\u2468", "\u2469"];
function selectorKo(sel) {
  const s = sel.trim();
  const parts = s.split(/\s*,\s*/);
  if (parts.length > 1) return parts.map(selectorKo).join(", ");
  const words = s.split(/\s+/);
  if (words.length > 1) {
    return `${selectorKo(words.slice(0, -1).join(" "))} \uC548\uC5D0 \uB4E4\uC5B4 \uC788\uB294 ${selectorKo(words[words.length - 1])}`;
  }
  let m;
  if (m = s.match(/^#([\w-]+)$/)) return `id\uAC00 ${m[1]}\uC778 \uC694\uC18C`;
  if (m = s.match(/^\.([\w-]+)$/)) return `class\uAC00 ${m[1]}\uC778 \uC694\uC18C\uB4E4`;
  if (m = s.match(/^([a-z][\w-]*):(hover|focus|active|first-child|last-child)$/i)) {
    const st = { hover: "\uB9C8\uC6B0\uC2A4\uB97C \uC62C\uB838\uC744 \uB54C\uC758", focus: "\uC120\uD0DD(\uD3EC\uCEE4\uC2A4)\uB410\uC744 \uB54C\uC758", active: "\uB204\uB974\uACE0 \uC788\uC744 \uB54C\uC758", "first-child": "\uCCAB \uBC88\uC9F8", "last-child": "\uB9C8\uC9C0\uB9C9" };
    return `${st[m[2]]} <${m[1]}> \uC694\uC18C`;
  }
  if (s === "*") return "\uBAA8\uB4E0 \uC694\uC18C";
  if (/^[a-z][\w-]*$/i.test(s)) return `\uBAA8\uB4E0 <${s}> \uC694\uC18C`;
  return `'${s}'\uC5D0 \uD574\uB2F9\uD558\uB294 \uC694\uC18C`;
}
function selectorDefinition(sel) {
  const s = sel.trim();
  if (/\s/.test(s) && !/,/.test(s)) return 'CSS\uC5D0\uC11C \uC120\uD0DD\uC790 \uC0AC\uC774\uB97C \uB744\uC5B4 \uC4F0\uBA74 "\uC55E \uC694\uC18C \uC548\uC5D0 \uB4E4\uC5B4 \uC788\uB294 \uB4A4 \uC694\uC18C"\uB9CC \uACE0\uB974\uB294 \uC790\uC190 \uC120\uD0DD\uC790\uAC00 \uB429\uB2C8\uB2E4.';
  if (/,/.test(s)) return "CSS\uC5D0\uC11C \uC27C\uD45C(,)\uB85C \uC120\uD0DD\uC790\uB97C \uB098\uC5F4\uD558\uBA74 \uC5EC\uB7EC \uC694\uC18C\uC5D0 \uAC19\uC740 \uAFB8\uBC08 \uADDC\uCE59\uC744 \uD55C \uBC88\uC5D0 \uC801\uC6A9\uD569\uB2C8\uB2E4.";
  if (s.startsWith("#")) return 'CSS\uC5D0\uC11C #\uC73C\uB85C \uC2DC\uC791\uD558\uB294 \uC120\uD0DD\uC790\uB294 id \uC774\uB984\uC73C\uB85C \uC694\uC18C\uB97C \uACE0\uB974\uB294 "id \uC120\uD0DD\uC790"\uC785\uB2C8\uB2E4. id\uB294 \uD55C \uD398\uC774\uC9C0\uC5D0 \uD558\uB098\uBFD0\uC778 \uC774\uB984\uD45C\uC785\uB2C8\uB2E4.';
  if (s.startsWith(".")) return 'CSS\uC5D0\uC11C \uC810(.)\uC73C\uB85C \uC2DC\uC791\uD558\uB294 \uC120\uD0DD\uC790\uB294 class \uC774\uB984\uC73C\uB85C \uC694\uC18C\uB97C \uACE0\uB974\uB294 "class \uC120\uD0DD\uC790"\uC785\uB2C8\uB2E4. \uAC19\uC740 class\uB97C \uAC00\uC9C4 \uC694\uC18C \uBAA8\uB450\uC5D0 \uC801\uC6A9\uB429\uB2C8\uB2E4.';
  if (/:/.test(s)) return 'CSS\uC5D0\uC11C \uCF5C\uB860(:) \uB4A4\uC5D0 \uBD99\uB294 hover, focus \uB4F1\uC740 "\uD2B9\uC815 \uC0C1\uD0DC\uC77C \uB54C"\uB9CC \uC801\uC6A9\uD558\uB294 \uAC00\uC0C1 \uD074\uB798\uC2A4\uC785\uB2C8\uB2E4.';
  return 'CSS\uC5D0\uC11C \uD0DC\uADF8 \uC774\uB984\uB9CC \uC4F4 \uC120\uD0DD\uC790\uB294 \uD398\uC774\uC9C0\uC758 \uADF8 \uD0DC\uADF8 \uBAA8\uB450\uB97C \uACE0\uB974\uB294 "\uD0DC\uADF8 \uC120\uD0DD\uC790"\uC785\uB2C8\uB2E4.';
}
var looksLikeDecls = (text) => {
  if (/,\s*$/.test(text)) return false;
  const decls = parseDeclarations(text);
  return decls.length > 0 && decls.some((d) => CSS_PROPS[d.prop]) && /:\s*[^;]+;|:\s*[^;{}]+$/.test(text);
};
function describeCssLine(line, stack = []) {
  const t = line.trim();
  if (!t) return null;
  let selector;
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
    body = body.replace(/\}\s*$/, "").trim();
  }
  const enclosing = stack.length ? stack[stack.length - 1] : void 0;
  const enclosingIsCss = !!enclosing && /^[.#a-zA-Z*:\[][^=(){};]*\{/.test(enclosing.trim()) && !/^(if|for|while|switch|function|else|try|catch|class|do)\b/.test(enclosing.trim());
  const loneClose = !opens && closes && !body;
  if (loneClose && !enclosingIsCss) return null;
  if (!opens && !loneClose && !looksLikeDecls(body)) return null;
  if (opens && body && !looksLikeDecls(body)) return null;
  const decls = parseDeclarations(body);
  const sel = selector || (enclosingIsCss ? enclosing.trim().replace(/\s*\{[\s\S]*$/, "") : void 0);
  const target = sel ? selectorKo(sel) : "\uC774 \uC694\uC18C";
  const explained = decls.map(explainDecl);
  const tokens = decls.map((d, i) => ({ token: `${d.prop}: ${d.value}`, meaning: explained[i].sentence }));
  const parts = [];
  if (opens) parts.push(`${josa(target, "\uC744/\uB97C")} \uC5B4\uB5BB\uAC8C \uAFB8\uBC00\uC9C0 \uC815\uD558\uB294 \uADDC\uCE59 \uBB36\uC74C\uC744 \uC2DC\uC791\uD569\uB2C8\uB2E4.`);
  if (explained.length === 1) {
    parts.push(`${opens ? "\uADF8 \uC548\uC5D0\uC11C " : `${target}\uC758 `}${explained[0].sentence}`);
  } else if (explained.length > 1) {
    parts.push(`${opens ? "\uADF8 \uC548\uC5D0" : `\uC774 \uC904\uC5D0\uB294 ${target}\uC5D0 \uB300\uD55C`} \uAFB8\uBC08 \uADDC\uCE59 ${explained.length}\uAC1C\uAC00 \uC138\uBBF8\uCF5C\uB860(;)\uC73C\uB85C \uB098\uB258\uC5B4 \uD55C \uC904\uC5D0 \uC801\uD600 \uC788\uC2B5\uB2C8\uB2E4.`);
    explained.forEach((e, i) => parts.push(`${CIRCLED[i] || `(${i + 1})`} ${e.sentence}`));
  }
  if (loneClose) parts.push(`\uC774 }\uB294 \uC704\uC5D0\uC11C \uC2DC\uC791\uD55C ${sel ? `'${sel}' ` : ""}\uAFB8\uBC08 \uADDC\uCE59 \uBB36\uC74C\uC774 \uC5EC\uAE30\uC11C \uB05D\uB09C\uB2E4\uB294 \uD45C\uC2DC\uC785\uB2C8\uB2E4.`);
  else if (closes) parts.push(`\uB9C8\uC9C0\uB9C9\uC758 }\uB294 ${sel ? `'${sel}' ` : ""}\uAFB8\uBC08 \uADDC\uCE59 \uBB36\uC74C\uC774 \uC5EC\uAE30\uC11C \uB05D\uB09C\uB2E4\uB294 \uD45C\uC2DC\uC785\uB2C8\uB2E4.`);
  const has = (p) => decls.find((d) => d.prop === p);
  const nameOf = (v) => cssToken(v).match(/\(([^()]*)\)$/)?.[1] || cssToken(v);
  const intents = [];
  const w = has("width") || has("max-width");
  const mg = has("margin");
  if (w && mg && /\bauto\b/.test(mg.value)) intents.push(`\uAC00\uB85C ${cssToken(w.value)} \uD06C\uAE30\uB85C \uB9CC\uB4E4\uC5B4 \uD654\uBA74 \uAC00\uC6B4\uB370\uC5D0 \uBC30\uCE58\uD558`);
  else if (w) intents.push(`\uAC00\uB85C \uD3ED\uC744 ${josa(cssToken(w.value), "\uC73C\uB85C/\uB85C")} \uACE0\uC815\uD558`);
  else if (mg) intents.push("\uC8FC\uBCC0 \uC694\uC18C\uC640\uC758 \uAC04\uACA9\uC744 \uC815\uD558");
  const hgt = has("height");
  if (hgt) intents.push(`\uB192\uC774\uB97C ${josa(cssToken(hgt.value), "\uC73C\uB85C/\uB85C")} \uD655\uBCF4\uD558`);
  const bg = has("background") || has("background-color");
  if (bg) intents.push(`${nameOf(splitValues(bg.value)[0])} \uBC30\uACBD\uC744 \uAE54\uC544 \uB2E4\uB978 \uC601\uC5ED\uACFC \uB208\uC5D0 \uB744\uAC8C \uAD6C\uBD84\uD558`);
  const c = has("color");
  if (c) intents.push(`\uAE00\uC790\uB97C ${nameOf(c.value)}\uC73C\uB85C \uD45C\uC2DC\uD558`);
  if (has("display")) intents.push(`\uC694\uC18C\uB97C ${cssToken(has("display").value).replace(/\(.*$/, "")} \uBC29\uC2DD\uC73C\uB85C \uBC30\uCE58\uD558`);
  if (has("padding")) intents.push("\uC548\uCABD\uC5D0 \uC5EC\uC720 \uACF5\uAC04\uC744 \uB450");
  if (has("border") || has("border-radius")) intents.push("\uD14C\uB450\uB9AC\uC640 \uBAA8\uC11C\uB9AC\uB85C \uBAA8\uC591\uC744 \uB2E4\uB4EC");
  if (has("font-size") || has("font-weight") || has("line-height")) intents.push("\uAE00\uC790 \uD06C\uAE30\xB7\uAD75\uAE30\xB7\uC904 \uAC04\uACA9\uC744 \uC77D\uAE30 \uC88B\uAC8C \uC870\uC808\uD558");
  const td = has("text-decoration");
  if (td && td.value === "none") intents.push("\uB9C1\uD06C\uC5D0 \uAE30\uBCF8\uC73C\uB85C \uC0DD\uAE30\uB294 \uBC11\uC904\uC744 \uC5C6\uC560");
  if (!intents.length && decls.length) intents.push(`${decls.map((d) => CSS_PROPS[d.prop] || d.prop).join(", ")} \uAC12\uC744 \uC6D0\uD558\uB294 \uBAA8\uC591\uC73C\uB85C \uC815\uD558`);
  const sectionGuess = sel && /header|top/i.test(sel) ? "\uD398\uC774\uC9C0 \uB9E8 \uC704 \uBA38\uB9AC \uC601\uC5ED(\uD5E4\uB354)\uCC98\uB7FC \uBCF4\uC774\uB3C4\uB85D, " : sel && /footer/i.test(sel) ? "\uD398\uC774\uC9C0 \uB9E8 \uC544\uB798 \uAF2C\uB9AC \uC601\uC5ED(\uD478\uD130)\uCC98\uB7FC \uBCF4\uC774\uB3C4\uB85D, " : sel && /nav|menu/i.test(sel) ? "\uBA54\uB274\uCC98\uB7FC \uBCF4\uC774\uB3C4\uB85D, " : "";
  let why;
  if (intents.length) {
    const joined = intents.map((s, i) => i < intents.length - 1 ? `${s}\uACE0` : `${s}\uAE30`).join(", ");
    why = `${josa(target, "\uC744/\uB97C")} ${sectionGuess}${joined} \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`;
  } else if (opens) why = `${josa(target, "\uC744/\uB97C")} \uC6D0\uD558\uB294 \uBAA8\uC591\uC73C\uB85C \uAFB8\uBC00 \uADDC\uCE59\uC744 \uD55C\uACF3\uC5D0 \uBAA8\uC544 \uB450\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`;
  else why = "\uAFB8\uBC08 \uADDC\uCE59 \uBB36\uC74C\uC774 \uC5B4\uB514\uC11C \uB05D\uB098\uB294\uC9C0 \uBE0C\uB77C\uC6B0\uC800\uC5D0 \uC54C\uB824\uC8FC\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.";
  const definition = opens ? selectorDefinition(sel || "") : decls.length > 1 ? 'CSS \uC120\uC5B8\uC740 "\uC18D\uC131: \uAC12;" \uBAA8\uC591\uC73C\uB85C \uB514\uC790\uC778 \uADDC\uCE59 \uD558\uB098\uB97C \uC815\uD558\uB294 \uBB38\uC7A5\uC785\uB2C8\uB2E4. \uC138\uBBF8\uCF5C\uB860(;)\uC73C\uB85C \uB05D\uB098\uAE30 \uB54C\uBB38\uC5D0 \uD55C \uC904\uC5D0 \uC5EC\uB7EC \uAC1C\uB97C \uC774\uC5B4 \uC4F8 \uC218 \uC788\uC2B5\uB2C8\uB2E4.' : decls.length === 1 ? `${josa(decls[0].prop, "\uC740/\uB294")} CSS\uC5D0\uC11C \uC694\uC18C\uC758 ${josa(CSS_PROPS[decls[0].prop] || "\uB514\uC790\uC778 \uAC12", "\uC744/\uB97C")} \uC815\uD558\uB294 \uC18D\uC131\uC785\uB2C8\uB2E4.` : "\uB2EB\uB294 \uC911\uAD04\uD638 }\uB294 CSS \uAFB8\uBC08 \uADDC\uCE59 \uBB36\uC74C\uC774 \uB05D\uB0AC\uB2E4\uB294 \uD45C\uC2DC\uC785\uB2C8\uB2E4.";
  const role = opens ? `'${sel}' \uAFB8\uBC08 \uADDC\uCE59${decls.length ? ` (${decls.length}\uAC1C)` : " \uC2DC\uC791"}` : decls.length > 1 ? `\uAFB8\uBC08 \uADDC\uCE59 ${decls.length}\uAC1C (${decls.map((d) => CSS_PROPS[d.prop] || d.prop).join(", ")})` : decls.length === 1 ? `${CSS_PROPS[decls[0].prop] || decls[0].prop} \uC815\uD558\uAE30` : "\uAFB8\uBC08 \uADDC\uCE59 \uB05D";
  return { role, definition, easy: parts.join(" "), why, tokens, isCss: true, decls, selector: sel };
}
var HOW = {
  width: "width\uB294 \uC694\uC18C\uC758 \uB0B4\uC6A9 \uC601\uC5ED \uD3ED\uC744 \uACE0\uC815\uD569\uB2C8\uB2E4. box-sizing\uC774 \uAE30\uBCF8\uAC12(content-box)\uC774\uBA74 padding\uACFC border\uB294 \uC774 \uD3ED \uBC14\uAE65\uC5D0 \uB354\uD574\uC838\uC11C \uC2E4\uC81C \uCC28\uC9C0\uD558\uB294 \uD3ED\uC774 \uB354 \uCEE4\uC9D1\uB2C8\uB2E4.",
  height: "height\uB97C \uACE0\uC815\uD558\uBA74 \uB0B4\uC6A9\uC774 \uADF8\uBCF4\uB2E4 \uB9CE\uC544\uC9C8 \uB54C \uC0C1\uC790 \uBC16\uC73C\uB85C \uB118\uCCD0(overflow) \uC544\uB798 \uC694\uC18C\uC640 \uACB9\uCE60 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB0B4\uC6A9 \uAE38\uC774\uAC00 \uBCC0\uD55C\uB2E4\uBA74 min-height\uAC00 \uB354 \uC548\uC804\uD569\uB2C8\uB2E4.",
  margin: "margin\uC740 \uC0C1\uC790 \uBC14\uAE65 \uC5EC\uBC31\uC785\uB2C8\uB2E4. \uC88C\uC6B0\uB97C auto\uB85C \uB450\uBA74 \uBD80\uBAA8 \uD3ED\uC5D0\uC11C \uC694\uC18C \uD3ED\uC744 \uBE80 \uB0A8\uB294 \uACF5\uAC04\uC744 \uC591\uCABD\uC5D0 \uB611\uAC19\uC774 \uB098\uB220 \uAC00\uC6B4\uB370 \uC815\uB82C\uC774 \uB429\uB2C8\uB2E4(\uD3ED\uC774 \uC815\uD574\uC838 \uC788\uC5B4\uC57C \uB3D9\uC791). \uC704\uC544\uB798\uB85C \uBD99\uC740 \uB450 \uC694\uC18C\uC758 margin\uC740 \uB354\uD574\uC9C0\uC9C0 \uC54A\uACE0 \uD070 \uCABD \uD558\uB098\uB85C \uD569\uCCD0\uC9D1\uB2C8\uB2E4(\uB9C8\uC9C4 \uC0C1\uC1C4).",
  padding: "padding\uC740 \uD14C\uB450\uB9AC \uC548\uCABD \uC5EC\uBC31\uC73C\uB85C, \uBC30\uACBD\uC0C9\uC774 \uCE60\uD574\uC9C0\uB294 \uC601\uC5ED\uC5D0 \uD3EC\uD568\uB429\uB2C8\uB2E4.",
  background: "background \uB2E8\uCD95 \uC18D\uC131\uC740 \uBC30\uACBD\uC0C9\xB7\uADF8\uB9BC\xB7\uC704\uCE58\xB7\uBC18\uBCF5\uC744 \uD55C \uBC88\uC5D0 \uC815\uD558\uBA70, \uC5EC\uAE30 \uC801\uC9C0 \uC54A\uC740 \uAC12\uC740 \uAE30\uBCF8\uAC12\uC73C\uB85C \uCD08\uAE30\uD654\uB429\uB2C8\uB2E4. \uBC30\uACBD\uC740 padding \uC601\uC5ED\uAE4C\uC9C0 \uCE60\uD574\uC9D1\uB2C8\uB2E4.",
  "background-color": "\uBC30\uACBD\uC0C9\uC740 \uB0B4\uC6A9\uACFC padding \uC601\uC5ED\uAE4C\uC9C0 \uCE60\uD574\uC9C0\uACE0 margin \uC601\uC5ED\uC740 \uD22C\uBA85\uD558\uAC8C \uB0A8\uC2B5\uB2C8\uB2E4.",
  color: "color\uB294 \uBD80\uBAA8\uC5D0\uC11C \uC790\uC2DD\uC73C\uB85C \uC0C1\uC18D\uB418\uB294 \uC18D\uC131\uC774\uB77C, \uC548\uCABD \uC694\uC18C\uB4E4\uB3C4 \uB530\uB85C \uC815\uD558\uC9C0 \uC54A\uC73C\uBA74 \uAC19\uC740 \uAE00\uC790 \uC0C9\uC744 \uC501\uB2C8\uB2E4.",
  display: "display\uB294 \uC694\uC18C\uAC00 \uB808\uC774\uC544\uC6C3\uC5D0 \uCC38\uC5EC\uD558\uB294 \uBC29\uC2DD\uC744 \uBC14\uAFC9\uB2C8\uB2E4. block\uC740 \uC904 \uC804\uCCB4\uB97C \uCC28\uC9C0\uD558\uACE0, inline\uC740 width/height\uAC00 \uBB34\uC2DC\uB418\uBA70, inline-block\uC740 \uC606\uC73C\uB85C \uC774\uC5B4\uC9C0\uBA74\uC11C \uD06C\uAE30\uB97C \uAC00\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
  position: "position: absolute\uB294 \uC6D0\uB798 \uC790\uB9AC\uB97C \uBE44\uC6B0\uACE0, \uAC00\uC7A5 \uAC00\uAE4C\uC6B4 position\uC774 \uC9C0\uC815\uB41C \uC870\uC0C1 \uC694\uC18C\uB97C \uAE30\uC900\uC73C\uB85C top/left \uC88C\uD45C\uC5D0 \uB193\uC785\uB2C8\uB2E4. relative\uB294 \uC6D0\uB798 \uC790\uB9AC\uB97C \uC720\uC9C0\uD55C \uCC44 \uC870\uAE08 \uC774\uB3D9\uD569\uB2C8\uB2E4.",
  "font-size": "font-size\uB294 \uC0C1\uC18D\uB418\uBA70, em \uB2E8\uC704\uB294 \uBD80\uBAA8 \uAE00\uC790 \uD06C\uAE30\uB97C \uAE30\uC900\uC73C\uB85C \uACC4\uC0B0\uB429\uB2C8\uB2E4.",
  border: "border\uB294 padding \uBC14\uAE65\uC5D0 \uADF8\uB824\uC9C0\uBA70, \uAE30\uBCF8 box-sizing\uC5D0\uC11C\uB294 \uC694\uC18C\uC758 \uC2E4\uC81C \uD06C\uAE30\uB97C \uB298\uB9BD\uB2C8\uB2E4.",
  "border-radius": "border-radius\uB294 \uBC30\uACBD\uACFC \uD14C\uB450\uB9AC\uC758 \uBAA8\uC11C\uB9AC\uB97C \uB465\uAE00\uAC8C \uAE4E\uC2B5\uB2C8\uB2E4. \uC548\uCABD \uB0B4\uC6A9\uC774 \uC090\uC838\uB098\uC624\uBA74 overflow: hidden\uC73C\uB85C \uD568\uAED8 \uC798\uB77C\uC57C \uD569\uB2C8\uB2E4.",
  "z-index": "z-index\uB294 position\uC774 \uC9C0\uC815\uB41C \uC694\uC18C\uC5D0\uC11C\uB9CC \uB3D9\uC791\uD558\uBA70, \uAC19\uC740 \uC313\uC784 \uB9E5\uB77D(stacking context) \uC548\uC5D0\uC11C \uC22B\uC790\uAC00 \uD070 \uC694\uC18C\uAC00 \uC55E\uC5D0 \uADF8\uB824\uC9D1\uB2C8\uB2E4.",
  transition: "transition\uC740 \uAC12\uC774 \uBC14\uB014 \uB54C \uBE0C\uB77C\uC6B0\uC800\uAC00 \uC911\uAC04 \uB2E8\uACC4\uB97C \uC790\uB3D9\uC73C\uB85C \uACC4\uC0B0\uD574 \uBD80\uB4DC\uB7FD\uAC8C \uBCF4\uC5EC\uC90D\uB2C8\uB2E4. transform\uACFC opacity\uB97C \uC560\uB2C8\uBA54\uC774\uC158\uD558\uB294 \uAC83\uC774 \uAC00\uC7A5 \uBD80\uB4DC\uB7FD\uC2B5\uB2C8\uB2E4.",
  "line-height": "\uB2E8\uC704 \uC5C6\uB294 line-height\uB294 \uAC01 \uC694\uC18C\uC758 \uAE00\uC790 \uD06C\uAE30\uC5D0 \uACF1\uD574\uC838 \uC0C1\uC18D\uB418\uBBC0\uB85C, \uAE00\uC790 \uD06C\uAE30\uAC00 \uB2EC\uB77C\uB3C4 \uBE44\uC728\uC774 \uC720\uC9C0\uB429\uB2C8\uB2E4."
};
var TECH = {
  width: "width/height/margin/padding \uBCC0\uACBD\uC740 Layout(reflow) \uB2E8\uACC4\uB97C \uB2E4\uC2DC \uC2E4\uD589\uC2DC\uD0A4\uB294 \uBE44\uC6A9\uC774 \uD070 \uC18D\uC131\uC785\uB2C8\uB2E4. \uACE0\uC815 px \uD3ED\uC740 \uBDF0\uD3EC\uD2B8\uAC00 \uC881\uC740 \uBAA8\uBC14\uC77C\uC5D0\uC11C \uAC00\uB85C \uC2A4\uD06C\uB864\uC744 \uB9CC\uB4E4\uBBC0\uB85C width: 100%; max-width: 800px \uD328\uD134\uC774 \uBC18\uC751\uD615\uC5D0 \uC801\uD569\uD569\uB2C8\uB2E4.",
  height: "\uACE0\uC815 height\uB294 \uCF58\uD150\uCE20 \uAE38\uC774\uB098 font-size \uBCC0\uD654(\uC811\uADFC\uC131 \uD655\uB300)\uC5D0 \uB300\uC751\uD558\uC9C0 \uBABB\uD574 overflow \uD074\uB9AC\uD551/\uACB9\uCE68\uC774 \uBC1C\uC0DD\uD569\uB2C8\uB2E4. WCAG 1.4.4(Resize Text) \uAD00\uC810\uC5D0\uC11C min-height \uC0AC\uC6A9\uC774 \uAD8C\uC7A5\uB429\uB2C8\uB2E4.",
  margin: "margin: 0 auto \uC911\uC559 \uC815\uB82C\uC740 Block Formatting Context\uC5D0\uC11C used width\uAC00 \uD655\uC815\uB41C \uBE14\uB85D \uBC15\uC2A4\uC5D0\uB9CC \uC801\uC6A9\uB429\uB2C8\uB2E4. \uC218\uC9C1 \uC778\uC811 margin\uC740 margin collapsing \uADDC\uCE59(CSS 2.1 \xA78.3.1)\uC5D0 \uB530\uB77C \uC0C1\uC1C4\uB429\uB2C8\uB2E4.",
  background: "background shorthand\uB294 background-image/position/size/repeat/attachment/origin/clip/color\uB97C \uBAA8\uB450 initial\uB85C \uB9AC\uC14B\uD558\uBBC0\uB85C cascade \uC0C1 \uC55E\uC11C \uC120\uC5B8\uD55C \uAC1C\uBCC4 \uC18D\uC131\uC744 \uB36E\uC5B4\uC501\uB2C8\uB2E4. \uC0C9 \uBCC0\uACBD\uC740 Paint \uB2E8\uACC4\uB9CC \uC7AC\uC2E4\uD589\uD569\uB2C8\uB2E4.",
  "background-color": "\uBC30\uACBD \uBCC0\uACBD\uC740 Layout \uC5C6\uC774 Paint\uB9CC \uC7AC\uC2E4\uD589\uB429\uB2C8\uB2E4. \uAE00\uC790\uC640 \uBC30\uACBD\uC758 \uBA85\uB3C4 \uB300\uBE44\uB294 WCAG 1.4.3 \uAE30\uC900 4.5:1 \uC774\uC0C1\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.",
  color: "color\uB294 inherited property\uB85C computed value\uAC00 \uC790\uC190\uC5D0 \uC804\uB2EC\uB429\uB2C8\uB2E4. \uBC30\uACBD \uB300\uBE44 4.5:1(WCAG AA)\uC744 \uCDA9\uC871\uD574\uC57C \uD558\uBA70 currentColor \uD0A4\uC6CC\uB4DC\uB85C border/svg fill\uC5D0 \uC7AC\uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
  display: "display \uBCC0\uACBD\uC740 \uBC15\uC2A4 \uC0DD\uC131(box generation)\uACFC formatting context\uB97C \uBC14\uAFB8\uC5B4 \uC804\uCCB4 Layout\uC744 \uC7AC\uACC4\uC0B0\uD569\uB2C8\uB2E4. display: none\uC740 \uC811\uADFC\uC131 \uD2B8\uB9AC\uC5D0\uC11C\uB3C4 \uC81C\uAC70\uB429\uB2C8\uB2E4.",
  position: "absolute/fixed\uB294 normal flow\uC5D0\uC11C \uC81C\uC678\uB418\uACE0 containing block \uAE30\uC900\uC73C\uB85C \uBC30\uCE58\uB418\uBA70, position + z-index \uC870\uD569\uC740 \uC0C8\uB85C\uC6B4 stacking context\uB97C \uC0DD\uC131\uD569\uB2C8\uB2E4.",
  transition: "transform/opacity \uC774\uC678\uC758 \uC18D\uC131 transition\uC740 \uB9E4 \uD504\uB808\uC784 Layout/Paint\uB97C \uC720\uBC1C\uD569\uB2C8\uB2E4. prefers-reduced-motion \uBBF8\uB514\uC5B4 \uCFFC\uB9AC\uB85C \uBAA8\uC158 \uAC10\uC18C \uC124\uC815\uC744 \uC874\uC911\uD574\uC57C \uD569\uB2C8\uB2E4.",
  "z-index": "z-index\uB294 positioned box \uB610\uB294 flex/grid item\uC5D0\uC11C\uB9CC \uC801\uC6A9\uB418\uBA70, opacity<1\xB7transform \uB4F1\uB3C4 stacking context\uB97C \uC0DD\uC131\uD574 \uC758\uB3C4\uCE58 \uC54A\uC740 \uB808\uC774\uC5B4 \uC21C\uC11C \uBB38\uC81C\uAC00 \uC0DD\uAE38 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
};
function cssLevelDepth(r) {
  const sel = r.selector || "";
  const spec = sel.startsWith("#") ? "1-0-0" : sel.startsWith(".") ? "0-1-0" : sel ? "0-0-1" : "";
  if (!r.decls.length) {
    const opening = /\{/.test(r.role) || r.role.includes("\uC2DC\uC791");
    return {
      isBasic: !opening,
      howItWorks: opening ? `\uBE0C\uB77C\uC6B0\uC800\uB294 \uD398\uC774\uC9C0\uC758 \uC694\uC18C\uB4E4 \uC911 ${selectorKo(sel)}\uB97C \uCC3E\uC544, \uC774 \uBB36\uC74C \uC548\uC758 \uADDC\uCE59\uC744 \uC801\uC6A9\uD569\uB2C8\uB2E4. \uAC19\uC740 \uC694\uC18C\uC5D0 \uC5EC\uB7EC \uADDC\uCE59\uC774 \uACB9\uCE58\uBA74 \uB354 \uAD6C\uCCB4\uC801\uC778 \uC120\uD0DD\uC790(id > class > \uD0DC\uADF8)\uC640 \uB098\uC911\uC5D0 \uC801\uC740 \uADDC\uCE59\uC774 \uC774\uAE41\uB2C8\uB2E4.` : "\uAFB8\uBC08 \uADDC\uCE59 \uBB36\uC74C\uC774 \uB05D\uB098\uB294 \uAE30\uD638\uC785\uB2C8\uB2E4.",
      technicalDetail: opening ? `CSSOM\uC5D0 style rule\uB85C \uB4F1\uB85D\uB418\uBA70, \uC120\uD0DD\uC790 '${sel}'\uC758 \uBA85\uC2DC\uB3C4(specificity)\uB294 ${spec || "\uBCF5\uD569"}\uC785\uB2C8\uB2E4. \uBE0C\uB77C\uC6B0\uC800\uB294 \uC120\uD0DD\uC790\uB97C \uC624\uB978\uCABD(key selector)\uBD80\uD130 \uB9E4\uCE6D\uD558\uBBC0\uB85C \uAE4A\uC740 \uC790\uC190 \uC120\uD0DD\uC790\uB294 Style Recalc \uBE44\uC6A9\uC744 \uD0A4\uC6C1\uB2C8\uB2E4.` : "Rule block \uC885\uB8CC \uD1A0\uD070\uC73C\uB85C CSS tokenizer\uAC00 \uD574\uB2F9 style rule\uC758 declaration block\uC744 \uB2EB\uC2B5\uB2C8\uB2E4."
    };
  }
  const how = r.decls.map((d) => HOW[d.prop]).filter(Boolean);
  const tech = r.decls.map((d) => TECH[d.prop]).filter(Boolean);
  return {
    isBasic: false,
    howItWorks: (how.length ? how.join(" ") : "\uBE0C\uB77C\uC6B0\uC800\uB294 \uC120\uD0DD\uC790\uC5D0 \uB9DE\uB294 \uC694\uC18C\uC5D0 \uC774 \uC120\uC5B8\uB4E4\uC744 \uC801\uC6A9\uD574 \uD06C\uAE30\uC640 \uC704\uCE58(\uB808\uC774\uC544\uC6C3)\uB97C \uBA3C\uC800 \uACC4\uC0B0\uD558\uACE0, \uADF8\uB2E4\uC74C \uC0C9\uACFC \uADF8\uB9BC\uC790(\uD398\uC778\uD2B8)\uB97C \uCE60\uD569\uB2C8\uB2E4.") + (r.decls.length > 1 ? " \uD55C \uC904\uC5D0 \uC801\uC5B4\uB3C4 \uC138\uBBF8\uCF5C\uB860\uC73C\uB85C \uAD6C\uBD84\uB418\uC5B4 \uAC01\uAC01 \uB530\uB85C \uC801\uC6A9\uB429\uB2C8\uB2E4." : ""),
    technicalDetail: (spec ? `\uC120\uD0DD\uC790 '${sel}'\uC758 specificity ${spec}. ` : "") + (tech.length ? tech.join(" ") : "Declaration block\uC758 \uAC01 property\uB294 cascade(origin \u2192 specificity \u2192 \uC120\uC5B8 \uC21C\uC11C)\uB97C \uAC70\uCCD0 computed value\uAC00 \uACB0\uC815\uB429\uB2C8\uB2E4.")
  };
}
function looksLikeCss(code) {
  if (/<\/?[a-z][\s\S]*>/i.test(code) && !/<style/i.test(code)) return false;
  if (/\b(function|const|let|var|=>|import|return)\b/.test(code)) return false;
  return /[^{}]+\{[^}]*:[^}]*\}/.test(code) || /^\s*[a-z-]+\s*:\s*[^;]+;/m.test(code);
}

// src/utils/beginnerDescriber.ts
function splitTopLevel(s, sep = ",") {
  const out = [];
  let depth = 0;
  let cur = "";
  let quote = null;
  for (const ch of s) {
    if (quote) {
      cur += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      cur += ch;
      continue;
    }
    if ("([{".includes(ch)) depth++;
    if (")]}".includes(ch)) depth--;
    if (ch === sep && depth === 0) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
function stripSemi(s) {
  return s.trim().replace(/;+\s*$/, "").trim();
}
function unquote(s) {
  const m = s.trim().match(/^(['"`])([\s\S]*)\1$/);
  return m ? m[2] : null;
}
function parseArrow(s) {
  const m = s.trim().match(/^(?:async\s+)?(\(([^)]*)\)|[\w$]+)\s*=>\s*([\s\S]*)$/);
  if (!m) return null;
  return { params: (m[2] ?? m[1]).trim(), body: m[3].trim() };
}
function explainValue(raw) {
  const v = stripSemi(raw);
  const known = matchKnown(v);
  if (known?.entry.value) return known.entry.value(known.m);
  const prop = explainProperty(v);
  if (prop) return prop;
  if (/^-?\d+(\.\d+)?$/.test(v)) return `\uC22B\uC790 ${v}`;
  const str = unquote(v);
  if (str !== null) return str ? `\uAE00\uC790 '${str}'` : "\uBE48 \uAE00\uC790('')";
  if (v === "true") return "\uCC38(true) \uAC12";
  if (v === "false") return "\uAC70\uC9D3(false) \uAC12";
  if (v === "null") return "\uBE44\uC5B4 \uC788\uC74C(null) \uAC12";
  if (v === "undefined") return "\uC544\uC9C1 \uC815\uD574\uC9C0\uC9C0 \uC54A\uC74C(undefined) \uAC12";
  if (v === "[]") return "\uC544\uBB34\uAC83\uB3C4 \uB4E4\uC5B4\uC788\uC9C0 \uC54A\uC740 \uBE48 \uBAA9\uB85D(\uBC30\uC5F4)";
  if (v === "{}") return "\uC544\uBB34\uAC83\uB3C4 \uB4E4\uC5B4\uC788\uC9C0 \uC54A\uC740 \uBE48 \uBB36\uC74C(\uAC1D\uCCB4)";
  if (/^\[[\s\S]*\]$/.test(v)) {
    const items = splitTopLevel(v.slice(1, -1));
    const shown = items.length > 5 ? [...items.slice(0, 5), "\u2026"] : items;
    return `${josa(shown.join(", "), "\uC774/\uAC00")} \uC21C\uC11C\uB300\uB85C \uB2F4\uAE34 \uBAA9\uB85D(\uBC30\uC5F4)`;
  }
  if (/^\{[\s\S]*\}$/.test(v)) {
    const keys = splitTopLevel(v.slice(1, -1)).map((k) => k.split(":")[0].trim());
    return keys.length ? `${josa(keys.join(", "), "\uC744/\uB97C")} \uD55C\uB370 \uBB36\uC740 \uBB36\uC74C(\uAC1D\uCCB4)` : "\uBB36\uC74C(\uAC1D\uCCB4)";
  }
  const arr = v.match(/^([\w$.]+)\.(map|filter|find|some|every|forEach)\(([\s\S]*)\)$/);
  if (arr) {
    const [, list, method, inner] = arr;
    const fn = parseArrow(inner);
    const p = fn?.params || "\uAC12";
    const body = fn?.body || inner;
    if (method === "map") return `${list} \uBAA9\uB85D\uC758 \uAC12\uC744 \uD558\uB098\uC529 \uAEBC\uB0B4(${p}) ${josa(body, "\uC73C\uB85C/\uB85C")} \uBC14\uAFBC \uC0C8 \uBAA9\uB85D`;
    if (method === "filter") return `${list} \uBAA9\uB85D\uC5D0\uC11C ${josa(body, "\uC774\uB77C\uB294/\uB77C\uB294")} \uC870\uAC74\uC5D0 \uB9DE\uB294 \uAC12\uB9CC \uACE8\uB77C\uB0B8 \uC0C8 \uBAA9\uB85D`;
    if (method === "find") return `${list} \uBAA9\uB85D\uC5D0\uC11C ${josa(body, "\uC774\uB77C\uB294/\uB77C\uB294")} \uC870\uAC74\uC5D0 \uB9DE\uB294 \uCCAB \uBC88\uC9F8 \uAC12`;
    if (method === "some") return `${list} \uBAA9\uB85D\uC5D0 ${josa(body, "\uC774\uB77C\uB294/\uB77C\uB294")} \uC870\uAC74\uC5D0 \uB9DE\uB294 \uAC12\uC774 \uD558\uB098\uB77C\uB3C4 \uC788\uB294\uC9C0(\uCC38/\uAC70\uC9D3)`;
    if (method === "every") return `${list} \uBAA9\uB85D\uC758 \uAC12\uC774 \uBAA8\uB450 ${josa(body, "\uC774\uB77C\uB294/\uB77C\uB294")} \uC870\uAC74\uC5D0 \uB9DE\uB294\uC9C0(\uCC38/\uAC70\uC9D3)`;
  }
  if (/^await\s+/.test(v)) return `${v.replace(/^await\s+/, "")} \uC791\uC5C5\uC774 \uB05D\uB0A0 \uB54C\uAE4C\uC9C0 \uAE30\uB2E4\uB824\uC11C \uBC1B\uC740 \uACB0\uACFC`;
  const nw = v.match(/^new\s+([\w$.]+)/);
  if (nw) return `\uC0C8\uB85C \uB9CC\uB4E0 ${nw[1]} \uBB3C\uAC74(\uAC1D\uCCB4)`;
  if (parseArrow(v) || /^(async\s+)?function\b/.test(v)) return "\uB098\uC911\uC5D0 \uBD88\uB7EC\uC11C \uC4F8 \uC218 \uC788\uB294 \uD568\uC218(\uAE30\uB2A5 \uBB36\uC74C)";
  const doc = v.match(/^document\.(getElementById|querySelector|querySelectorAll)\((.*)\)$/);
  if (doc) {
    const target = unquote(doc[2]) ?? doc[2];
    return doc[1] === "querySelectorAll" ? `\uD654\uBA74\uC5D0\uC11C '${target}'\uC5D0 \uD574\uB2F9\uD558\uB294 \uC694\uC18C\uB97C \uBAA8\uB450 \uCC3E\uC544 \uBAA8\uC740 \uBAA9\uB85D` : `\uD654\uBA74\uC5D0\uC11C '${target}'\uC5D0 \uD574\uB2F9\uD558\uB294 \uC694\uC18C\uB97C \uCC3E\uC544\uB0B8 \uAC83`;
  }
  const call = v.match(/^([\w$.]+)\(([\s\S]*)\)$/);
  if (call) return `${call[1]}(${call[2]}) \uAE30\uB2A5\uC744 \uC2E4\uD589\uD574\uC11C \uB098\uC628 \uACB0\uACFC`;
  if (/^[\w$.]+$/.test(v)) return `${v}\uC5D0 \uB4E4\uC5B4\uC788\uB294 \uAC12`;
  if (/[+\-*/%]/.test(v)) return `${josa(v, "\uC744/\uB97C")} \uACC4\uC0B0\uD55C \uACB0\uACFC`;
  return `${v}\uC758 \uACB0\uACFC`;
}
function splitIfOneLiner(t) {
  const head = t.match(/^if\s*\(/);
  if (!head) return null;
  let depth = 0;
  for (let i = head[0].length - 1; i < t.length; i++) {
    if (t[i] === "(") depth++;
    else if (t[i] === ")") {
      depth--;
      if (depth === 0) {
        const body = t.slice(i + 1).trim();
        if (!body || body === "{") return null;
        return { cond: t.slice(head[0].length, i), body };
      }
    }
  }
  return null;
}
function explainSingleCondition(c) {
  c = c.trim();
  while (c.startsWith("(") && c.endsWith(")")) c = c.slice(1, -1).trim();
  let m;
  if (m = c.match(/^!\s*([\w$.]+)\.trim\(\)$/)) return `${m[1]}\uC5D0 \uACF5\uBC31 \uB9D0\uACE0 \uC2E4\uC81C \uAE00\uC790\uAC00 \uD558\uB098\uB3C4 \uC5C6\uC73C\uBA74`;
  if ((m = c.match(/^!\s*([\w$.]+)\.length$/)) || (m = c.match(/^([\w$.]+)\.length\s*===?\s*0$/)))
    return `${josa(m[1], "\uC774/\uAC00")} \uBE44\uC5B4 \uC788\uC73C\uBA74`;
  if (m = c.match(/^!\s*([\w$.[\]'"]+)$/)) return `${m[1]} \uAC12\uC774 \uC5C6\uAC70\uB098 \uBE44\uC5B4 \uC788\uC73C\uBA74`;
  if (m = c.match(/^([\w$.]+)\.includes\((.+)\)$/)) return `${m[1]} \uC548\uC5D0 ${josa(m[2], "\uC774/\uAC00")} \uB4E4\uC5B4 \uC788\uC73C\uBA74`;
  if (m = c.match(/^(.+?)\s*(===|!==|==|!=|>=|<=|>|<)\s*(.+)$/)) {
    const [, a, op, b] = m;
    const A = josa(a.trim(), "\uC774/\uAC00");
    const B = b.trim();
    switch (op) {
      case "===":
      case "==":
        return `${A} ${josa(B, "\uACFC/\uC640")} \uAC19\uC73C\uBA74`;
      case "!==":
      case "!=":
        return `${A} ${josa(B, "\uACFC/\uC640")} \uB2E4\uB974\uBA74`;
      case ">":
        return `${A} ${B}\uBCF4\uB2E4 \uD06C\uBA74`;
      case "<":
        return `${A} ${B}\uBCF4\uB2E4 \uC791\uC73C\uBA74`;
      case ">=":
        return `${A} ${B} \uC774\uC0C1\uC774\uBA74`;
      case "<=":
        return `${A} ${B} \uC774\uD558\uC774\uBA74`;
    }
  }
  if (/^[\w$.]+$/.test(c)) return `${c} \uAC12\uC774 \uC788\uC73C\uBA74(\uCC38\uC774\uBA74)`;
  return `'${c}' \uC870\uAC74\uC774 \uB9DE\uC73C\uBA74`;
}
function toConnective(clause, kind) {
  const stem = clause.replace(/면$/, "").replace(/으$/, "");
  return stem + (kind === "and" ? "\uACE0" : "\uAC70\uB098");
}
function explainCondition(c) {
  const orParts = c.split(/\s*\|\|\s*/);
  if (orParts.length > 1) {
    const parts = orParts.map(explainSingleCondition);
    return parts.map((p, i) => i < parts.length - 1 ? toConnective(p, "or") : p).join(" ");
  }
  const andParts = c.split(/\s*&&\s*/);
  if (andParts.length > 1) {
    const parts = andParts.map(explainSingleCondition);
    return parts.map((p, i) => i < parts.length - 1 ? toConnective(p, "and") : p).join(" ");
  }
  return explainSingleCondition(c);
}
var REACT_HOOKS = {
  useState: "\uD654\uBA74\uC5D0 \uBCF4\uC5EC\uC904 \uAC12\uC744 \uAE30\uC5B5\uD574 \uB450\uB294 \uAE30\uB2A5",
  useEffect: "\uD654\uBA74\uC774 \uB098\uD0C0\uB098\uAC70\uB098 \uAC12\uC774 \uBC14\uB014 \uB54C \uC790\uB3D9\uC73C\uB85C \uD560 \uC77C\uC744 \uC815\uD558\uB294 \uAE30\uB2A5",
  useRef: "\uD654\uBA74\uC744 \uB2E4\uC2DC \uADF8\uB9AC\uC9C0 \uC54A\uACE0 \uAC12\uC744 \uBCF4\uAD00\uD558\uAC70\uB098 \uD654\uBA74 \uC694\uC18C\uB97C \uC9C1\uC811 \uAC00\uB9AC\uD0A4\uB294 \uAE30\uB2A5",
  useMemo: "\uACC4\uC0B0 \uACB0\uACFC\uB97C \uAE30\uC5B5\uD574 \uB450\uACE0 \uD544\uC694\uD560 \uB54C\uB9CC \uB2E4\uC2DC \uACC4\uC0B0\uD558\uB294 \uAE30\uB2A5",
  useCallback: "\uD568\uC218\uB97C \uAE30\uC5B5\uD574 \uB450\uACE0 \uD544\uC694\uD560 \uB54C\uB9CC \uC0C8\uB85C \uB9CC\uB4DC\uB294 \uAE30\uB2A5",
  useContext: "\uC5EC\uB7EC \uD654\uBA74\uC774 \uD568\uAED8 \uC4F0\uB294 \uACF5\uC6A9 \uAC12\uC744 \uAEBC\uB0B4\uC624\uB294 \uAE30\uB2A5",
  useReducer: "\uBCF5\uC7A1\uD55C \uAC12 \uBCC0\uACBD \uADDC\uCE59\uC744 \uD55C\uACF3\uC5D0 \uBAA8\uC544 \uAD00\uB9AC\uD558\uB294 \uAE30\uB2A5"
};
function explainCall(expr) {
  const e = stripSemi(expr);
  let m;
  const known = matchKnown(e);
  if (known?.entry.stmt) {
    return { easy: known.entry.stmt(known.m), why: known.entry.why || "\uC774 \uAE30\uB2A5\uC774 \uB9E1\uC740 \uC77C\uC744 \uC774 \uC2DC\uC810\uC5D0 \uCC98\uB9AC\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4." };
  }
  if (m = e.match(/^console\.(log|info|warn|error)\(([\s\S]*)\)$/)) {
    const args = splitTopLevel(m[2]);
    const what = args.map((a) => unquote(a) !== null ? `'${unquote(a)}'` : a).join(", ");
    const kind = m[1] === "error" ? "\uBE68\uAC04 \uC624\uB958 \uBA54\uC2DC\uC9C0\uB85C" : m[1] === "warn" ? "\uB178\uB780 \uACBD\uACE0 \uBA54\uC2DC\uC9C0\uB85C" : "\uAE00\uC790\uB85C";
    return {
      easy: `\uAD04\uD638 \uC548\uC758 ${josa(what || "\uAC12", "\uC744/\uB97C")} \uAC1C\uBC1C\uC790 \uB3C4\uAD6C(F12)\uC758 \uCF58\uC194 \uCC3D\uC5D0 ${kind} \uCD9C\uB825\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: `\uCF54\uB4DC\uAC00 \uC81C\uB300\uB85C \uB3D9\uC791\uD558\uB294\uC9C0, ${what || "\uAC12"}\uC5D0 \uBB34\uC5C7\uC774 \uB4E4\uC5B4\uC788\uB294\uC9C0 \uAC1C\uBC1C\uC790\uAC00 \uB208\uC73C\uB85C \uD655\uC778(\uB514\uBC84\uAE45)\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`
    };
  }
  if (m = e.match(/^alert\(([\s\S]*)\)$/)) {
    const msg = unquote(m[1]) ?? m[1];
    return {
      easy: `\uD654\uBA74 \uAC00\uC6B4\uB370\uC5D0 ${josa(`'${msg}'`, "\uC774\uB77C\uB294/\uB77C\uB294")} \uB0B4\uC6A9\uC774 \uC801\uD78C \uC54C\uB9BC \uCC3D\uC744 \uB744\uC6B0\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: "\uC0AC\uC6A9\uC790\uC5D0\uAC8C \uAF2D \uC54C\uB824\uC57C \uD560 \uB0B4\uC6A9\uC744 \uD655\uC2E4\uD558\uAC8C \uBCF4\uC5EC\uC8FC\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (m = e.match(/^fetch\(([\s\S]*?)(?:,\s*\{[\s\S]*\})?\)$/)) {
    const parts = m[1].split(/\s*\+\s*/);
    const base = unquote(parts[0]) ?? parts[0];
    const extra = parts.slice(1).map((p) => {
      const enc = p.match(/^encodeURIComponent\((.+)\)$/);
      return enc ? `${enc[1]} \uAC12(\uC8FC\uC18C\uC5D0 \uB123\uC744 \uC218 \uC788\uAC8C \uBCC0\uD658\uD55C \uAC83)` : unquote(p) ?? p;
    }).join(", ");
    return {
      easy: `'${base}' \uC8FC\uC18C${extra ? ` \uB4A4\uC5D0 ${josa(extra, "\uC744/\uB97C")} \uBD99\uC778 \uC8FC\uC18C` : ""}\uC758 \uC11C\uBC84\uC5D0 \uB370\uC774\uD130\uB97C \uB2EC\uB77C\uACE0 \uC694\uCCAD\uC744 \uBCF4\uB0B4\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: "\uD654\uBA74\uC5D0 \uBCF4\uC5EC\uC904 \uB370\uC774\uD130(\uAC80\uC0C9 \uACB0\uACFC, \uBAA9\uB85D \uB4F1)\uB97C \uC11C\uBC84\uC5D0\uC11C \uBC1B\uC544\uC624\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if ((m = e.match(/^\.then\(([\s\S]*)\)$/)) || (m = e.match(/^[\w$.]+\)?\.then\(([\s\S]*)\)$/))) {
    const fn = parseArrow(m[1]);
    if (fn && /\.json\(\)$/.test(fn.body)) {
      return {
        easy: `\uBC14\uB85C \uC55E\uC758 \uC694\uCCAD\uC774 \uB05D\uB098\uBA74, \uC11C\uBC84\uAC00 \uBCF4\uB0B8 \uC751\uB2F5(${fn.params})\uC744 JSON\uC774\uB77C\uB294 \uB370\uC774\uD130 \uD615\uC2DD\uC5D0\uC11C \uAEBC\uB0B4 \uC4F8 \uC218 \uC788\uB294 \uAC12\uC73C\uB85C \uBC14\uAFB8\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
        why: "\uC11C\uBC84\uAC00 \uBCF4\uB0B8 \uC751\uB2F5\uC740 \uADF8\uB300\uB85C\uB294 \uC4F8 \uC218 \uC5C6\uC5B4\uC11C, \uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8\uC5D0\uC11C \uB2E4\uB8F0 \uC218 \uC788\uB294 \uAC12\uC73C\uB85C \uD480\uC5B4\uB0B4\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
      };
    }
    if (fn) {
      const set = fn.body.match(/^(set([A-Z]\w*))\((.*)\)$/);
      const doWhat = set ? `${set[1]}\uB85C ${set[2].charAt(0).toLowerCase() + set[2].slice(1)} \uAC12\uC744 ${josa(set[3], "\uC73C\uB85C/\uB85C")} \uBC14\uAFB8\uB294` : `${josa(fn.body, "\uC744/\uB97C")} \uC2E4\uD589\uD558\uB294`;
      return {
        easy: `\uBC14\uB85C \uC55E\uC758 \uC791\uC5C5\uC774 \uB05D\uB098\uBA74, \uADF8 \uACB0\uACFC\uB97C ${josa(fn.params, "\uC774\uB77C\uB294/\uB77C\uB294")} \uC774\uB984\uC73C\uB85C \uBC1B\uC544\uC11C ${doWhat} \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
        why: "\uC11C\uBC84 \uC694\uCCAD\uCC98\uB7FC \uC2DC\uAC04\uC774 \uAC78\uB9AC\uB294 \uC791\uC5C5\uC740 \uB05D\uB098\uB294 \uC21C\uAC04\uC744 \uAE30\uB2E4\uB838\uB2E4\uAC00 \uB2E4\uC74C \uC77C\uC744 \uD574\uC57C \uD574\uC11C \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
      };
    }
  }
  if (m = e.match(/^\.catch\(([\s\S]*)\)$/)) {
    const fn = parseArrow(m[1]);
    return {
      easy: `\uC55E\uC758 \uC791\uC5C5 \uC911\uC5D0 \uC624\uB958\uAC00 \uB098\uBA74, \uADF8 \uC624\uB958\uB97C ${fn ? `${josa(fn.params, "\uC774\uB77C\uB294/\uB77C\uB294")} \uC774\uB984\uC73C\uB85C \uBC1B\uC544 ${josa(fn.body, "\uC744/\uB97C")}` : "\uBC1B\uC544 \uCC98\uB9AC \uCF54\uB4DC\uB97C"} \uC2E4\uD589\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: "\uC778\uD130\uB137\uC774 \uB04A\uAE30\uB294 \uB4F1 \uBB38\uC81C\uAC00 \uC0DD\uACA8\uB3C4 \uD654\uBA74\uC774 \uBA48\uCD94\uC9C0 \uC54A\uACE0 \uB300\uCC98\uD560 \uC218 \uC788\uAC8C \uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (m = e.match(/^(set([A-Z]\w*))\(([\s\S]*)\)$/)) {
    const stateName = m[2].charAt(0).toLowerCase() + m[2].slice(1);
    return {
      easy: `${josa(stateName, "\uC774\uB77C\uB294/\uB77C\uB294")} \uAC12\uC744 ${josa(m[3] || "\uC0C8 \uAC12", "\uC73C\uB85C/\uB85C")} \uBC14\uAFB8\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4. \uAC12\uC774 \uBC14\uB00C\uBA74 \uD654\uBA74\uC774 \uC790\uB3D9\uC73C\uB85C \uB2E4\uC2DC \uADF8\uB824\uC9D1\uB2C8\uB2E4.`,
      why: `\uBC14\uB010 ${stateName} \uAC12\uC744 \uD654\uBA74\uC5D0 \uBC14\uB85C \uBC18\uC601\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`
    };
  }
  if (m = e.match(/^(clearTimeout|clearInterval)\((.+)\)$/)) {
    return {
      easy: `\uC608\uC57D\uD574 \uB454 ${josa(m[2], "\uC744/\uB97C")} \uCDE8\uC18C\uD574\uC11C, \uC544\uC9C1 \uC2E4\uD589\uB418\uC9C0 \uC54A\uC558\uB2E4\uBA74 \uC2E4\uD589\uB418\uC9C0 \uC54A\uB3C4\uB85D \uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: "\uB354 \uC774\uC0C1 \uD544\uC694 \uC5C6\uC5B4\uC9C4 \uC608\uC57D \uC791\uC5C5\uC774 \uB4A4\uB2A6\uAC8C \uC2E4\uD589\uB418\uB294 \uAC83\uC744 \uB9C9\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (m = e.match(/^([\w$.]+)\.addEventListener\(\s*(['"])(\w+)\2\s*,\s*([\s\S]*?)\)?$/)) {
    const evName = {
      click: "\uD074\uB9AD",
      submit: "\uC81C\uCD9C",
      input: "\uAE00\uC790 \uC785\uB825",
      change: "\uAC12 \uBCC0\uACBD",
      keydown: "\uD0A4\uBCF4\uB4DC \uB204\uB984",
      load: "\uBD88\uB7EC\uC624\uAE30 \uC644\uB8CC",
      scroll: "\uC2A4\uD06C\uB864",
      mouseover: "\uB9C8\uC6B0\uC2A4 \uC62C\uB9BC"
    };
    return {
      easy: `${m[1]} \uC694\uC18C\uC5D0 '${m[3]}'(${evName[m[3]] || m[3]}) \uC77C\uC774 \uC0DD\uAE30\uBA74 \uB4A4\uC5D0 \uC801\uC740 \uD568\uC218\uB97C \uC2E4\uD589\uD558\uB3C4\uB85D \uC5F0\uACB0\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: `\uC0AC\uC6A9\uC790\uAC00 ${evName[m[3]] || m[3]} \uD589\uB3D9\uC744 \uD588\uC744 \uB54C \uD654\uBA74\uC774 \uBC18\uC751\uD558\uB3C4\uB85D \uB9CC\uB4E4\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`
    };
  }
  if (m = e.match(/^([\w$.]+)\.preventDefault\(\)$/)) {
    return {
      easy: "\uBE0C\uB77C\uC6B0\uC800\uAC00 \uC6D0\uB798 \uD558\uB824\uB358 \uAE30\uBCF8 \uB3D9\uC791(\uC608: \uC591\uC2DD \uC81C\uCD9C \uC2DC \uD398\uC774\uC9C0 \uC0C8\uB85C\uACE0\uCE68, \uB9C1\uD06C \uC774\uB3D9)\uC744 \uB9C9\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.",
      why: "\uD398\uC774\uC9C0\uAC00 \uC0C8\uB85C\uACE0\uCE68\uB418\uC9C0 \uC54A\uACE0, \uB300\uC2E0 \uC9C1\uC811 \uC791\uC131\uD55C \uCF54\uB4DC\uB300\uB85C \uCC98\uB9AC\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (m = e.match(/^([\w$.]+)\.push\(([\s\S]*)\)$/)) {
    return {
      easy: `${m[1]} \uBAA9\uB85D\uC758 \uB9E8 \uB4A4\uC5D0 ${josa(m[2], "\uC744/\uB97C")} \uD558\uB098 \uB354 \uCD94\uAC00\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: "\uBAA9\uB85D\uC5D0 \uC0C8 \uD56D\uBAA9\uC744 \uC313\uC544 \uAC00\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (m = e.match(/^([\w$.]+)\.forEach\(([\s\S]*)\)$/)) {
    const fn = parseArrow(m[2]);
    return {
      easy: `${m[1]} \uBAA9\uB85D\uC758 \uAC12\uC744 \uCC98\uC74C\uBD80\uD130 \uB05D\uAE4C\uC9C0 \uD558\uB098\uC529 \uAEBC\uB0B4${fn ? `(${fn.params})` : ""} \uAC01\uAC01\uC5D0 \uB300\uD574 \uAC19\uC740 \uBA85\uB839\uC744 \uC2E4\uD589\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: "\uBAA9\uB85D\uC5D0 \uB4E0 \uBAA8\uB4E0 \uD56D\uBAA9\uC5D0 \uAC19\uC740 \uC77C\uC744 \uD55C \uBC88\uC529 \uD574\uC8FC\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (m = e.match(/^(useEffect|useLayoutEffect)\(/)) {
    return {
      easy: "\uC544\uB798 { } \uC548\uC5D0 \uC801\uD78C \uBA85\uB839\uC744, \uD654\uBA74\uC774 \uCC98\uC74C \uB098\uD0C0\uB0A0 \uB54C\uC640 \uC9C0\uC815\uD55C \uAC12\uC774 \uBC14\uB014 \uB54C\uB9C8\uB2E4 \uC790\uB3D9\uC73C\uB85C \uC2E4\uD589\uD558\uB3C4\uB85D \uB4F1\uB85D\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.",
      why: "\uC0AC\uC6A9\uC790\uAC00 \uBC84\uD2BC\uC744 \uB204\uB974\uC9C0 \uC54A\uC544\uB3C4 \uD2B9\uC815 \uC21C\uAC04(\uD654\uBA74 \uB4F1\uC7A5, \uAC12 \uBCC0\uACBD)\uC5D0 \uC54C\uC544\uC11C \uD574\uC57C \uD560 \uC77C(\uC608: \uB370\uC774\uD130 \uBD88\uB7EC\uC624\uAE30)\uC744 \uCC98\uB9AC\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (m = e.match(/^(setTimeout|setInterval)\(/)) {
    return {
      easy: m[1] === "setTimeout" ? "\uC544\uB798 { } \uC548\uC758 \uBA85\uB839\uC744 \uBC14\uB85C \uC2E4\uD589\uD558\uC9C0 \uC54A\uACE0, \uC815\uD574\uC9C4 \uC2DC\uAC04\uC774 \uC9C0\uB09C \uB4A4\uC5D0 \uD55C \uBC88 \uC2E4\uD589\uD558\uB3C4\uB85D \uC608\uC57D\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4." : "\uC544\uB798 { } \uC548\uC758 \uBA85\uB839\uC744 \uC815\uD574\uC9C4 \uC2DC\uAC04\uB9C8\uB2E4 \uACC4\uC18D \uBC18\uBCF5\uD574\uC11C \uC2E4\uD589\uD558\uB3C4\uB85D \uC608\uC57D\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.",
      why: "\uC77C\uC815 \uC2DC\uAC04 \uAE30\uB2E4\uB838\uB2E4\uAC00 \uC2E4\uD589\uD574\uC57C \uD558\uB294 \uC77C\uC744 \uCC98\uB9AC\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (m = e.match(/^print\(([\s\S]*)\)$/)) {
    return {
      easy: `\uAD04\uD638 \uC548\uC758 ${josa(m[1], "\uC744/\uB97C")} \uD654\uBA74(\uD130\uBBF8\uB110)\uC5D0 \uAE00\uC790\uB85C \uCD9C\uB825\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: "\uACC4\uC0B0 \uACB0\uACFC\uB098 \uC548\uB0B4 \uBB38\uAD6C\uB97C \uB208\uC73C\uB85C \uD655\uC778\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (m = e.match(/^([\w$.]+)\(([\s\S]*)\)$/)) {
    const args = m[2].trim();
    return {
      easy: `${josa(m[1], "\uC774\uB77C\uB294/\uB77C\uB294")} \uAE30\uB2A5(\uD568\uC218)\uC744 ${args ? `${josa(args, "\uC744/\uB97C")} \uB123\uC5B4\uC11C ` : ""}\uC2E4\uD589\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: `${m[1]} \uAE30\uB2A5\uC5D0 \uBBF8\uB9AC \uC815\uD574 \uB454 \uC77C\uC744 \uC774 \uC2DC\uC810\uC5D0 \uCC98\uB9AC\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`
    };
  }
  return null;
}
function describeOpener(opener) {
  const t = opener.trim();
  let m;
  if (/\buse(Layout)?Effect\(/.test(t)) return "useEffect \uC790\uB3D9 \uC2E4\uD589 \uBB36\uC74C";
  if (/\bsetTimeout\(/.test(t)) return "setTimeout \uC608\uC57D \uBB36\uC74C";
  if (/\bsetInterval\(/.test(t)) return "setInterval \uBC18\uBCF5 \uC608\uC57D \uBB36\uC74C";
  if (m = t.match(/^(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*([\w$]*)/)) return m[1] ? `${m[1]} \uD568\uC218` : "\uD568\uC218";
  if (m = t.match(/^(?:export\s+)?(?:const|let|var)\s+([\w$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[\w$]+)\s*=>/)) return `${m[1]} \uD568\uC218`;
  if (/^(\}\s*)?else\s+if\b|^if\b/.test(t)) return "if \uC870\uAC74 \uBB36\uC74C";
  if (/^(\}\s*)?else\b/.test(t)) return "else \uBB36\uC74C";
  if (/^(for|while)\b/.test(t)) return "\uBC18\uBCF5 \uBB36\uC74C";
  if (/^try\b/.test(t)) return "try \uBB36\uC74C";
  if (/^switch\b/.test(t)) return "switch \uBB36\uC74C";
  if (/^(\}\s*)?catch\b/.test(t)) return "catch \uC624\uB958 \uCC98\uB9AC \uBB36\uC74C";
  if (m = t.match(/^(?:export\s+)?(?:default\s+)?class\s+([\w$]+)/)) return `${m[1]} \uD074\uB798\uC2A4`;
  if (/addEventListener\(/.test(t)) return "\uC774\uBCA4\uD2B8 \uCC98\uB9AC \uBB36\uC74C";
  if (/\.then\(/.test(t)) return "\uD6C4\uC18D \uCC98\uB9AC \uBB36\uC74C";
  if (/return\s*\($/.test(t)) return "\uD654\uBA74 \uBAA8\uC591(JSX) \uBB36\uC74C";
  if (/=>\s*\{$/.test(t)) return "\uD568\uC218 \uBB36\uC74C";
  if (/=\s*\{$/.test(t)) return "\uBB36\uC74C(\uAC1D\uCCB4)";
  if (/=\s*\[$/.test(t)) return "\uBAA9\uB85D(\uBC30\uC5F4)";
  if (/^[.#a-zA-Z*:\[][^=(){};]*\{$/.test(t)) return `'${t.replace(/\s*\{$/, "")}' \uAFB8\uBC08 \uADDC\uCE59 \uBB36\uC74C`;
  return "{ } \uBB36\uC74C";
}
function describeCodeForBeginner(line, opener, stack = []) {
  const t = line.trim();
  const css = describeCssLine(line, stack);
  if (css) return { role: css.role, definition: css.definition, easy: css.easy, why: css.why, tokens: css.tokens };
  const d = describeKeyword(t, stack) || describeLine(line, opener);
  if (!d) return null;
  if (!d.definition) {
    const rhs = t.match(/^(?:(?:export\s+)?(?:const|let|var)\s+[^=]+=|return\s+|[\w$.]+\s*=)\s*(?:await\s+)?([\s\S]+?);?$/)?.[1];
    const known = rhs && matchKnown(rhs) || matchKnown(t);
    d.definition = known?.entry.def || definitionFor(t);
  }
  return d;
}
function describeLine(line, opener) {
  const t = line.trim();
  if (!t) return null;
  let m;
  if (m = t.match(/^(\/\/|#(?![\w-]+\s*\{)|\/\*+|\*)\s*(.*?)\s*(\*\/)?$/)) {
    const memo = m[2] || "(\uB0B4\uC6A9 \uC5C6\uC74C)";
    return {
      role: "\uC124\uBA85 \uBA54\uBAA8 (\uC8FC\uC11D)",
      easy: `\uCEF4\uD4E8\uD130\uB294 \uBB34\uC2DC\uD558\uACE0 \uC0AC\uB78C\uB9CC \uC77D\uB294 \uC124\uBA85 \uBA54\uBAA8(\uC8FC\uC11D)\uC785\uB2C8\uB2E4. \uC801\uD78C \uB0B4\uC6A9\uC740 ${josa(`'${memo}'`, "\uC774\uB77C\uB294/\uB77C\uB294")} \uB73B\uC785\uB2C8\uB2E4.`,
      why: "\uB098\uC911\uC5D0 \uCF54\uB4DC\uB97C \uC77D\uB294 \uC0AC\uB78C\uC774 \uC774 \uBD80\uBD84\uC774 \uBB34\uC2A8 \uC77C\uC744 \uD558\uB294\uC9C0 \uBE68\uB9AC \uC54C\uC544\uBCFC \uC218 \uC788\uB3C4\uB85D \uB0A8\uACA8 \uB454 \uAC83\uC785\uB2C8\uB2E4."
    };
  }
  if (/^[\]})]/.test(t)) {
    const name = opener ? describeOpener(opener) : "{ } \uBB36\uC74C";
    const rest = t.replace(/^[\]})]+/, "");
    let easy = `\uC704\uC5D0\uC11C \uC2DC\uC791\uD55C ${josa(name, "\uC744/\uB97C")} \uC5EC\uAE30\uC11C \uB2EB\uB294`;
    let why = "\uC5B4\uB514\uAE4C\uC9C0\uAC00 \uD55C \uBB36\uC74C\uC778\uC9C0 \uCEF4\uD4E8\uD130\uC5D0\uAC8C \uC815\uD655\uD788 \uC54C\uB824\uC8FC\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.";
    const delay = rest.match(/^\s*,\s*(\d+)\s*\)/);
    const deps = rest.match(/^\s*,\s*\[([^\]]*)\]\s*\)/);
    const elseNext = rest.match(/^\s*else\b(\s+if\s*\((.*)\))?/);
    const catchNext = rest.match(/^\s*catch\b/);
    if (delay && opener && /setTimeout|setInterval/.test(opener)) {
      const ms = Number(delay[1]);
      const sec = ms / 1e3;
      easy += /setInterval/.test(opener) ? ` \uB3D9\uC2DC\uC5D0, \uADF8 \uC548\uC758 \uBA85\uB839\uC744 ${ms}\uBC00\uB9AC\uCD08(${sec}\uCD08)\uB9C8\uB2E4 \uBC18\uBCF5 \uC2E4\uD589\uD558\uB3C4\uB85D \uC2DC\uAC04\uC744 \uC815\uD558\uB294` : ` \uB3D9\uC2DC\uC5D0, \uADF8 \uC548\uC758 \uBA85\uB839\uC744 ${ms}\uBC00\uB9AC\uCD08(${sec}\uCD08) \uB4A4\uC5D0 \uD55C \uBC88 \uC2E4\uD589\uD558\uB3C4\uB85D \uC2DC\uAC04\uC744 \uC815\uD558\uB294`;
      why = `\uBC14\uB85C \uC2E4\uD589\uD558\uC9C0 \uC54A\uACE0 ${sec}\uCD08 \uAE30\uB2E4\uB838\uB2E4\uAC00 \uC2E4\uD589\uD558\uB3C4\uB85D \uC2DC\uAC04 \uAC04\uACA9\uC744 \uB450\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`;
    } else if (deps && opener && /use(Layout)?Effect|useMemo|useCallback/.test(opener)) {
      const list = deps[1].trim();
      if (list) {
        easy += ` \uB3D9\uC2DC\uC5D0, ${list} \uAC12\uC774 \uBC14\uB014 \uB54C\uB9C8\uB2E4 \uC774 \uBB36\uC74C\uC744 \uB2E4\uC2DC \uC2E4\uD589\uD558\uB77C\uACE0 \uC815\uD558\uB294`;
        why = `${list} \uAC12\uC774 \uBC14\uB014 \uB54C\uB9CC \uD544\uC694\uD55C \uC791\uC5C5\uC744 \uB2E4\uC2DC \uD558\uB3C4\uB85D \uD574\uC11C, \uC4F8\uB370\uC5C6\uC774 \uBC18\uBCF5 \uC2E4\uD589\uB418\uB294 \uAC83\uC744 \uB9C9\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`;
      } else {
        easy += " \uB3D9\uC2DC\uC5D0, \uC774 \uBB36\uC74C\uC744 \uD654\uBA74\uC774 \uCC98\uC74C \uB098\uD0C0\uB0A0 \uB54C \uB531 \uD55C \uBC88\uB9CC \uC2E4\uD589\uD558\uB77C\uACE0 \uC815\uD558\uB294";
        why = "\uCC98\uC74C \uD55C \uBC88\uB9CC \uD558\uBA74 \uB418\uB294 \uC77C(\uC608: \uCCAB \uB370\uC774\uD130 \uBD88\uB7EC\uC624\uAE30)\uC744 \uBC18\uBCF5\uD558\uC9C0 \uC54A\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.";
      }
    } else if (elseNext) {
      easy += elseNext[1] ? ` \uB3D9\uC2DC\uC5D0, \uC704 \uC870\uAC74\uC774 \uB9DE\uC9C0 \uC54A\uC558\uC744 \uB54C \uB2E4\uC2DC ${explainCondition(elseNext[2])} \uC544\uB798 { } \uC548\uC758 \uBA85\uB839\uC744 \uC2E4\uD589\uD558\uB77C\uACE0 \uC774\uC5B4\uC11C \uC815\uD558\uB294` : " \uB3D9\uC2DC\uC5D0, \uC704 \uC870\uAC74\uC774 \uB9DE\uC9C0 \uC54A\uC558\uC744 \uB54C\uB294 \uC544\uB798 { } \uC548\uC758 \uBA85\uB839\uC744 \uB300\uC2E0 \uC2E4\uD589\uD558\uB77C\uACE0 \uC815\uD558\uB294";
      why = "\uC870\uAC74\uC5D0 \uB530\uB77C \uC11C\uB85C \uB2E4\uB978 \uC77C\uC744 \uD558\uB3C4\uB85D \uAC08\uB9BC\uAE38\uC744 \uB9CC\uB4E4\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.";
    } else if (catchNext) {
      easy += " \uB3D9\uC2DC\uC5D0, \uC704\uC5D0\uC11C \uC624\uB958\uAC00 \uB098\uBA74 \uC544\uB798 { } \uC548\uC758 \uBA85\uB839\uC73C\uB85C \uB300\uC2E0 \uCC98\uB9AC\uD558\uB77C\uACE0 \uC815\uD558\uB294";
      why = "\uC624\uB958\uAC00 \uB098\uB3C4 \uD504\uB85C\uADF8\uB7A8\uC774 \uBA48\uCD94\uC9C0 \uC54A\uACE0 \uB300\uCC98\uD560 \uC218 \uC788\uAC8C \uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.";
    }
    return { role: `${name} \uB2EB\uAE30`, easy: `${easy} \uC904\uC785\uB2C8\uB2E4.`, why };
  }
  if (m = t.match(/^import\s+(.+?)\s+from\s+['"](.+?)['"];?$/)) {
    const what = m[1].trim();
    const from = m[2];
    const names = what.startsWith("{") ? splitTopLevel(what.replace(/^\{|\}$/g, "")).map((n) => n.split(/\s+as\s+/)[0].trim()) : [what.replace(/^\*\s+as\s+/, "")];
    const lib = from.startsWith(".") ? `\uAC19\uC740 \uD504\uB85C\uC81D\uD2B8 \uC548\uC758 '${from}' \uD30C\uC77C` : `'${from}'\uB77C\uB294 \uC774\uBBF8 \uB9CC\uB4E4\uC5B4\uC9C4 \uB3C4\uAD6C \uBAA8\uC74C(\uB77C\uC774\uBE0C\uB7EC\uB9AC)`;
    const known = names.filter((n) => REACT_HOOKS[n]).map((n) => `${n}(${REACT_HOOKS[n]})`);
    return {
      role: `${names.join(", ")} \uAC00\uC838\uC624\uAE30`,
      easy: `${lib}\uC5D0\uC11C ${josa(names.join(", "), "\uC774\uB77C\uB294/\uB77C\uB294")} \uAE30\uB2A5\uC744 \uAC00\uC838\uC640 \uC774 \uD30C\uC77C\uC5D0\uC11C \uC4F8 \uC218 \uC788\uAC8C \uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.${known.length ? ` \uAC00\uC838\uC628 \uAE30\uB2A5\uC740 ${known.join(", ")}\uC785\uB2C8\uB2E4.` : ""}`,
      why: `\uC544\uB798 \uCF54\uB4DC\uC5D0\uC11C ${josa(names.join(", "), "\uC744/\uB97C")} \uC0AC\uC6A9\uD558\uAE30 \uC704\uD574, \uC9C1\uC811 \uB9CC\uB4E4\uC9C0 \uC54A\uACE0 \uC774\uBBF8 \uB9CC\uB4E4\uC5B4\uC9C4 \uAC83\uC744 \uBBF8\uB9AC \uBD88\uB7EC\uC628 \uAC83\uC785\uB2C8\uB2E4.`
    };
  }
  if (m = t.match(/^import\s+['"](.+?)['"];?$/)) {
    return {
      role: "\uD30C\uC77C \uBD88\uB7EC\uC624\uAE30",
      easy: `'${m[1]}' \uD30C\uC77C\uC744 \uBD88\uB7EC\uC640\uC11C \uC774 \uD654\uBA74\uC5D0 \uC801\uC6A9\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: m[1].endsWith(".css") ? "\uC774 \uD654\uBA74\uC744 \uAFB8\uBBF8\uB294 \uB514\uC790\uC778 \uADDC\uCE59(\uC0C9, \uD06C\uAE30, \uBC30\uCE58)\uC744 \uC801\uC6A9\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4." : "\uADF8 \uD30C\uC77C\uC5D0 \uB4E4\uC5B4\uC788\uB294 \uCF54\uB4DC\uB97C \uBBF8\uB9AC \uC2E4\uD589\uD574 \uB450\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if ((m = t.match(/^from\s+([\w.]+)\s+import\s+(.+)$/)) || (m = t.match(/^import\s+([\w., ]+)$/))) {
    const lib = m[1];
    const names = m[2] ? m[2] : m[1];
    return {
      role: `${names} \uAC00\uC838\uC624\uAE30`,
      easy: m[2] ? `'${lib}'\uB77C\uB294 \uB3C4\uAD6C \uBAA8\uC74C\uC5D0\uC11C ${josa(names, "\uC774\uB77C\uB294/\uB77C\uB294")} \uAE30\uB2A5\uC744 \uAC00\uC838\uC640 \uC774 \uD30C\uC77C\uC5D0\uC11C \uC4F8 \uC218 \uC788\uAC8C \uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.` : `${josa(`'${lib}'`, "\uC774\uB77C\uB294/\uB77C\uB294")} \uB3C4\uAD6C \uBAA8\uC74C(\uB77C\uC774\uBE0C\uB7EC\uB9AC)\uC744 \uD1B5\uC9F8\uB85C \uAC00\uC838\uC640 \uC774 \uD30C\uC77C\uC5D0\uC11C \uC4F8 \uC218 \uC788\uAC8C \uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: "\uD544\uC694\uD55C \uAE30\uB2A5\uC744 \uC9C1\uC811 \uB9CC\uB4E4\uC9C0 \uC54A\uACE0 \uC774\uBBF8 \uB9CC\uB4E4\uC5B4\uC9C4 \uAC83\uC744 \uAC00\uC838\uB2E4 \uC4F0\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (m = t.match(/^(export\s+)?(default\s+)?(async\s+)?function\s*([\w$]*)\s*\(([^)]*)\)\s*\{?$/)) {
    const [, exp, , isAsync, name, params] = m;
    return describeFunction(name || "(\uC774\uB984 \uC5C6\uB294)", params, Boolean(exp), Boolean(isAsync));
  }
  if (m = t.match(/^(export\s+)?(const|let|var)\s+([\w$]+)\s*=\s*(async\s*)?(?:\(([^)]*)\)|([\w$]+))\s*=>\s*\{?$/)) {
    return describeFunction(m[3], m[5] ?? m[6] ?? "", Boolean(m[1]), Boolean(m[4]));
  }
  if (m = t.match(/^def\s+(\w+)\s*\(([^)]*)\)\s*:$/)) {
    return describeFunction(m[1], m[2], false, false, true);
  }
  if (m = t.match(/^(const|let)\s+\[\s*([\w$]+)\s*,\s*([\w$]+)\s*\]\s*=\s*useState(?:<[^>]*>)?\(([\s\S]*)\);?$/)) {
    const [, , val, setter, init] = m;
    return {
      role: `${val} \uC0C1\uD0DC(\uAE30\uC5B5 \uAC12) \uB9CC\uB4E4\uAE30`,
      easy: `${josa(val, "\uC774\uB77C\uB294/\uB77C\uB294")} \uAC12\uACFC, \uADF8 \uAC12\uC744 \uBC14\uAFC0 \uB54C \uC4F0\uB294 ${josa(setter, "\uC774\uB77C\uB294/\uB77C\uB294")} \uAE30\uB2A5\uC744 \uD55C \uC30D\uC73C\uB85C \uB9CC\uB4E4\uACE0, ${val}\uC758 \uCC98\uC74C \uAC12\uC740 ${init.trim() ? josa(explainValue(init), "\uC73C\uB85C/\uB85C") : "\uBE44\uC5B4 \uC788\uB294 \uAC12\uC73C\uB85C"} \uC815\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: `\uD654\uBA74\uC5D0 \uBCF4\uC5EC\uC904 ${josa(val, "\uC744/\uB97C")} \uAE30\uC5B5\uD574 \uB450\uC5C8\uB2E4\uAC00, ${josa(setter, "\uC73C\uB85C/\uB85C")} \uAC12\uC774 \uBC14\uB00C\uBA74 \uD654\uBA74\uC774 \uC790\uB3D9\uC73C\uB85C \uB2E4\uC2DC \uADF8\uB824\uC9C0\uAC8C \uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`
    };
  }
  if (m = t.match(/^(const|let|var)\s+([{[])\s*([^=]+?)\s*[}\]]\s*=\s*([\s\S]+?);?$/)) {
    const names = splitTopLevel(m[3]).map((n) => n.split(/[:=]/)[0].trim()).join(", ");
    const src = m[4];
    return {
      role: `${names} \uAEBC\uB0B4\uAE30`,
      easy: m[2] === "{" ? `${src} \uBB36\uC74C(\uAC1D\uCCB4) \uC548\uC5D0\uC11C ${josa(names, "\uC774\uB77C\uB294/\uB77C\uB294")} \uC774\uB984\uC758 \uAC12\uC744 \uAC01\uAC01 \uAEBC\uB0B4, \uAC19\uC740 \uC774\uB984\uC758 \uC0C1\uC790\uC5D0 \uD558\uB098\uC529 \uB2F4\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.` : `${src} \uBAA9\uB85D(\uBC30\uC5F4)\uC758 \uC55E\uC5D0\uC11C\uBD80\uD130 \uAC12\uC744 \uC21C\uC11C\uB300\uB85C \uAEBC\uB0B4 ${names} \uC0C1\uC790\uC5D0 \uD558\uB098\uC529 \uB2F4\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: `${src}.${names.split(", ")[0]}\uCC98\uB7FC \uAE38\uAC8C \uC4F0\uC9C0 \uC54A\uACE0 \uC9E7\uC740 \uC774\uB984\uC73C\uB85C \uBC14\uB85C \uC4F0\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`
    };
  }
  if (m = t.match(/^(const|let|var)\s+([\w$]+)\s*=\s*(setTimeout|setInterval)\(/)) {
    const [, , name, fn] = m;
    return {
      role: `${fn} \uC608\uC57D (${name})`,
      easy: fn === "setTimeout" ? `\uC544\uB798 { } \uC548\uC758 \uBA85\uB839\uC744 \uC815\uD574\uC9C4 \uC2DC\uAC04\uC774 \uC9C0\uB09C \uB4A4\uC5D0 \uD55C \uBC88 \uC2E4\uD589\uD558\uB3C4\uB85D \uC608\uC57D\uD558\uACE0, \uADF8 \uC608\uC57D \uBC88\uD638\uB97C ${josa(name, "\uC774\uB77C\uB294/\uB77C\uB294")} \uC774\uB984\uD45C \uC0C1\uC790\uC5D0 \uB2F4\uC544 \uB450\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.` : `\uC544\uB798 { } \uC548\uC758 \uBA85\uB839\uC744 \uC815\uD574\uC9C4 \uC2DC\uAC04\uB9C8\uB2E4 \uBC18\uBCF5 \uC2E4\uD589\uD558\uB3C4\uB85D \uC608\uC57D\uD558\uACE0, \uADF8 \uC608\uC57D \uBC88\uD638\uB97C ${josa(name, "\uC774\uB77C\uB294/\uB77C\uB294")} \uC774\uB984\uD45C \uC0C1\uC790\uC5D0 \uB2F4\uC544 \uB450\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: `\uB098\uC911\uC5D0 ${fn === "setTimeout" ? "clearTimeout" : "clearInterval"}(${name})\uC73C\uB85C \uC774 \uC608\uC57D\uC744 \uCDE8\uC18C\uD560 \uC218 \uC788\uB3C4\uB85D \uC608\uC57D \uBC88\uD638\uB97C \uC800\uC7A5\uD574 \uB450\uB824\uACE0 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`
    };
  }
  if (m = t.match(/^(const|let|var)\s+([\w$]+)(?:\s*:\s*[^=]+)?\s*=\s*([\s\S]+?);?$/)) {
    const [, kw, name, value] = m;
    const changeable = kw === "const" ? "\uD55C \uBC88 \uB123\uC73C\uBA74 \uB2E4\uB978 \uAC12\uC73C\uB85C \uBC14\uAFC0 \uC218 \uC5C6\uB294" : "\uB098\uC911\uC5D0 \uB2E4\uB978 \uAC12\uC73C\uB85C \uBC14\uAFC0 \uC218 \uC788\uB294";
    return {
      role: `${name} \uBCC0\uC218 \uB9CC\uB4E4\uAE30`,
      easy: `${josa(name, "\uC774\uB77C\uB294/\uB77C\uB294")} \uC774\uB984\uD45C\uB97C \uBD99\uC778 \uC0C1\uC790(${changeable} \uBCC0\uC218)\uB97C \uB9CC\uB4E4\uACE0, \uADF8 \uC548\uC5D0 ${josa(explainValue(value), "\uC744/\uB97C")} \uB123\uC5B4\uB450\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: `\uC774 \uAC12\uC744 ${josa(name, "\uC774\uB77C\uB294/\uB77C\uB294")} \uC774\uB984\uC73C\uB85C \uAE30\uC5B5\uD574 \uB450\uC5C8\uB2E4\uAC00, \uC544\uB798 \uCF54\uB4DC\uC5D0\uC11C \uC774\uB984\uB9CC \uBD88\uB7EC \uB2E4\uC2DC \uC4F0\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`
    };
  }
  if ((m = t.match(/^([a-zA-Z_]\w*)\s*=\s*([^=][\s\S]*)$/)) && !t.endsWith(";") && !t.includes("=>")) {
    return {
      role: `${m[1]} \uAC12 \uC800\uC7A5`,
      easy: `${josa(m[1], "\uC774\uB77C\uB294/\uB77C\uB294")} \uC774\uB984\uD45C \uC0C1\uC790\uC5D0 ${josa(explainValue(m[2]), "\uC744/\uB97C")} \uB123\uC5B4\uB450\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: `\uC774 \uAC12\uC744 ${josa(m[1], "\uC774\uB77C\uB294/\uB77C\uB294")} \uC774\uB984\uC73C\uB85C \uAE30\uC5B5\uD574 \uB450\uC5C8\uB2E4\uAC00 \uB2E4\uC2DC \uC4F0\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`
    };
  }
  const oneLine = splitIfOneLiner(t);
  if (oneLine) {
    const cond = explainCondition(oneLine.cond);
    const body = oneLine.body;
    let r;
    if (r = body.match(/^return\s*([^;]*);?$/)) {
      return {
        role: "\uC870\uAC74\uC774 \uB9DE\uC73C\uBA74 \uBA48\uCD94\uAE30",
        easy: `\uB9CC\uC57D ${cond} \uC5EC\uAE30\uC11C \uBC14\uB85C \uBA48\uCD94\uACE0${r[1] ? ` ${josa(r[1], "\uC744/\uB97C")} \uACB0\uACFC\uB85C \uB3CC\uB824\uC8FC\uBA70` : ""}, \uC544\uB798\uC5D0 \uC788\uB294 \uBA85\uB839\uC740 \uC2E4\uD589\uD558\uC9C0 \uC54A\uB294 \uC870\uAC74\uBB38\uC785\uB2C8\uB2E4.`,
        why: "\uD560 \uD544\uC694\uAC00 \uC5C6\uB294 \uC0C1\uD669(\uC608: \uC785\uB825\uAC12\uC774 \uBE44\uC5B4 \uC788\uC744 \uB54C)\uC5D0\uB294 \uC544\uB798 \uC791\uC5C5\uC744 \uC544\uC608 \uD558\uC9C0 \uC54A\uB3C4\uB85D \uBBF8\uB9AC \uAC78\uB7EC\uB0B4\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
      };
    }
    if (/^continue;?$/.test(body)) {
      return {
        role: "\uC870\uAC74\uC774 \uB9DE\uC73C\uBA74 \uC774\uBC88 \uCC28\uB840 \uAC74\uB108\uB6F0\uAE30",
        easy: `\uB9CC\uC57D ${cond} \uC774\uBC88 \uCC28\uB840\uC758 \uB0A8\uC740 \uBA85\uB839\uC740 \uAC74\uB108\uB6F0\uACE0 \uBC14\uB85C \uB2E4\uC74C \uCC28\uB840 \uBC18\uBCF5\uC73C\uB85C \uB118\uC5B4\uAC00\uB294 \uC870\uAC74\uBB38\uC785\uB2C8\uB2E4.`,
        why: "\uC870\uAC74\uC5D0 \uB9DE\uC9C0 \uC54A\uB294 \uD56D\uBAA9(\uC608: \uBE44\uC5B4 \uC788\uB294 \uAC12)\uC740 \uCC98\uB9AC\uD558\uC9C0 \uC54A\uACE0 \uB118\uC5B4\uAC00\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
      };
    }
    if (/^break;?$/.test(body)) {
      return {
        role: "\uC870\uAC74\uC774 \uB9DE\uC73C\uBA74 \uBC18\uBCF5 \uB05D\uB0B4\uAE30",
        easy: `\uB9CC\uC57D ${cond} \uBC18\uBCF5\uC744 \uADF8 \uC790\uB9AC\uC5D0\uC11C \uBC14\uB85C \uB05D\uB0B4\uACE0 \uBC18\uBCF5 \uBB36\uC74C \uB2E4\uC74C \uCF54\uB4DC\uB85C \uB118\uC5B4\uAC00\uB294 \uC870\uAC74\uBB38\uC785\uB2C8\uB2E4.`,
        why: "\uC6D0\uD558\uB294 \uAC83\uC744 \uCC3E\uC558\uAC70\uB098 \uB354 \uBC18\uBCF5\uD560 \uD544\uC694\uAC00 \uC5C6\uC744 \uB54C \uBC14\uB85C \uB05D\uB0B4\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
      };
    }
    const inner = describeLine(body) || describeKeyword(body);
    return {
      role: "\uC870\uAC74\uC774 \uB9DE\uC73C\uBA74 \uD55C \uAC00\uC9C0 \uC2E4\uD589",
      easy: `\uB9CC\uC57D ${cond} \uB4A4\uC5D0 \uC801\uD78C \uBA85\uB839 \uD558\uB098\uB97C \uC2E4\uD589\uD558\uB294 \uC870\uAC74\uBB38\uC785\uB2C8\uB2E4.${inner ? ` \uADF8 \uBA85\uB839\uC740 ${inner.easy}` : ""}`,
      why: "\uD2B9\uC815 \uC0C1\uD669\uC5D0\uC11C\uB9CC \uADF8 \uBA85\uB839\uC744 \uC2E4\uD589\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if ((m = t.match(/^if\s*\((.+)\)\s*\{?$/)) || (m = t.match(/^if\s+(.+):$/))) {
    return {
      role: "\uC870\uAC74 \uAC80\uC0AC (if)",
      easy: `\uB9CC\uC57D ${explainCondition(m[1])} \uC544\uB798 { } \uC548\uC758 \uBA85\uB839\uC744 \uC2E4\uD589\uD558\uACE0, \uC544\uB2C8\uBA74 \uAC74\uB108\uB6F0\uB77C\uB294 \uC870\uAC74\uBB38\uC785\uB2C8\uB2E4.`,
      why: "\uC0C1\uD669\uC5D0 \uB530\uB77C \uD574\uC57C \uD560 \uC77C\uC774 \uB2E4\uB97C \uB54C, \uC870\uAC74\uC774 \uB9DE\uB294 \uACBD\uC6B0\uC5D0\uB9CC \uD2B9\uC815 \uC791\uC5C5\uC744 \uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if ((m = t.match(/^(?:\}\s*)?else\s+if\s*\((.+)\)\s*\{?$/)) || (m = t.match(/^elif\s+(.+):$/))) {
    return {
      role: "\uB2E4\uB978 \uC870\uAC74 \uAC80\uC0AC (else if)",
      easy: `\uC704 \uC870\uAC74\uC774 \uB9DE\uC9C0 \uC54A\uC558\uC744 \uB54C, \uB2E4\uC2DC ${explainCondition(m[1])} \uC544\uB798 { } \uC548\uC758 \uBA85\uB839\uC744 \uC2E4\uD589\uD558\uB77C\uB294 \uC870\uAC74\uBB38\uC785\uB2C8\uB2E4.`,
      why: "\uC5EC\uB7EC \uACBD\uC6B0\uB97C \uCC28\uB840\uB300\uB85C \uAC80\uC0AC\uD574\uC11C \uACBD\uC6B0\uB9C8\uB2E4 \uB2E4\uB978 \uC77C\uC744 \uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (/^(\}\s*)?else\s*\{?$/.test(t) || t === "else:") {
    return {
      role: "\uB098\uBA38\uC9C0 \uACBD\uC6B0 (else)",
      easy: "\uC704\uC758 \uC870\uAC74\uB4E4\uC774 \uD558\uB098\uB3C4 \uB9DE\uC9C0 \uC54A\uC558\uC744 \uB54C \uC544\uB798 { } \uC548\uC758 \uBA85\uB839\uC744 \uB300\uC2E0 \uC2E4\uD589\uD558\uB77C\uB294 \uB73B\uC785\uB2C8\uB2E4.",
      why: "\uC870\uAC74\uC5D0 \uD574\uB2F9\uD558\uC9C0 \uC54A\uB294 \uB098\uBA38\uC9C0 \uBAA8\uB4E0 \uACBD\uC6B0\uB97C \uBE60\uC9D0\uC5C6\uC774 \uCC98\uB9AC\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if ((m = t.match(/^for\s*\(\s*(?:const|let|var)\s+([\w$[\]{}, ]+?)\s+of\s+(.+?)\)\s*\{?$/)) || (m = t.match(/^for\s+(\w+)\s+in\s+(.+):$/))) {
    return {
      role: `${m[2]} \uD558\uB098\uC529 \uBC18\uBCF5`,
      easy: `${m[2]} \uBAA9\uB85D\uC5D0\uC11C \uAC12\uC744 \uCC98\uC74C\uBD80\uD130 \uD558\uB098\uC529 \uAEBC\uB0B4 ${josa(m[1].trim(), "\uC774\uB77C\uACE0/\uB77C\uACE0")} \uBD80\uB974\uBA74\uC11C, \uC544\uB798 \uBA85\uB839\uC744 \uBAA9\uB85D \uAC1C\uC218\uB9CC\uD07C \uBC18\uBCF5\uD558\uB294 \uBC18\uBCF5\uBB38\uC785\uB2C8\uB2E4.`,
      why: "\uBAA9\uB85D\uC5D0 \uB4E0 \uBAA8\uB4E0 \uD56D\uBAA9\uC5D0 \uAC19\uC740 \uC77C\uC744 \uD558\uB098\uC529 \uD574\uC8FC\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (m = t.match(/^for\s*\(\s*(?:let|var)\s+(\w+)\s*=\s*([^;]+);\s*([^;]+);\s*([^)]+)\)\s*\{?$/)) {
    const [, i, start, cond, step] = m;
    const stepKo = /\+\+|\+=\s*1\b/.test(step) ? "1\uC529 \uB298\uB824\uAC00\uBA70" : /--|-=\s*1\b/.test(step) ? "1\uC529 \uC904\uC5EC\uAC00\uBA70" : `${step} \uADDC\uCE59\uC73C\uB85C \uBC14\uAFD4\uAC00\uBA70`;
    return {
      role: "\uD69F\uC218\uB9CC\uD07C \uBC18\uBCF5 (for)",
      easy: `${josa(i, "\uC744/\uB97C")} ${start.trim()}\uBD80\uD130 \uC2DC\uC791\uD574\uC11C ${stepKo}, ${explainCondition(cond)} \uC544\uB798 \uBA85\uB839\uC744 \uACC4\uC18D \uBC18\uBCF5\uD558\uB294 \uBC18\uBCF5\uBB38\uC785\uB2C8\uB2E4. \uC870\uAC74\uC774 \uB9DE\uC9C0 \uC54A\uAC8C \uB418\uBA74 \uBC18\uBCF5\uC774 \uB05D\uB0A9\uB2C8\uB2E4.`,
      why: "\uAC19\uC740 \uC77C\uC744 \uC815\uD574\uC9C4 \uD69F\uC218\uB9CC\uD07C \uC5EC\uB7EC \uBC88 \uBC18\uBCF5\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if ((m = t.match(/^while\s*\((.+)\)\s*\{?$/)) || (m = t.match(/^while\s+(.+):$/))) {
    return {
      role: "\uC870\uAC74 \uB3D9\uC548 \uBC18\uBCF5 (while)",
      easy: `${explainCondition(m[1])} \uC544\uB798 \uBA85\uB839\uC744 \uACC4\uC18D \uBC18\uBCF5\uD558\uACE0, \uC870\uAC74\uC774 \uB9DE\uC9C0 \uC54A\uAC8C \uB418\uBA74 \uBC18\uBCF5\uC744 \uBA48\uCD94\uB294 \uBC18\uBCF5\uBB38\uC785\uB2C8\uB2E4.`,
      why: "\uBA87 \uBC88 \uBC18\uBCF5\uD560\uC9C0 \uBBF8\uB9AC \uBAA8\uB97C \uB54C, \uC870\uAC74\uC774 \uB9DE\uB294 \uB3D9\uC548 \uACC4\uC18D \uBC18\uBCF5\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (m = t.match(/^return\s*\(?\s*$/)) {
    return {
      role: "\uD654\uBA74 \uBAA8\uC591 \uB3CC\uB824\uC8FC\uAE30",
      easy: t === "return" || t === "return;" ? "\uC774 \uD568\uC218\uB97C \uC5EC\uAE30\uC11C \uB05D\uB0B4\uACE0 \uBE60\uC838\uB098\uAC00\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4." : "\uC774 \uD568\uC218\uC758 \uACB0\uACFC\uB85C, \uC544\uB798 \uAD04\uD638 \uC548\uC5D0 \uC801\uD78C \uD654\uBA74 \uBAA8\uC591(JSX)\uC744 \uB3CC\uB824\uC8FC\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.",
      why: "\uC774 \uBD80\uD488\uC774 \uD654\uBA74\uC5D0 \uC5B4\uB5A4 \uBAA8\uC591\uC73C\uB85C \uBCF4\uC5EC\uC57C \uD558\uB294\uC9C0 \uC54C\uB824\uC8FC\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (m = t.match(/^return\s+([\s\S]+?);?$/)) {
    const val = m[1];
    const fn = parseArrow(val);
    if (fn) {
      const inner = explainCall(fn.body);
      return {
        role: "\uC815\uB9AC \uD568\uC218 \uB3CC\uB824\uC8FC\uAE30",
        easy: `\uACB0\uACFC\uB85C '\uB098\uC911\uC5D0 \uC2E4\uD589\uD560 \uD568\uC218'\uB97C \uB3CC\uB824\uC8FC\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4. \uADF8 \uD568\uC218\uB294 ${josa(fn.body, "\uC744/\uB97C")} \uC2E4\uD589\uD569\uB2C8\uB2E4${inner ? ` \u2014 ${inner.easy.replace(/ 명령어입니다\.$/, "")} \uC77C\uC785\uB2C8\uB2E4` : ""}.`,
        why: "useEffect \uC548\uC774\uB77C\uBA74, \uD654\uBA74\uC774 \uC0AC\uB77C\uC9C0\uAC70\uB098 \uB2E4\uC2DC \uC2E4\uD589\uB418\uAE30 \uC9C1\uC804\uC5D0 \uC55E\uC5D0\uC11C \uD574 \uB454 \uC77C(\uC608\uC57D, \uC5F0\uACB0)\uC744 \uAE68\uB057\uC774 \uC815\uB9AC\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
      };
    }
    return {
      role: "\uACB0\uACFC \uB3CC\uB824\uC8FC\uAE30 (return)",
      easy: `\uC774 \uD568\uC218\uC758 \uACB0\uACFC\uB85C ${josa(explainValue(val), "\uC744/\uB97C")} \uB3CC\uB824\uC8FC\uACE0, \uD568\uC218\uB97C \uC5EC\uAE30\uC11C \uB05D\uB0B4\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: "\uC774 \uD568\uC218\uB97C \uBD80\uB978 \uACF3\uC5D0\uC11C \uACB0\uACFC\uAC12\uC744 \uBC1B\uC544 \uC4F8 \uC218 \uC788\uAC8C \uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (/^try\s*\{?$/.test(t) || t === "try:") {
    return {
      role: "\uC624\uB958 \uB300\uBE44 \uC2DC\uC791 (try)",
      easy: "\uC544\uB798 { } \uC548\uC758 \uBA85\uB839\uC744 \uC77C\uB2E8 \uC2DC\uB3C4\uD574 \uBCF4\uACE0, \uB3C4\uC911\uC5D0 \uC624\uB958\uAC00 \uB098\uBA74 catch \uBD80\uBD84\uC73C\uB85C \uB118\uC5B4\uAC00\uB77C\uB294 \uB73B\uC785\uB2C8\uB2E4.",
      why: "\uC624\uB958\uAC00 \uB0A0 \uC218 \uC788\uB294 \uC791\uC5C5(\uC11C\uBC84 \uC694\uCCAD \uB4F1) \uB54C\uBB38\uC5D0 \uD504\uB85C\uADF8\uB7A8 \uC804\uCCB4\uAC00 \uBA48\uCD94\uC9C0 \uC54A\uB3C4\uB85D \uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if ((m = t.match(/^(?:\}\s*)?catch\s*(?:\((\w+)\))?\s*\{?$/)) || (m = t.match(/^except\b.*:$/))) {
    return {
      role: "\uC624\uB958 \uCC98\uB9AC (catch)",
      easy: `\uC704 try \uBD80\uBD84\uC5D0\uC11C \uC624\uB958\uAC00 \uB098\uBA74, \uADF8 \uC624\uB958 \uB0B4\uC6A9\uC744 ${m[1] ? josa(m[1], "\uC774\uB77C\uB294/\uB77C\uB294") : ""} \uC774\uB984\uC73C\uB85C \uBC1B\uC544\uC11C \uC544\uB798 { } \uC548\uC758 \uBA85\uB839\uC73C\uB85C \uCC98\uB9AC\uD558\uB77C\uB294 \uB73B\uC785\uB2C8\uB2E4.`,
      why: "\uC624\uB958\uAC00 \uB0AC\uC744 \uB54C \uC0AC\uC6A9\uC790\uC5D0\uAC8C \uC548\uB0B4\uD558\uAC70\uB098 \uB300\uC2E0\uD560 \uB3D9\uC791\uC744 \uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (m = t.match(/^(?:export\s+)?(?:default\s+)?class\s+([\w$]+)(?:\s+extends\s+([\w$.]+))?\s*\{?$/)) {
    return {
      role: `${m[1]} \uD074\uB798\uC2A4 \uB9CC\uB4E4\uAE30`,
      easy: `${josa(m[1], "\uC774\uB77C\uB294/\uB77C\uB294")} \uC774\uB984\uC758 \uC124\uACC4\uB3C4(\uD074\uB798\uC2A4)\uB97C \uB9CC\uB4DC\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.${m[2] ? ` \uC774 \uC124\uACC4\uB3C4\uB294 ${m[2]} \uC124\uACC4\uB3C4\uC758 \uAE30\uB2A5\uC744 \uBB3C\uB824\uBC1B\uC2B5\uB2C8\uB2E4.` : ""}`,
      why: "\uAC19\uC740 \uAD6C\uC870\uC758 \uBB3C\uAC74(\uAC1D\uCCB4)\uC744 \uC5EC\uB7EC \uAC1C \uCC0D\uC5B4\uB0BC \uC218 \uC788\uB3C4\uB85D \uACF5\uD1B5 \uC124\uACC4\uB3C4\uB97C \uC815\uD574 \uB450\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (m = t.match(/^([\w$.[\]]+)\s*(\+\+|--);?$/)) {
    return {
      role: `${m[1]} 1 ${m[2] === "++" ? "\uB298\uB9AC\uAE30" : "\uC904\uC774\uAE30"}`,
      easy: `${m[1]}\uC5D0 \uB4E4\uC5B4\uC788\uB294 \uC22B\uC790\uB97C 1\uB9CC\uD07C ${m[2] === "++" ? "\uB298\uB9AC\uB294" : "\uC904\uC774\uB294"} \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: "\uAC1C\uC218\uB97C \uC138\uAC70\uB098 \uC21C\uC11C\uB97C \uD558\uB098\uC529 \uC62E\uAE30\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (m = t.match(/^([\w$.[\]]+)\s*([+\-*/])=\s*([\s\S]+?);?$/)) {
    const opKo = { "+": "\uB354\uD55C", "-": "\uBE80", "*": "\uACF1\uD55C", "/": "\uB098\uB208" };
    return {
      role: `${m[1]} \uAC12 \uBC14\uAFB8\uAE30`,
      easy: `${m[1]}\uC5D0 \uB4E4\uC5B4\uC788\uB294 \uAC12\uC5D0 ${josa(m[3], "\uC744/\uB97C")} ${opKo[m[2]]} \uACB0\uACFC\uB97C \uB2E4\uC2DC ${m[1]}\uC5D0 \uB123\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: "\uAE30\uC874 \uAC12\uC744 \uBC14\uD0D5\uC73C\uB85C \uC0C8 \uAC12\uC744 \uACC4\uC18D \uC313\uC544\uAC00\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (m = t.match(/^([\w$.[\]]+)\s*=\s*([^=>][\s\S]*?);?$/)) {
    const target = m[1];
    const dom = target.match(/\.(textContent|innerText|innerHTML|value|src|href|className)$/);
    const domKo = {
      textContent: "\uC548\uC5D0 \uBCF4\uC774\uB294 \uAE00\uC790",
      innerText: "\uC548\uC5D0 \uBCF4\uC774\uB294 \uAE00\uC790",
      innerHTML: "\uC548\uCABD HTML \uB0B4\uC6A9",
      value: "\uC785\uB825\uCE78\uC758 \uAC12",
      src: "\uBD88\uB7EC\uC62C \uD30C\uC77C \uC8FC\uC18C",
      href: "\uC774\uB3D9\uD560 \uC8FC\uC18C",
      className: "\uAFB8\uBC08 \uC774\uB984\uD45C(class)"
    };
    return {
      role: `${target} \uAC12 \uBC14\uAFB8\uAE30`,
      easy: dom ? `${target.replace(/\.[^.]+$/, "")} \uC694\uC18C\uC758 ${josa(domKo[dom[1]], "\uC744/\uB97C")} ${josa(explainValue(m[2]), "\uC73C\uB85C/\uB85C")} \uBC14\uAFB8\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.` : `${target}\uC5D0 \uB4E4\uC5B4\uC788\uB358 \uAC12\uC744 ${josa(explainValue(m[2]), "\uC73C\uB85C/\uB85C")} \uBC14\uAFD4 \uB123\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: dom ? "\uD654\uBA74\uC5D0 \uBCF4\uC774\uB294 \uB0B4\uC6A9\uC744 \uCF54\uB4DC\uB85C \uBC14\uAFD4\uC11C \uC0AC\uC6A9\uC790\uC5D0\uAC8C \uC0C8 \uC815\uBCF4\uB97C \uBCF4\uC5EC\uC8FC\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4." : "\uC0C1\uD669\uC774 \uBC14\uB010 \uAC83\uC5D0 \uB9DE\uCDB0 \uC800\uC7A5\uB41C \uAC12\uC744 \uC0C8\uB85C \uACE0\uCE58\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (m = t.match(/^await\s+([\s\S]+?);?$/)) {
    const inner = explainCall(m[1]);
    return {
      role: "\uB05D\uB0A0 \uB54C\uAE4C\uC9C0 \uAE30\uB2E4\uB9AC\uAE30 (await)",
      easy: `${inner ? inner.easy.replace(/ 명령어입니다\.$/, "") + " \uC791\uC5C5\uC744" : `${m[1]} \uC791\uC5C5\uC744`} \uC2DC\uC791\uD558\uACE0, \uADF8 \uC791\uC5C5\uC774 \uB05D\uB0A0 \uB54C\uAE4C\uC9C0 \uB2E4\uC74C \uC904\uB85C \uB118\uC5B4\uAC00\uC9C0 \uC54A\uACE0 \uAE30\uB2E4\uB9AC\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: "\uC55E\uC758 \uC791\uC5C5 \uACB0\uACFC\uAC00 \uC788\uC5B4\uC57C \uB2E4\uC74C \uC77C\uC744 \uD560 \uC218 \uC788\uC5B4\uC11C, \uC21C\uC11C\uB97C \uC9C0\uD0A4\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  const call = explainCall(t);
  if (call) {
    const nameMatch = t.match(/^\.?([\w$.]+)\(/);
    return { role: `${nameMatch ? nameMatch[1] : "\uAE30\uB2A5"} \uC2E4\uD589`, ...call };
  }
  if (m = t.match(/^([.#a-zA-Z*:\[][^=(){};]*?)\s*\{$/)) {
    const sel = m[1];
    const selKo = sel.startsWith(".") ? `${josa(sel.slice(1), "\uC774\uB77C\uB294/\uB77C\uB294")} class \uC774\uB984\uD45C\uAC00 \uBD99\uC740 \uC694\uC18C\uB4E4` : sel.startsWith("#") ? `${josa(sel.slice(1), "\uC774\uB77C\uB294/\uB77C\uB294")} id\uB97C \uAC00\uC9C4 \uC694\uC18C` : `\uBAA8\uB4E0 <${sel}> \uC694\uC18C`;
    return {
      role: `'${sel}' \uAFB8\uBC08 \uADDC\uCE59 \uC2DC\uC791`,
      easy: `${josa(selKo, "\uC744/\uB97C")} \uC5B4\uB5BB\uAC8C \uAFB8\uBC00\uC9C0 \uC544\uB798 { } \uC548\uC5D0 \uADDC\uCE59\uC744 \uC801\uAE30 \uC2DC\uC791\uD558\uB294 \uC904\uC785\uB2C8\uB2E4.`,
      why: "\uD574\uB2F9 \uC694\uC18C\uB4E4\uC758 \uC0C9, \uD06C\uAE30, \uC704\uCE58 \uAC19\uC740 \uB514\uC790\uC778\uC744 \uD55C\uACF3\uC5D0\uC11C \uC815\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if ((m = t.match(/^([a-z-]+)\s*:\s*([^;{}]+);?$/)) && CSS_PROPS[m[1]]) {
    const label = CSS_PROPS[m[1]];
    const value = m[2].trim();
    return {
      role: `${label} \uC815\uD558\uAE30`,
      easy: `\uC774 \uC694\uC18C\uC758 ${label}(${m[1]})${josa(label, "\uC744/\uB97C").slice(label.length)} ${josa(value, "\uC73C\uB85C/\uB85C")} \uC815\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: `\uD654\uBA74\uC5D0\uC11C \uC774 \uC694\uC18C\uC758 ${josa(label, "\uC744/\uB97C")} \uC6D0\uD558\uB294 \uBAA8\uC591\uC73C\uB85C \uBCF4\uC774\uAC8C \uAFB8\uBBF8\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`
    };
  }
  return null;
}
function describeFunction(name, params, exported, isAsync, python = false) {
  const ps = splitTopLevel(params).filter(Boolean);
  const paramText = ps.map((p) => {
    const [pn, def] = p.split("=").map((x) => x.trim());
    return def !== void 0 ? `${pn}(\uAC12\uC744 \uC548 \uC8FC\uBA74 ${explainValue(def)})` : pn;
  }).join(", ");
  const kind = /^use[A-Z]/.test(name) ? "\uB9AC\uC561\uD2B8\uC5D0\uC11C \uC9C1\uC811 \uB9CC\uB4E0 \uAE30\uB2A5 \uBB36\uC74C(\uCEE4\uC2A4\uD140 \uD6C5)" : /^[A-Z]/.test(name) ? "\uD654\uBA74\uC758 \uD55C \uC870\uAC01\uC744 \uADF8\uB824\uC8FC\uB294 \uBD80\uD488(\uCEF4\uD3EC\uB10C\uD2B8)" : "\uC5EC\uB7EC \uBA85\uB839\uC744 \uD558\uB098\uB85C \uBB36\uC5B4 \uC774\uB984\uC744 \uBD99\uC778 \uAE30\uB2A5(\uD568\uC218)";
  return {
    role: `${name} \uD568\uC218 \uB9CC\uB4E4\uAE30`,
    easy: `${josa(name, "\uC774\uB77C\uB294/\uB77C\uB294")} \uC774\uB984\uC758 ${josa(kind, "\uC744/\uB97C")} \uB9CC\uB4DC\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.${ps.length ? ` \uC774 \uAE30\uB2A5\uC744 \uC4F8 \uB54C\uB294 ${josa(paramText, "\uC744/\uB97C")} \uC804\uB2EC\uBC1B\uC2B5\uB2C8\uB2E4.` : ""}${exported ? " export\uAC00 \uBD99\uC5B4 \uC788\uC5B4 \uB2E4\uB978 \uD30C\uC77C\uC5D0\uC11C\uB3C4 \uAC00\uC838\uB2E4 \uC4F8 \uC218 \uC788\uC2B5\uB2C8\uB2E4." : ""}${isAsync ? " async\uAC00 \uBD99\uC5B4 \uC788\uC5B4 \uC548\uC5D0\uC11C \uC624\uB798 \uAC78\uB9AC\uB294 \uC791\uC5C5\uC744 \uAE30\uB2E4\uB9B4(await) \uC218 \uC788\uC2B5\uB2C8\uB2E4." : ""} ${python ? "\uC544\uB798 \uB4E4\uC5EC \uC4F4 \uC904\uB4E4\uC5D0" : "\uC544\uB798 { } \uC548\uC5D0"} \uC774 \uAE30\uB2A5\uC774 \uD560 \uC77C\uC774 \uC801\uD600 \uC788\uC2B5\uB2C8\uB2E4.`,
    why: `\uAC19\uC740 \uB3D9\uC791\uC744 \uC5EC\uB7EC \uACF3\uC5D0\uC11C \uBC18\uBCF5\uD574\uC11C \uC4F0\uAE30 \uC27D\uB3C4\uB85D ${josa(name, "\uC774\uB77C\uB294/\uB77C\uB294")} \uD558\uB098\uC758 \uC774\uB984\uC73C\uB85C \uBB36\uC5B4 \uB450\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`
  };
}
function uq(s) {
  return unquote(s) ?? s.trim();
}
var KNOWN = [
  // ---- 브라우저 저장 공간 ----
  {
    re: /^localStorage\.setItem\((.+?),\s*([\s\S]+)\)$/,
    def: "localStorage.setItem\uC740 \uBE0C\uB77C\uC6B0\uC800 \uC548\uC758 \uC800\uC7A5 \uACF5\uAC04\uC5D0 \uAC12\uC744 \uC774\uB984(\uD0A4)\uACFC \uD568\uAED8 \uC800\uC7A5\uD558\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4. \uBE0C\uB77C\uC6B0\uC800\uB97C \uAED0\uB2E4 \uCF1C\uB3C4 \uC9C0\uC6CC\uC9C0\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
    stmt: (m) => `${josa(explainValue(m[2]), "\uC744/\uB97C")} '${uq(m[1])}'\uB77C\uB294 \uC774\uB984\uC73C\uB85C \uBE0C\uB77C\uC6B0\uC800 \uC800\uC7A5 \uACF5\uAC04\uC5D0 \uC800\uC7A5\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
    why: "\uC0C8\uB85C\uACE0\uCE68\uD558\uAC70\uB098 \uB2E4\uC2DC \uBC29\uBB38\uD574\uB3C4 \uAC12(\uB85C\uADF8\uC778 \uC0C1\uD0DC, \uC124\uC815 \uB4F1)\uC774 \uC0AC\uB77C\uC9C0\uC9C0 \uC54A\uAC8C \uBCF4\uAD00\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
  },
  {
    re: /^localStorage\.getItem\((.+)\)$/,
    def: "localStorage.getItem\uC740 \uBE0C\uB77C\uC6B0\uC800 \uC800\uC7A5 \uACF5\uAC04\uC5D0 \uC800\uC7A5\uD574 \uB454 \uAC12\uC744 \uC774\uB984(\uD0A4)\uC73C\uB85C \uCC3E\uC544 \uAEBC\uB0B4\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.",
    value: (m) => `\uBE0C\uB77C\uC6B0\uC800 \uC800\uC7A5 \uACF5\uAC04\uC5D0 '${uq(m[1])}'\uB77C\uB294 \uC774\uB984\uC73C\uB85C \uC800\uC7A5\uD574 \uB454 \uAC12`
  },
  {
    re: /^localStorage\.removeItem\((.+)\)$/,
    def: "localStorage.removeItem\uC740 \uBE0C\uB77C\uC6B0\uC800 \uC800\uC7A5 \uACF5\uAC04\uC5D0\uC11C \uAC12\uC744 \uC9C0\uC6B0\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.",
    stmt: (m) => `\uBE0C\uB77C\uC6B0\uC800 \uC800\uC7A5 \uACF5\uAC04\uC5D0\uC11C '${uq(m[1])}'\uB77C\uB294 \uC774\uB984\uC73C\uB85C \uC800\uC7A5\uB41C \uAC12\uC744 \uC9C0\uC6B0\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
    why: "\uB354 \uC774\uC0C1 \uD544\uC694 \uC5C6\uB294 \uC815\uBCF4(\uC608: \uB85C\uADF8\uC544\uC6C3 \uC2DC \uB85C\uADF8\uC778 \uC815\uBCF4)\uB97C \uB0A8\uACA8 \uB450\uC9C0 \uC54A\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
  },
  // ---- JSON ----
  {
    re: /^JSON\.parse\(([\s\S]+)\)$/,
    def: "JSON.parse\uB294 JSON\uC774\uB77C\uB294 \uAE00\uC790 \uD615\uC2DD\uC758 \uB370\uC774\uD130\uB97C \uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8\uC5D0\uC11C \uC4F8 \uC218 \uC788\uB294 \uAC12(\uAC1D\uCCB4\xB7\uBC30\uC5F4)\uC73C\uB85C \uBC14\uAFB8\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.",
    value: (m) => `\uAE00\uC790\uB85C \uB41C ${josa(m[1], "\uC744/\uB97C")} \uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8 \uAC12(\uAC1D\uCCB4\xB7\uBC30\uC5F4)\uC73C\uB85C \uBC14\uAFBC \uAC83`
  },
  {
    re: /^JSON\.stringify\(([\s\S]+?)\)$/,
    def: "JSON.stringify\uB294 \uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8 \uAC12(\uAC1D\uCCB4\xB7\uBC30\uC5F4)\uC744 \uC800\uC7A5\uD558\uAC70\uB098 \uBCF4\uB0B4\uAE30 \uC26C\uC6B4 JSON \uAE00\uC790 \uD615\uC2DD\uC73C\uB85C \uBC14\uAFB8\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.",
    value: (m) => `${josa(splitTopLevel(m[1])[0], "\uC744/\uB97C")} JSON \uAE00\uC790\uB85C \uBC14\uAFBC \uAC83`
  },
  // ---- 숫자 계산 ----
  { re: /^Math\.random\(\)$/, def: "Math.random\uC740 0 \uC774\uC0C1 1 \uBBF8\uB9CC\uC758 \uC22B\uC790\uB97C \uBB34\uC791\uC704\uB85C \uD558\uB098 \uBF51\uC544 \uC8FC\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: () => "0 \uC774\uC0C1 1 \uBBF8\uB9CC\uC758 \uBB34\uC791\uC704 \uC22B\uC790" },
  { re: /^Math\.floor\(([\s\S]+)\)$/, def: "Math.floor\uB294 \uC22B\uC790\uC758 \uC18C\uC218\uC810 \uC544\uB798\uB97C \uBC84\uB9AC\uACE0 \uC815\uC218\uB85C \uB9CC\uB4DC\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4. (3.7 \u2192 3)", value: (m) => `${m[1]}\uC758 \uC18C\uC218\uC810 \uC544\uB798\uB97C \uBC84\uB9B0 \uC815\uC218` },
  { re: /^Math\.ceil\(([\s\S]+)\)$/, def: "Math.ceil\uC740 \uC22B\uC790\uC758 \uC18C\uC218\uC810 \uC544\uB798\uB97C \uC62C\uB824\uC11C \uC815\uC218\uB85C \uB9CC\uB4DC\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4. (3.2 \u2192 4)", value: (m) => `${m[1]}\uC758 \uC18C\uC218\uC810 \uC544\uB798\uB97C \uC62C\uB9B0 \uC815\uC218` },
  { re: /^Math\.round\(([\s\S]+)\)$/, def: "Math.round\uB294 \uC22B\uC790\uB97C \uBC18\uC62C\uB9BC\uD574\uC11C \uC815\uC218\uB85C \uB9CC\uB4DC\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4. (3.5 \u2192 4)", value: (m) => `${josa(m[1], "\uC744/\uB97C")} \uBC18\uC62C\uB9BC\uD55C \uC815\uC218` },
  { re: /^Math\.max\(([\s\S]+)\)$/, def: "Math.max\uB294 \uC5EC\uB7EC \uC22B\uC790 \uC911 \uAC00\uC7A5 \uD070 \uAC12\uC744 \uACE8\uB77C \uC8FC\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: (m) => `${m[1]} \uC911\uC5D0\uC11C \uAC00\uC7A5 \uD070 \uAC12` },
  { re: /^Math\.min\(([\s\S]+)\)$/, def: "Math.min\uC740 \uC5EC\uB7EC \uC22B\uC790 \uC911 \uAC00\uC7A5 \uC791\uC740 \uAC12\uC744 \uACE8\uB77C \uC8FC\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: (m) => `${m[1]} \uC911\uC5D0\uC11C \uAC00\uC7A5 \uC791\uC740 \uAC12` },
  { re: /^Math\.abs\(([\s\S]+)\)$/, def: "Math.abs\uB294 \uC22B\uC790\uC758 \uB9C8\uC774\uB108\uC2A4(-) \uBD80\uD638\uB97C \uC5C6\uC564 \uC808\uB313\uAC12\uC744 \uAD6C\uD558\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: (m) => `${m[1]}\uC758 \uC808\uB313\uAC12(\uBD80\uD638\uB97C \uB5C0 \uAC12)` },
  { re: /^parseInt\(([\s\S]+?)(?:,\s*\d+)?\)$/, def: 'parseInt\uB294 \uAE00\uC790\uB85C \uB41C \uC22B\uC790("42")\uB97C \uACC4\uC0B0\uD560 \uC218 \uC788\uB294 \uC815\uC218(42)\uB85C \uBC14\uAFB8\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.', value: (m) => `${josa(m[1], "\uC744/\uB97C")} \uC815\uC218 \uC22B\uC790\uB85C \uBC14\uAFBC \uAC12` },
  { re: /^parseFloat\(([\s\S]+)\)$/, def: 'parseFloat\uB294 \uAE00\uC790\uB85C \uB41C \uC22B\uC790("3.14")\uB97C \uC18C\uC218\uC810\uC774 \uC788\uB294 \uC22B\uC790(3.14)\uB85C \uBC14\uAFB8\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.', value: (m) => `${josa(m[1], "\uC744/\uB97C")} \uC18C\uC218\uC810 \uC22B\uC790\uB85C \uBC14\uAFBC \uAC12` },
  { re: /^Number\(([\s\S]+)\)$/, def: "Number\uB294 \uAC12\uC744 \uC22B\uC790\uB85C \uBC14\uAFB8\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4. \uC22B\uC790\uB85C \uBC14\uAFC0 \uC218 \uC5C6\uC73C\uBA74 NaN(\uC22B\uC790 \uC544\uB2D8)\uC774 \uB429\uB2C8\uB2E4.", value: (m) => `${josa(m[1], "\uC744/\uB97C")} \uC22B\uC790\uB85C \uBC14\uAFBC \uAC12` },
  { re: /^String\(([\s\S]+)\)$/, def: "String\uC740 \uAC12\uC744 \uAE00\uC790(\uBB38\uC790\uC5F4)\uB85C \uBC14\uAFB8\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: (m) => `${josa(m[1], "\uC744/\uB97C")} \uAE00\uC790\uB85C \uBC14\uAFBC \uAC12` },
  { re: /^([\w$.]+)\.toFixed\((\d+)\)$/, def: "toFixed\uB294 \uC22B\uC790\uB97C \uC18C\uC218\uC810 \uC544\uB798 \uC815\uD574\uC9C4 \uC790\uB9AC\uAE4C\uC9C0\uB9CC \uB0A8\uACA8 \uAE00\uC790\uB85C \uBC14\uAFB8\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: (m) => `${josa(m[1], "\uC744/\uB97C")} \uC18C\uC218\uC810 ${m[2]}\uC790\uB9AC\uAE4C\uC9C0 \uBC18\uC62C\uB9BC\uD55C \uAE00\uC790` },
  // ---- 글자(문자열) 다루기 ----
  { re: /^([\w$.]+)\.toUpperCase\(\)$/, def: "toUpperCase\uB294 \uC601\uC5B4 \uAE00\uC790\uB97C \uBAA8\uB450 \uB300\uBB38\uC790\uB85C \uBC14\uAFB8\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: (m) => `${m[1]}\uC758 \uC601\uC5B4 \uAE00\uC790\uB97C \uBAA8\uB450 \uB300\uBB38\uC790\uB85C \uBC14\uAFBC \uAE00\uC790` },
  { re: /^([\w$.]+)\.toLowerCase\(\)$/, def: "toLowerCase\uB294 \uC601\uC5B4 \uAE00\uC790\uB97C \uBAA8\uB450 \uC18C\uBB38\uC790\uB85C \uBC14\uAFB8\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: (m) => `${m[1]}\uC758 \uC601\uC5B4 \uAE00\uC790\uB97C \uBAA8\uB450 \uC18C\uBB38\uC790\uB85C \uBC14\uAFBC \uAE00\uC790` },
  { re: /^([\w$.]+)\.trim\(\)$/, def: "trim\uC740 \uAE00\uC790\uC758 \uC55E\uB4A4\uC5D0 \uBD99\uC740 \uACF5\uBC31(\uB744\uC5B4\uC4F0\uAE30, \uC904\uBC14\uAFC8)\uC744 \uC5C6\uC560\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: (m) => `${m[1]}\uC758 \uC55E\uB4A4 \uACF5\uBC31\uC744 \uC5C6\uC564 \uAE00\uC790` },
  { re: /^([\w$.]+)\.split\((.+)\)$/, def: "split\uC740 \uAE00\uC790\uB97C \uC815\uD574\uC9C4 \uAE30\uD638\uB97C \uAE30\uC900\uC73C\uB85C \uC798\uB77C\uC11C \uC5EC\uB7EC \uC870\uAC01\uC758 \uBAA9\uB85D(\uBC30\uC5F4)\uC73C\uB85C \uB9CC\uB4DC\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: (m) => `${m[1]} \uAE00\uC790\uB97C ${uq(m[2]) === "" ? "\uD55C \uAE00\uC790\uC529" : `'${uq(m[2])}' \uAE30\uC900\uC73C\uB85C`} \uC798\uB77C \uB9CC\uB4E0 \uBAA9\uB85D` },
  { re: /^([\w$.]+)\.join\((.*)\)$/, def: "join\uC740 \uBAA9\uB85D(\uBC30\uC5F4)\uC5D0 \uB4E0 \uAC12\uB4E4\uC744 \uD558\uB098\uC758 \uAE00\uC790\uB85C \uC774\uC5B4 \uBD99\uC774\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: (m) => `${m[1]} \uBAA9\uB85D\uC758 \uAC12\uB4E4\uC744 ${m[2] ? `'${uq(m[2])}'\uB85C` : "\uC27C\uD45C(,)\uB85C"} \uC774\uC5B4 \uBD99\uC778 \uAE00\uC790` },
  { re: /^([\w$.]+)\.(replace|replaceAll)\((.+?),\s*(.+)\)$/, def: "replace\uB294 \uAE00\uC790 \uC548\uC5D0\uC11C \uD2B9\uC815 \uBD80\uBD84\uC744 \uCC3E\uC544 \uB2E4\uB978 \uAE00\uC790\uB85C \uBC14\uAFB8\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4. (replaceAll\uC740 \uBAA8\uB450 \uBC14\uAFC8)", value: (m) => `${m[1]} \uC548\uC758 ${m[3]}${m[2] === "replaceAll" ? "\uB97C \uBAA8\uB450" : "\uB97C"} ${josa(m[4], "\uC73C\uB85C/\uB85C")} \uBC14\uAFBC \uAE00\uC790` },
  { re: /^([\w$.]+)\.includes\((.+)\)$/, def: "includes\uB294 \uAE00\uC790\uB098 \uBAA9\uB85D \uC548\uC5D0 \uD2B9\uC815 \uAC12\uC774 \uB4E4\uC5B4 \uC788\uB294\uC9C0 \uD655\uC778\uD574\uC11C \uCC38(true)/\uAC70\uC9D3(false)\uC73C\uB85C \uC54C\uB824\uC8FC\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: (m) => `${m[1]} \uC548\uC5D0 ${josa(m[2], "\uC774/\uAC00")} \uB4E4\uC5B4 \uC788\uB294\uC9C0 \uC5EC\uBD80(\uCC38/\uAC70\uC9D3)` },
  { re: /^([\w$.]+)\.indexOf\((.+)\)$/, def: "indexOf\uB294 \uAE00\uC790\uB098 \uBAA9\uB85D\uC5D0\uC11C \uD2B9\uC815 \uAC12\uC774 \uBA87 \uBC88\uC9F8\uC5D0 \uCC98\uC74C \uB098\uC624\uB294\uC9C0 \uC704\uCE58 \uBC88\uD638\uB97C \uC54C\uB824\uC8FC\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4. \uC5C6\uC73C\uBA74 -1\uC785\uB2C8\uB2E4.", value: (m) => `${m[1]}\uC5D0\uC11C ${josa(m[2], "\uC774/\uAC00")} \uCC98\uC74C \uB098\uC624\uB294 \uC704\uCE58 \uBC88\uD638(\uC5C6\uC73C\uBA74 -1)` },
  { re: /^([\w$.]+)\.slice\(([^,]+)(?:,\s*(.+))?\)$/, def: "slice\uB294 \uAE00\uC790\uB098 \uBAA9\uB85D\uC758 \uC77C\uBD80\uBD84\uB9CC \uC798\uB77C\uC11C \uC0C8\uB85C \uB9CC\uB4DC\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4. \uC6D0\uBCF8\uC740 \uADF8\uB300\uB85C \uB0A8\uC2B5\uB2C8\uB2E4.", value: (m) => `${m[1]}\uC758 ${m[2]}\uBC88\uC9F8\uBD80\uD130 ${m[3] ? `${m[3]}\uBC88\uC9F8 \uC55E\uAE4C\uC9C0` : "\uB05D\uAE4C\uC9C0"} \uC798\uB77C\uB0B8 \uBD80\uBD84` },
  // ---- 목록(배열) 다루기 ----
  { re: /^([\w$.]+)\.reduce\(([\s\S]+)\)$/, def: "reduce\uB294 \uBAA9\uB85D(\uBC30\uC5F4)\uC758 \uAC12\uC744 \uCC98\uC74C\uBD80\uD130 \uD558\uB098\uC529 \uCC28\uB840\uB85C \uD569\uCCD0\uC11C \uD558\uB098\uC758 \uACB0\uACFC(\uD569\uACC4 \uB4F1)\uB85C \uB9CC\uB4DC\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: (m) => `${m[1]} \uBAA9\uB85D\uC758 \uAC12\uC744 \uD558\uB098\uC529 \uCC28\uB840\uB85C \uD569\uCCD0 \uB9CC\uB4E0 \uD558\uB098\uC758 \uACB0\uACFC` },
  { re: /^([\w$.]+)\.sort\(([\s\S]*)\)$/, def: "sort\uB294 \uBAA9\uB85D(\uBC30\uC5F4)\uC758 \uAC12\uC744 \uC815\uD574\uC9C4 \uC21C\uC11C\uB300\uB85C \uB2E4\uC2DC \uC815\uB82C\uD558\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4. \uC6D0\uBCF8 \uBAA9\uB85D\uC774 \uBC14\uB01D\uB2C8\uB2E4.", value: (m) => `${josa(m[1], "\uC744/\uB97C")} \uC21C\uC11C\uB300\uB85C \uC815\uB82C\uD55C \uBAA9\uB85D`, stmt: (m) => `${m[1]} \uBAA9\uB85D\uC758 \uAC12\uC744 \uC21C\uC11C\uB300\uB85C \uC815\uB82C\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.` },
  { re: /^([\w$.]+)\.reverse\(\)$/, def: "reverse\uB294 \uBAA9\uB85D(\uBC30\uC5F4)\uC758 \uC21C\uC11C\uB97C \uAC70\uAFB8\uB85C \uB4A4\uC9D1\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: (m) => `${m[1]} \uBAA9\uB85D\uC758 \uC21C\uC11C\uB97C \uAC70\uAFB8\uB85C \uB4A4\uC9D1\uC740 \uAC83`, stmt: (m) => `${m[1]} \uBAA9\uB85D\uC758 \uC21C\uC11C\uB97C \uAC70\uAFB8\uB85C \uB4A4\uC9D1\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.` },
  { re: /^([\w$.]+)\.concat\(([\s\S]+)\)$/, def: "concat\uC740 \uB450 \uAC1C \uC774\uC0C1\uC758 \uBAA9\uB85D(\uBC30\uC5F4)\uC774\uB098 \uAE00\uC790\uB97C \uC774\uC5B4 \uBD99\uC5EC \uC0C8\uB85C \uB9CC\uB4DC\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: (m) => `${m[1]} \uB4A4\uC5D0 ${josa(m[2], "\uC744/\uB97C")} \uC774\uC5B4 \uBD99\uC778 \uC0C8 \uBAA9\uB85D` },
  { re: /^([\w$.]+)\.pop\(\)$/, def: "pop\uC740 \uBAA9\uB85D(\uBC30\uC5F4)\uC758 \uB9E8 \uB9C8\uC9C0\uB9C9 \uAC12\uC744 \uBE7C\uB0B4\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: (m) => `${m[1]} \uBAA9\uB85D\uC5D0\uC11C \uBE7C\uB0B8 \uB9E8 \uB9C8\uC9C0\uB9C9 \uAC12`, stmt: (m) => `${m[1]} \uBAA9\uB85D\uC758 \uB9E8 \uB9C8\uC9C0\uB9C9 \uAC12\uC744 \uBE7C\uB0B4\uC11C \uC5C6\uC560\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.` },
  { re: /^([\w$.]+)\.shift\(\)$/, def: "shift\uB294 \uBAA9\uB85D(\uBC30\uC5F4)\uC758 \uB9E8 \uCCAB \uBC88\uC9F8 \uAC12\uC744 \uBE7C\uB0B4\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: (m) => `${m[1]} \uBAA9\uB85D\uC5D0\uC11C \uBE7C\uB0B8 \uB9E8 \uCCAB \uBC88\uC9F8 \uAC12`, stmt: (m) => `${m[1]} \uBAA9\uB85D\uC758 \uB9E8 \uCCAB \uBC88\uC9F8 \uAC12\uC744 \uBE7C\uB0B4\uC11C \uC5C6\uC560\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.` },
  { re: /^([\w$.]+)\.unshift\(([\s\S]+)\)$/, def: "unshift\uB294 \uBAA9\uB85D(\uBC30\uC5F4)\uC758 \uB9E8 \uC55E\uC5D0 \uC0C8 \uAC12\uC744 \uB07C\uC6CC \uB123\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", stmt: (m) => `${m[1]} \uBAA9\uB85D\uC758 \uB9E8 \uC55E\uC5D0 ${josa(m[2], "\uC744/\uB97C")} \uB07C\uC6CC \uB123\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.` },
  { re: /^([\w$.]+)\.splice\(([^,]+),\s*([^,)]+)(?:,\s*([\s\S]+))?\)$/, def: "splice\uB294 \uBAA9\uB85D(\uBC30\uC5F4)\uC758 \uC6D0\uD558\uB294 \uC704\uCE58\uC5D0\uC11C \uAC12\uC744 \uBE7C\uB0B4\uAC70\uB098 \uC0C8 \uAC12\uC744 \uB07C\uC6CC \uB123\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4. \uC6D0\uBCF8 \uBAA9\uB85D\uC774 \uBC14\uB01D\uB2C8\uB2E4.", stmt: (m) => `${m[1]} \uBAA9\uB85D\uC758 ${m[2]}\uBC88\uC9F8 \uC790\uB9AC\uBD80\uD130 ${m[3]}\uAC1C\uB97C \uBE7C\uB0B4${m[4] ? `\uACE0, \uADF8 \uC790\uB9AC\uC5D0 ${josa(m[4], "\uC744/\uB97C")} \uB123` : ""}\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.` },
  { re: /^Object\.keys\(([\s\S]+)\)$/, def: "Object.keys\uB294 \uBB36\uC74C(\uAC1D\uCCB4)\uC5D0 \uB4E4\uC5B4 \uC788\uB294 \uC774\uB984(\uD0A4)\uB4E4\uB9CC \uBAA8\uC544 \uBAA9\uB85D\uC73C\uB85C \uB9CC\uB4E4\uC5B4 \uC8FC\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: (m) => `${m[1]} \uBB36\uC74C\uC5D0 \uB4E4\uC5B4 \uC788\uB294 \uC774\uB984(\uD0A4)\uB4E4\uC758 \uBAA9\uB85D` },
  { re: /^Object\.values\(([\s\S]+)\)$/, def: "Object.values\uB294 \uBB36\uC74C(\uAC1D\uCCB4)\uC5D0 \uB4E4\uC5B4 \uC788\uB294 \uAC12\uB4E4\uB9CC \uBAA8\uC544 \uBAA9\uB85D\uC73C\uB85C \uB9CC\uB4E4\uC5B4 \uC8FC\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: (m) => `${m[1]} \uBB36\uC74C\uC5D0 \uB4E4\uC5B4 \uC788\uB294 \uAC12\uB4E4\uC758 \uBAA9\uB85D` },
  { re: /^Object\.entries\(([\s\S]+)\)$/, def: "Object.entries\uB294 \uBB36\uC74C(\uAC1D\uCCB4)\uC758 [\uC774\uB984, \uAC12] \uC9DD\uB4E4\uC744 \uBAA9\uB85D\uC73C\uB85C \uB9CC\uB4E4\uC5B4 \uC8FC\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: (m) => `${m[1]} \uBB36\uC74C\uC758 [\uC774\uB984, \uAC12] \uC9DD \uBAA9\uB85D` },
  { re: /^Array\.isArray\(([\s\S]+)\)$/, def: "Array.isArray\uB294 \uC5B4\uB5A4 \uAC12\uC774 \uBAA9\uB85D(\uBC30\uC5F4)\uC778\uC9C0 \uD655\uC778\uD574\uC11C \uCC38/\uAC70\uC9D3\uC73C\uB85C \uC54C\uB824\uC8FC\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: (m) => `${josa(m[1], "\uC774/\uAC00")} \uBAA9\uB85D(\uBC30\uC5F4)\uC778\uC9C0 \uC5EC\uBD80(\uCC38/\uAC70\uC9D3)` },
  { re: /^Promise\.all\(([\s\S]+)\)$/, def: "Promise.all\uC740 \uC5EC\uB7EC \uAC1C\uC758 \uC624\uB798 \uAC78\uB9AC\uB294 \uC791\uC5C5\uC744 \uB3D9\uC2DC\uC5D0 \uC2DC\uC791\uD558\uACE0, \uBAA8\uB450 \uB05D\uB0A0 \uB54C\uAE4C\uC9C0 \uAE30\uB2E4\uB9AC\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: (m) => `${m[1]}\uC5D0 \uB4E0 \uC791\uC5C5\uC774 \uBAA8\uB450 \uB05D\uB09C \uACB0\uACFC \uBAA9\uB85D` },
  // ---- 화면(문서) 다루기 ----
  { re: /^document\.createElement\((.+)\)$/, def: "document.createElement\uB294 \uC0C8 HTML \uC694\uC18C\uB97C \uCF54\uB4DC\uB85C \uB9CC\uB4E4\uC5B4 \uB0B4\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4. \uB9CC\uB4E0 \uC9C1\uD6C4\uC5D0\uB294 \uC544\uC9C1 \uD654\uBA74\uC5D0 \uBD99\uC5B4 \uC788\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.", value: (m) => `\uC0C8\uB85C \uB9CC\uB4E0 <${uq(m[1])}> \uC694\uC18C(\uC544\uC9C1 \uD654\uBA74\uC5D0 \uBD99\uAE30 \uC804)` },
  { re: /^([\w$.]+)\.classList\.add\((.+)\)$/, def: "classList.add\uB294 \uC694\uC18C\uC5D0 class \uC774\uB984\uD45C\uB97C \uBD99\uC774\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4. CSS\uC5D0\uC11C \uADF8 \uC774\uB984\uD45C\uC5D0 \uC815\uD55C \uB514\uC790\uC778\uC774 \uC801\uC6A9\uB429\uB2C8\uB2E4.", stmt: (m) => `${m[1]} \uC694\uC18C\uC5D0 ${josa(`'${uq(m[2])}'`, "\uC774\uB77C\uB294/\uB77C\uB294")} class \uC774\uB984\uD45C\uB97C \uBD99\uC774\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`, why: "\uC774\uB984\uD45C\uC5D0 \uC5F0\uACB0\uB41C \uB514\uC790\uC778(\uC0C9, \uBCF4\uC774\uAE30/\uC228\uAE30\uAE30 \uB4F1)\uC744 \uC774 \uC694\uC18C\uC5D0 \uC801\uC6A9\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4." },
  { re: /^([\w$.]+)\.classList\.remove\((.+)\)$/, def: "classList.remove\uB294 \uC694\uC18C\uC5D0 \uBD99\uC5B4 \uC788\uB358 class \uC774\uB984\uD45C\uB97C \uB5BC\uC5B4\uB0B4\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", stmt: (m) => `${m[1]} \uC694\uC18C\uC5D0\uC11C ${josa(`'${uq(m[2])}'`, "\uC774\uB77C\uB294/\uB77C\uB294")} class \uC774\uB984\uD45C\uB97C \uB5BC\uC5B4\uB0B4\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`, why: "\uADF8 \uC774\uB984\uD45C\uC5D0 \uC5F0\uACB0\uB41C \uB514\uC790\uC778\uC744 \uB354 \uC774\uC0C1 \uC801\uC6A9\uD558\uC9C0 \uC54A\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4." },
  { re: /^([\w$.]+)\.classList\.toggle\((.+)\)$/, def: "classList.toggle\uC740 class \uC774\uB984\uD45C\uAC00 \uBD99\uC5B4 \uC788\uC73C\uBA74 \uB5BC\uACE0, \uC5C6\uC73C\uBA74 \uBD99\uC774\uB294 \uC2A4\uC704\uCE58 \uAC19\uC740 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", stmt: (m) => `${m[1]} \uC694\uC18C\uC5D0 ${josa(`'${uq(m[2])}'`, "\uC774\uB77C\uB294/\uB77C\uB294")} class \uC774\uB984\uD45C\uAC00 \uC788\uC73C\uBA74 \uB5BC\uACE0, \uC5C6\uC73C\uBA74 \uBD99\uC774\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`, why: "\uBC84\uD2BC\uC744 \uB204\uB97C \uB54C\uB9C8\uB2E4 \uBA54\uB274 \uC5F4\uAE30/\uB2EB\uAE30\uCC98\uB7FC \uC0C1\uD0DC\uB97C \uBC88\uAC08\uC544 \uBC14\uAFB8\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4." },
  { re: /^([\w$.]+)\.(appendChild)\(([\s\S]+)\)$/, def: "appendChild\uB294 \uC5B4\uB5A4 \uC694\uC18C \uC548\uC758 \uB9E8 \uB05D\uC5D0 \uB2E4\uB978 \uC694\uC18C\uB97C \uB123\uC5B4 \uD654\uBA74\uC5D0 \uBD99\uC774\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", stmt: (m) => `${m[1]} \uC694\uC18C \uC548\uC758 \uB9E8 \uB05D\uC5D0 ${josa(m[3], "\uC744/\uB97C")} \uB123\uC5B4\uC11C \uD654\uBA74\uC5D0 \uBCF4\uC774\uAC8C \uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`, why: "\uCF54\uB4DC\uB85C \uB9CC\uB4E0 \uC0C8 \uC694\uC18C\uB97C \uC2E4\uC81C \uD654\uBA74\uC5D0 \uB098\uD0C0\uB098\uAC8C \uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4." },
  { re: /^([\w$.]+)\.remove\(\)$/, def: "remove\uB294 \uC694\uC18C\uB97C \uD654\uBA74\uC5D0\uC11C \uC644\uC804\uD788 \uC9C0\uC6B0\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", stmt: (m) => `${m[1]} \uC694\uC18C\uB97C \uD654\uBA74\uC5D0\uC11C \uC9C0\uC6B0\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`, why: "\uB354 \uC774\uC0C1 \uD544\uC694 \uC5C6\uB294 \uC694\uC18C(\uB2EB\uC740 \uC54C\uB9BC\uCC3D \uB4F1)\uB97C \uD654\uBA74\uC5D0\uC11C \uC5C6\uC560\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4." },
  { re: /^([\w$.]+)\.setAttribute\((.+?),\s*(.+)\)$/, def: "setAttribute\uB294 \uC694\uC18C\uC758 \uC18D\uC131(\uC608: src, href, disabled) \uAC12\uC744 \uC815\uD558\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", stmt: (m) => `${m[1]} \uC694\uC18C\uC758 ${uq(m[2])} \uC18D\uC131 \uAC12\uC744 ${josa(m[3], "\uC73C\uB85C/\uB85C")} \uC815\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`, why: "\uC694\uC18C\uC758 \uC124\uC815(\uC8FC\uC18C, \uBE44\uD65C\uC131\uD654 \uC5EC\uBD80 \uB4F1)\uC744 \uCF54\uB4DC\uB85C \uBC14\uAFB8\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4." },
  { re: /^([\w$.]+)\.focus\(\)$/, def: "focus\uB294 \uC785\uB825\uCE78\uC774\uB098 \uBC84\uD2BC\uC744 \uC120\uD0DD\uB41C \uC0C1\uD0DC\uB85C \uB9CC\uB4E4\uC5B4 \uBC14\uB85C \uC785\uB825\uD560 \uC218 \uC788\uAC8C \uD558\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", stmt: (m) => `${m[1]}\uC5D0 \uCEE4\uC11C\uB97C \uC62E\uACA8\uC11C \uC0AC\uC6A9\uC790\uAC00 \uBC14\uB85C \uC785\uB825\uD560 \uC218 \uC788\uAC8C \uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`, why: "\uC0AC\uC6A9\uC790\uAC00 \uC9C1\uC811 \uD074\uB9AD\uD558\uC9C0 \uC54A\uC544\uB3C4 \uBC14\uB85C \uC785\uB825\uC744 \uC2DC\uC791\uD560 \uC218 \uC788\uAC8C \uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4." },
  { re: /^(?:window\.)?scrollTo\(([\s\S]+)\)$/, def: "scrollTo\uB294 \uD654\uBA74\uC744 \uC6D0\uD558\uB294 \uC704\uCE58\uB85C \uC2A4\uD06C\uB864(\uC774\uB3D9)\uD558\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", stmt: () => "\uD654\uBA74\uC744 \uC9C0\uC815\uD55C \uC704\uCE58\uB85C \uC2A4\uD06C\uB864\uD574\uC11C \uC774\uB3D9\uC2DC\uD0A4\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4." },
  // ---- 서버(Node.js / Express) ----
  { re: /^require\((.+)\)$/, def: "require\uB294 Node.js\uC5D0\uC11C \uB2E4\uB978 \uD30C\uC77C\uC774\uB098 \uB77C\uC774\uBE0C\uB7EC\uB9AC\uB97C \uBD88\uB7EC\uC624\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: (m) => `'${uq(m[1])}' \uBAA8\uB4C8(\uB77C\uC774\uBE0C\uB7EC\uB9AC)\uC744 \uBD88\uB7EC\uC628 \uAC83` },
  { re: /^(app|router|server)\.(get|post|put|patch|delete)\(\s*(['"`])(.+?)\3\s*,[\s\S]*$/, def: 'app.get / app.post \uB4F1\uC740 \uC11C\uBC84\uC5D0\uC11C "\uC5B4\uB5A4 \uC8FC\uC18C\uB85C \uC694\uCCAD\uC774 \uC624\uBA74 \uBB34\uC5C7\uC744 \uD560\uC9C0" \uC815\uD558\uB294 \uAE30\uB2A5(\uB77C\uC6B0\uD2B8)\uC785\uB2C8\uB2E4.', stmt: (m) => `\uB204\uAD70\uAC00 '${m[4]}' \uC8FC\uC18C\uB85C ${m[2].toUpperCase()} \uC694\uCCAD\uC744 \uBCF4\uB0B4\uBA74, \uB4A4\uC5D0 \uC801\uC740 \uD568\uC218\uB97C \uC2E4\uD589\uD574\uC11C \uC751\uB2F5\uD558\uB3C4\uB85D \uC815\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`, why: "\uC6F9\uC0AC\uC774\uD2B8\uB098 \uC571\uC774 \uC11C\uBC84\uC5D0 \uB370\uC774\uD130\uB97C \uC694\uCCAD\uD588\uC744 \uB54C \uC54C\uB9DE\uAC8C \uB300\uB2F5\uD574 \uC8FC\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4." },
  { re: /^(app|router|server)\.use\(([\s\S]+)\)$/, def: "app.use\uB294 \uC11C\uBC84\uB85C \uB4E4\uC5B4\uC624\uB294 \uBAA8\uB4E0 \uC694\uCCAD\uC774 \uAC70\uCCD0 \uAC00\uB294 \uACF5\uD1B5 \uCC98\uB9AC \uB2E8\uACC4(\uBBF8\uB4E4\uC6E8\uC5B4)\uB97C \uB4F1\uB85D\uD558\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", stmt: (m) => `\uC11C\uBC84\uB85C \uB4E4\uC5B4\uC624\uB294 \uC694\uCCAD\uB9C8\uB2E4 ${josa(m[2], "\uC744/\uB97C")} \uBA3C\uC800 \uAC70\uCE58\uB3C4\uB85D \uB4F1\uB85D\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`, why: "\uBAA8\uB4E0 \uC694\uCCAD\uC5D0 \uACF5\uD1B5\uC73C\uB85C \uD544\uC694\uD55C \uC77C(\uB370\uC774\uD130 \uD574\uC11D, \uB85C\uADF8\uC778 \uD655\uC778 \uB4F1)\uC744 \uD55C\uACF3\uC5D0\uC11C \uCC98\uB9AC\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4." },
  { re: /^(app|server)\.listen\(([\s\S]+)\)$/, def: "listen\uC740 \uC11C\uBC84\uB97C \uCF1C\uC11C \uC815\uD574\uC9C4 \uBC88\uD638\uC758 \uBB38(\uD3EC\uD2B8)\uC73C\uB85C \uB4E4\uC5B4\uC624\uB294 \uC694\uCCAD\uC744 \uAE30\uB2E4\uB9AC\uAE30 \uC2DC\uC791\uD558\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", stmt: (m) => `\uC11C\uBC84\uB97C \uCF1C\uACE0 ${splitTopLevel(m[2])[0]}\uBC88 \uD3EC\uD2B8(\uBB38)\uB85C \uB4E4\uC5B4\uC624\uB294 \uC694\uCCAD\uC744 \uAE30\uB2E4\uB9AC\uAE30 \uC2DC\uC791\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`, why: "\uC0AC\uC6A9\uC790\uAC00 \uC811\uC18D\uD560 \uC218 \uC788\uB3C4\uB85D \uC11C\uBC84\uB97C \uC2E4\uC81C\uB85C \uB3D9\uC791\uC2DC\uD0A4\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4." },
  { re: /^res\.status\((\d+)\)\.(json|send)\(([\s\S]*)\)$/, def: "res.status(...).json(...)\uC740 \uC694\uCCAD\uD55C \uC0AC\uB78C\uC5D0\uAC8C \uC0C1\uD0DC \uBC88\uD638\uC640 \uD568\uAED8 \uB370\uC774\uD130\uB97C \uC751\uB2F5\uC73C\uB85C \uBCF4\uB0B4\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", stmt: (m) => `\uC694\uCCAD\uD55C \uC0AC\uB78C\uC5D0\uAC8C ${m[1]}\uBC88 \uC0C1\uD0DC(${m[1].startsWith("2") ? "\uC131\uACF5" : m[1].startsWith("4") ? "\uC694\uCCAD \uC624\uB958" : m[1].startsWith("5") ? "\uC11C\uBC84 \uC624\uB958" : "\uC751\uB2F5"})\uC640 \uD568\uAED8 ${josa(m[3] || "\uBE48 \uB0B4\uC6A9", "\uC744/\uB97C")} \uC751\uB2F5\uC73C\uB85C \uBCF4\uB0B4\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`, why: "\uC694\uCCAD\uC774 \uC131\uACF5\uD588\uB294\uC9C0 \uC2E4\uD328\uD588\uB294\uC9C0\uC640 \uACB0\uACFC \uB370\uC774\uD130\uB97C \uD568\uAED8 \uC54C\uB824\uC8FC\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4." },
  { re: /^res\.(json|send)\(([\s\S]*)\)$/, def: "res.json / res.send\uB294 \uC11C\uBC84\uC5D0 \uC694\uCCAD\uD55C \uC0AC\uB78C\uC5D0\uAC8C \uACB0\uACFC\uB97C \uC751\uB2F5\uC73C\uB85C \uBCF4\uB0B4\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", stmt: (m) => `\uC694\uCCAD\uD55C \uC0AC\uB78C\uC5D0\uAC8C ${josa(m[2] || "\uBE48 \uB0B4\uC6A9", "\uC744/\uB97C")} \uC751\uB2F5\uC73C\uB85C \uBCF4\uB0B4\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`, why: "\uC694\uCCAD\uC5D0 \uB300\uD55C \uACB0\uACFC\uB97C \uB3CC\uB824\uC8FC\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4." },
  // ---- 화면 이동 ----
  { re: /^(navigate|router\.push)\((.+)\)$/, def: "navigate / router.push\uB294 \uB2E4\uB978 \uD398\uC774\uC9C0(\uC8FC\uC18C)\uB85C \uD654\uBA74\uC744 \uC774\uB3D9\uC2DC\uD0A4\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", stmt: (m) => `\uD654\uBA74\uC744 ${josa(`'${uq(m[2])}'`, "\uC73C\uB85C/\uB85C")} \uC774\uB3D9\uC2DC\uD0A4\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`, why: "\uC0AC\uC6A9\uC790\uB97C \uB2E4\uC74C \uB2E8\uACC4 \uD654\uBA74\uC73C\uB85C \uBCF4\uB0B4\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4." },
  // ---- 파이썬 ----
  { re: /^len\(([\s\S]+)\)$/, def: "len\uC740 \uAE00\uC790 \uC218\uB098 \uBAA9\uB85D\uC5D0 \uB4E0 \uD56D\uBAA9 \uAC1C\uC218\uB97C \uC138\uC5B4 \uC8FC\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: (m) => `${m[1]}\uC758 \uAE38\uC774(\uAE00\uC790 \uC218 \uB610\uB294 \uD56D\uBAA9 \uAC1C\uC218)` },
  { re: /^range\(([\s\S]+)\)$/, def: "range\uB294 \uC815\uD574\uC9C4 \uBC94\uC704\uC758 \uC22B\uC790\uB4E4\uC744 \uCC28\uB840\uB300\uB85C \uB9CC\uB4E4\uC5B4 \uC8FC\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4. range(5)\uB294 0, 1, 2, 3, 4\uC785\uB2C8\uB2E4.", value: (m) => {
    const a = splitTopLevel(m[1]);
    return a.length === 1 ? `0\uBD80\uD130 ${a[0]}-1\uAE4C\uC9C0\uC758 \uC22B\uC790\uB4E4` : `${a[0]}\uBD80\uD130 ${a[1]}-1\uAE4C\uC9C0\uC758 \uC22B\uC790\uB4E4`;
  } },
  { re: /^input\(([\s\S]*)\)$/, def: "input\uC740 \uD654\uBA74\uC5D0 \uC548\uB0B4 \uBB38\uAD6C\uB97C \uBCF4\uC5EC\uC8FC\uACE0, \uC0AC\uC6A9\uC790\uAC00 \uD0A4\uBCF4\uB4DC\uB85C \uC785\uB825\uD55C \uAE00\uC790\uB97C \uBC1B\uC544\uC624\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: (m) => `${m[1] ? `${josa(`'${uq(m[1])}'`, "\uC774\uB77C\uB294/\uB77C\uB294")} \uC548\uB0B4\uB97C \uBCF4\uC5EC\uC900 \uB4A4 ` : ""}\uC0AC\uC6A9\uC790\uAC00 \uD0A4\uBCF4\uB4DC\uB85C \uC785\uB825\uD55C \uAE00\uC790` },
  { re: /^int\(([\s\S]+)\)$/, def: "int\uB294 \uAC12\uC744 \uC815\uC218 \uC22B\uC790\uB85C \uBC14\uAFB8\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: (m) => `${josa(m[1], "\uC744/\uB97C")} \uC815\uC218 \uC22B\uC790\uB85C \uBC14\uAFBC \uAC12` },
  { re: /^str\(([\s\S]+)\)$/, def: "str\uC740 \uAC12\uC744 \uAE00\uC790(\uBB38\uC790\uC5F4)\uB85C \uBC14\uAFB8\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", value: (m) => `${josa(m[1], "\uC744/\uB97C")} \uAE00\uC790\uB85C \uBC14\uAFBC \uAC12` },
  { re: /^([\w$.]+)\.append\(([\s\S]+)\)$/, def: "append\uB294 \uBAA9\uB85D(\uB9AC\uC2A4\uD2B8)\uC774\uB098 \uC694\uC18C\uC758 \uB9E8 \uB05D\uC5D0 \uC0C8 \uAC12\uC744 \uCD94\uAC00\uD558\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.", stmt: (m) => `${m[1]} \uBAA9\uB85D\uC758 \uB9E8 \uB05D\uC5D0 ${josa(m[2], "\uC744/\uB97C")} \uCD94\uAC00\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`, why: "\uBAA9\uB85D\uC5D0 \uC0C8 \uD56D\uBAA9\uC744 \uD558\uB098\uC529 \uC313\uC544 \uAC00\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4." }
];
function matchKnown(expr) {
  const e = stripSemi(expr);
  for (const entry of KNOWN) {
    const m = e.match(entry.re);
    if (m) return { entry, m };
  }
  return null;
}
function explainProperty(v) {
  let m;
  if (m = v.match(/^([\w$.]+)\.length$/)) return `${m[1]}\uC758 \uAE38\uC774(\uAE00\uC790 \uC218 \uB610\uB294 \uD56D\uBAA9 \uAC1C\uC218)`;
  if (/^(e|event|evt)\.target\.value$/.test(v)) return "\uC774\uBCA4\uD2B8\uAC00 \uC77C\uC5B4\uB09C \uC785\uB825\uCE78\uC5D0 \uC9C0\uAE08 \uC801\uD600 \uC788\uB294 \uAC12";
  if (/^(e|event|evt)\.target\.checked$/.test(v)) return "\uC774\uBCA4\uD2B8\uAC00 \uC77C\uC5B4\uB09C \uCCB4\uD06C\uBC15\uC2A4\uAC00 \uCCB4\uD06C\uB418\uC5B4 \uC788\uB294\uC9C0 \uC5EC\uBD80(\uCC38/\uAC70\uC9D3)";
  if (/^(e|event|evt)\.target$/.test(v)) return "\uC774\uBCA4\uD2B8\uAC00 \uC77C\uC5B4\uB09C \uBC14\uB85C \uADF8 \uC694\uC18C";
  if (/^(e|event|evt)\.key$/.test(v)) return "\uC0AC\uC6A9\uC790\uAC00 \uB204\uB978 \uD0A4\uBCF4\uB4DC \uD0A4\uC758 \uC774\uB984";
  if (/^(window\.)?location\.href$/.test(v)) return "\uC9C0\uAE08 \uC5F4\uB824 \uC788\uB294 \uD398\uC774\uC9C0\uC758 \uC804\uCCB4 \uC8FC\uC18C";
  if (m = v.match(/^process\.env\.(\w+)$/)) return `\uC11C\uBC84\uC758 \uD658\uACBD \uC124\uC815(\uBE44\uBC00\uAC12 \uB4F1)\uC5D0 \uC800\uC7A5\uB41C ${m[1]} \uAC12`;
  if (m = v.match(/^typeof\s+([\w$.]+)$/)) return `${m[1]}\uC758 \uC790\uB8CC\uD615 \uC774\uB984(\uC608: 'number', 'string')`;
  if (m = v.match(/^([\w$.]+)\.(value)$/)) return `${m[1]} \uC785\uB825\uCE78\uC5D0 \uC9C0\uAE08 \uC801\uD600 \uC788\uB294 \uAC12`;
  if (m = v.match(/^([\w$.]+)\.(textContent|innerText)$/)) return `${m[1]} \uC694\uC18C \uC548\uC5D0 \uBCF4\uC774\uB294 \uAE00\uC790`;
  return null;
}
function describeKeyword(t, stack = []) {
  let m;
  const nearest2 = (re) => [...stack].reverse().find((l) => re.test(l.trim()));
  if (/^break;?$/.test(t)) {
    const loop = nearest2(/^(for|while|do)\b|^switch\b|\.forEach\(/);
    const inSwitch = loop ? /^switch\b/.test(loop.trim()) : false;
    return {
      role: inSwitch ? "switch \uBE60\uC838\uB098\uC624\uAE30 (break)" : "\uBC18\uBCF5 \uB05D\uB0B4\uAE30 (break)",
      definition: "break\uB294 \uBC18\uBCF5\uBB38(for, while)\uC774\uB098 switch \uBB38\uC744 \uADF8 \uC790\uB9AC\uC5D0\uC11C \uC989\uC2DC \uB05D\uB0B4\uACE0 \uBE60\uC838\uB098\uC624\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.",
      easy: inSwitch ? "\uC5EC\uAE30\uC11C switch \uBB38\uC744 \uB05D\uB0B4\uACE0 \uBE60\uC838\uB098\uC635\uB2C8\uB2E4. \uADF8\uB798\uC11C \uC544\uB798\uC5D0 \uC788\uB294 \uB2E4\uB978 case\uC758 \uBA85\uB839\uC740 \uC2E4\uD589\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." : loop ? `\uBC18\uBCF5 \uC911\uC774\uB358 \uBB36\uC74C(${loop.trim().replace(/\s*\{$/, "")})\uC744 \uC5EC\uAE30\uC11C \uBC14\uB85C \uC885\uB8CC\uD558\uACE0, \uBC18\uBCF5 \uBB36\uC74C \uB2E4\uC74C\uC5D0 \uC788\uB294 \uCF54\uB4DC\uB85C \uB118\uC5B4\uAC11\uB2C8\uB2E4.` : "\uBC18\uBCF5\uC744 \uC5EC\uAE30\uC11C \uBC14\uB85C \uC885\uB8CC\uD558\uACE0, \uBC18\uBCF5 \uBB36\uC74C \uB2E4\uC74C\uC5D0 \uC788\uB294 \uCF54\uB4DC\uB85C \uB118\uC5B4\uAC11\uB2C8\uB2E4.",
      why: inSwitch ? "\uC77C\uCE58\uD558\uB294 case\uC758 \uBA85\uB839\uB9CC \uC2E4\uD589\uD558\uACE0, \uC544\uB798 case\uAE4C\uC9C0 \uC774\uC5B4\uC11C \uC2E4\uD589\uB418\uB294 \uAC83\uC744 \uB9C9\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4." : "\uC6D0\uD558\uB294 \uAC12\uC744 \uCC3E\uC558\uAC70\uB098 \uB354 \uC774\uC0C1 \uBC18\uBCF5\uD560 \uD544\uC694\uAC00 \uC5C6\uC744 \uB54C, \uB0A8\uC740 \uBC18\uBCF5\uC744 \uAC74\uB108\uB6F0\uACE0 \uBC14\uB85C \uB05D\uB0B4\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (/^continue;?$/.test(t)) {
    return {
      role: "\uC774\uBC88 \uCC28\uB840 \uAC74\uB108\uB6F0\uAE30 (continue)",
      definition: "continue\uB294 \uBC18\uBCF5\uBB38\uC5D0\uC11C \uC774\uBC88 \uCC28\uB840\uC758 \uB0A8\uC740 \uBA85\uB839\uC744 \uAC74\uB108\uB6F0\uACE0, \uACE7\uBC14\uB85C \uB2E4\uC74C \uCC28\uB840 \uBC18\uBCF5\uC73C\uB85C \uB118\uC5B4\uAC00\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.",
      easy: "\uC774 \uC904 \uC544\uB798\uC5D0 \uB0A8\uC740 \uBA85\uB839\uC740 \uC774\uBC88 \uCC28\uB840\uC5D0\uB9CC \uC2E4\uD589\uD558\uC9C0 \uC54A\uACE0, \uBC18\uBCF5\uC758 \uB2E4\uC74C \uCC28\uB840\uB85C \uBC14\uB85C \uB118\uC5B4\uAC11\uB2C8\uB2E4. \uBC18\uBCF5 \uC790\uCCB4\uAC00 \uB05D\uB098\uC9C0\uB294 \uC54A\uC2B5\uB2C8\uB2E4.",
      why: "\uC870\uAC74\uC5D0 \uB9DE\uC9C0 \uC54A\uB294 \uD56D\uBAA9\uC740 \uCC98\uB9AC\uD558\uC9C0 \uC54A\uACE0 \uB118\uC5B4\uAC00\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (/^pass$/.test(t)) {
    return {
      role: "\uC544\uBB34\uAC83\uB3C4 \uC548 \uD558\uAE30 (pass)",
      definition: "pass\uB294 \uD30C\uC774\uC36C\uC5D0\uC11C \uC544\uBB34 \uC77C\uB3C4 \uD558\uC9C0 \uC54A\uACE0 \uADF8\uB0E5 \uC9C0\uB098\uAC00\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.",
      easy: "\uBB38\uBC95\uC0C1 \uC774 \uC790\uB9AC\uC5D0 \uBA85\uB839\uC774 \uAF2D \uC788\uC5B4\uC57C \uD558\uC9C0\uB9CC \uC544\uC9C1 \uD560 \uC77C\uC774 \uC5C6\uC5B4\uC11C, \uBE48\uC790\uB9AC\uB97C \uCC44\uC6CC \uB454 \uC904\uC785\uB2C8\uB2E4.",
      why: "\uB098\uC911\uC5D0 \uCC44\uC6B8 \uBD80\uBD84\uC758 \uC790\uB9AC\uB97C \uBBF8\uB9AC \uC7A1\uC544 \uB450\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (m = t.match(/^switch\s*\((.+)\)\s*\{?$/)) {
    return {
      role: `${m[1]} \uAC12\uC5D0 \uB530\uB77C \uB098\uB204\uAE30 (switch)`,
      definition: "switch\uB294 \uD558\uB098\uC758 \uAC12\uC744 \uC5EC\uB7EC \uACBD\uC6B0(case)\uC640 \uCC28\uB840\uB85C \uBE44\uAD50\uD574\uC11C, \uC77C\uCE58\uD558\uB294 \uACBD\uC6B0\uC758 \uBA85\uB839\uB9CC \uC2E4\uD589\uD558\uB294 \uC870\uAC74\uBB38\uC785\uB2C8\uB2E4.",
      easy: `${m[1]} \uAC12\uC774 \uBB34\uC5C7\uC778\uC9C0\uC5D0 \uB530\uB77C, \uC544\uB798 case \uC911 \uAC12\uC774 \uAC19\uC740 \uACF3\uC73C\uB85C \uAC00\uC11C \uADF8 \uBA85\uB839\uC744 \uC2E4\uD589\uD569\uB2C8\uB2E4.`,
      why: "if ~ else if\uB97C \uC5EC\uB7EC \uBC88 \uC4F0\uB294 \uB300\uC2E0, \uD55C \uAC12\uC758 \uC5EC\uB7EC \uACBD\uC6B0\uB97C \uBCF4\uAE30 \uC88B\uAC8C \uC815\uB9AC\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (m = t.match(/^case\s+(.+?)\s*:$/)) {
    const sw = nearest2(/^switch\b/);
    const subject = sw?.match(/^switch\s*\((.+)\)/)?.[1] || "\uAC80\uC0AC\uD558\uB294 \uAC12";
    return {
      role: `\uACBD\uC6B0: ${m[1]}`,
      definition: 'case\uB294 switch \uBB38 \uC548\uC5D0\uC11C "\uAC12\uC774 \uC774\uAC83\uC77C \uB54C"\uB77C\uB294 \uD558\uB098\uC758 \uACBD\uC6B0\uB97C \uB098\uD0C0\uB0C5\uB2C8\uB2E4.',
      easy: `${josa(subject, "\uC774/\uAC00")} ${josa(m[1], "\uACFC/\uC640")} \uAC19\uC73C\uBA74 \uC774 \uC904 \uC544\uB798\uC758 \uBA85\uB839\uBD80\uD130 \uC2E4\uD589\uD569\uB2C8\uB2E4.`,
      why: `${subject} \uAC12\uC774 ${m[1]}\uC77C \uB54C \uD574\uC57C \uD560 \uC77C\uC744 \uB530\uB85C \uC815\uD574 \uB450\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`
    };
  }
  if (/^default\s*:$/.test(t)) {
    return {
      role: "\uB098\uBA38\uC9C0 \uACBD\uC6B0 (default)",
      definition: "default\uB294 switch \uBB38\uC5D0\uC11C \uC704\uC758 case\uAC00 \uD558\uB098\uB3C4 \uB9DE\uC9C0 \uC54A\uC744 \uB54C \uC2E4\uD589\uD560 \uBD80\uBD84\uC785\uB2C8\uB2E4.",
      easy: "\uC704\uC5D0 \uC801\uC740 \uC5B4\uB5A4 \uACBD\uC6B0\uC5D0\uB3C4 \uD574\uB2F9\uD558\uC9C0 \uC54A\uC73C\uBA74 \uC774 \uC904 \uC544\uB798\uC758 \uBA85\uB839\uC744 \uC2E4\uD589\uD569\uB2C8\uB2E4.",
      why: "\uC608\uC0C1\uD558\uC9C0 \uBABB\uD55C \uAC12\uC774 \uB4E4\uC5B4\uC640\uB3C4 \uBE60\uC9D0\uC5C6\uC774 \uCC98\uB9AC\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (m = t.match(/^throw\s+(?:new\s+)?(\w*Error)?\(?\s*([\s\S]*?)\)?;?$/)) {
    const msg = uq(m[2] || "");
    return {
      role: "\uC624\uB958 \uC77C\uC73C\uD0A4\uAE30 (throw)",
      definition: "throw\uB294 \uC624\uB958\uB97C \uC77C\uBD80\uB7EC \uBC1C\uC0DD\uC2DC\uCF1C\uC11C \uC2E4\uD589\uC744 \uBA48\uCD94\uACE0, \uAC00\uAE4C\uC6B4 catch \uBD80\uBD84\uC73C\uB85C \uB118\uAE30\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.",
      easy: msg ? `${josa(`'${msg}'`, "\uC774\uB77C\uB294/\uB77C\uB294")} \uB0B4\uC6A9\uC758 \uC624\uB958\uB97C \uBC1C\uC0DD\uC2DC\uCF1C, \uC774 \uC544\uB798 \uCF54\uB4DC\uB294 \uC2E4\uD589\uD558\uC9C0 \uC54A\uACE0 \uC624\uB958 \uCC98\uB9AC \uBD80\uBD84\uC73C\uB85C \uB118\uC5B4\uAC11\uB2C8\uB2E4.` : "\uC624\uB958\uB97C \uBC1C\uC0DD\uC2DC\uCF1C \uC774 \uC544\uB798 \uCF54\uB4DC\uB294 \uC2E4\uD589\uD558\uC9C0 \uC54A\uACE0 \uC624\uB958 \uCC98\uB9AC \uBD80\uBD84\uC73C\uB85C \uB118\uC5B4\uAC11\uB2C8\uB2E4.",
      why: "\uC798\uBABB\uB41C \uAC12\uC774 \uB4E4\uC5B4\uC628 \uC0C1\uD669\uC744 \uADF8\uB0E5 \uB118\uC5B4\uAC00\uC9C0 \uC54A\uACE0, \uBB38\uC81C\uAC00 \uC788\uB2E4\uB294 \uAC83\uC744 \uD655\uC2E4\uD788 \uC54C\uB9AC\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (/^do\s*\{?$/.test(t)) {
    return {
      role: "\uBA3C\uC800 \uC2E4\uD589\uD558\uACE0 \uBC18\uBCF5 (do)",
      definition: "do ... while\uC740 \uC544\uB798 { } \uC548\uC758 \uBA85\uB839\uC744 \uC77C\uB2E8 \uD55C \uBC88 \uC2E4\uD589\uD55C \uB4A4, while\uC758 \uC870\uAC74\uC774 \uB9DE\uB294 \uB3D9\uC548 \uACC4\uC18D \uBC18\uBCF5\uD558\uB294 \uBC18\uBCF5\uBB38\uC785\uB2C8\uB2E4.",
      easy: "\uC544\uB798 { } \uC548\uC758 \uBA85\uB839\uC744 \uC870\uAC74 \uAC80\uC0AC \uC5C6\uC774 \uBA3C\uC800 \uD55C \uBC88 \uC2E4\uD589\uD569\uB2C8\uB2E4. \uBC18\uBCF5\uD560\uC9C0\uB294 \uB9E8 \uB05D\uC758 while \uC870\uAC74\uC73C\uB85C \uC815\uD569\uB2C8\uB2E4.",
      why: "\uCD5C\uC18C\uD55C \uD55C \uBC88\uC740 \uAF2D \uC2E4\uD589\uD574\uC57C \uD558\uB294 \uC791\uC5C5\uC744 \uBC18\uBCF5\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (/^['"]use strict['"];?$/.test(t)) {
    return {
      role: "\uC5C4\uACA9 \uBAA8\uB4DC \uC120\uC5B8",
      definition: "'use strict'\uB294 \uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8\uB97C \uB354 \uC5C4\uACA9\uD55C \uADDC\uCE59\uC73C\uB85C \uC2E4\uD589\uD558\uB77C\uACE0 \uC54C\uB824\uC8FC\uB294 \uC120\uC5B8\uC785\uB2C8\uB2E4.",
      easy: "\uC2E4\uC218\uD558\uAE30 \uC26C\uC6B4 \uCF54\uB4DC(\uC120\uC5B8\uD558\uC9C0 \uC54A\uC740 \uBCC0\uC218 \uC0AC\uC6A9 \uB4F1)\uB97C \uC624\uB958\uB85C \uBC14\uB85C \uC54C\uB824\uC8FC\uB3C4\uB85D \uC5C4\uACA9 \uBAA8\uB4DC\uB97C \uCF2D\uB2C8\uB2E4.",
      why: "\uB208\uC5D0 \uC798 \uB744\uC9C0 \uC54A\uB294 \uC2E4\uC218\uB97C \uBBF8\uB9AC \uC7A1\uC544\uB0B4\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (/^debugger;?$/.test(t)) {
    return {
      role: "\uB514\uBC84\uAE45 \uBA48\uCDA4\uC810",
      definition: "debugger\uB294 \uAC1C\uBC1C\uC790 \uB3C4\uAD6C\uAC00 \uC5F4\uB824 \uC788\uC744 \uB54C \uADF8 \uC904\uC5D0\uC11C \uC2E4\uD589\uC744 \uC7A0\uAE50 \uBA48\uCD94\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.",
      easy: "\uAC1C\uBC1C\uC790 \uB3C4\uAD6C(F12)\uAC00 \uC5F4\uB824 \uC788\uC73C\uBA74 \uC5EC\uAE30\uC11C \uC2E4\uD589\uC774 \uBA48\uCDB0\uC11C, \uADF8 \uC21C\uAC04\uC758 \uBCC0\uC218 \uAC12\uC744 \uD558\uB098\uC529 \uC0B4\uD3B4\uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
      why: "\uCF54\uB4DC\uAC00 \uC5B4\uB514\uC11C \uC798\uBABB\uB418\uB294\uC9C0 \uCC3E\uAE30 \uC704\uD574 \uC784\uC2DC\uB85C \uB123\uC5B4 \uB454 \uAC83\uC785\uB2C8\uB2E4. \uC644\uC131\uB41C \uCF54\uB4DC\uC5D0\uC11C\uB294 \uC9C0\uC6CC\uC57C \uD569\uB2C8\uB2E4."
    };
  }
  if (m = t.match(/^export\s+default\s+([\w$]+);?$/)) {
    return {
      role: `${m[1]} \uB0B4\uBCF4\uB0B4\uAE30`,
      definition: "export default\uB294 \uC774 \uD30C\uC77C\uC758 \uB300\uD45C \uAE30\uB2A5 \uD558\uB098\uB97C \uB2E4\uB978 \uD30C\uC77C\uC5D0\uC11C \uAC00\uC838\uB2E4 \uC4F8 \uC218 \uC788\uAC8C \uB0B4\uBCF4\uB0B4\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.",
      easy: `\uC774 \uD30C\uC77C\uC758 \uB300\uD45C\uB85C ${josa(m[1], "\uC744/\uB97C")} \uB0B4\uBCF4\uB0B4\uC11C, \uB2E4\uB978 \uD30C\uC77C\uC5D0\uC11C import\uB85C \uAC00\uC838\uB2E4 \uC4F8 \uC218 \uC788\uAC8C \uD569\uB2C8\uB2E4.`,
      why: `\uC5EC\uAE30\uC11C \uB9CC\uB4E0 ${josa(m[1], "\uC744/\uB97C")} \uB2E4\uB978 \uD654\uBA74\uC774\uB098 \uD30C\uC77C\uC5D0\uC11C\uB3C4 \uC0AC\uC6A9\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`
    };
  }
  if (m = t.match(/^module\.exports\s*=\s*([\s\S]+?);?$/)) {
    return {
      role: "\uB0B4\uBCF4\uB0B4\uAE30 (module.exports)",
      definition: "module.exports\uB294 Node.js\uC5D0\uC11C \uC774 \uD30C\uC77C\uC758 \uAE30\uB2A5\uC744 \uB2E4\uB978 \uD30C\uC77C\uC774 require\uB85C \uAC00\uC838\uB2E4 \uC4F8 \uC218 \uC788\uAC8C \uB0B4\uBCF4\uB0B4\uB294 \uBC29\uBC95\uC785\uB2C8\uB2E4.",
      easy: `${josa(m[1], "\uC744/\uB97C")} \uC774 \uD30C\uC77C\uC758 \uACB0\uACFC\uBB3C\uB85C \uB0B4\uBCF4\uB0C5\uB2C8\uB2E4.`,
      why: "\uC5EC\uAE30\uC11C \uB9CC\uB4E0 \uAE30\uB2A5\uC744 \uB2E4\uB978 \uD30C\uC77C\uC5D0\uC11C\uB3C4 \uC7AC\uC0AC\uC6A9\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (m = t.match(/^delete\s+([\w$.[\]'"]+);?$/)) {
    return {
      role: "\uD56D\uBAA9 \uC9C0\uC6B0\uAE30 (delete)",
      definition: "delete\uB294 \uBB36\uC74C(\uAC1D\uCCB4) \uC548\uC758 \uD56D\uBAA9 \uD558\uB098\uB97C \uC9C0\uC6B0\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.",
      easy: `${m[1].replace(/\.[^.]+$/, "")} \uBB36\uC74C\uC5D0\uC11C ${m[1].split(".").pop()} \uD56D\uBAA9\uC744 \uC9C0\uC6C1\uB2C8\uB2E4.`,
      why: "\uB354 \uC774\uC0C1 \uD544\uC694 \uC5C6\uB294 \uC815\uBCF4\uB97C \uBB36\uC74C\uC5D0\uC11C \uC5C6\uC560\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (m = t.match(/^(window\.)?location\.href\s*=\s*([\s\S]+?);?$/)) {
    return {
      role: "\uD398\uC774\uC9C0 \uC774\uB3D9",
      definition: "location.href\uC5D0 \uC8FC\uC18C\uB97C \uB123\uC73C\uBA74 \uBE0C\uB77C\uC6B0\uC800\uAC00 \uADF8 \uC8FC\uC18C\uC758 \uD398\uC774\uC9C0\uB85C \uC774\uB3D9\uD569\uB2C8\uB2E4.",
      easy: `\uC9C0\uAE08 \uCC3D\uC744 ${josa(explainValue(m[2]), "\uC73C\uB85C/\uB85C")} \uC774\uB3D9\uC2DC\uD0A4\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: "\uC0AC\uC6A9\uC790\uB97C \uB2E4\uB978 \uD398\uC774\uC9C0\uB85C \uBCF4\uB0B4\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (m = t.match(/^document\.title\s*=\s*([\s\S]+?);?$/)) {
    return {
      role: "\uD0ED \uC81C\uBAA9 \uBC14\uAFB8\uAE30",
      definition: "document.title\uC740 \uBE0C\uB77C\uC6B0\uC800 \uD0ED\uC5D0 \uBCF4\uC774\uB294 \uD398\uC774\uC9C0 \uC81C\uBAA9\uC785\uB2C8\uB2E4.",
      easy: `\uBE0C\uB77C\uC6B0\uC800 \uD0ED\uC5D0 \uBCF4\uC774\uB294 \uC81C\uBAA9\uC744 ${josa(explainValue(m[1]), "\uC73C\uB85C/\uB85C")} \uBC14\uAFB8\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: "\uC9C0\uAE08 \uBCF4\uACE0 \uC788\uB294 \uD654\uBA74\uC5D0 \uB9DE\uAC8C \uD0ED \uC81C\uBAA9\uC744 \uC54C\uB824\uC8FC\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (m = t.match(/^([\w$.]+)\.style\.([a-zA-Z]+)\s*=\s*([\s\S]+?);?$/)) {
    const kebab = m[2].replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
    const label = CSS_PROPS[kebab] || kebab;
    return {
      role: `${label} \uB514\uC790\uC778 \uBC14\uAFB8\uAE30`,
      definition: "\uC694\uC18C.style.\uC18D\uC131 = \uAC12 \uC740 \uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8\uB85C \uADF8 \uC694\uC18C\uC758 \uB514\uC790\uC778(CSS)\uC744 \uC9C1\uC811 \uBC14\uAFB8\uB294 \uBC29\uBC95\uC785\uB2C8\uB2E4.",
      easy: `${m[1]} \uC694\uC18C\uC758 ${label}(${kebab})${josa(label, "\uC744/\uB97C").slice(label.length)} ${josa(uq(m[3]), "\uC73C\uB85C/\uB85C")} \uBC14\uAFB8\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: "\uC0AC\uC6A9\uC790 \uD589\uB3D9\uC5D0 \uB530\uB77C \uD654\uBA74\uC758 \uBAA8\uC591(\uC0C9, \uD06C\uAE30, \uBCF4\uC774\uAE30/\uC228\uAE30\uAE30)\uC744 \uBC14\uB85C \uBC14\uAFB8\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  return null;
}
function definitionFor(t) {
  if (/^import\b/.test(t) || /^from\s+\S+\s+import\b/.test(t)) return "import\uB294 \uB2E4\uB978 \uD30C\uC77C\uC774\uB098 \uB77C\uC774\uBE0C\uB7EC\uB9AC\uC5D0 \uC788\uB294 \uAE30\uB2A5\uC744 \uC774 \uD30C\uC77C\uB85C \uAC00\uC838\uC624\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.";
  if (/^(export\s+)?(default\s+)?(async\s+)?function\b/.test(t) || /^def\s/.test(t)) return "\uD568\uC218\uB294 \uC5EC\uB7EC \uBA85\uB839\uC744 \uD558\uB098\uB85C \uBB36\uC5B4 \uC774\uB984\uC744 \uBD99\uC5EC \uB454 \uAE30\uB2A5\uC785\uB2C8\uB2E4. \uC774\uB984\uC744 \uBD88\uB7EC\uC57C(\uD638\uCD9C\uD574\uC57C) \uC548\uC758 \uBA85\uB839\uC774 \uC2E4\uD589\uB429\uB2C8\uB2E4.";
  if (/=\s*(async\s*)?(\([^)]*\)|[\w$]+)\s*=>/.test(t) && /^(export\s+)?(const|let|var)\s/.test(t)) return "\uD654\uC0B4\uD45C \uD568\uC218(=>)\uB294 \uD568\uC218\uB97C \uC9E7\uAC8C \uC4F0\uB294 \uBC29\uBC95\uC785\uB2C8\uB2E4. \uC774\uB984\uC744 \uBD88\uB7EC\uC57C(\uD638\uCD9C\uD574\uC57C) \uC548\uC758 \uBA85\uB839\uC774 \uC2E4\uD589\uB429\uB2C8\uB2E4.";
  if (/useState(<[^>]*>)?\(/.test(t)) return "useState\uB294 \uD654\uBA74\uC5D0 \uBCF4\uC5EC\uC904 \uAC12\uC744 \uAE30\uC5B5\uD574 \uB450\uACE0, \uADF8 \uAC12\uC774 \uBC14\uB00C\uBA74 \uD654\uBA74\uC744 \uC790\uB3D9\uC73C\uB85C \uB2E4\uC2DC \uADF8\uB824 \uC8FC\uB294 \uB9AC\uC561\uD2B8 \uAE30\uB2A5\uC785\uB2C8\uB2E4.";
  if (/^(const|let|var)\s/.test(t)) {
    const kw = t.split(/\s/)[0];
    return kw === "const" ? "const\uB294 \uD55C \uBC88 \uB123\uC740 \uAC12\uC744 \uB2E4\uC2DC \uBC14\uAFC0 \uC218 \uC5C6\uB294 \uBCC0\uC218(\uC774\uB984\uD45C\uB97C \uBD99\uC778 \uC0C1\uC790)\uB97C \uB9CC\uB4DC\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4." : kw === "let" ? "let\uC740 \uB098\uC911\uC5D0 \uB2E4\uB978 \uAC12\uC73C\uB85C \uBC14\uAFC0 \uC218 \uC788\uB294 \uBCC0\uC218(\uC774\uB984\uD45C\uB97C \uBD99\uC778 \uC0C1\uC790)\uB97C \uB9CC\uB4DC\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4." : "var\uB294 \uBCC0\uC218\uB97C \uB9CC\uB4DC\uB294 \uC61B\uB0A0 \uBC29\uC2DD\uC758 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4. \uC694\uC998\uC740 const\uB098 let\uC744 \uC501\uB2C8\uB2E4.";
  }
  if (/^if\b/.test(t)) return "if\uB294 \uAD04\uD638 \uC548\uC758 \uC870\uAC74\uC774 \uB9DE\uC744 \uB54C\uB9CC \uC544\uB798 \uBA85\uB839\uC744 \uC2E4\uD589\uD558\uB294 \uC870\uAC74\uBB38\uC785\uB2C8\uB2E4.";
  if (/^(\}\s*)?else\s+if\b|^elif\b/.test(t)) return "else if\uB294 \uC55E\uC758 \uC870\uAC74\uC774 \uB9DE\uC9C0 \uC54A\uC558\uC744 \uB54C \uB2E4\uB978 \uC870\uAC74\uC744 \uD55C \uBC88 \uB354 \uAC80\uC0AC\uD558\uB294 \uC870\uAC74\uBB38\uC785\uB2C8\uB2E4.";
  if (/^(\}\s*)?else\b/.test(t)) return "else\uB294 \uC55E\uC758 \uC870\uAC74\uB4E4\uC774 \uBAA8\uB450 \uB9DE\uC9C0 \uC54A\uC744 \uB54C \uC2E4\uD589\uD560 \uBD80\uBD84\uC785\uB2C8\uB2E4.";
  if (/^for\b/.test(t)) return "for\uB294 \uAC19\uC740 \uBA85\uB839\uC744 \uC815\uD574\uC9C4 \uD69F\uC218\uB098 \uBAA9\uB85D\uC758 \uAC1C\uC218\uB9CC\uD07C \uBC18\uBCF5\uD558\uB294 \uBC18\uBCF5\uBB38\uC785\uB2C8\uB2E4.";
  if (/^while\b/.test(t)) return "while\uC740 \uAD04\uD638 \uC548\uC758 \uC870\uAC74\uC774 \uB9DE\uB294 \uB3D9\uC548 \uBA85\uB839\uC744 \uACC4\uC18D \uBC18\uBCF5\uD558\uB294 \uBC18\uBCF5\uBB38\uC785\uB2C8\uB2E4.";
  if (/^return\b/.test(t)) return "return\uC740 \uD568\uC218\uC758 \uACB0\uACFC\uAC12\uC744 \uB3CC\uB824\uC8FC\uBA74\uC11C \uD568\uC218\uB97C \uADF8 \uC790\uB9AC\uC5D0\uC11C \uB05D\uB0B4\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.";
  if (/^try\b/.test(t)) return "try\uB294 \uC624\uB958\uAC00 \uB0A0 \uC218 \uC788\uB294 \uBA85\uB839\uC744 \uC2DC\uB3C4\uD574 \uBCF4\uACE0, \uC624\uB958\uAC00 \uB098\uBA74 catch\uB85C \uB118\uACA8 \uCC98\uB9AC\uD558\uAC8C \uD558\uB294 \uBB38\uBC95\uC785\uB2C8\uB2E4.";
  if (/^(\}\s*)?catch\b|^except\b/.test(t)) return "catch\uB294 try \uBD80\uBD84\uC5D0\uC11C \uC624\uB958\uAC00 \uB0AC\uC744 \uB54C \uADF8 \uC624\uB958\uB97C \uBC1B\uC544 \uCC98\uB9AC\uD558\uB294 \uBD80\uBD84\uC785\uB2C8\uB2E4.";
  if (/^(export\s+)?(default\s+)?class\b/.test(t)) return "class\uB294 \uAC19\uC740 \uAD6C\uC870\uC758 \uBB3C\uAC74(\uAC1D\uCCB4)\uC744 \uC5EC\uB7EC \uAC1C \uB9CC\uB4E4 \uC218 \uC788\uB294 \uC124\uACC4\uB3C4\uB97C \uC815\uC758\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.";
  if (/^console\./.test(t)) return "console.log\uB294 \uAD04\uD638 \uC548\uC758 \uAC12\uC744 \uAC1C\uBC1C\uC790 \uB3C4\uAD6C(F12)\uC758 \uCF58\uC194 \uCC3D\uC5D0 \uCD9C\uB825\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.";
  if (/^alert\(/.test(t)) return "alert\uB294 \uD654\uBA74\uC5D0 \uD655\uC778 \uBC84\uD2BC\uC774 \uC788\uB294 \uC54C\uB9BC \uCC3D\uC744 \uB744\uC6B0\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.";
  if (/^print\(/.test(t)) return "print\uB294 \uAD04\uD638 \uC548\uC758 \uAC12\uC744 \uD654\uBA74(\uD130\uBBF8\uB110)\uC5D0 \uAE00\uC790\uB85C \uCD9C\uB825\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.";
  if (/^fetch\(|=\s*(await\s+)?fetch\(/.test(t)) return "fetch\uB294 \uC778\uD130\uB137 \uC8FC\uC18C(\uC11C\uBC84)\uC5D0 \uB370\uC774\uD130\uB97C \uC694\uCCAD\uD558\uACE0 \uC751\uB2F5\uC744 \uBC1B\uC544\uC624\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.";
  if (/^\.then\(/.test(t)) return ".then\uC740 \uC55E\uC758 \uC624\uB798 \uAC78\uB9AC\uB294 \uC791\uC5C5(\uC11C\uBC84 \uC694\uCCAD \uB4F1)\uC774 \uB05D\uB09C \uB4A4\uC5D0 \uC774\uC5B4\uC11C \uD560 \uC77C\uC744 \uC815\uD558\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.";
  if (/^\.catch\(/.test(t)) return ".catch\uB294 \uC55E\uC758 \uC791\uC5C5\uC5D0\uC11C \uC624\uB958\uAC00 \uB0AC\uC744 \uB54C \uD560 \uC77C\uC744 \uC815\uD558\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.";
  if (/^use(Layout)?Effect\(/.test(t)) return "useEffect\uB294 \uD654\uBA74\uC774 \uB098\uD0C0\uB098\uAC70\uB098 \uD2B9\uC815 \uAC12\uC774 \uBC14\uB014 \uB54C \uC790\uB3D9\uC73C\uB85C \uC2E4\uD589\uD560 \uC77C\uC744 \uB4F1\uB85D\uD558\uB294 \uB9AC\uC561\uD2B8 \uAE30\uB2A5\uC785\uB2C8\uB2E4.";
  if (/setTimeout\(/.test(t)) return "setTimeout\uC740 \uC815\uD574\uC9C4 \uC2DC\uAC04(\uBC00\uB9AC\uCD08)\uC774 \uC9C0\uB09C \uB4A4\uC5D0 \uBA85\uB839\uC744 \uD55C \uBC88 \uC2E4\uD589\uD558\uB3C4\uB85D \uC608\uC57D\uD558\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4. 1000\uBC00\uB9AC\uCD08 = 1\uCD08\uC785\uB2C8\uB2E4.";
  if (/setInterval\(/.test(t)) return "setInterval\uC740 \uC815\uD574\uC9C4 \uC2DC\uAC04(\uBC00\uB9AC\uCD08)\uB9C8\uB2E4 \uBA85\uB839\uC744 \uACC4\uC18D \uBC18\uBCF5 \uC2E4\uD589\uD558\uB3C4\uB85D \uC608\uC57D\uD558\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.";
  if (/^clear(Timeout|Interval)\(/.test(t)) return "clearTimeout / clearInterval\uC740 setTimeout\xB7setInterval\uB85C \uC608\uC57D\uD574 \uB454 \uC791\uC5C5\uC744 \uCDE8\uC18C\uD558\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.";
  if (/\.addEventListener\(/.test(t)) return "addEventListener\uB294 \uC694\uC18C\uC5D0 \uD074\uB9AD\xB7\uC785\uB825 \uAC19\uC740 \uC77C(\uC774\uBCA4\uD2B8)\uC774 \uC0DD\uACBC\uC744 \uB54C \uC2E4\uD589\uD560 \uD568\uC218\uB97C \uC5F0\uACB0\uD558\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.";
  if (/\.preventDefault\(\)/.test(t)) return "preventDefault\uB294 \uBE0C\uB77C\uC6B0\uC800\uAC00 \uC6D0\uB798 \uD558\uB824\uB358 \uAE30\uBCF8 \uB3D9\uC791(\uC0C8\uB85C\uACE0\uCE68, \uB9C1\uD06C \uC774\uB3D9 \uB4F1)\uC744 \uB9C9\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.";
  if (/document\.(getElementById|querySelector)/.test(t)) return "document.querySelector / getElementById\uB294 \uD654\uBA74(HTML)\uC5D0\uC11C \uC6D0\uD558\uB294 \uC694\uC18C\uB97C \uCC3E\uC544\uC624\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.";
  if (/^set[A-Z]\w*\(/.test(t)) return "set\uC73C\uB85C \uC2DC\uC791\uD558\uB294 \uC774 \uAE30\uB2A5\uC740 useState\uB85C \uB9CC\uB4E0 \uAC12\uC744 \uC0C8 \uAC12\uC73C\uB85C \uBC14\uAFB8\uB294 \uB9AC\uC561\uD2B8 \uAE30\uB2A5\uC785\uB2C8\uB2E4. \uAC12\uC774 \uBC14\uB00C\uBA74 \uD654\uBA74\uC774 \uB2E4\uC2DC \uADF8\uB824\uC9D1\uB2C8\uB2E4.";
  if (/\.map\(/.test(t)) return "map\uC740 \uBAA9\uB85D(\uBC30\uC5F4)\uC758 \uAC12\uC744 \uD558\uB098\uC529 \uAEBC\uB0B4 \uADDC\uCE59\uB300\uB85C \uBC14\uAFBC \uC0C8 \uBAA9\uB85D\uC744 \uB9CC\uB4DC\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.";
  if (/\.filter\(/.test(t)) return "filter\uB294 \uBAA9\uB85D(\uBC30\uC5F4)\uC5D0\uC11C \uC870\uAC74\uC5D0 \uB9DE\uB294 \uAC12\uB9CC \uACE8\uB77C \uC0C8 \uBAA9\uB85D\uC744 \uB9CC\uB4DC\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.";
  if (/\.forEach\(/.test(t)) return "forEach\uB294 \uBAA9\uB85D(\uBC30\uC5F4)\uC758 \uAC12\uC744 \uD558\uB098\uC529 \uAEBC\uB0B4 \uAC19\uC740 \uBA85\uB839\uC744 \uC2E4\uD589\uD558\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.";
  if (/\.push\(/.test(t)) return "push\uB294 \uBAA9\uB85D(\uBC30\uC5F4)\uC758 \uB9E8 \uB05D\uC5D0 \uC0C8 \uAC12\uC744 \uCD94\uAC00\uD558\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4.";
  if (/^(\/\/|#|\/\*|\*)/.test(t)) return "\uC8FC\uC11D\uC740 \uCEF4\uD4E8\uD130\uAC00 \uC2E4\uD589\uD558\uC9C0 \uC54A\uACE0 \uBB34\uC2DC\uD558\uB294, \uC0AC\uB78C\uC744 \uC704\uD55C \uC124\uBA85 \uBA54\uBAA8\uC785\uB2C8\uB2E4.";
  if (/^[\]})]/.test(t)) return "\uB2EB\uB294 \uAD04\uD638( }, ), ] )\uB294 \uC55E\uC5D0\uC11C \uC5EC\uB294 \uAD04\uD638\uB85C \uC2DC\uC791\uD55C \uBB36\uC74C\uC774 \uC5EC\uAE30\uC11C \uB05D\uB0AC\uB2E4\uB294 \uAC83\uC744 \uC54C\uB824\uC8FC\uB294 \uAE30\uD638\uC785\uB2C8\uB2E4.";
  if (/\+\+|--/.test(t)) return "++\uB294 \uC22B\uC790\uB97C 1 \uB298\uB9AC\uACE0, --\uB294 \uC22B\uC790\uB97C 1 \uC904\uC774\uB294 \uAE30\uD638\uC785\uB2C8\uB2E4.";
  if (/[+\-*/]=/.test(t)) return "+=, -= \uAC19\uC740 \uAE30\uD638\uB294 \uAE30\uC874 \uAC12\uC5D0 \uACC4\uC0B0\uC744 \uD55C \uB4A4 \uADF8 \uACB0\uACFC\uB97C \uB2E4\uC2DC \uAC19\uC740 \uBCC0\uC218\uC5D0 \uB123\uB294 \uAE30\uD638\uC785\uB2C8\uB2E4.";
  if (/^[.#a-zA-Z*:\[][^=(){};]*\{$/.test(t)) return 'CSS \uC120\uD0DD\uC790\uB294 "\uC5B4\uB5A4 \uC694\uC18C\uB97C \uAFB8\uBC00\uC9C0" \uACE0\uB974\uB294 \uBD80\uBD84\uC774\uACE0, { } \uC548\uC5D0 \uAFB8\uBC08 \uADDC\uCE59\uC744 \uC801\uC2B5\uB2C8\uB2E4.';
  const css = t.match(/^([a-z-]+)\s*:/);
  if (css && CSS_PROPS[css[1]]) return `${css[1]}\uC740 CSS\uC5D0\uC11C \uC694\uC18C\uC758 ${josa(CSS_PROPS[css[1]], "\uC744/\uB97C")} \uC815\uD558\uB294 \uC18D\uC131\uC785\uB2C8\uB2E4.`;
  return void 0;
}
var TAG_DEFINITIONS = {
  "!doctype": "<!DOCTYPE html>\uC740 \uC774 \uBB38\uC11C\uAC00 \uCD5C\uC2E0 HTML5 \uADDC\uCE59\uC73C\uB85C \uB9CC\uB4E0 \uC6F9\uD398\uC774\uC9C0\uB77C\uACE0 \uBE0C\uB77C\uC6B0\uC800\uC5D0 \uC54C\uB824\uC8FC\uB294 \uC120\uC5B8\uC785\uB2C8\uB2E4.",
  html: "<html>\uC740 \uC6F9\uD398\uC774\uC9C0 \uC804\uCCB4\uB97C \uAC10\uC2F8\uB294 \uAC00\uC7A5 \uBC14\uAE65 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  head: "<head>\uB294 \uD654\uBA74\uC5D0 \uBCF4\uC774\uC9C0 \uC54A\uB294 \uD398\uC774\uC9C0 \uC815\uBCF4(\uC81C\uBAA9, \uAE00\uC790 \uC124\uC815, \uB514\uC790\uC778 \uD30C\uC77C \uC5F0\uACB0 \uB4F1)\uB97C \uB2F4\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  body: "<body>\uB294 \uD654\uBA74\uC5D0 \uC2E4\uC81C\uB85C \uBCF4\uC774\uB294 \uBAA8\uB4E0 \uB0B4\uC6A9\uC744 \uB2F4\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  meta: "<meta>\uB294 \uAE00\uC790 \uBC29\uC2DD, \uD654\uBA74 \uD06C\uAE30 \uAC19\uC740 \uD398\uC774\uC9C0\uC758 \uC124\uC815 \uC815\uBCF4\uB97C \uBE0C\uB77C\uC6B0\uC800\uC5D0 \uC54C\uB824\uC8FC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  title: "<title>\uC740 \uBE0C\uB77C\uC6B0\uC800 \uD0ED\uC5D0 \uD45C\uC2DC\uB418\uB294 \uD398\uC774\uC9C0 \uC81C\uBAA9\uC744 \uC815\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  link: "<link>\uB294 CSS \uB514\uC790\uC778 \uD30C\uC77C\uC774\uB098 \uC544\uC774\uCF58 \uAC19\uC740 \uC678\uBD80 \uD30C\uC77C\uC744 \uD398\uC774\uC9C0\uC5D0 \uC5F0\uACB0\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  script: "<script>\uB294 \uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8 \uCF54\uB4DC\uB97C \uB123\uAC70\uB098 \uBD88\uB7EC\uC640\uC11C \uC2E4\uD589\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  style: "<style>\uC740 \uC774 \uD398\uC774\uC9C0 \uC548\uC5D0 CSS \uB514\uC790\uC778 \uADDC\uCE59\uC744 \uC9C1\uC811 \uC801\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  h1: "<h1>\uC740 \uC6F9\uD398\uC774\uC9C0\uC5D0 \uAC00\uC7A5 \uD070 \uC81C\uBAA9\uC744 \uD45C\uC2DC\uD558\uB294 \uCF54\uB4DC\uC785\uB2C8\uB2E4.",
  h2: "<h2>\uB294 \uC6F9\uD398\uC774\uC9C0\uC5D0 \uB450 \uBC88\uC9F8\uB85C \uD070 \uC81C\uBAA9(\uC18C\uC81C\uBAA9)\uC744 \uD45C\uC2DC\uD558\uB294 \uCF54\uB4DC\uC785\uB2C8\uB2E4.",
  h3: "<h3>\uC740 \uC6F9\uD398\uC774\uC9C0\uC5D0 \uC138 \uBC88\uC9F8 \uD06C\uAE30\uC758 \uC791\uC740 \uC81C\uBAA9\uC744 \uD45C\uC2DC\uD558\uB294 \uCF54\uB4DC\uC785\uB2C8\uB2E4.",
  h4: "<h4>\uB294 \uC6F9\uD398\uC774\uC9C0\uC5D0 \uB124 \uBC88\uC9F8 \uD06C\uAE30\uC758 \uC791\uC740 \uC81C\uBAA9\uC744 \uD45C\uC2DC\uD558\uB294 \uCF54\uB4DC\uC785\uB2C8\uB2E4.",
  h5: "<h5>\uB294 \uC6F9\uD398\uC774\uC9C0\uC5D0 \uB2E4\uC12F \uBC88\uC9F8 \uD06C\uAE30\uC758 \uC791\uC740 \uC81C\uBAA9\uC744 \uD45C\uC2DC\uD558\uB294 \uCF54\uB4DC\uC785\uB2C8\uB2E4.",
  h6: "<h6>\uC740 \uC6F9\uD398\uC774\uC9C0\uC5D0 \uAC00\uC7A5 \uC791\uC740 \uC81C\uBAA9\uC744 \uD45C\uC2DC\uD558\uB294 \uCF54\uB4DC\uC785\uB2C8\uB2E4.",
  p: "<p>\uB294 \uC6F9\uD398\uC774\uC9C0\uC5D0 \uD55C \uB369\uC5B4\uB9AC\uC758 \uBB38\uC7A5(\uBB38\uB2E8)\uC744 \uD45C\uC2DC\uD558\uB294 \uCF54\uB4DC\uC785\uB2C8\uB2E4.",
  span: "<span>\uC740 \uAE00\uC790\uC758 \uC77C\uBD80\uBD84\uB9CC \uB530\uB85C \uAFB8\uBBF8\uAE30 \uC704\uD574 \uAC10\uC2F8\uB294 \uC791\uC740 \uC0C1\uC790 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  div: "<div>\uB294 \uC5EC\uB7EC \uC694\uC18C\uB97C \uD558\uB098\uB85C \uBB36\uB294 \uBCF4\uC774\uC9C0 \uC54A\uB294 \uC0C1\uC790 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  section: "<section>\uC740 \uD398\uC774\uC9C0\uC758 \uB0B4\uC6A9\uC744 \uC8FC\uC81C\uBCC4\uB85C \uB098\uB204\uB294 \uAD6C\uC5ED \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  main: "<main>\uC740 \uD398\uC774\uC9C0\uC5D0\uC11C \uAC00\uC7A5 \uC911\uC694\uD55C \uBCF8\uBB38 \uB0B4\uC6A9\uC744 \uB2F4\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  article: "<article>\uC740 \uD558\uB098\uC758 \uAE00(\uAC8C\uC2DC\uAE00, \uAE30\uC0AC)\uC744 \uD1B5\uC9F8\uB85C \uB2F4\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  aside: "<aside>\uB294 \uBCF8\uBB38 \uC606\uC5D0 \uBD99\uB294 \uBCF4\uC870 \uB0B4\uC6A9(\uAD11\uACE0, \uAD00\uB828 \uAE00 \uB4F1)\uC744 \uB2F4\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  header: "<header>\uB294 \uD398\uC774\uC9C0\uB098 \uAD6C\uC5ED\uC758 \uB9E8 \uC704 \uBA38\uB9AC \uBD80\uBD84(\uB85C\uACE0, \uBA54\uB274 \uB4F1)\uC744 \uB2F4\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  footer: "<footer>\uB294 \uD398\uC774\uC9C0\uB098 \uAD6C\uC5ED\uC758 \uB9E8 \uC544\uB798 \uAF2C\uB9AC \uBD80\uBD84(\uC800\uC791\uAD8C, \uC5F0\uB77D\uCC98 \uB4F1)\uC744 \uB2F4\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  nav: "<nav>\uB294 \uB2E4\uB978 \uD398\uC774\uC9C0\uB85C \uC774\uB3D9\uD558\uB294 \uBA54\uB274 \uB9C1\uD06C\uB4E4\uC744 \uB2F4\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  a: "<a>\uB294 \uB204\uB974\uBA74 \uB2E4\uB978 \uD398\uC774\uC9C0\uB098 \uC8FC\uC18C\uB85C \uC774\uB3D9\uD558\uB294 \uB9C1\uD06C\uB97C \uB9CC\uB4DC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  img: "<img>\uB294 \uC6F9\uD398\uC774\uC9C0\uC5D0 \uADF8\uB9BC(\uC774\uBBF8\uC9C0)\uC744 \uD45C\uC2DC\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  button: "<button>\uC740 \uC0AC\uC6A9\uC790\uAC00 \uB204\uB97C \uC218 \uC788\uB294 \uBC84\uD2BC\uC744 \uB9CC\uB4DC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  input: "<input>\uC740 \uC0AC\uC6A9\uC790\uAC00 \uAE00\uC790\uB97C \uC785\uB825\uD558\uAC70\uB098 \uAC12\uC744 \uACE0\uB97C \uC218 \uC788\uB294 \uC785\uB825\uCE78\uC744 \uB9CC\uB4DC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  textarea: "<textarea>\uB294 \uC5EC\uB7EC \uC904\uC758 \uAE34 \uAE00\uC744 \uC785\uB825\uD560 \uC218 \uC788\uB294 \uD070 \uC785\uB825\uCE78\uC744 \uB9CC\uB4DC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  label: '<label>\uC740 \uC785\uB825\uCE78 \uC606\uC5D0 "\uBB34\uC5C7\uC744 \uC785\uB825\uD558\uB294 \uCE78\uC778\uC9C0" \uC54C\uB824\uC8FC\uB294 \uC774\uB984\uD45C \uAE00\uC790\uB97C \uB9CC\uB4DC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.',
  form: "<form>\uC740 \uC785\uB825\uCE78\uACFC \uBC84\uD2BC\uC744 \uD558\uB098\uB85C \uBB36\uC5B4 \uC785\uB825\uD55C \uB0B4\uC6A9\uC744 \uC11C\uBC84\uB85C \uBCF4\uB0B4\uB294 \uC2E0\uCCAD\uC11C(\uC591\uC2DD)\uB97C \uB9CC\uB4DC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  select: "<select>\uB294 \uC5EC\uB7EC \uD56D\uBAA9 \uC911 \uD558\uB098\uB97C \uACE0\uB974\uB294 \uD3BC\uCE68 \uBAA9\uB85D(\uB4DC\uB86D\uB2E4\uC6B4)\uC744 \uB9CC\uB4DC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  option: "<option>\uC740 \uD3BC\uCE68 \uBAA9\uB85D(<select>) \uC548\uC758 \uC120\uD0DD \uD56D\uBAA9 \uD558\uB098\uB97C \uB9CC\uB4DC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  ul: "<ul>\uC740 \uC55E\uC5D0 \uC810(\u2022)\uC774 \uCC0D\uD788\uB294 \uC21C\uC11C \uC5C6\uB294 \uBAA9\uB85D\uC744 \uB9CC\uB4DC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  ol: "<ol>\uC740 \uC55E\uC5D0 1, 2, 3 \uBC88\uD638\uAC00 \uBD99\uB294 \uC21C\uC11C \uC788\uB294 \uBAA9\uB85D\uC744 \uB9CC\uB4DC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  li: "<li>\uB294 \uBAA9\uB85D(<ul>, <ol>) \uC548\uC758 \uD56D\uBAA9 \uD55C \uC904\uC744 \uB9CC\uB4DC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  table: "<table>\uC740 \uAC00\uB85C\uC904\uACFC \uC138\uB85C\uC904\uB85C \uB41C \uD45C\uB97C \uB9CC\uB4DC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  thead: "<thead>\uB294 \uD45C\uC758 \uB9E8 \uC704 \uC81C\uBAA9 \uC904 \uBD80\uBD84\uC744 \uBB36\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  tbody: "<tbody>\uB294 \uD45C\uC758 \uBCF8\uBB38 \uB0B4\uC6A9 \uC904\uB4E4\uC744 \uBB36\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  tr: "<tr>\uC740 \uD45C\uC758 \uAC00\uB85C\uC904 \uD55C \uC904\uC744 \uB9CC\uB4DC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  th: "<th>\uB294 \uD45C\uC758 \uC81C\uBAA9 \uCE78(\uAD75\uC740 \uAE00\uC528) \uD558\uB098\uB97C \uB9CC\uB4DC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  td: "<td>\uB294 \uD45C\uC758 \uB0B4\uC6A9 \uCE78 \uD558\uB098\uB97C \uB9CC\uB4DC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  strong: "<strong>\uC740 \uC911\uC694\uD55C \uAE00\uC790\uB97C \uAD75\uC740 \uAE00\uC528\uB85C \uAC15\uC870\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  b: "<b>\uB294 \uAE00\uC790\uB97C \uAD75\uAC8C \uD45C\uC2DC\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  em: "<em>\uC740 \uAC15\uC870\uD560 \uAE00\uC790\uB97C \uAE30\uC6B8\uC5B4\uC9C4 \uAE00\uC528\uB85C \uD45C\uC2DC\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  i: "<i>\uB294 \uAE00\uC790\uB97C \uAE30\uC6B8\uC5B4\uC9C4 \uAE00\uC528\uB85C \uD45C\uC2DC\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  u: "<u>\uB294 \uAE00\uC790\uC5D0 \uBC11\uC904\uC744 \uAE0B\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  small: "<small>\uC740 \uAE00\uC790\uB97C \uC791\uAC8C \uD45C\uC2DC\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4. \uC8FC\uB85C \uC548\uB0B4\uBB38\uC774\uB098 \uC800\uC791\uAD8C \uBB38\uAD6C\uC5D0 \uC501\uB2C8\uB2E4.",
  br: "<br>\uC740 \uAE00\uC790\uB97C \uB2E4\uC74C \uC904\uB85C \uB118\uAE30\uB294(\uC904\uBC14\uAFC8) \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  hr: "<hr>\uC740 \uD654\uBA74\uC5D0 \uAC00\uB85C\uB85C \uAD6C\uBD84\uC120\uC744 \uAE0B\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  code: "<code>\uB294 \uAE00\uC790\uB97C \uCF54\uB4DC\uCC98\uB7FC \uACE0\uC815\uD3ED \uAE00\uC528\uB85C \uBCF4\uC5EC\uC8FC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  pre: "<pre>\uB294 \uB744\uC5B4\uC4F0\uAE30\uC640 \uC904\uBC14\uAFC8\uC744 \uC801\uC740 \uADF8\uB300\uB85C \uBCF4\uC5EC\uC8FC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  blockquote: "<blockquote>\uB294 \uB2E4\uB978 \uACF3\uC5D0\uC11C \uAC00\uC838\uC628 \uAE34 \uC778\uC6A9\uBB38\uC744 \uD45C\uC2DC\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  iframe: "<iframe>\uC740 \uC6F9\uD398\uC774\uC9C0 \uC548\uC5D0 \uB2E4\uB978 \uC6F9\uD398\uC774\uC9C0(\uC720\uD29C\uBE0C, \uC9C0\uB3C4 \uB4F1)\uB97C \uCC3D\uCC98\uB7FC \uB07C\uC6CC \uB123\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  video: "<video>\uB294 \uC6F9\uD398\uC774\uC9C0\uC5D0 \uB3D9\uC601\uC0C1\uC744 \uB123\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  audio: "<audio>\uB294 \uC6F9\uD398\uC774\uC9C0\uC5D0 \uC18C\uB9AC(\uC74C\uC545)\uB97C \uB123\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  source: "<source>\uB294 \uB3D9\uC601\uC0C1\uC774\uB098 \uC18C\uB9AC \uD30C\uC77C\uC758 \uC704\uCE58\uB97C \uC54C\uB824\uC8FC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  canvas: "<canvas>\uB294 \uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8\uB85C \uADF8\uB9BC\uC744 \uADF8\uB9B4 \uC218 \uC788\uB294 \uB3C4\uD654\uC9C0 \uC601\uC5ED\uC744 \uB9CC\uB4DC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  svg: "<svg>\uB294 \uD655\uB300\uD574\uB3C4 \uAE68\uC9C0\uC9C0 \uC54A\uB294 \uADF8\uB9BC(\uC544\uC774\uCF58, \uB3C4\uD615)\uC744 \uCF54\uB4DC\uB85C \uADF8\uB9AC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  figure: "<figure>\uB294 \uADF8\uB9BC\uACFC \uADF8 \uC124\uBA85\uC744 \uD55C \uBB36\uC74C\uC73C\uB85C \uB2F4\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  figcaption: "<figcaption>\uC740 <figure> \uC548\uC758 \uADF8\uB9BC\uC5D0 \uBD99\uB294 \uC124\uBA85 \uAE00\uC790\uB97C \uB9CC\uB4DC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  details: "<details>\uB294 \uB20C\uB7EC\uC11C \uD3BC\uCE58\uACE0 \uC811\uC744 \uC218 \uC788\uB294 \uB0B4\uC6A9 \uC0C1\uC790\uB97C \uB9CC\uB4DC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  summary: "<summary>\uB294 <details> \uC0C1\uC790\uC758 \uD56D\uC0C1 \uBCF4\uC774\uB294 \uC81C\uBAA9 \uBD80\uBD84\uC744 \uB9CC\uB4DC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  dialog: "<dialog>\uB294 \uD654\uBA74 \uC704\uC5D0 \uB728\uB294 \uB300\uD654 \uC0C1\uC790(\uD31D\uC5C5 \uCC3D)\uB97C \uB9CC\uB4DC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  progress: "<progress>\uB294 \uC9C4\uD589 \uC815\uB3C4\uB97C \uBCF4\uC5EC\uC8FC\uB294 \uB9C9\uB300(\uC9C4\uD589 \uBC14)\uB97C \uB9CC\uB4DC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  fieldset: "<fieldset>\uC740 \uC591\uC2DD \uC548\uC758 \uAD00\uB828\uB41C \uC785\uB825\uCE78\uB4E4\uC744 \uD14C\uB450\uB9AC\uB85C \uBB36\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  legend: "<legend>\uB294 <fieldset> \uBB36\uC74C\uC758 \uC81C\uBAA9\uC744 \uBD99\uC774\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
  noscript: "<noscript>\uB294 \uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8\uAC00 \uAEBC\uC838 \uC788\uC744 \uB54C\uB9CC \uBCF4\uC5EC\uC904 \uB0B4\uC6A9\uC744 \uB2F4\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4."
};
function describeHtmlByDefinition(trimmed, tagName) {
  const isComponent = /^<[A-Z]/.test(trimmed);
  if (isComponent) {
    const name = trimmed.match(/^<([A-Z][\w.]*)/)?.[1] || tagName;
    const props = [...trimmed.matchAll(/\s([a-zA-Z]+)=\{?["']?([^"'}\s>]+)/g)].map((m) => `${m[1]}=${m[2]}`);
    return {
      easy: `${josa(name, "\uC774\uB77C\uB294/\uB77C\uB294")}, \uC9C1\uC811 \uB9CC\uB4E0 \uD654\uBA74 \uBD80\uD488(\uCEF4\uD3EC\uB10C\uD2B8)\uC744 \uC774 \uC790\uB9AC\uC5D0 \uB123\uB294 \uCF54\uB4DC\uC785\uB2C8\uB2E4.${props.length ? ` \uBD80\uD488\uC5D0 ${props.join(", ")} \uAC12\uC744 \uC804\uB2EC\uD569\uB2C8\uB2E4.` : ""}`,
      why: `${name} \uBD80\uD488\uC5D0 \uBBF8\uB9AC \uB9CC\uB4E4\uC5B4 \uB454 \uD654\uBA74 \uC870\uAC01\uC744 \uC5EC\uAE30\uC11C \uB2E4\uC2DC \uC0AC\uC6A9\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`
    };
  }
  const def = TAG_DEFINITIONS[tagName];
  if (!def) return null;
  const text = trimmed.match(/^<[^>]+>([^<]+)</)?.[1]?.trim();
  if (text) {
    return {
      easy: `${josa(`'${text}'`, "\uC774\uB77C\uB294/\uB77C\uB294")} \uAE00\uC790\uC5D0 <${tagName}> \uD0DC\uADF8\uB97C \uC801\uC6A9\uD574\uC11C, \uC704 \uC815\uC758\uC5D0 \uC801\uD78C \uBAA8\uC591\uC73C\uB85C \uD654\uBA74\uC5D0 \uD45C\uC2DC\uD569\uB2C8\uB2E4.`,
      why: `${josa(`'${text}'`, "\uC744/\uB97C")} \uB2E4\uB978 \uAE00\uC790\uC640 \uAD6C\uBD84\uB418\uB294 \uC54C\uB9DE\uC740 \uBAA8\uC591\uC73C\uB85C \uBCF4\uC5EC\uC8FC\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`
    };
  }
  const ACTIONS = {
    br: { easy: "\uC774 \uC790\uB9AC\uC5D0\uC11C \uC904\uC744 \uBC14\uAFD4\uC11C, \uB4A4\uC5D0 \uC624\uB294 \uAE00\uC790\uAC00 \uB2E4\uC74C \uC904\uBD80\uD130 \uC2DC\uC791\uB418\uAC8C \uD569\uB2C8\uB2E4.", why: "\uBB38\uC7A5\uC744 \uC6D0\uD558\uB294 \uC704\uCE58\uC5D0\uC11C \uC904\uBC14\uAFC8\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4." },
    hr: { easy: "\uC774 \uC790\uB9AC\uC5D0 \uAC00\uB85C \uAD6C\uBD84\uC120\uC744 \uADF8\uC5B4\uC11C \uC704 \uB0B4\uC6A9\uACFC \uC544\uB798 \uB0B4\uC6A9\uC744 \uB098\uB215\uB2C8\uB2E4.", why: "\uC11C\uB85C \uB2E4\uB978 \uC8FC\uC81C\uC758 \uB0B4\uC6A9\uC744 \uB208\uC73C\uB85C \uAD6C\uBD84\uD558\uAE30 \uC27D\uAC8C \uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4." },
    table: { easy: "\uC5EC\uAE30\uC11C\uBD80\uD130 \uD45C\uAC00 \uC2DC\uC791\uB429\uB2C8\uB2E4. \uC544\uB798\uC5D0 \uC624\uB294 <tr>(\uAC00\uB85C\uC904)\uACFC <td>(\uCE78)\uB4E4\uC774 \uC774 \uD45C\uC758 \uC904\uACFC \uCE78\uC774 \uB429\uB2C8\uB2E4.", why: "\uC5EC\uB7EC \uC815\uBCF4\uB97C \uAC00\uB85C\xB7\uC138\uB85C \uCE78\uC5D0 \uB9DE\uCDB0 \uD55C\uB208\uC5D0 \uBE44\uAD50\uD560 \uC218 \uC788\uAC8C \uC815\uB9AC\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4." },
    tr: { easy: "\uD45C \uC548\uC5D0 \uAC00\uB85C\uC904 \uD558\uB098\uB97C \uC0C8\uB85C \uC2DC\uC791\uD569\uB2C8\uB2E4. \uC544\uB798\uC758 <td> \uCE78\uB4E4\uC774 \uC774 \uC904\uC5D0 \uB098\uB780\uD788 \uB4E4\uC5B4\uAC11\uB2C8\uB2E4.", why: "\uD45C\uC5D0 \uC0C8 \uC904(\uD55C \uAC74\uC758 \uB370\uC774\uD130)\uC744 \uCD94\uAC00\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4." },
    ul: { easy: "\uC5EC\uAE30\uC11C\uBD80\uD130 \uC810(\u2022)\uC774 \uBD99\uB294 \uBAA9\uB85D\uC774 \uC2DC\uC791\uB418\uACE0, \uC544\uB798\uC758 <li> \uC904\uB4E4\uC774 \uBAA9\uB85D \uD56D\uBAA9\uC774 \uB429\uB2C8\uB2E4.", why: "\uC5EC\uB7EC \uD56D\uBAA9\uC744 \uC21C\uC11C \uC5C6\uC774 \uAC00\uC9C0\uB7F0\uD788 \uB098\uC5F4\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4." },
    ol: { easy: "\uC5EC\uAE30\uC11C\uBD80\uD130 \uBC88\uD638\uAC00 \uBD99\uB294 \uBAA9\uB85D\uC774 \uC2DC\uC791\uB418\uACE0, \uC544\uB798\uC758 <li> \uC904\uB4E4\uC774 1, 2, 3 \uC21C\uC11C\uB85C \uD45C\uC2DC\uB429\uB2C8\uB2E4.", why: "\uC21C\uC11C\uAC00 \uC911\uC694\uD55C \uD56D\uBAA9(\uB2E8\uACC4, \uC21C\uC704)\uC744 \uBC88\uD638\uC640 \uD568\uAED8 \uB098\uC5F4\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4." },
    select: { easy: "\uC5EC\uAE30\uC11C\uBD80\uD130 \uD3BC\uCE68 \uBAA9\uB85D(\uB4DC\uB86D\uB2E4\uC6B4)\uC774 \uC2DC\uC791\uB418\uACE0, \uC544\uB798\uC758 <option> \uC904\uB4E4\uC774 \uACE0\uB97C \uC218 \uC788\uB294 \uD56D\uBAA9\uC774 \uB429\uB2C8\uB2E4.", why: "\uC815\uD574\uC9C4 \uBCF4\uAE30 \uC911 \uD558\uB098\uB97C \uC0AC\uC6A9\uC790\uAC00 \uACE0\uB974\uAC8C \uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4." }
  };
  if (ACTIONS[tagName]) return ACTIONS[tagName];
  return {
    easy: `\uC5EC\uAE30\uC11C\uBD80\uD130 <${tagName}> \uC601\uC5ED\uC774 \uC2DC\uC791\uB418\uACE0, \uB2EB\uB294 </${tagName}>\uAC00 \uB098\uC62C \uB54C\uAE4C\uC9C0\uC758 \uB0B4\uC6A9\uC774 \uADF8 \uC548\uC5D0 \uB4E4\uC5B4\uAC11\uB2C8\uB2E4.`,
    why: "\uC6F9\uD398\uC774\uC9C0\uC758 \uD654\uBA74 \uAD6C\uC870\uC640 \uB0B4\uC6A9\uC744 \uC54C\uB9DE\uC740 \uBAA8\uC591\uC73C\uB85C \uBCF4\uC5EC\uC8FC\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
  };
}

// src/utils/jsTypoChecker.ts
function dist(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
    }
  return dp[a.length][b.length];
}
var isPlural = (a, b) => a === b + "s" || b === a + "s" || a === b + "es" || b === a + "es";
function nearest(word, pool, maxDist) {
  let best;
  let bestD = 99;
  for (const c of pool) {
    if (c === word) return void 0;
    if (c.toLowerCase() === word.toLowerCase()) return c;
    if (Math.abs(c.length - word.length) > 2 || isPlural(c, word)) continue;
    const d = dist(word.toLowerCase(), c.toLowerCase());
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best && bestD <= maxDist(word.length) ? best : void 0;
}
var KEYWORDS = [
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "default",
  "delete",
  "do",
  "else",
  "export",
  "extends",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "let",
  "new",
  "return",
  "switch",
  "this",
  "throw",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "async",
  "await",
  "yield",
  "of",
  "null",
  "undefined",
  "true",
  "false"
];
var KEYWORD_SET = new Set(KEYWORDS);
var ROOT_MEMBERS = {
  document: [
    "write",
    "writeln",
    "getElementById",
    "getElementsByClassName",
    "getElementsByTagName",
    "getElementsByName",
    "querySelector",
    "querySelectorAll",
    "createElement",
    "createTextNode",
    "createDocumentFragment",
    "body",
    "head",
    "title",
    "cookie",
    "addEventListener",
    "removeEventListener",
    "documentElement",
    "forms",
    "images",
    "links",
    "location",
    "readyState",
    "activeElement",
    "URL",
    "domain",
    "referrer",
    "open",
    "close",
    "hidden"
  ],
  console: ["log", "error", "warn", "info", "debug", "table", "dir", "clear", "time", "timeEnd", "group", "groupEnd", "count", "assert", "trace"],
  window: [
    "alert",
    "confirm",
    "prompt",
    "location",
    "localStorage",
    "sessionStorage",
    "setTimeout",
    "setInterval",
    "clearTimeout",
    "clearInterval",
    "addEventListener",
    "removeEventListener",
    "open",
    "close",
    "scrollTo",
    "scrollBy",
    "scrollY",
    "scrollX",
    "innerWidth",
    "innerHeight",
    "document",
    "navigator",
    "history",
    "fetch",
    "requestAnimationFrame",
    "onload",
    "print",
    "matchMedia",
    "getComputedStyle"
  ],
  Math: ["random", "floor", "ceil", "round", "max", "min", "abs", "pow", "sqrt", "PI", "trunc", "sign", "log", "sin", "cos", "tan", "E", "cbrt", "hypot"],
  JSON: ["parse", "stringify"],
  localStorage: ["getItem", "setItem", "removeItem", "clear", "key", "length"],
  sessionStorage: ["getItem", "setItem", "removeItem", "clear", "key", "length"],
  Object: ["keys", "values", "entries", "assign", "freeze", "create", "fromEntries", "defineProperty", "getPrototypeOf", "is"],
  Array: ["isArray", "from", "of"],
  Number: ["parseInt", "parseFloat", "isNaN", "isInteger", "isFinite", "MAX_SAFE_INTEGER", "MIN_SAFE_INTEGER", "EPSILON"],
  Promise: ["all", "allSettled", "race", "any", "resolve", "reject"],
  location: ["href", "reload", "replace", "assign", "pathname", "search", "hash", "host", "hostname", "origin", "protocol", "port"],
  history: ["back", "forward", "go", "pushState", "replaceState", "length", "state"],
  navigator: ["userAgent", "language", "languages", "clipboard", "geolocation", "onLine", "platform", "share", "vibrate"]
};
var ROOTS = Object.keys(ROOT_MEMBERS);
var COMMON_MEMBERS = /* @__PURE__ */ new Set([
  "length",
  "push",
  "pop",
  "shift",
  "unshift",
  "slice",
  "splice",
  "concat",
  "join",
  "reverse",
  "sort",
  "indexOf",
  "lastIndexOf",
  "includes",
  "find",
  "findIndex",
  "filter",
  "map",
  "forEach",
  "reduce",
  "some",
  "every",
  "flat",
  "flatMap",
  "fill",
  "keys",
  "values",
  "entries",
  "toString",
  "toUpperCase",
  "toLowerCase",
  "trim",
  "trimStart",
  "trimEnd",
  "split",
  "replace",
  "replaceAll",
  "substring",
  "charAt",
  "charCodeAt",
  "startsWith",
  "endsWith",
  "padStart",
  "padEnd",
  "repeat",
  "match",
  "matchAll",
  "toFixed",
  "then",
  "catch",
  "finally",
  "json",
  "text",
  "addEventListener",
  "removeEventListener",
  "preventDefault",
  "stopPropagation",
  "appendChild",
  "removeChild",
  "insertBefore",
  "replaceChild",
  "append",
  "prepend",
  "remove",
  "setAttribute",
  "getAttribute",
  "removeAttribute",
  "hasAttribute",
  "classList",
  "add",
  "toggle",
  "contains",
  "innerHTML",
  "innerText",
  "textContent",
  "outerHTML",
  "value",
  "style",
  "className",
  "children",
  "parentNode",
  "parentElement",
  "firstChild",
  "lastChild",
  "firstElementChild",
  "lastElementChild",
  "nextSibling",
  "previousSibling",
  "nextElementSibling",
  "querySelector",
  "querySelectorAll",
  "getElementById",
  "getElementsByClassName",
  "getElementsByTagName",
  "focus",
  "blur",
  "click",
  "submit",
  "reset",
  "checked",
  "disabled",
  "selected",
  "src",
  "href",
  "target",
  "currentTarget",
  "dataset",
  "offsetWidth",
  "offsetHeight",
  "clientWidth",
  "clientHeight",
  "scrollTop",
  "scrollIntoView",
  "getBoundingClientRect",
  "display",
  "color",
  "backgroundColor",
  "fontSize",
  "fontWeight",
  "width",
  "height",
  "visibility",
  "opacity",
  "onclick",
  "onload",
  "onchange",
  "oninput",
  "onsubmit",
  "onkeydown",
  "key",
  "keyCode",
  "status",
  "headers",
  "body",
  "message",
  "name",
  "type",
  "files",
  "data",
  "write",
  "writeln",
  "log",
  "error",
  "warn",
  "info",
  "getItem",
  "setItem",
  "removeItem",
  "parse",
  "stringify",
  "random",
  "floor",
  "ceil",
  "round",
  "current",
  "useState",
  "useEffect",
  "useRef",
  "useMemo",
  "useCallback",
  "Component",
  "Fragment",
  "createElement"
]);
var GLOBAL_FUNCS = [
  "alert",
  "prompt",
  "confirm",
  "parseInt",
  "parseFloat",
  "setTimeout",
  "setInterval",
  "clearTimeout",
  "clearInterval",
  "fetch",
  "isNaN",
  "encodeURIComponent",
  "decodeURIComponent",
  "require",
  "print"
  // useState 같은 리액트 훅은 useStore·useQuery 등 비슷한 이름의 사용자 훅이 많아서 검사하지 않음
];
function identifiers(src) {
  const out = [];
  let i = 0;
  let quote = null;
  while (i < src.length) {
    const ch = src[i];
    if (quote) {
      if (ch === "\\") i += 2;
      else {
        if (ch === quote) quote = null;
        i++;
      }
      continue;
    }
    if (ch === "/" && src[i + 1] === "/") break;
    if (ch === "/" && src[i + 1] === "*") {
      const endC = src.indexOf("*/", i + 2);
      i = endC === -1 ? src.length : endC + 2;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      i++;
      continue;
    }
    if (/[A-Za-z_$]/.test(ch)) {
      let j = i + 1;
      while (j < src.length && /[\w$]/.test(src[j])) j++;
      let k = i - 1;
      while (k >= 0 && src[k] === " ") k--;
      out.push({ text: src.slice(i, j), start: i, end: j, afterDot: k >= 0 && src[k] === "." && src[k - 1] !== "." });
      i = j;
      continue;
    }
    i++;
  }
  return out;
}
var nextNonSpace = (s, from) => {
  let i = from;
  while (i < s.length && /\s/.test(s[i])) i++;
  return { ch: s[i] ?? "", at: i };
};
var prevNonSpace = (s, from) => {
  let i = from - 1;
  while (i >= 0 && /\s/.test(s[i])) i--;
  return s[i] ?? "";
};
var replaceAt = (s, t, word) => s.slice(0, t.start) + word + s.slice(t.end);
function checkJsTypos(code, declared = /* @__PURE__ */ new Set()) {
  const toks = identifiers(code);
  const trimmedEnd = code.trimEnd();
  for (let idx = 0; idx < toks.length; idx++) {
    const t = toks[idx];
    const prevTok = toks[idx - 1];
    const lower = t.text.toLowerCase();
    if (declared.has(t.text)) continue;
    const after = nextNonSpace(code, t.end);
    const before = prevNonSpace(code, t.start);
    const isStatementStart = before === "" || before === "}" || before === ";" || before === "{" || before === ")";
    if (!t.afterDot && KEYWORD_SET.has(lower) && t.text !== lower) {
      const pythonLiteral = /^(True|False)$/.test(t.text) && !/;\s*$/.test(trimmedEnd);
      const constructorUse = prevTok?.text === "new";
      if (!pythonLiteral && !constructorUse) {
        return {
          detail: `${josa(t.text, "\uC740/\uB294")} \uB300\uC18C\uBB38\uC790\uAC00 \uD2C0\uB838\uC2B5\uB2C8\uB2E4. \uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8\uB294 \uB300\uBB38\uC790\uC640 \uC18C\uBB38\uC790\uB97C \uB2E4\uB978 \uAE00\uC790\uB85C \uBCF4\uAE30 \uB54C\uBB38\uC5D0 ${josa(lower, "\uC73C\uB85C/\uB85C")} \uC368\uC57C \uBA85\uB839\uC5B4\uB85C \uC778\uC2DD\uB429\uB2C8\uB2E4.`,
          fixed: replaceAt(code, t, lower)
        };
      }
    }
    if (!t.afterDot && after.ch === "." && !ROOTS.includes(t.text) && !KEYWORD_SET.has(t.text)) {
      const root = nearest(t.text, ROOTS, (len) => len >= 7 ? 2 : len >= 5 ? 1 : 0);
      if (root) {
        const caseOnly = root.toLowerCase() === lower;
        return {
          detail: caseOnly ? `${josa(t.text, "\uC740/\uB294")} \uB300\uC18C\uBB38\uC790\uAC00 \uD2C0\uB838\uC2B5\uB2C8\uB2E4. \uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8\uB294 \uB300\uC18C\uBB38\uC790\uB97C \uAD6C\uBD84\uD558\uBBC0\uB85C ${josa(root, "\uC73C\uB85C/\uB85C")} \uC368\uC57C \uD569\uB2C8\uB2E4.` : `${josa(t.text, "\uC740/\uB294")} \uCCA0\uC790\uAC00 \uD2C0\uB838\uC2B5\uB2C8\uB2E4. ${josa(root, "\uC73C\uB85C/\uB85C")} \uC368\uC57C \uD569\uB2C8\uB2E4. (\uC9C0\uAE08\uCC98\uB7FC \uC4F0\uBA74 "${t.text} is not defined" \uC624\uB958\uAC00 \uB0A9\uB2C8\uB2E4)`,
          fixed: replaceAt(code, t, root)
        };
      }
    }
    if (t.afterDot && prevTok && ROOT_MEMBERS[prevTok.text]) {
      const members = ROOT_MEMBERS[prevTok.text];
      if (!members.includes(t.text)) {
        const m = nearest(t.text, members, (len) => len >= 8 ? 2 : len >= 3 ? 1 : 0);
        if (m) {
          return {
            detail: `${prevTok.text}.${josa(t.text, "\uC740/\uB294")} \uCCA0\uC790\uAC00 \uD2C0\uB838\uC2B5\uB2C8\uB2E4. ${prevTok.text}\uC5D0\uB294 ${josa(t.text, "\uC774\uB77C\uB294/\uB77C\uB294")} \uAE30\uB2A5\uC774 \uC5C6\uC5B4\uC694. ${prevTok.text}.${josa(m, "\uC73C\uB85C/\uB85C")} \uACE0\uCCD0\uC57C \uD569\uB2C8\uB2E4.`,
            fixed: replaceAt(code, t, m)
          };
        }
      }
      continue;
    }
    if (t.afterDot && !COMMON_MEMBERS.has(t.text)) {
      const m = nearest(t.text, COMMON_MEMBERS, (len) => len >= 9 ? 2 : len >= 6 ? 1 : 0);
      if (m) {
        return {
          detail: m.toLowerCase() === lower ? `.${josa(t.text, "\uC740/\uB294")} \uB300\uC18C\uBB38\uC790\uAC00 \uD2C0\uB838\uC2B5\uB2C8\uB2E4. \uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8\uB294 \uB300\uC18C\uBB38\uC790\uB97C \uAD6C\uBD84\uD558\uBBC0\uB85C .${josa(m, "\uC73C\uB85C/\uB85C")} \uC368\uC57C \uD569\uB2C8\uB2E4.` : `.${josa(t.text, "\uC740/\uB294")} \uCCA0\uC790\uAC00 \uD2C0\uB9B0 \uAC83 \uAC19\uC2B5\uB2C8\uB2E4. .${josa(m, "\uC744/\uB97C")} \uC4F0\uB824\uB358 \uAC70\uB77C\uBA74 \uACE0\uCCD0\uC57C \uD569\uB2C8\uB2E4.`,
          fixed: replaceAt(code, t, m)
        };
      }
      continue;
    }
    if (t.afterDot) continue;
    if (after.ch === "(" && !GLOBAL_FUNCS.includes(t.text) && !KEYWORD_SET.has(lower)) {
      const f = nearest(t.text, GLOBAL_FUNCS, (len) => len >= 8 ? 2 : len >= 5 ? 1 : 0);
      if (f && prevTok?.text !== "function") {
        return {
          detail: `${josa(t.text, "\uC740/\uB294")} ${f.toLowerCase() === lower ? "\uB300\uC18C\uBB38\uC790\uAC00" : "\uCCA0\uC790\uAC00"} \uD2C0\uB838\uC2B5\uB2C8\uB2E4. ${josa(f, "\uC73C\uB85C/\uB85C")} \uC368\uC57C \uD569\uB2C8\uB2E4.`,
          fixed: replaceAt(code, t, f)
        };
      }
    }
    if (isStatementStart && !KEYWORD_SET.has(lower)) {
      const rest = code.slice(t.end);
      const guess = (kw2, ok, maxD) => ok && dist(lower, kw2) <= maxD && lower !== kw2 ? kw2 : void 0;
      const kw = guess("const", /^\s+[A-Za-z_$[{][\w$, \]}]*\s*=/.test(rest), 2) || guess("let", /^\s+[A-Za-z_$[{][\w$, \]}]*\s*=/.test(rest) && lower.length === 3, 1) || guess("var", /^\s+[A-Za-z_$][\w$]*\s*=/.test(rest) && lower.length === 3, 1) || guess("function", /^\s*[A-Za-z_$]?[\w$]*\s*\(/.test(rest) && /\)\s*\{?\s*$/.test(code), 2) || guess("return", /^\s+[^=\s(.]/.test(rest) || /^\s*;/.test(rest), 2) || guess("break", /^\s*;?\s*$/.test(rest), 2) || guess("continue", /^\s*;?\s*$/.test(rest), 2) || guess("else", /^\s*(\{|if\b)/.test(rest), 1) || guess("while", /^\s*\(.*\)\s*\{\s*$/.test(rest), 2) || guess("switch", /^\s*\(.*\)\s*\{\s*$/.test(rest), 2) || guess("if", /^\s*\(.*\)\s*\{\s*$/.test(rest) && lower.length === 2, 1) || guess("for", /^\s*\(.*(;|\bof\b|\bin\b).*\)\s*\{?\s*$/.test(rest) && lower.length === 3, 1) || guess("import", /^\s+.+\s+from\s+['"]/.test(rest), 2) || guess("export", /^\s+(default|function|const|let|class)\b/.test(rest), 2);
      if (kw) {
        return {
          detail: `${josa(t.text, "\uC740/\uB294")} \uCCA0\uC790\uAC00 \uD2C0\uB9B0 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4. ${josa(kw, "\uC73C\uB85C/\uB85C")} \uC368\uC57C \uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8\uAC00 \uC54C\uC544\uB4E3\uC2B5\uB2C8\uB2E4.`,
          fixed: replaceAt(code, t, kw)
        };
      }
    }
  }
  return null;
}
function checkInlineJs(line, declared = /* @__PURE__ */ new Set()) {
  const parts = [];
  const attrRe = /\son[a-z]+\s*=\s*(["'])([\s\S]*?)\1/gi;
  let m;
  while ((m = attrRe.exec(line)) !== null) {
    const valueStart = m.index + m[0].indexOf(m[1]) + 1;
    parts.push({ start: valueStart, end: valueStart + m[2].length });
  }
  const scriptRe = /<script\b[^>]*>([\s\S]*?)(<\/script>|$)/gi;
  while ((m = scriptRe.exec(line)) !== null) {
    const s = m.index + m[0].indexOf(">") + 1;
    parts.push({ start: s, end: s + m[1].length });
  }
  for (const p of parts) {
    const snippet = line.slice(p.start, p.end);
    const issue = checkJsTypos(snippet, declared);
    if (issue) return { detail: issue.detail, fixed: (line.slice(0, p.start) + issue.fixed + line.slice(p.end)).trim() };
  }
  return null;
}
function collectDeclared(code) {
  const names = /* @__PURE__ */ new Set();
  const add = (s) => s.split(/[\s,{}[\]=:]+/).filter((w) => /^[A-Za-z_$][\w$]*$/.test(w)).forEach((w) => names.add(w));
  let m;
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
  while ((m = re7.exec(code)) !== null) add(m[1] || m[2] || "");
  return names;
}

// src/utils/syntaxChecker.ts
var KNOWN_TAGS = new Set(
  "html head body title meta link script style noscript base main header footer nav section article aside div span p h1 h2 h3 h4 h5 h6 a img button input textarea label form select option optgroup ul ol li dl dt dd table thead tbody tfoot tr th td caption colgroup col strong b em i u s small mark sub sup br hr code pre kbd blockquote q cite abbr time address iframe video audio source track canvas svg path circle rect g line polyline polygon ellipse use defs text tspan picture figure figcaption details summary dialog progress meter fieldset legend output template slot embed object param map area wbr data datalist center font".split(" ")
);
var VOID_TAGS = /* @__PURE__ */ new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
    }
  return dp[a.length][b.length];
}
function closestTag(name) {
  if (name.length < 2) return void 0;
  let best;
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
  return bestD <= limit ? best : void 0;
}
function tagTokens(line) {
  const out = [];
  const re = /<(\/?)([a-zA-Z][\w-]*)\b([^<>]*?)(\/?)>/g;
  let m;
  while ((m = re.exec(line)) !== null) {
    out.push({ name: m[2], closing: m[1] === "/", selfClosing: m[4] === "/", raw: m[0], index: m.index });
  }
  return out;
}
var isHtmlTagName = (n) => /^[a-z][a-z0-9]*$/.test(n);
function checkLine(line, opts = {}) {
  const t = line.trim();
  if (!t) return null;
  const jsOn = opts.js !== false;
  const declared = opts.declared ?? /* @__PURE__ */ new Set();
  if (t.startsWith("<") && !t.startsWith("<!--")) {
    if (!t.includes(">")) {
      return { detail: "\uD0DC\uADF8 \uB05D\uC744 \uB2EB\uB294 \uAEBE\uC1E0(>)\uAC00 \uBE60\uC84C\uC2B5\uB2C8\uB2E4. <\uD0DC\uADF8> \uBAA8\uC591\uC73C\uB85C \uC644\uC131\uD574\uC57C \uD569\uB2C8\uB2E4.", fixed: `${t}>` };
    }
    const tokens = tagTokens(t);
    for (const tk of tokens) {
      const lower = tk.name.toLowerCase();
      if (!isHtmlTagName(tk.name) || KNOWN_TAGS.has(lower)) continue;
      const near = closestTag(lower);
      if (near) {
        const wrong = tk.closing ? `</${tk.name}>` : `<${tk.name}>`;
        const right = tk.closing ? `</${near}>` : `<${near}>`;
        return {
          detail: `${josa(wrong, "\uC740/\uB294")} HTML\uC5D0 \uC5C6\uB294 \uD0DC\uADF8 \uC774\uB984\uC785\uB2C8\uB2E4. \uCCA0\uC790\uAC00 \uD2C0\uB838\uC5B4\uC694. ${josa(right, "\uC73C\uB85C/\uB85C")} \uACE0\uCCD0\uC57C \uD569\uB2C8\uB2E4.`,
          fixed: t.replace(tk.raw, tk.raw.replace(tk.name, near))
        };
      }
    }
    const stack = [];
    for (const tk of tokens) {
      const name = tk.name.toLowerCase();
      if (tk.closing) {
        const top = stack[stack.length - 1];
        if (top && top.name.toLowerCase() === name) {
          stack.pop();
        } else if (top) {
          const inStack = stack.some((s) => s.name.toLowerCase() === name);
          return {
            detail: inStack ? `<${top.name}> \uD0DC\uADF8\uB97C \uBA3C\uC800 \uB2EB\uC544\uC57C \uD558\uB294\uB370 </${tk.name}>\uAC00 \uBA3C\uC800 \uB098\uC654\uC2B5\uB2C8\uB2E4. \uD0DC\uADF8\uB294 \uC5F0 \uC21C\uC11C\uC758 \uBC18\uB300\uB85C \uB2EB\uC544\uC57C \uD569\uB2C8\uB2E4.` : `\uC5EC\uB294 \uD0DC\uADF8\uB294 <${top.name}>\uC778\uB370 \uB2EB\uB294 \uD0DC\uADF8\uAC00 </${tk.name}>\uB85C \uB418\uC5B4 \uC788\uC5B4 \uC9DD\uC774 \uB9DE\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. </${top.name}>\uB85C \uACE0\uCCD0\uC57C \uD569\uB2C8\uB2E4.`,
            fixed: inStack ? void 0 : t.replace(tk.raw, `</${top.name}>`)
          };
        }
      } else if (!tk.selfClosing && !VOID_TAGS.has(name)) {
        stack.push(tk);
      }
    }
    for (let i = 1; i < tokens.length; i++) {
      const a = tokens[i - 1];
      const b = tokens[i];
      if (!a.closing && !b.closing && a.name.toLowerCase() === b.name.toLowerCase() && !VOID_TAGS.has(a.name.toLowerCase())) {
        const between = t.slice(a.index + a.raw.length, b.index).trim();
        const after = t.slice(b.index + b.raw.length).trim();
        if (between && !after && b.raw === `<${b.name}>`) {
          return {
            detail: `\uB9C8\uC9C0\uB9C9 ${josa(`<${b.name}>`, "\uC740/\uB294")} \uB2EB\uB294 \uD0DC\uADF8\uC5EC\uC57C \uD558\uB294\uB370 \uC2AC\uB798\uC2DC(/)\uAC00 \uBE60\uC84C\uC2B5\uB2C8\uB2E4. </${b.name}>\uB85C \uC368\uC57C \uB0B4\uC6A9\uC774 \uB05D\uB0AC\uB2E4\uB294 \uAC83\uC774 \uBE0C\uB77C\uC6B0\uC800\uC5D0 \uC804\uB2EC\uB429\uB2C8\uB2E4.`,
            fixed: t.slice(0, b.index) + `</${b.name}>`
          };
        }
      }
    }
    for (const tk of tokens) {
      if ((tk.raw.match(/"/g)?.length || 0) % 2 !== 0 || (tk.raw.match(/'/g)?.length || 0) % 2 !== 0) {
        const q2 = (tk.raw.match(/"/g)?.length || 0) % 2 !== 0 ? '"' : "'";
        const fixedTag = tk.raw.replace(/(\s*\/?>)$/, `${q2}$1`);
        return {
          detail: `${tk.raw} \uC548\uC758 \uC18D\uC131 \uAC12 \uB530\uC634\uD45C(" \uB610\uB294 ') \uC9DD\uC774 \uB9DE\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC5EC\uB294 \uB530\uC634\uD45C\uC640 \uB2EB\uB294 \uB530\uC634\uD45C\uB97C \uBAA8\uB450 \uC368\uC57C \uD569\uB2C8\uB2E4.`,
          fixed: t.replace(tk.raw, fixedTag)
        };
      }
    }
    const lastTagStart = t.lastIndexOf("<");
    if (t.indexOf(">", lastTagStart) === -1) {
      return { detail: "\uB9C8\uC9C0\uB9C9 \uD0DC\uADF8 \uB05D\uC758 \uAEBE\uC1E0(>)\uAC00 \uBE60\uC84C\uC2B5\uB2C8\uB2E4.", fixed: `${t}>` };
    }
    const inline = checkInlineJs(t, declared);
    if (inline) return inline;
    return null;
  }
  if (/^\/?[a-zA-Z][\w-]*(\s[^<>]*)?>$/.test(t) && KNOWN_TAGS.has(t.replace(/^\//, "").match(/^[a-zA-Z][\w-]*/)[0].toLowerCase())) {
    return { detail: `\uD0DC\uADF8\uB97C \uC2DC\uC791\uD558\uB294 \uAEBE\uC1E0(<)\uAC00 \uBE60\uC84C\uC2B5\uB2C8\uB2E4. <${t} \uBAA8\uC591\uC73C\uB85C \uC368\uC57C \uD569\uB2C8\uB2E4.`, fixed: `<${t}` };
  }
  if (/^(\/\/|\/\*|\*|#(?![\w-]+\s*[{,]))/.test(t)) return null;
  let quote = null;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "/" && t[i + 1] === "/") break;
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "`") return null;
  }
  if (quote) {
    return {
      detail: `\uBB38\uC790\uC5F4\uC744 \uC5F0 \uB530\uC634\uD45C(${quote})\uAC00 \uC774 \uC904\uC5D0\uC11C \uB2EB\uD788\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uAE00\uC790 \uB05D\uC5D0\uB3C4 ${quote}\uB97C \uC368\uC57C \uD569\uB2C8\uB2E4.`,
      fixed: /[;,)]\s*$/.test(t) ? t.replace(/(\s*[;,)]+\s*)$/, `${quote}$1`) : `${t}${quote}`
    };
  }
  if (/^(let|const|var)\s*=/.test(t)) {
    return { detail: "\uBCC0\uC218 \uD0A4\uC6CC\uB4DC(let/const) \uB4A4\uC5D0 \uBCC0\uC218 \uC774\uB984\uC774 \uBE60\uC84C\uC2B5\uB2C8\uB2E4. \uC608: const \uC774\uB984 = \uAC12;" };
  }
  const eqeq = t.match(/^(let|const|var)\s+([a-zA-Z0-9_$]+)\s*===?\s*/);
  if (eqeq) {
    return {
      detail: "\uBCC0\uC218\uC5D0 \uAC12\uC744 \uB123\uC744 \uB54C\uB294 ==(\uAC19\uC740\uC9C0 \uBE44\uAD50)\uAC00 \uC544\uB2C8\uB77C =(\uB123\uAE30)\uB97C \uC368\uC57C \uD569\uB2C8\uB2E4.",
      fixed: t.replace(/\s*===?\s*/, " = ")
    };
  }
  if (jsOn) {
    const typo = checkJsTypos(t, declared);
    if (typo) return typo;
  }
  return null;
}
var CLOSE_OF = { "(": ")", "[": "]", "{": "}" };
var OPEN_OF = { ")": "(", "]": "[", "}": "{" };
function checkDocument(rawLines, language) {
  const errs = /* @__PURE__ */ new Map();
  const tagStack = [];
  rawLines.forEach((line, idx) => {
    const t = line.trim();
    if (!t.startsWith("<") || t.startsWith("<!--")) return;
    for (const tk of tagTokens(t)) {
      const name = tk.name.toLowerCase();
      if (!isHtmlTagName(tk.name)) continue;
      if (tk.closing) {
        const pos = tagStack.lastIndexOf(name);
        if (pos === -1) {
          if (!errs.has(idx) && KNOWN_TAGS.has(name)) {
            errs.set(idx, { detail: `\uC704\uC5D0\uC11C <${name}> \uD0DC\uADF8\uB97C \uC5F0 \uC801\uC774 \uC5C6\uB294\uB370 </${name}> \uB2EB\uB294 \uD0DC\uADF8\uAC00 \uB098\uC654\uC2B5\uB2C8\uB2E4. \uC5EC\uB294 \uD0DC\uADF8\uAC00 \uBE60\uC84C\uAC70\uB098 \uB2EB\uB294 \uD0DC\uADF8\uAC00 \uD558\uB098 \uB354 \uB4E4\uC5B4\uAC14\uC2B5\uB2C8\uB2E4.` });
          }
        } else {
          tagStack.splice(pos);
        }
      } else if (!tk.selfClosing && !VOID_TAGS.has(name)) {
        tagStack.push(name);
      }
    }
  });
  if (language !== "HTML") {
    const stack = [];
    let inTemplate = false;
    let inBlockComment = false;
    rawLines.forEach((raw, idx) => {
      const t = raw.trim();
      if (/^#(?![\w-]+\s*[{,])/.test(t)) return;
      let quote = inTemplate ? "`" : null;
      for (let i = 0; i < raw.length; i++) {
        const ch = raw[i];
        const nx = raw[i + 1];
        if (inBlockComment) {
          if (ch === "*" && nx === "/") {
            inBlockComment = false;
            i++;
          }
          continue;
        }
        if (quote) {
          if (ch === "\\") i++;
          else if (ch === quote) quote = null;
          continue;
        }
        if (ch === "/" && nx === "/") break;
        if (ch === "/" && nx === "*") {
          inBlockComment = true;
          i++;
          continue;
        }
        if (ch === '"' || ch === "'" || ch === "`") {
          quote = ch;
          continue;
        }
        if (CLOSE_OF[ch]) stack.push({ ch, line: idx });
        else if (OPEN_OF[ch]) {
          const top = stack[stack.length - 1];
          if (!top) {
            if (!errs.has(idx)) errs.set(idx, { detail: `\uC5EC\uB294 \uAD04\uD638 \uC5C6\uC774 \uB2EB\uB294 \uAD04\uD638 '${ch}'\uAC00 \uB098\uC654\uC2B5\uB2C8\uB2E4. \uC704\uCABD\uC5D0 \uC9DD\uC774 \uB418\uB294 '${OPEN_OF[ch]}'\uAC00 \uBE60\uC84C\uAC70\uB098, \uB2EB\uB294 \uAD04\uD638\uAC00 \uD558\uB098 \uB354 \uB4E4\uC5B4\uAC14\uC2B5\uB2C8\uB2E4.` });
          } else if (top.ch !== OPEN_OF[ch]) {
            if (!errs.has(idx))
              errs.set(idx, {
                detail: `${top.line + 1}\uBC88\uC9F8 \uC904\uC5D0\uC11C '${top.ch}'\uB85C \uC5F0 \uAD04\uD638\uB97C \uC5EC\uAE30\uC11C '${ch}'\uB85C \uB2EB\uC558\uC2B5\uB2C8\uB2E4. '${CLOSE_OF[top.ch]}'\uB85C \uB2EB\uC544\uC57C \uC9DD\uC774 \uB9DE\uC2B5\uB2C8\uB2E4.`,
                fixed: (raw.slice(0, i) + CLOSE_OF[top.ch] + raw.slice(i + 1)).trim()
              });
            stack.pop();
          } else {
            stack.pop();
          }
        }
      }
      inTemplate = quote === "`";
    });
    for (const s of stack) {
      if (!errs.has(s.line)) {
        errs.set(s.line, { detail: `\uC774 \uC904\uC5D0\uC11C \uC5F0 \uAD04\uD638 '${s.ch}'\uAC00 \uCF54\uB4DC \uB05D\uAE4C\uC9C0 \uB2EB\uD788\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uC9DD\uC774 \uB418\uB294 '${CLOSE_OF[s.ch]}'\uB97C \uC54C\uB9DE\uC740 \uC704\uCE58\uC5D0 \uCD94\uAC00\uD574\uC57C \uD569\uB2C8\uB2E4.` });
      }
    }
  }
  return errs;
}

// src/utils/codeAnalyzer.ts
var HTML_MASTER_DICTIONARY = {
  "!doctype": {
    name: "HTML5 \uBB38\uC11C \uADDC\uACA9 \uC120\uC5B8",
    subBeginner: "\uC774 \uBB38\uC11C\uAC00 \uCD5C\uC2E0 HTML5 \uD45C\uC900 \uC6F9\uD398\uC774\uC9C0\uC784\uC744 \uBE0C\uB77C\uC6B0\uC800\uC5D0 \uC120\uC5B8\uD569\uB2C8\uB2E4.",
    subIntermediate: "\uD45C\uC900 \uB80C\uB354\uB9C1 \uBAA8\uB4DC(Standards Mode) \uD65C\uC131\uD654 \uBC0F \uB808\uAC70\uC2DC \uCFFD\uC2A4 \uBAA8\uB4DC \uCC28\uB2E8",
    subAdvanced: "[PASS] HTML5 Doctype \uC120\uC5B8 \uC815\uC0C1. \uB80C\uB354\uB9C1 \uC5D4\uC9C4 \uD45C\uC900 \uD2B8\uB9AC\uAC70 \uC644\uB8CC.",
    easyExplanation: '\uD06C\uB86C\uC774\uB098 \uC0AC\uD30C\uB9AC \uAC19\uC740 \uC6F9 \uBE0C\uB77C\uC6B0\uC800\uC5D0\uAC8C "\uC774 \uBB38\uC11C\uB294 \uCD5C\uC2E0 \uADDC\uACA9\uC778 HTML5\uB85C \uB9CC\uB4E0 \uC6F9\uD398\uC774\uC9C0\uC785\uB2C8\uB2E4"\uB77C\uACE0 \uCCAB \uC904\uC5D0\uC11C \uBA85\uD655\uD558\uAC8C \uC54C\uB824\uC8FC\uB294 \uC120\uC5B8\uBB38\uC785\uB2C8\uB2E4.',
    whyUsedHere: "\uBE0C\uB77C\uC6B0\uC800\uAC00 \uC61B\uB0A0 \uBC29\uC2DD(\uCFFD\uC2A4 \uBAA8\uB4DC)\uC73C\uB85C \uB3D9\uC791\uD558\uC9C0 \uC54A\uACE0, \uCD5C\uC2E0 \uC6F9 \uD45C\uC900 \uAE30\uC220\uACFC CSS \uB808\uC774\uC544\uC6C3\uC744 \uC815\uD655\uD558\uAC8C \uADF8\uB9AC\uB3C4\uB85D \uB9CC\uB4E4\uAE30 \uC704\uD574 \uBB38\uC11C \uB9E8 \uCCAB \uC904\uC5D0 \uD544\uC218\uC801\uC73C\uB85C \uC791\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
    wrongExample: {
      code: "<html> (\uC120\uC5B8 \uB204\uB77D)",
      reason: "DOCTYPE\uC744 \uBE7C\uBA39\uC73C\uBA74 \uBE0C\uB77C\uC6B0\uC800\uAC00 2000\uB144\uB300 \uCD08\uBC18 \uD638\uD658 \uBAA8\uB4DC\uB85C \uB3D9\uC791\uD558\uC5EC \uCD5C\uC2E0 CSS Flexbox\uB098 Grid\uAC00 \uAE68\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    betterExample: {
      code: "<!DOCTYPE html>",
      reason: "\uD30C\uC77C \uB9E8 \uCCAB \uC904\uC5D0 \uACF5\uBC31\uC774\uB098 \uC904\uBC14\uAFC8 \uC5C6\uC774 \uB300\uBB38\uC790\uB85C \uC120\uC5B8\uD558\uB294 \uAC83\uC774 \uAC00\uC7A5 \uD655\uC2E4\uD558\uACE0 \uC548\uC804\uD569\uB2C8\uB2E4."
    },
    codeCheckVerdict: "\uBB38\uBC95\uC801\uC73C\uB85C \uC644\uBCBD\uD569\uB2C8\uB2E4. \uB300\uC18C\uBB38\uC790\uB294 \uBB34\uAD00\uD558\uB098 \uAD00\uB840\uC801\uC778 \uB300\uBB38\uC790 \uD45C\uAE30\uB97C \uC9C0\uCF30\uC73C\uBA70 \uBB38\uC11C \uCD5C\uC0C1\uB2E8\uC5D0 \uC815\uD655\uD788 \uBC30\uCE58\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
    betterRefactor: {
      code: "<!DOCTYPE html>",
      reason: "HTML5 \uB2E8\uC77C \uC120\uC5B8 \uD45C\uC900\uC73C\uB85C \uCD94\uAC00\uC801\uC778 DTD URL\uC774 \uD544\uC694 \uC5C6\uB294 \uCD5C\uC801\uC758 \uD615\uD0DC\uC785\uB2C8\uB2E4."
    },
    suggestedAdditions: [
      {
        code: "<!-- UTF-8 / Responsive Meta Tags Follow -->",
        meaning: "\uBB38\uC11C \uD5E4\uB354 \uBA54\uD0C0\uB370\uC774\uD130 \uC601\uC5ED \uC548\uB0B4",
        whyAdd: "DOCTYPE \uC9C1\uD6C4 <head> \uB0B4 \uBB38\uC790\uC14B\uACFC \uBDF0\uD3EC\uD2B8 \uBA54\uD0C0\uD0DC\uADF8\uAC00 \uBC18\uB4DC\uC2DC \uB4A4\uB530\uB77C\uC57C \uD568\uC744 \uAD6C\uC870\uC801\uC73C\uB85C \uBA85\uC2DC\uD558\uAE30 \uC704\uD568\uC785\uB2C8\uB2E4."
      }
    ],
    bugIssueTitle: "Doctype \uC120\uC5B8 \uC720\uD6A8\uC131 \uD1B5\uACFC",
    bugIssueDetail: "BOM(Byte Order Mark) \uC5C6\uB294 \uC815\uC0C1 \uD14D\uC2A4\uD2B8 \uC2A4\uD2B8\uB9BC. Standards Mode \uC815\uC0C1 \uD2B8\uB9AC\uAC70.",
    bugSeverity: "none",
    missingTitle: "\uB204\uB77D \uC5C6\uC74C",
    missingSnippet: "",
    missingReason: "HTML5 doctype \uCD5C\uC18C \uC694\uAC74 \uCDA9\uC871",
    recommendedPatch: "<!DOCTYPE html>"
  },
  html: {
    name: "HTML \uCD5C\uC0C1\uC704 \uB8E8\uD2B8 \uD0DC\uADF8",
    subBeginner: "\uC6F9\uD398\uC774\uC9C0\uC758 \uBAA8\uB4E0 \uB0B4\uC6A9(\uBA38\uB9AC\uB9D0\uACFC \uBCF8\uBB38)\uC744 \uAC10\uC2F8\uB294 \uAC00\uC7A5 \uBC14\uAE65 \uC0C1\uC790\uC785\uB2C8\uB2E4.",
    subIntermediate: 'DOM \uD2B8\uB9AC\uC758 \uB8E8\uD2B8 \uB178\uB4DC (\uC5B8\uC5B4 \uC18D\uC131 lang="ko" \uC900\uC218 \uC5EC\uBD80 \uC810\uAC80)',
    subAdvanced: "[AUDIT] Root Element \uC120\uC5B8. i18n/a11y\uC6A9 lang \uB514\uB809\uD2F0\uBE0C \uAC80\uC99D.",
    easyExplanation: "\uC6F9\uD398\uC774\uC9C0\uC5D0 \uB4E4\uC5B4\uAC00\uB294 \uBAA8\uB4E0 \uAE00\uC790, \uC774\uBBF8\uC9C0, \uC124\uC815, \uBCF8\uBB38 \uC804\uCCB4\uB97C \uD558\uB098\uB85C \uAC10\uC2F8\uC8FC\uB294 \uAC00\uC7A5 \uD070 \uCD5C\uC0C1\uC704 \uC0C1\uC790\uC785\uB2C8\uB2E4.",
    whyUsedHere: "\uC5B4\uB514\uC11C\uBD80\uD130 \uC5B4\uB514\uAE4C\uC9C0\uAC00 \uC6F9\uD398\uC774\uC9C0 \uCF54\uB4DC\uC778\uC9C0 \uBE0C\uB77C\uC6B0\uC800\uC640 \uAC80\uC0C9\uC5D4\uC9C4\uC5D0\uAC8C \uC2DC\uC791\uACFC \uB05D \uBC94\uC704\uB97C \uBA85\uD655\uD788 \uC54C\uB824\uC8FC\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
    wrongExample: {
      code: "<html> (lang \uC18D\uC131 \uB204\uB77D)",
      reason: "lang \uC18D\uC131\uC744 \uBE7C\uBA39\uC73C\uBA74 \uBE0C\uB77C\uC6B0\uC800\uAC00 \uC5B8\uC5B4\uB97C \uC54C \uC218 \uC5C6\uC5B4 \uBC88\uC5ED \uD31D\uC5C5\uC774 \uC624\uC791\uB3D9\uD558\uAC70\uB098 \uC2DC\uAC01\uC7A5\uC560\uC778 \uB0AD\uB3C5\uAE30\uAC00 \uC601\uBB38 \uBC1C\uC74C\uC73C\uB85C \uC77D\uC2B5\uB2C8\uB2E4."
    },
    betterExample: {
      code: '<html lang="ko">',
      reason: '\uD55C\uAD6D\uC5B4 \uC0AC\uC774\uD2B8\uB77C\uBA74 lang="ko"\uB97C \uAF2D \uBA85\uC2DC\uD574 \uC6F9 \uC811\uADFC\uC131\uACFC \uAC80\uC0C9\uC5D4\uC9C4 \uC778\uC2DD\uC744 \uB192\uC5EC\uC8FC\uC138\uC694.'
    },
    codeCheckVerdict: "\uB8E8\uD2B8 \uCEE8\uD14C\uC774\uB108\uB85C \uC815\uC0C1 \uC791\uB3D9\uD569\uB2C8\uB2E4. \uB2E4\uAD6D\uC5B4 \uC9C0\uC6D0\uC774\uB098 \uAC80\uC0C9\uC5D4\uC9C4 \uD06C\uB864\uB7EC\uB97C \uC704\uD574 lang \uC18D\uC131\uC774 \uC62C\uBC14\uB974\uAC8C \uC9C0\uC815\uB418\uC5C8\uB294\uC9C0 \uD655\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.",
    betterRefactor: {
      code: '<html lang="ko" dir="ltr">',
      reason: '\uD14D\uC2A4\uD2B8 \uBC29\uD5A5(dir="ltr", \uC88C\uC5D0\uC11C \uC6B0\uB85C)\uAE4C\uC9C0 \uBA85\uC2DC\uD558\uBA74 \uAE00\uB85C\uBC8C \uC6F9 \uD45C\uC900\uC5D0 \uB354\uC6B1 \uBD80\uD569\uD569\uB2C8\uB2E4.'
    },
    suggestedAdditions: [
      {
        code: 'class="scroll-smooth"',
        meaning: "\uBD80\uB4DC\uB7EC\uC6B4 \uC2A4\uD06C\uB864 \uC560\uB2C8\uBA54\uC774\uC158 \uD074\uB798\uC2A4",
        whyAdd: "\uD398\uC774\uC9C0 \uB0B4\uBD80 \uB9C1\uD06C \uC774\uB3D9 \uC2DC \uC21C\uAC04\uC774\uB3D9\uD558\uC9C0 \uC54A\uACE0 \uBD80\uB4DC\uB7FD\uAC8C \uC2A4\uD06C\uB864\uB418\uB3C4\uB85D UX\uB97C \uD5A5\uC0C1\uC2DC\uD0B5\uB2C8\uB2E4."
      }
    ],
    bugIssueTitle: "I18N Lang \uC18D\uC131 \uB204\uB77D \uC8FC\uC758",
    bugIssueDetail: "lang \uC18D\uC131\uC774 \uC5C6\uC73C\uBA74 WCAG 2.1 Success Criterion 3.1.1 (Language of Page) \uC704\uBC18.",
    bugSeverity: "warning",
    missingTitle: "lang \uC18D\uC131",
    missingSnippet: 'lang="ko"',
    missingReason: "\uC2A4\uD06C\uB9B0 \uB9AC\uB354 \uC74C\uC131 \uC5D4\uC9C4 \uD569\uC131(TTS) \uC5B8\uC5B4 \uC2DD\uBCC4 \uBC0F SEO \uD0C0\uAC9F\uD305 \uD544\uC218",
    recommendedPatch: '<html lang="ko">'
  },
  head: {
    name: "\uBB38\uC11C \uBA38\uB9AC\uB9D0(\uC124\uC815 \uC815\uBCF4) \uAD6C\uC5ED",
    subBeginner: "\uD654\uBA74\uC5D0\uB294 \uC548 \uBCF4\uC774\uC9C0\uB9CC \uD398\uC774\uC9C0 \uC81C\uBAA9, \uBB38\uC790 \uC778\uCF54\uB529 \uB4F1 \uC124\uC815\uC744 \uB2F4\uB294 \uAD6C\uC5ED\uC785\uB2C8\uB2E4.",
    subIntermediate: "Document Metadata & Asset Container (\uC778\uCF54\uB529/\uBDF0\uD3EC\uD2B8/\uD0C0\uC774\uD2C0 \uC9D1\uC57D)",
    subAdvanced: "[STRUCTURE] Resource Preload & Meta Descriptor Scope. \uB80C\uB354\uB9C1 \uBE14\uB85C\uD0B9 \uC694\uC18C \uC810\uAC80 \uD544\uC694.",
    easyExplanation: "\uD654\uBA74\uC5D0 \uC9C1\uC811 \uBCF4\uC774\uC9C0\uB294 \uC54A\uC9C0\uB9CC, \uC6F9\uD398\uC774\uC9C0\uC758 \uC81C\uBAA9, \uD55C\uAE00 \uAE68\uC9D0 \uBC29\uC9C0 \uC124\uC815, \uB514\uC790\uC778 \uD30C\uC77C \uC5F0\uACB0 \uB4F1 \uBE0C\uB77C\uC6B0\uC800\uAC00 \uD654\uBA74\uC744 \uADF8\uB9AC\uAE30 \uC804\uC5D0 \uAF2D \uC54C\uC544\uC57C \uD558\uB294 \uC2E0\uBD84\uC99D \uAC19\uC740 \uC815\uBCF4\uB4E4\uC744 \uBAA8\uC544\uB450\uB294 \uACF3\uC785\uB2C8\uB2E4.",
    whyUsedHere: "\uBCF8\uBB38(body)\uC744 \uD654\uBA74\uC5D0 \uB80C\uB354\uB9C1\uD558\uAE30 \uC804\uC5D0 \uD544\uC694\uD55C \uD3F0\uD2B8, \uC778\uCF54\uB529, \uC2A4\uD0C0\uC77C\uC2DC\uD2B8\uB97C \uBE0C\uB77C\uC6B0\uC800\uAC00 \uBA3C\uC800 \uC900\uBE44\uD560 \uC218 \uC788\uB3C4\uB85D \uC124\uC815 \uAD6C\uC5ED\uC744 \uB530\uB85C \uBD84\uB9AC\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
    wrongExample: {
      code: "<head> <h1>\uC81C\uBAA9</h1> </head>",
      reason: "\uD654\uBA74\uC5D0 \uD45C\uC2DC\uB418\uC5B4\uC57C \uD558\uB294 \uBCF8\uBB38 \uD0DC\uADF8\uB97C head \uC548\uC5D0 \uB123\uC73C\uBA74 \uC6F9 \uD45C\uC900 \uC704\uBC18\uC774\uBA70 \uBE0C\uB77C\uC6B0\uC800\uAC00 \uAC15\uC81C\uB85C \uB2EB\uC544\uBC84\uB824 \uD654\uBA74\uC774 \uAE68\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
    },
    betterExample: {
      code: '<head>\n  <meta charset="UTF-8">\n  <title>\uD398\uC774\uC9C0 \uC81C\uBAA9</title>\n</head>',
      reason: "head \uC548\uC5D0\uB294 \uC624\uC9C1 \uBA54\uD0C0\uB370\uC774\uD130, \uC81C\uBAA9(title), \uC678\uBD80 \uB9AC\uC18C\uC2A4 \uB9C1\uD06C(link, script)\uB9CC \uB2F4\uC544\uC57C \uD569\uB2C8\uB2E4."
    },
    codeCheckVerdict: "\uC124\uC815 \uAD6C\uC5ED\uC774 \uBA85\uD655\uD788 \uBD84\uB9AC\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4. \uBCF8\uBB38 \uD0DC\uADF8\uAC00 \uC11E\uC5EC \uB4E4\uC5B4\uAC00\uC9C0 \uC54A\uC558\uB294\uC9C0, \uD544\uC218 \uBA54\uD0C0\uD0DC\uADF8\uB4E4\uC774 \uB204\uB77D\uB418\uC9C0 \uC54A\uC558\uB294\uC9C0 \uC810\uAC80\uD558\uC138\uC694.",
    betterRefactor: {
      code: '<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>\uC81C\uBAA9</title>\n</head>',
      reason: "\uBAA8\uBC14\uC77C \uBC18\uC751\uD615\uC744 \uC704\uD55C viewport \uBA54\uD0C0\uD0DC\uADF8\uAC00 charset \uC9C1\uD6C4\uC5D0 \uD568\uAED8 \uAD6C\uC131\uB418\uC5B4\uC57C \uD569\uB2C8\uB2E4."
    },
    suggestedAdditions: [
      {
        code: '<link rel="icon" href="/favicon.ico">',
        meaning: "\uBE0C\uB77C\uC6B0\uC800 \uD0ED \uD30C\uBE44\uCF58 \uC544\uC774\uCF58 \uC5F0\uACB0",
        whyAdd: "\uBE0C\uB77C\uC6B0\uC800 \uD0ED\uC5D0 \uAE30\uBCF8 \uC9C0\uAD6C\uBCF8 \uB300\uC2E0 \uC11C\uBE44\uC2A4 \uB85C\uACE0\uB97C \uB744\uC6CC \uC0AC\uC6A9\uC790 \uC2E0\uB8B0\uB3C4\uB97C \uB192\uC774\uACE0 \uBE0C\uB77C\uC6B0\uC800\uC758 404 \uC694\uCCAD\uC744 \uBC29\uC9C0\uD569\uB2C8\uB2E4."
      }
    ],
    bugIssueTitle: "Head \uB0B4 \uB80C\uB354\uB9C1 \uBE14\uB85C\uD0B9 \uB9AC\uC18C\uC2A4 \uC810\uAC80",
    bugIssueDetail: "\uB3D9\uAE30 \uC2A4\uD06C\uB9BD\uD2B8\uAC00 head \uB0B4\uC5D0 \uC9C1\uC811 \uC0BD\uC785\uB420 \uACBD\uC6B0 First Contentful Paint(FCP) \uC9C0\uC5F0 \uBC1C\uC0DD \uAC00\uB2A5\uC131.",
    bugSeverity: "none",
    missingTitle: "Viewport Meta Tag \uB204\uB77D \uAC00\uB2A5\uC131",
    missingSnippet: '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    missingReason: "\uBAA8\uBC14\uC77C \uAE30\uAE30 \uB514\uBC14\uC774\uC2A4 \uD53D\uC140 \uBE44\uC728 1:1 \uB9E4\uD551 \uB204\uB77D \uBC29\uC9C0",
    recommendedPatch: '<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n</head>'
  },
  meta: {
    name: "\uBB38\uC11C \uBA54\uD0C0(\uC778\uCF54\uB529/\uBDF0\uD3EC\uD2B8) \uC124\uC815",
    subBeginner: "\uD55C\uAE00\uC774\uB098 \uC774\uBAA8\uC9C0\uAC00 \uAE68\uC9C0\uC9C0 \uC54A\uB3C4\uB85D \uBB38\uC790 \uC778\uCF54\uB529(UTF-8)\uC744 \uC9C0\uC815\uD569\uB2C8\uB2E4.",
    subIntermediate: "\uC778\uCF54\uB529 \uD45C\uC900(UTF-8) \uC9C0\uC815 \uBC0F \uD30C\uC2F1 \uC6B0\uC120\uC21C\uC704 \uD655\uBCF4",
    subAdvanced: "[OPTIMIZATION] Charset \uB514\uB809\uD2F0\uBE0C. \uBC18\uB4DC\uC2DC head\uC758 \uCCAB 1024\uBC14\uC774\uD2B8 \uB0B4 \uC704\uCE58\uD574\uC57C \uD568.",
    easyExplanation: "\uC6F9\uD398\uC774\uC9C0\uC5D0 \uC801\uD78C \uD55C\uAE00, \uC601\uC5B4, \uD2B9\uC218\uAE30\uD638, \uC774\uBAA8\uC9C0\uAC00 \uC678\uACC4\uC5B4\uCC98\uB7FC \uAE68\uC9C0\uC9C0 \uC54A\uACE0 \uC815\uC0C1\uC801\uC73C\uB85C \uBCF4\uC774\uB3C4\uB85D \uC804 \uC138\uACC4 \uACF5\uD1B5 \uBB38\uC790 \uBC29\uC2DD(UTF-8)\uC744 \uBE0C\uB77C\uC6B0\uC800\uC5D0 \uC9C0\uC815\uD569\uB2C8\uB2E4.",
    whyUsedHere: '\uC774 \uD0DC\uADF8\uB97C \uBE7C\uBA39\uC73C\uBA74 \uC0AC\uC6A9\uC790 \uCEF4\uD4E8\uD130 \uD658\uACBD\uC774\uB098 \uBE0C\uB77C\uC6B0\uC800\uC5D0 \uB530\uB77C \uD55C\uAE00\uC774 "???"\uCC98\uB7FC \uAE68\uC838\uC11C \uBCF4\uC77C \uC218 \uC788\uAE30 \uB54C\uBB38\uC5D0 \uD544\uC218\uB85C \uC791\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4.',
    wrongExample: {
      code: '<meta http-equiv="Content-Type" content="text/html; charset=EUC-KR">',
      reason: "EUC-KR\uC740 \uC61B\uB0A0 \uBC29\uC2DD\uC774\uBA70 \uC678\uACC4\uC5B4\uB098 \uD2B9\uC218\uBB38\uC790, \uC774\uBAA8\uC9C0(Emoji)\uAC00 \uAE68\uC9C0\uB294 \uCE58\uBA85\uC801\uC778 \uBB38\uC81C\uAC00 \uC788\uC2B5\uB2C8\uB2E4."
    },
    betterExample: {
      code: '<meta charset="UTF-8">',
      reason: "\uAC04\uACB0\uD558\uACE0 \uCD5C\uC2E0\uC778 HTML5 \uD45C\uC900 \uBB38\uBC95\uC73C\uB85C \uC804 \uC138\uACC4 \uBAA8\uB4E0 \uC5B8\uC5B4\uB97C \uC9C0\uC6D0\uD569\uB2C8\uB2E4."
    },
    codeCheckVerdict: "UTF-8 \uC120\uC5B8\uC740 \uC801\uC808\uD569\uB2C8\uB2E4. \uB2E8, \uBE0C\uB77C\uC6B0\uC800\uAC00 \uD30C\uC77C \uC778\uCF54\uB529\uC744 \uAC10\uC9C0\uD558\uAE30 \uC804\uC5D0 \uC77D\uC744 \uC218 \uC788\uB3C4\uB85D <head> \uD0DC\uADF8 \uBC14\uB85C \uB2E4\uC74C \uC904(\uCCAB 1024\uBC14\uC774\uD2B8 \uC774\uB0B4)\uC5D0 \uC704\uCE58\uD558\uB294\uC9C0 \uD655\uC778\uD558\uC138\uC694.",
    betterRefactor: {
      code: '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">',
      reason: "\uC778\uCF54\uB529\uACFC \uBDF0\uD3EC\uD2B8 \uBA54\uD0C0\uD0DC\uADF8\uB97C \uD56D\uC0C1 \uD55C \uC30D\uC73C\uB85C \uBB36\uC5B4 \uBC30\uCE58\uD558\uB294 \uAC83\uC774 \uCD5C\uC120\uC785\uB2C8\uB2E4."
    },
    suggestedAdditions: [
      {
        code: '<meta name="description" content="\uD398\uC774\uC9C0 \uC0C1\uC138 \uC124\uBA85">',
        meaning: "\uAC80\uC0C9\uC5D4\uC9C4\uC6A9 \uC694\uC57D \uC124\uBA85 \uBA54\uD0C0\uD0DC\uADF8",
        whyAdd: "\uAD6C\uAE00, \uB124\uC774\uBC84 \uAC80\uC0C9 \uACB0\uACFC \uB9C1\uD06C \uC544\uB798\uC5D0 \uBBF8\uB9AC\uBCF4\uAE30 \uBB38\uAD6C\uB85C \uB178\uCD9C\uB418\uC5B4 \uD074\uB9AD\uB960(CTR)\uC744 \uB192\uC5EC\uC90D\uB2C8\uB2E4."
      }
    ],
    bugIssueTitle: "\uC778\uCF54\uB529 \uC120\uC5B8 \uC704\uCE58 \uAC80\uC99D",
    bugIssueDetail: "charset \uC120\uC5B8\uC774 title\uBCF4\uB2E4 \uB4A4\uC5D0 \uC62C \uACBD\uC6B0 \uC77C\uBD80 \uAD6C\uD615 \uBE0C\uB77C\uC6B0\uC800\uC5D0\uC11C \uC778\uCF54\uB529 \uC2A4\uB2C8\uD551 \uC2E4\uD328 \uAC00\uB2A5\uC131.",
    bugSeverity: "none",
    missingTitle: "OpenGraph Meta Tags",
    missingSnippet: '<meta property="og:title" content="...">',
    missingReason: "\uCE74\uCE74\uC624\uD1A1/SNS \uB9C1\uD06C \uACF5\uC720 \uC2DC \uBBF8\uB9AC\uBCF4\uAE30 \uCE74\uB4DC \uB80C\uB354\uB9C1 \uC9C0\uC6D0",
    recommendedPatch: '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">'
  },
  title: {
    name: "\uBE0C\uB77C\uC6B0\uC800 \uC0C1\uB2E8 \uD0ED \uC81C\uBAA9",
    subBeginner: "\uBE0C\uB77C\uC6B0\uC800 \uCC3D \uD0ED\uACFC \uBD81\uB9C8\uD06C\uC5D0 \uD45C\uC2DC\uB420 \uC6F9\uD398\uC774\uC9C0\uC758 \uACF5\uC2DD \uC81C\uBAA9\uC785\uB2C8\uB2E4.",
    subIntermediate: "Document Title \uC124\uC815 (SEO \uB7AD\uD0B9 & \uBE0C\uB77C\uC6B0\uC800 \uD788\uC2A4\uD1A0\uB9AC \uC2DD\uBCC4\uC790)",
    subAdvanced: "[SEO/A11y] Title Element. Document.title DOM \uC778\uD130\uD398\uC774\uC2A4 \uBC14\uC778\uB529.",
    easyExplanation: "\uC778\uD130\uB137 \uCC3D \uB9E8 \uC704 \uD0ED(Tab)\uACFC \uC990\uACA8\uCC3E\uAE30(\uBD81\uB9C8\uD06C)\uC5D0 \uD45C\uC2DC\uB420 \uC6F9\uD398\uC774\uC9C0\uC758 \uC774\uB984\uC744 \uBD99\uC5EC\uC8FC\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
    whyUsedHere: "\uC0AC\uC6A9\uC790\uAC00 \uC5EC\uB7EC \uD0ED\uC744 \uC5F4\uC5B4\uB450\uC5C8\uC744 \uB54C \uC774 \uD398\uC774\uC9C0\uAC00 \uBB34\uC5C7\uC778\uC9C0 \uC27D\uAC8C \uC54C\uC544\uBCF4\uACE0, \uAD6C\uAE00 \uAC80\uC0C9 \uACB0\uACFC \uB9C1\uD06C \uC81C\uBAA9\uC73C\uB85C \uD45C\uC2DC\uB418\uB3C4\uB85D \uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
    wrongExample: {
      code: "<title>\uD398\uC774\uC9C01</title> \uB610\uB294 <title>\uC81C\uBAA9\uC5C6\uC74C</title>",
      reason: "\uC758\uBBF8 \uC5C6\uB294 \uC81C\uBAA9\uC740 \uAD6C\uAE00 \uAC80\uC0C9 \uB7AD\uD0B9\uC5D0\uC11C \uBC00\uB824\uB098\uACE0 \uC0AC\uC6A9\uC790\uAC00 \uC990\uACA8\uCC3E\uAE30\uD588\uC744 \uB54C \uC0AC\uC774\uD2B8\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
    },
    betterExample: {
      code: "<title>\uB85C\uADF8\uC778 | \uC11C\uBE44\uC2A4\uBA85</title>",
      reason: "\uD398\uC774\uC9C0 \uC5ED\uD560\uACFC \uC11C\uBE44\uC2A4 \uC774\uB984\uC744 \uAD6C\uBD84 \uAE30\uD638(|)\uB85C \uBA85\uD655\uD788 \uC801\uB294 \uAC83\uC774 \uBAA8\uBC94 \uC0AC\uB840\uC785\uB2C8\uB2E4."
    },
    codeCheckVerdict: "\uBB38\uC11C \uC81C\uBAA9\uC774 \uC874\uC7AC\uD558\uC5EC \uAE30\uBCF8 \uC6F9 \uD45C\uC900\uC744 \uCDA9\uC871\uD569\uB2C8\uB2E4. 20~40\uC790 \uB0B4\uC678\uB85C \uC11C\uBE44\uC2A4\uBA85\uACFC \uD575\uC2EC \uAE30\uB2A5\uC744 \uAD6C\uCCB4\uC801\uC73C\uB85C \uD3EC\uD568\uD558\uACE0 \uC788\uB294\uC9C0 \uD655\uC778\uD558\uC138\uC694.",
    betterRefactor: {
      code: "<title>\uB85C\uADF8\uC778 - \uC11C\uBE44\uC2A4\uBA85</title>",
      reason: "\uB2E8\uC21C \uC81C\uBAA9\uBCF4\uB2E4 \uBE0C\uB79C\uB4DC\uBA85\uACFC \uAE30\uB2A5\uBA85\uC744 \uC870\uD569\uD574 \uAC80\uC0C9\uC5D4\uC9C4 \uB178\uCD9C \uD6A8\uACFC\uB97C \uADF9\uB300\uD654\uD558\uC138\uC694."
    },
    suggestedAdditions: [
      {
        code: '<meta property="og:title" content="\uB098\uC758 \uCCAB \uB85C\uADF8\uC778 \uD398\uC774\uC9C0">',
        meaning: "SNS \uACF5\uC720\uC6A9 \uC624\uD508\uADF8\uB798\uD504 \uC81C\uBAA9",
        whyAdd: "\uBA54\uC2E0\uC800\uB098 \uD398\uC774\uC2A4\uBD81 \uB4F1\uC5D0 \uB9C1\uD06C\uB97C \uC804\uC1A1\uD560 \uB54C \uD0ED \uC81C\uBAA9\uACFC \uB3D9\uC77C\uD55C \uC608\uC05C \uBBF8\uB9AC\uBCF4\uAE30 \uCE74\uB4DC\uB97C \uB744\uC6CC\uC90D\uB2C8\uB2E4."
      }
    ],
    bugIssueTitle: "Title \uD14D\uC2A4\uD2B8 \uB204\uB77D \uAC80\uC0AC",
    bugIssueDetail: "\uBE44\uC5B4\uC788\uB294 <title></title>\uC740 WCAG 2.1 Success Criterion 2.4.2 \uC704\uBC18.",
    bugSeverity: "none",
    missingTitle: "\uBE0C\uB79C\uB4DC \uC811\uBBF8\uC0AC",
    missingSnippet: " | BrandName",
    missingReason: "SERP(\uAC80\uC0C9\uACB0\uACFC\uD398\uC774\uC9C0) \uBE0C\uB79C\uB529 \uBC0F \uC911\uBCF5 \uD0C0\uC774\uD2C0 \uBC29\uC9C0",
    recommendedPatch: "<title>\uB098\uC758 \uCCAB \uB85C\uADF8\uC778 \uD398\uC774\uC9C0 | \uC11C\uBE44\uC2A4\uBA85</title>"
  },
  body: {
    name: "\uC6F9\uD398\uC774\uC9C0 \uBCF8\uBB38 \uC601\uC5ED",
    subBeginner: "\uC2E4\uC81C \uC0AC\uC6A9\uC790 \uB208\uC5D0 \uBCF4\uC774\uB294 \uBAA8\uB4E0 \uAE00\uC790, \uBC84\uD2BC, \uADF8\uB9BC\uC774 \uB4E4\uC5B4\uAC00\uB294 \uAD6C\uC5ED\uC785\uB2C8\uB2E4.",
    subIntermediate: "Document Body Scope (\uB80C\uB354\uB9C1 \uD2B8\uB9AC \uB8E8\uD2B8 \uCEE8\uD14C\uC774\uB108)",
    subAdvanced: "[LAYOUT ROOT] Body Container. CSS Box Model \uBC0F \uAE30\uBCF8 \uB9AC\uC14B(margin:0) \uC810\uAC80.",
    easyExplanation: "\uC0AC\uC6A9\uC790\uC758 \uB208\uC5D0 \uC2E4\uC81C\uB85C \uBCF4\uC774\uB294 \uBAA8\uB4E0 \uAE00\uC790, \uC774\uBBF8\uC9C0, \uBC84\uD2BC, \uC785\uB825\uCC3D, \uBAA9\uB85D \uB4F1\uC774 \uB4E4\uC5B4\uAC00\uB294 \uC9C4\uC9DC \uD654\uBA74 \uB3C4\uD654\uC9C0\uC785\uB2C8\uB2E4.",
    whyUsedHere: '\uBE0C\uB77C\uC6B0\uC800\uC5D0\uAC8C "\uC774 \uC548\uCABD\uC758 \uBAA8\uB4E0 \uC694\uC18C\uB97C \uC0AC\uC6A9\uC790\uAC00 \uBCF4\uB294 \uD654\uBA74 \uCC3D\uC5D0 \uB80C\uB354\uB9C1\uD558\uB77C"\uACE0 \uC9C0\uC2DC\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uD569\uB2C8\uB2E4.',
    wrongExample: {
      code: "<body> <body> ... </body> </body>",
      reason: "\uD55C \uBB38\uC11C\uC5D0 body \uD0DC\uADF8\uAC00 2\uAC1C \uC774\uC0C1 \uC788\uC73C\uBA74 \uBE0C\uB77C\uC6B0\uC800\uAC00 DOM \uD2B8\uB9AC\uB97C \uD30C\uC2F1\uD560 \uB54C \uC2EC\uAC01\uD55C \uC624\uB958\uAC00 \uC0DD\uAE41\uB2C8\uB2E4."
    },
    betterExample: {
      code: '<body class="bg-gray-50 text-gray-900">\n  <!-- \uC2E4\uC81C \uD654\uBA74 \uC694\uC18C\uB4E4 -->\n</body>',
      reason: "body\uB294 \uD398\uC774\uC9C0\uC5D0 \uB531 \uD558\uB098\uB9CC \uC791\uC131\uD558\uACE0, \uC804\uCCB4 \uD398\uC774\uC9C0\uC758 \uAE30\uBCF8 \uBC30\uACBD\uC0C9\uACFC \uAE30\uBCF8 \uD3F0\uD2B8 \uC0C9\uC0C1\uC744 \uC9C0\uC815\uD574 \uB450\uBA74 \uC88B\uC2B5\uB2C8\uB2E4."
    },
    codeCheckVerdict: "\uBCF8\uBB38 \uB8E8\uD2B8\uB85C\uC11C \uC815\uC0C1\uC801\uC785\uB2C8\uB2E4. \uBE0C\uB77C\uC6B0\uC800 \uAE30\uBCF8 \uB9C8\uC9C4(8px)\uC774 \uC801\uC6A9\uB418\uC5B4 \uC5EC\uBC31\uC774 \uC0DD\uAE38 \uC218 \uC788\uC73C\uBBC0\uB85C CSS \uB9AC\uC14B\uC774\uB098 \uD074\uB798\uC2A4\uAC00 \uC801\uC6A9\uB418\uC5B4 \uC788\uB294\uC9C0 \uD655\uC778\uD558\uC138\uC694.",
    betterRefactor: {
      code: '<body class="min-h-screen bg-slate-50 antialiased">',
      reason: "\uCD5C\uC18C \uD654\uBA74 \uB192\uC774(100vh)\uB97C \uBCF4\uC7A5\uD558\uACE0 \uD3F0\uD2B8 \uB80C\uB354\uB9C1\uC744 \uB9E4\uB044\uB7FD\uAC8C \uD558\uB294 \uC2A4\uD0C0\uC77C\uC744 \uAE30\uBCF8 \uBD80\uC5EC\uD558\uB294 \uAC83\uC774 \uC88B\uC2B5\uB2C8\uB2E4."
    },
    suggestedAdditions: [
      {
        code: "<noscript>\uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8\uB97C \uD65C\uC131\uD654\uD574\uC8FC\uC138\uC694.</noscript>",
        meaning: "\uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8 \uBE44\uD65C\uC131\uD654 \uC0AC\uC6A9\uC790 \uC548\uB0B4",
        whyAdd: "\uBE0C\uB77C\uC6B0\uC800 \uC124\uC815\uC5D0\uC11C JS\uAC00 \uAEBC\uC838 \uC788\uAC70\uB098 \uB85C\uB529\uC5D0 \uC2E4\uD328\uD588\uC744 \uB54C \uD770 \uD654\uBA74 \uB300\uC2E0 \uCE5C\uC808\uD55C \uC548\uB0B4\uB97C \uB744\uC6CC\uC90D\uB2C8\uB2E4."
      }
    ],
    bugIssueTitle: "Body \uC911\uBCF5 \uC120\uC5B8 \uC5EC\uBD80",
    bugIssueDetail: "\uB2E8\uC77C \uC778\uC2A4\uD134\uC2A4 \uAC80\uC99D \uC644\uB8CC. <body> \uD0DC\uADF8 \uB0B4\uBD80\uC758 \uCD5C\uC0C1\uC704 \uB79C\uB4DC\uB9C8\uD06C \uAD6C\uC870(header/main/footer) \uD655\uC778 \uAD8C\uC7A5.",
    bugSeverity: "none",
    missingTitle: "Main Landmark Tag",
    missingSnippet: "<main> ... </main>",
    missingReason: "\uC2A4\uD06C\uB9B0 \uB9AC\uB354\uC758 \uBCF8\uBB38 \uBC14\uB85C\uAC00\uAE30 \uD0D0\uC0C9 \uC9C0\uC6D0",
    recommendedPatch: '<body>\n  <main id="main-content">\n    <!-- \uCF58\uD150\uCE20 -->\n  </main>\n</body>'
  },
  div: {
    name: "\uAD6C\uC5ED \uB098\uB204\uAE30 \uC0C1\uC790 (Division)",
    subBeginner: "\uC5EC\uB7EC \uC694\uC18C\uB97C \uD558\uB098\uB85C \uBB36\uC5B4 \uB514\uC790\uC778\uACFC \uC704\uCE58\uB97C \uC81C\uC5B4\uD558\uB294 \uD22C\uBA85 \uC0C1\uC790\uC785\uB2C8\uB2E4.",
    subIntermediate: "Non-semantic Container (Flex/Grid \uB808\uC774\uC544\uC6C3 \uC2A4\uD0C0\uC77C \uB798\uD37C)",
    subAdvanced: "[A11Y AUDIT] Non-semantic <div> \uB0A8\uBC1C \uC5EC\uBD80 \uBC0F ARIA Role \uD544\uC694\uC131 \uC810\uAC80.",
    easyExplanation: "\uC81C\uBAA9, \uBB38\uB2E8, \uC785\uB825\uCC3D, \uBC84\uD2BC \uAC19\uC740 \uC5EC\uB7EC \uC694\uC18C\uB97C \uD558\uB098\uC758 \uC138\uD2B8\uB85C \uBB36\uC5B4\uC11C \uD55C \uBC88\uC5D0 \uAC00\uC6B4\uB370 \uC815\uB82C\uD558\uAC70\uB098 \uC608\uC05C \uCE74\uB4DC \uD14C\uB450\uB9AC\uB97C \uCE60\uD558\uAE30 \uC704\uD55C \uD22C\uBA85\uD55C \uB124\uBAA8 \uC0C1\uC790\uC785\uB2C8\uB2E4.",
    whyUsedHere: "\uB85C\uADF8\uC778 \uAD00\uB828 \uC694\uC18C\uB4E4\uC744 \uD558\uB098\uC758 \uB3C5\uB9BD\uB41C \uCE74\uB4DC \uBC15\uC2A4\uB85C \uBB36\uC5B4 \uD654\uBA74 \uC911\uC559\uC5D0 \uBC30\uCE58\uD558\uACE0 \uBC30\uACBD\uC0C9\uACFC \uADF8\uB9BC\uC790 \uB514\uC790\uC778\uC744 \uC785\uD788\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
    wrongExample: {
      code: '<div onclick="goHome()">\uD648\uC73C\uB85C</div>',
      reason: "\uD074\uB9AD \uC774\uB3D9 \uC694\uC18C\uC5D0 \uB2E8\uC21C div\uB97C \uC4F0\uBA74 \uD0A4\uBCF4\uB4DC \uD0ED(Tab) \uD0A4\uB85C \uC774\uB3D9\uD560 \uC218 \uC5C6\uACE0 \uC2DC\uAC01\uC7A5\uC560\uC778 \uB0AD\uB3C5\uAE30\uAC00 \uBC84\uD2BC/\uB9C1\uD06C\uC778\uC9C0 \uBAA8\uB985\uB2C8\uB2E4."
    },
    betterExample: {
      code: '<main class="login-box"> \uB610\uB294 <section class="login-box">',
      reason: "\uB2E8\uC21C\uD55C \uB808\uC774\uC544\uC6C3 \uBB36\uC74C\uC5D0\uB294 div\uB97C \uC4F0\uB418, \uC8FC\uC694 \uBCF8\uBB38 \uCE74\uB4DC\uB77C\uBA74 <main>\uC774\uB098 <section> \uC2DC\uB9E8\uD2F1 \uD0DC\uADF8\uB97C \uC4F0\uBA74 \uD6E8\uC52C \uC88B\uC2B5\uB2C8\uB2E4."
    },
    codeCheckVerdict: "\uD074\uB798\uC2A4\uBA85\uC774 login-box\uB85C \uBAA9\uC801\uC774 \uBA85\uD655\uD569\uB2C8\uB2E4. \uB2E4\uB9CC \uD574\uB2F9 \uAD6C\uC5ED\uC774 \uD398\uC774\uC9C0\uC758 \uC720\uC77C\uD55C \uBA54\uC778 \uCF58\uD150\uCE20\uB77C\uBA74 \uC2DC\uB9E8\uD2F1 \uD0DC\uADF8\uC778 <main>\uC73C\uB85C \uAD50\uCCB4\uD558\uB294 \uAC83\uC744 \uC801\uADF9 \uAD8C\uC7A5\uD569\uB2C8\uB2E4.",
    betterRefactor: {
      code: '<main class="login-box" role="main">',
      reason: "\uC2DC\uB9E8\uD2F1 \uC6F9 \uD45C\uC900\uC744 \uC900\uC218\uD558\uC5EC \uAC80\uC0C9\uC5D4\uC9C4\uACFC \uC2A4\uD06C\uB9B0 \uB9AC\uB354\uAC00 \uBA54\uC778 \uB85C\uADF8\uC778 \uD3FC \uC601\uC5ED\uC784\uC744 \uC989\uC2DC \uC778\uC9C0\uD558\uB3C4\uB85D \uD569\uB2C8\uB2E4."
    },
    suggestedAdditions: [
      {
        code: 'aria-labelledby="login-title"',
        meaning: "\uC0C1\uC790\uC758 \uC81C\uBAA9\uACFC \uC811\uADFC\uC131 \uC5F0\uACB0",
        whyAdd: "\uC0C1\uC790 \uB0B4\uBD80\uC758 <h1> \uC81C\uBAA9 id\uC640 \uC5F0\uACB0\uD574 \uC2A4\uD06C\uB9B0 \uB9AC\uB354\uAC00 \uC774 \uC0C1\uC790\uC5D0 \uC9C4\uC785\uD588\uC744 \uB54C \uC5B4\uB5A4 \uC0C1\uC790\uC778\uC9C0 \uC81C\uBAA9\uC744 \uBA3C\uC800 \uC77D\uC5B4\uC8FC\uAC8C \uD569\uB2C8\uB2E4."
      }
    ],
    bugIssueTitle: "Semantic Tag \uB300\uCCB4 \uAD8C\uC7A5",
    bugIssueDetail: "div \uD0DC\uADF8\uB294 \uC758\uBBF8\uAC00 \uC5C6\uB294 \uCEE8\uD14C\uC774\uB108\uC785\uB2C8\uB2E4. \uB85C\uADF8\uC778 \uD654\uBA74\uC758 \uD575\uC2EC \uCE74\uB4DC\uB77C\uBA74 <main> \uB610\uB294 <section> \uC0AC\uC6A9\uC774 \uC2DC\uB9E8\uD2F1 \uC6F9 \uD45C\uC900\uC5D0 \uBD80\uD569\uD569\uB2C8\uB2E4.",
    bugSeverity: "warning",
    missingTitle: "ARIA Landmark Role",
    missingSnippet: 'role="region" aria-label="\uB85C\uADF8\uC778 \uC591\uC2DD"',
    missingReason: "\uC2A4\uD06C\uB9B0 \uB9AC\uB354 \uBCF4\uC870\uACF5\uD559 \uAE30\uAE30\uC758 \uC601\uC5ED \uC2DD\uBCC4 \uC9C0\uC6D0",
    recommendedPatch: '<main class="login-box">\n  <!-- \uB85C\uADF8\uC778 \uC694\uC18C -->\n</main>'
  },
  h1: {
    name: "\uCD5C\uC0C1\uC704 \uB300\uC81C\uBAA9 (Heading 1)",
    subBeginner: "\uC774 \uC6F9\uD398\uC774\uC9C0\uC5D0\uC11C \uAC00\uC7A5 \uC911\uC694\uD558\uACE0 \uD070 \uB300\uD45C \uC81C\uBAA9\uC744 \uD654\uBA74\uC5D0 \uD45C\uC2DC\uD569\uB2C8\uB2E4.",
    subIntermediate: "Level 1 Heading (\uBB38\uC11C \uC544\uC6C3\uB77C\uC778 \uCD5C\uC0C1\uB2E8 \uC81C\uBAA9 \uB178\uB4DC)",
    subAdvanced: "[OUTLINE] Heading Level 1. \uD398\uC774\uC9C0\uB2F9 1\uAC1C \uC81C\uD55C \uC6D0\uCE59(H1 Singleton) \uC900\uC218 \uC5EC\uBD80.",
    easyExplanation: "\uC81C\uC77C \uD070 \uAE00\uC528\uB85C \uC81C\uBAA9\uC744 \uCD9C\uB825\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
    whyUsedHere: "\uC774 \uD654\uBA74\uC5D0\uC11C \uAC00\uC7A5 \uD070 \uCCAB\uBC88\uC9F8 \uC81C\uBAA9 \uAE00\uC790\uB97C \uD45C\uC2DC\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
    wrongExample: {
      code: '<p style="font-size:32px; font-weight:bold;">\uD658\uC601\uD569\uB2C8\uB2E4</p>',
      reason: "p \uD0DC\uADF8\uB97C \uAE00\uC790 \uD06C\uAE30\uB9CC \uD0A4\uC6CC \uC4F0\uBA74 \uAC80\uC0C9\uC5D4\uC9C4 \uB85C\uBD07\uC774 \uC774\uAC83\uC774 \uB300\uD45C \uC81C\uBAA9\uC778\uC9C0 \uC804\uD600 \uC778\uC2DD\uD558\uC9C0 \uBABB\uD574 SEO \uC810\uC218\uAC00 \uAE4E\uC785\uB2C8\uB2E4."
    },
    betterExample: {
      code: "<h1>\uD658\uC601\uD569\uB2C8\uB2E4</h1>",
      reason: "\uD398\uC774\uC9C0\uB2F9 h1\uC740 \uC624\uC9C1 1\uAC1C\uB9CC \uC4F0\uACE0, \uBD80\uC81C\uBAA9\uC740 h2, \uC18C\uC81C\uBAA9\uC740 h3\uB85C \uACC4\uCE35 \uC21C\uC11C\uB97C \uC9C0\uCF1C \uC791\uC131\uD558\uB294 \uAC83\uC774 \uAC00\uC7A5 \uC6B0\uC218\uD569\uB2C8\uB2E4."
    },
    codeCheckVerdict: "\uC81C\uBAA9 \uACC4\uCE35 \uAD6C\uC870\uC758 \uCD5C\uC0C1\uB2E8\uC73C\uB85C \uC62C\uBC14\uB974\uAC8C \uC120\uC5B8\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBB38\uC11C \uB0B4\uC5D0 \uB2E4\uB978 h1\uC774 \uC911\uBCF5 \uC874\uC7AC\uD558\uC9C0 \uC54A\uB294\uC9C0 \uD655\uC778\uD558\uC138\uC694.",
    betterRefactor: {
      code: '<h1 id="login-title" class="text-2xl font-bold">\uD658\uC601\uD569\uB2C8\uB2E4</h1>',
      reason: "id\uB97C \uBD80\uC5EC\uD574 \uBD80\uBAA8 \uCEE8\uD14C\uC774\uB108(aria-labelledby)\uC640 \uC5F0\uACC4\uD558\uBA74 \uC811\uADFC\uC131\uC774 \uB354\uC6B1 \uAC15\uD654\uB429\uB2C8\uB2E4."
    },
    suggestedAdditions: [
      {
        code: '<span class="sr-only"> - \uC0AC\uC6A9\uC790 \uB85C\uADF8\uC778</span>',
        meaning: "\uD654\uBA74\uC5D4 \uC228\uAE30\uACE0 \uC2A4\uD06C\uB9B0 \uB9AC\uB354\uC5D0\uB9CC \uC77D\uD788\uB294 \uD14D\uC2A4\uD2B8",
        whyAdd: '\uC2DC\uAC01\uC801\uC73C\uB85C\uB294 "\uD658\uC601\uD569\uB2C8\uB2E4"\uB9CC \uAE54\uB054\uD558\uAC8C \uBCF4\uC774\uACE0, \uC2DC\uAC01\uC7A5\uC560\uC778 \uB0AD\uB3C5\uAE30\uC5D0\uB294 "\uD658\uC601\uD569\uB2C8\uB2E4 - \uC0AC\uC6A9\uC790 \uB85C\uADF8\uC778"\uC73C\uB85C \uB9E5\uB77D\uC744 \uC644\uC804\uD558\uAC8C \uC804\uB2EC\uD569\uB2C8\uB2E4.'
      }
    ],
    bugIssueTitle: "Heading \uACC4\uCE35 \uAD6C\uC870 \uC810\uAC80",
    bugIssueDetail: "h1\uC774 \uC0DD\uB7B5\uB41C \uCC44 h2\uBD80\uD130 \uC2DC\uC791\uD558\uAC70\uB098, h1\uC774 3\uAC1C \uC774\uC0C1 \uC911\uBCF5 \uC120\uC5B8\uB418\uBA74 \uBB38\uC11C \uC544\uC6C3\uB77C\uC778 \uD2B8\uB9AC \uD30C\uAD34.",
    bugSeverity: "none",
    missingTitle: "\uACE0\uC720 ID \uC2DD\uBCC4\uC790",
    missingSnippet: 'id="main-heading"',
    missingReason: "ARIA \uCC38\uC870 \uBC14\uC778\uB529\uC744 \uC704\uD55C \uC575\uCEE4 ID",
    recommendedPatch: '<h1 id="main-heading">\uD658\uC601\uD569\uB2C8\uB2E4</h1>'
  },
  p: {
    name: "\uBCF8\uBB38 \uC124\uBA85 \uBB38\uB2E8 (Paragraph)",
    subBeginner: "\uC77C\uBC18\uC801\uC778 \uC124\uBA85 \uAE00\uC774\uB098 \uBCF8\uBB38 \uBB38\uC7A5\uC744 \uC801\uB294 \uD45C\uC900 \uBB38\uB2E8 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
    subIntermediate: "Paragraph Block Element (\uD45C\uC900 \uB9C8\uC9C4 \uBC0F \uBCF8\uBB38 \uD0C0\uC774\uD3EC\uADF8\uB798\uD53C)",
    subAdvanced: "[TYPOGRAPHY] <p> \uBE14\uB85D \uB178\uB4DC. \uC778\uB77C\uC778 \uC694\uC18C\uB9CC \uC790\uC2DD\uC73C\uB85C \uC218\uC6A9 \uAC00\uB2A5.",
    easyExplanation: "\uC81C\uBAA9 \uC544\uB798\uC5D0\uC11C \uC0AC\uC6A9\uC790\uC5D0\uAC8C \uBD80\uAC00\uC801\uC778 \uC548\uB0B4 \uBB38\uAD6C\uB098 \uC77C\uBC18 \uBB38\uC7A5\uC744 \uC77D\uAE30 \uD3B8\uD558\uAC8C \uBCF4\uC5EC\uC8FC\uB294 \uBB38\uB2E8 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
    whyUsedHere: '\uC0AC\uC6A9\uC790\uC5D0\uAC8C "\uC544\uC774\uB514\uB97C \uC785\uB825\uD558\uACE0 \uB85C\uADF8\uC778\uD558\uC138\uC694"\uB77C\uB294 \uBA85\uD655\uD55C \uD589\uB3D9 \uC9C0\uCE68\uC744 \uC54C\uB824\uC8FC\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.',
    wrongExample: {
      code: "<div>\uAE00\uB0B4\uC6A91</div><br><br><div>\uAE00\uB0B4\uC6A92</div>",
      reason: "\uBB38\uB2E8 \uAD6C\uBD84\uC744 div\uC640 br \uD0DC\uADF8 \uC5F0\uC18D\uC73C\uB85C \uCC98\uB9AC\uD558\uBA74 \uBAA8\uBC14\uC77C \uD654\uBA74\uC5D0\uC11C \uC5EC\uBC31\uC774 \uBD80\uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC5B4\uAE0B\uB0A9\uB2C8\uB2E4."
    },
    betterExample: {
      code: '<p class="text-sm text-gray-600">\uC544\uC774\uB514\uB97C \uC785\uB825\uD558\uACE0 \uB85C\uADF8\uC778\uD558\uC138\uC694.</p>',
      reason: "\uAC01\uAC01\uC758 \uBB38\uC7A5\uC744 \uB3C5\uB9BD\uB41C <p> \uD0DC\uADF8\uB85C \uAC10\uC2F8\uACE0, \uBB38\uB2E8 \uAC04 \uAC04\uACA9\uC740 CSS margin\uC73C\uB85C \uC870\uC808\uD558\uB294 \uAC83\uC774 \uC815\uC11D\uC785\uB2C8\uB2E4."
    },
    codeCheckVerdict: "\uBB38\uB2E8\uC73C\uB85C \uC54C\uB9DE\uAC8C \uB9C8\uD06C\uC5C5\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uD14D\uC2A4\uD2B8 \uAE38\uC774\uAC00 \uAE38\uC5B4\uC9C8 \uACBD\uC6B0 \uB300\uBE44\uC728(\uBA85\uB3C4\uBE44 4.5:1 \uC774\uC0C1)\uC744 \uACE0\uB824\uD55C \uAE00\uC790\uC0C9 \uC120\uC815\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.",
    betterRefactor: {
      code: '<p class="text-slate-600 text-sm leading-relaxed">\uC544\uC774\uB514\uB97C \uC785\uB825\uD558\uACE0 \uB85C\uADF8\uC778\uD558\uC138\uC694.</p>',
      reason: "\uAC00\uB3C5\uC131\uC744 \uB192\uC774\uB294 \uC904\uAC04\uACA9(leading-relaxed)\uACFC \uC801\uC808\uD55C \uBA85\uB3C4\uBE44\uC758 \uC0C9\uC0C1\uC744 \uC9C0\uC815\uD558\uC138\uC694."
    },
    suggestedAdditions: [
      {
        code: 'id="login-instruction"',
        meaning: "\uC548\uB0B4\uBB38 ID \uC2DD\uBCC4\uC790",
        whyAdd: '\uC785\uB825\uCC3D\uC5D0 aria-describedby="login-instruction"\uC744 \uC5F0\uACB0\uD558\uBA74 \uC785\uB825\uCC3D\uC5D0 \uCEE4\uC11C\uAC00 \uAC08 \uB54C \uC774 \uC548\uB0B4\uBB38\uC774 \uC790\uB3D9\uC73C\uB85C \uB0AD\uB3C5\uB429\uB2C8\uB2E4.'
      }
    ],
    bugIssueTitle: "\uBE14\uB85D \uC694\uC18C \uC911\uCCA9 \uAE08\uC9C0 \uADDC\uCE59",
    bugIssueDetail: "<p> \uD0DC\uADF8 \uB0B4\uBD80\uC5D0 <div>, <p>, <ul> \uB4F1 \uBE14\uB85D \uC694\uC18C\uB97C \uB123\uC73C\uBA74 \uBE0C\uB77C\uC6B0\uC800\uAC00 \uC790\uB3D9\uC73C\uB85C \uB2EB\uC544\uBC84\uB824 DOM \uD30C\uC2F1 \uC624\uB958 \uBC1C\uC0DD.",
    bugSeverity: "none",
    missingTitle: "\uB204\uB77D \uC5C6\uC74C",
    missingSnippet: "",
    missingReason: "\uD14D\uC2A4\uD2B8 \uC778\uB77C\uC778 \uB178\uB4DC \uC815\uC0C1 \uC218\uC6A9",
    recommendedPatch: "<p>\uC544\uC774\uB514\uB97C \uC785\uB825\uD558\uACE0 \uB85C\uADF8\uC778\uD558\uC138\uC694.</p>"
  },
  input: {
    name: "\uC0AC\uC6A9\uC790 \uB370\uC774\uD130 \uC785\uB825\uCE78 (Input)",
    subBeginner: "\uC0AC\uC6A9\uC790\uAC00 \uD0A4\uBCF4\uB4DC\uB85C \uAE00\uC790\uB97C \uC785\uB825\uD560 \uC218 \uC788\uB294 \uC0AC\uAC01 \uC785\uB825\uCC3D\uC744 \uB9CC\uB4ED\uB2C8\uB2E4.",
    subIntermediate: "Interactive Form Control (name/id/type \uBC0F \uC81C\uC57D\uC870\uAC74 \uAC80\uC99D)",
    subAdvanced: "[SECURITY & A11Y] Input Element. Label \uBC14\uC778\uB529, name \uC18D\uC131, \uC790\uB3D9\uC644\uC131 \uB204\uB77D \uAC80\uC0AC.",
    easyExplanation: "\uC0AC\uC6A9\uC790\uAC00 \uD0A4\uBCF4\uB4DC\uB85C \uC544\uC774\uB514\uB97C \uC9C1\uC811 \uD0C0\uC774\uD551\uD560 \uC218 \uC788\uB294 \uB124\uBAA8\uB09C \uBE48\uCE78 \uC785\uB825 \uC0C1\uC790\uC785\uB2C8\uB2E4.",
    whyUsedHere: "\uB85C\uADF8\uC778\uC744 \uD558\uB824\uBA74 \uC0AC\uC6A9\uC790\uB85C\uBD80\uD130 \uC544\uC774\uB514 \uB370\uC774\uD130\uB97C \uC9C1\uC811 \uC785\uB825\uBC1B\uC544\uC57C \uD558\uBBC0\uB85C \uD3FC\uC5D0\uC11C \uAC00\uC7A5 \uD575\uC2EC\uC801\uC778 \uC785\uB825\uCC3D\uC73C\uB85C \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
    wrongExample: {
      code: '<input placeholder="\uBE44\uBC00\uBC88\uD638"> (type \uC18D\uC131 \uB204\uB77D)',
      reason: '\uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uBC1B\uC744 \uB54C type="password"\uB97C \uC0DD\uB7B5\uD558\uBA74 \uC785\uB825\uD55C \uAE00\uC790\uAC00 \uD654\uBA74\uC5D0 \uADF8\uB300\uB85C \uB178\uCD9C\uB418\uC5B4 \uBCF4\uC548\uC5D0 \uCE58\uBA85\uC801\uC785\uB2C8\uB2E4.'
    },
    betterExample: {
      code: '<input type="text" id="user-id" name="userId" placeholder="\uC544\uC774\uB514\uB97C \uC785\uB825\uD558\uC138\uC694" autocomplete="username" required>',
      reason: "type \uBA85\uC2DC, id/name \uBD80\uC5EC, \uC790\uB3D9\uC644\uC131(autocomplete) \uC18D\uC131\uC744 \uD568\uAED8 \uC801\uC5B4\uC8FC\uBA74 \uBCF4\uC548\uACFC \uBE0C\uB77C\uC6B0\uC800 \uD3B8\uC758\uC131\uC774 \uADF9\uB300\uD654\uB429\uB2C8\uB2E4."
    },
    codeCheckVerdict: 'placeholder\uC640 required \uC18D\uC131\uC774 \uC798 \uC801\uC6A9\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4. \uD558\uC9C0\uB9CC \uC11C\uBC84\uB85C \uB370\uC774\uD130\uB97C \uC804\uC1A1\uD560 \uB54C \uD0A4\uAC12\uC774 \uB418\uB294 "name" \uC18D\uC131\uACFC \uB77C\uBCA8 \uC5F0\uACB0\uC6A9 "id" \uC18D\uC131\uC774 \uB204\uB77D\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.',
    betterRefactor: {
      code: '<input type="text" id="user-id" name="username" placeholder="\uC544\uC774\uB514\uB97C \uC785\uB825\uD558\uC138\uC694" autocomplete="username" required>',
      reason: "name \uC18D\uC131\uC744 \uC8FC\uC5B4\uC57C \uD3FC \uC81C\uCD9C \uC2DC \uC11C\uBC84\uAC00 \uAC12\uC744 \uC77D\uC744 \uC218 \uC788\uC73C\uBA70, autocomplete\uB85C \uC800\uC7A5\uB41C \uC544\uC774\uB514\uB97C \uBE0C\uB77C\uC6B0\uC800\uAC00 \uC790\uB3D9 \uCC44\uC6CC\uC90D\uB2C8\uB2E4."
    },
    suggestedAdditions: [
      {
        code: 'name="username"',
        meaning: "\uC11C\uBC84 \uC804\uC1A1\uC6A9 \uD30C\uB77C\uBBF8\uD130 \uC2DD\uBCC4\uC790",
        whyAdd: "\uC774 \uC18D\uC131\uC774 \uC5C6\uC73C\uBA74 \uC0AC\uC6A9\uC790\uAC00 \uC544\uC774\uB514\uB97C \uC785\uB825\uD558\uACE0 \uC81C\uCD9C \uBC84\uD2BC\uC744 \uB20C\uB7EC\uB3C4 \uC11C\uBC84\uB85C \uC544\uC774\uB514 \uAC12\uC774 \uC804\uD600 \uC804\uB2EC\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4!"
      },
      {
        code: 'autocomplete="username"',
        meaning: "\uBE0C\uB77C\uC6B0\uC800 \uC790\uB3D9\uC644\uC131 \uD78C\uD2B8",
        whyAdd: "\uC0AC\uC6A9\uC790\uAC00 \uC774\uC804\uC5D0 \uC800\uC7A5\uD574 \uB454 \uACC4\uC815 \uC544\uC774\uB514\uB97C \uD074\uB9AD \uD55C \uBC88\uC73C\uB85C \uC790\uB3D9 \uC785\uB825\uD560 \uC218 \uC788\uAC8C \uD574 \uD3B8\uB9AC\uD568\uC744 \uB300\uD3ED \uD5A5\uC0C1\uC2DC\uD0B5\uB2C8\uB2E4."
      },
      {
        code: 'maxlength="50"',
        meaning: "\uCD5C\uB300 \uAE00\uC790 \uC218 \uC81C\uD55C",
        whyAdd: "\uC545\uC758\uC801\uC778 \uC0AC\uC6A9\uC790\uAC00 \uC218\uB9CC \uC790\uC758 \uAE34 \uD14D\uC2A4\uD2B8\uB97C \uC785\uB825\uD574 \uBE0C\uB77C\uC6B0\uC800\uB97C \uB2E4\uC6B4\uC2DC\uD0A4\uB294 \uBC84\uD37C \uC624\uBC84\uD50C\uB85C\uC6B0 \uACF5\uACA9\uC744 \uD074\uB77C\uC774\uC5B8\uD2B8 \uB2E8\uC5D0\uC11C 1\uCC28 \uCC28\uB2E8\uD569\uB2C8\uB2E4."
      }
    ],
    bugIssueTitle: "\u{1F6A8} [Warning] name \uC18D\uC131 \uB204\uB77D (Form Data \uC218\uC9D1 \uBD88\uAC00)",
    bugIssueDetail: "HTMLFormElement.elements \uB610\uB294 FormData API \uD638\uCD9C \uC2DC name \uC18D\uC131\uC774 \uC5C6\uB294 input\uC740 \uD3FC \uC9C1\uB82C\uD654 \uB300\uC0C1\uC5D0\uC11C \uC644\uC804\uD788 \uBC30\uC81C\uB429\uB2C8\uB2E4. \uC11C\uBC84\uC5D0 \uBE48 \uB370\uC774\uD130\uAC00 \uC804\uC1A1\uB429\uB2C8\uB2E4.",
    bugSeverity: "warning",
    missingTitle: "name \uC18D\uC131 & <label> \uBC14\uC778\uB529 \uB204\uB77D",
    missingSnippet: 'id="userId" name="username" autocomplete="username"',
    missingReason: "1) \uC11C\uBC84 \uD3FC \uB370\uC774\uD130 \uC804\uC1A1 \uBD88\uAC00 \uD574\uACB0, 2) \uC2A4\uD06C\uB9B0 \uB9AC\uB354 \uC785\uB825 \uB77C\uBCA8 \uC2DD\uBCC4 \uBD88\uAC00 \uD574\uACB0",
    recommendedPatch: '<label for="userId">\uC544\uC774\uB514</label>\n<input type="text" id="userId" name="username" placeholder="\uC544\uC774\uB514\uB97C \uC785\uB825\uD558\uC138\uC694" autocomplete="username" required>'
  },
  button: {
    name: "\uD074\uB9AD \uB3D9\uC791 \uBC84\uD2BC (Button)",
    subBeginner: "\uD074\uB9AD \uC2DC \uC591\uC2DD\uC744 \uC81C\uCD9C\uD558\uAC70\uB098 \uB3D9\uC791\uC744 \uC2E4\uD589\uD558\uB294 \uB204\uB97C \uC218 \uC788\uB294 \uBC84\uD2BC\uC785\uB2C8\uB2E4.",
    subIntermediate: "Submit Button Control (\uD0A4\uBCF4\uB4DC \uC5D4\uD130/\uC2A4\uD398\uC774\uC2A4 \uC778\uD130\uB799\uC158 \uCC98\uB9AC)",
    subAdvanced: '[A11Y & STATE] Button Element. Type="submit" \uD3FC \uC81C\uCD9C \uBC14\uC778\uB529 \uBC0F \uC911\uBCF5 \uD074\uB9AD \uBC29\uC9C0 \uC810\uAC80.',
    easyExplanation: "\uBC84\uD2BC\uC758 \uD0C0\uC785\uC744 \uC81C\uCD9C\uD560 \uC218 \uC788\uB294 \uBC84\uD2BC \uD615\uC2DD\uC73C\uB85C \uB9CC\uB4E0 \uD6C4 \uADF8 \uBC84\uD2BC\uC758 \uC774\uB984\uC744 \uB85C\uADF8\uC778\uC73C\uB85C \uD45C\uC2DC\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.",
    whyUsedHere: "\uC0AC\uC6A9\uC790\uAC00 \uC785\uB825\uD55C \uC591\uC2DD \uC815\uBCF4\uB97C \uC11C\uBC84\uB85C \uC804\uC1A1(\uC81C\uCD9C)\uD558\uAE30 \uC704\uD574 \uD074\uB9AD\uD560 \uC218 \uC788\uB3C4\uB85D \uBC30\uCE58\uD55C \uD544\uC218 \uC785\uB825 \uBC84\uD2BC\uC785\uB2C8\uB2E4.",
    wrongExample: {
      code: '<div class="btn" onclick="submitForm()">\uB85C\uADF8\uC778</div>',
      reason: "div\uB85C \uB9CC\uB4E0 \uAC00\uC9DC \uBC84\uD2BC\uC740 \uD0A4\uBCF4\uB4DC \uD3EC\uCEE4\uC2A4(Tab \uC774\uB3D9), \uC5D4\uD130\uD0A4 \uC2E4\uD589, \uC2A4\uD06C\uB9B0 \uB9AC\uB354 \uC74C\uC131 \uC9C0\uC6D0\uC774 \uBAA8\uB450 \uBD88\uAC00\uB2A5\uD569\uB2C8\uB2E4."
    },
    betterExample: {
      code: '<button type="submit" class="btn-primary">\uB85C\uADF8\uC778</button>',
      reason: '\uBC18\uB4DC\uC2DC \uD45C\uC900 <button> \uD0DC\uADF8\uB97C \uC4F0\uACE0, \uD3FC \uC804\uC1A1\uC6A9\uC774\uBA74 type="submit", \uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8\uC6A9\uC774\uBA74 type="button"\uC744 \uBA85\uC2DC\uD558\uC138\uC694.'
    },
    codeCheckVerdict: 'type="submit"\uC73C\uB85C \uC9C0\uC815\uB418\uC5B4 \uC788\uC5B4 \uD3FC \uC81C\uCD9C\uC6A9 \uBC84\uD2BC\uC758 \uC5ED\uD560\uC744 \uC62C\uBC14\uB974\uAC8C \uC218\uD589\uD569\uB2C8\uB2E4. \uD0A4\uBCF4\uB4DC \uC5D4\uD130\uD0A4\uB97C \uB20C\uB800\uC744 \uB54C\uB3C4 \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC81C\uCD9C\uB429\uB2C8\uB2E4.',
    betterRefactor: {
      code: '<button type="submit" class="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">\uB85C\uADF8\uC778</button>',
      reason: "\uD074\uB9AD \uC601\uC5ED\uC744 \uCDA9\uBD84\uD788 \uB113\uD788\uACE0(\uCD5C\uC18C 44px) \uB9C8\uC6B0\uC2A4 \uD638\uBC84 \uC2DC \uC2DC\uAC01\uC801 \uD53C\uB4DC\uBC31\uC744 \uC8FC\uBA74 \uBAA8\uBC14\uC77C\uACFC \uB370\uC2A4\uD06C\uD1B1 \uBAA8\uB450\uC5D0\uC11C \uC0AC\uC6A9\uC131\uC774 \uB192\uC544\uC9D1\uB2C8\uB2E4."
    },
    suggestedAdditions: [
      {
        code: 'id="login-submit-btn"',
        meaning: "\uBC84\uD2BC \uACE0\uC720 \uC2DD\uBCC4\uC790",
        whyAdd: "\uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8\uC5D0\uC11C \uB85C\uADF8\uC778 \uBC84\uD2BC\uC744 \uD074\uB9AD\uD588\uC744 \uB54C \uB85C\uB529 \uC2A4\uD53C\uB108\uB97C \uB744\uC6B0\uAC70\uB098 \uC911\uBCF5 \uC81C\uCD9C(\uB354\uBE14 \uD074\uB9AD)\uC744 \uB9C9\uAE30 \uC704\uD574 \uD544\uC694\uD569\uB2C8\uB2E4."
      }
    ],
    bugIssueTitle: "\uB354\uBE14 \uC11C\uBE0C\uBC0B(\uC911\uBCF5 \uC81C\uCD9C) \uBC29\uC9C0 \uB85C\uC9C1 \uD544\uC694",
    bugIssueDetail: "\uB124\uD2B8\uC6CC\uD06C \uC9C0\uC5F0 \uC2DC \uC0AC\uC6A9\uC790\uAC00 \uBC84\uD2BC\uC744 \uC5F0\uD0C0\uD558\uBA74 \uB85C\uADF8\uC778/\uACB0\uC81C \uC694\uCCAD\uC774 \uC911\uBCF5 \uC804\uC1A1\uB420 \uC218 \uC788\uC73C\uBBC0\uB85C disabled \uCC98\uB9AC \uD544\uC694.",
    bugSeverity: "none",
    missingTitle: "\uB204\uB77D \uC5C6\uC74C",
    missingSnippet: "",
    missingReason: 'type="submit" \uC815\uC0C1 \uC9C0\uC815 \uC644\uB8CC',
    recommendedPatch: '<button type="submit" id="submitBtn">\uB85C\uADF8\uC778</button>'
  }
};
var HTML_ATTR_DICTIONARY = {
  charset: "\uAE00\uC790\uAC00 \uAE68\uC9C0\uC9C0 \uC54A\uB3C4\uB85D \uBB38\uC790 \uC778\uCF54\uB529(UTF-8)\uC744 \uC9C0\uC815\uD569\uB2C8\uB2E4.",
  lang: "\uC6F9\uD398\uC774\uC9C0\uC758 \uAE30\uBCF8 \uC5B8\uC5B4(ko=\uD55C\uAD6D\uC5B4, en=\uC601\uC5B4)\uB97C \uBE0C\uB77C\uC6B0\uC800\uC5D0 \uC120\uC5B8\uD569\uB2C8\uB2E4.",
  name: "\uBA54\uD0C0 \uC124\uC815\uC758 \uC885\uB958\uB098 \uC11C\uBC84 \uC804\uC1A1 \uC2DC \uD30C\uB77C\uBBF8\uD130 \uBCC0\uC218\uBA85\uC744 \uC815\uD569\uB2C8\uB2E4.",
  content: "meta \uD0DC\uADF8\uC758 \uC2E4\uC81C \uC124\uC815 \uAC12(\uD654\uBA74 \uD06C\uAE30, \uC124\uBA85 \uBB38\uAD6C \uB4F1)\uC744 \uB2F4\uC2B5\uB2C8\uB2E4.",
  class: "CSS \uB514\uC790\uC778\uC774\uB098 \uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8\uC5D0\uC11C \uC774 \uC694\uC18C\uB97C \uAFB8\uBBF8\uAE30 \uC704\uD574 \uBD99\uC774\uB294 \uACF5\uD1B5 \uADF8\uB8F9 \uC774\uB984\uD45C\uC785\uB2C8\uB2E4.",
  id: "\uD398\uC774\uC9C0 \uC548\uC5D0\uC11C \uB2E8 \uD558\uB098\uBFD0\uC778 \uC774 \uC694\uC18C\uB9CC\uC758 \uACE0\uC720\uD55C \uC8FC\uBBFC\uB4F1\uB85D\uBC88\uD638(\uC2DD\uBCC4\uC790)\uC785\uB2C8\uB2E4.",
  href: "\uD074\uB9AD \uC2DC \uC774\uB3D9\uD560 \uC6F9 \uC8FC\uC18C(URL)\uB098 \uBD88\uB7EC\uC62C \uD30C\uC77C \uACBD\uB85C\uB97C \uC9C0\uC815\uD569\uB2C8\uB2E4.",
  src: "\uBD88\uB7EC\uC62C \uC774\uBBF8\uC9C0\uB098 \uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8 \uD30C\uC77C\uC758 \uC800\uC7A5 \uC704\uCE58(\uACBD\uB85C)\uB97C \uC9C0\uC815\uD569\uB2C8\uB2E4.",
  alt: "\uC774\uBBF8\uC9C0\uAC00 \uC548 \uBCF4\uC77C \uB54C \uB300\uC2E0 \uB730 \uB300\uCCB4 \uC124\uBA85 \uAE00\uC790\uC774\uC790 \uC2DC\uAC01\uC7A5\uC560\uC778\uC6A9 \uB0AD\uB3C5 \uD14D\uC2A4\uD2B8\uC785\uB2C8\uB2E4.",
  type: "\uC785\uB825\uCE78\uC758 \uC885\uB958(text=\uC77C\uBC18\uAE00\uC790, password=\uBE44\uBC00\uBC88\uD638 \uC228\uAE40, submit=\uC81C\uCD9C)\uB97C \uACB0\uC815\uD569\uB2C8\uB2E4.",
  placeholder: "\uAE00\uC790\uB97C \uCE58\uAE30 \uC804\uC5D0 \uC785\uB825\uCE78 \uC548\uC5D0 \uD750\uB9BF\uD558\uAC8C \uBCF4\uC774\uB294 \uB3C4\uC6C0\uB9D0 \uD78C\uD2B8 \uBB38\uAD6C\uC785\uB2C8\uB2E4.",
  value: "\uC785\uB825\uCE78\uC5D0 \uBBF8\uB9AC \uB4E4\uC5B4\uC788\uB294 \uAE30\uBCF8\uAC12\uC774\uAC70\uB098 \uC11C\uBC84\uB85C \uC804\uC1A1\uB420 \uC2E4\uC81C \uB370\uC774\uD130 \uAC12\uC785\uB2C8\uB2E4.",
  required: "\uC774 \uC785\uB825\uCE78\uC744 \uCC44\uC6B0\uC9C0 \uC54A\uC73C\uBA74 \uC81C\uCD9C\uB418\uC9C0 \uC54A\uB3C4\uB85D \uB9C9\uB294 \uD544\uC218 \uC785\uB825 \uD45C\uC2DC\uC785\uB2C8\uB2E4.",
  rel: "\uC5F0\uACB0\uD558\uB294 \uC678\uBD80 \uD30C\uC77C\uACFC \uD604\uC7AC \uBB38\uC11C\uC758 \uAD00\uACC4(stylesheet=\uC2A4\uD0C0\uC77C\uC2DC\uD2B8 \uB4F1)\uB97C \uC815\uC758\uD569\uB2C8\uB2E4.",
  target: "\uB9C1\uD06C\uB97C \uB204\uB97C \uB54C \uD604\uC7AC \uCC3D\uC5D0\uC11C \uC5F4\uC9C0, \uC0C8 \uD0ED(_blank)\uC5D0\uC11C \uB744\uC6B8\uC9C0 \uACB0\uC815\uD569\uB2C8\uB2E4."
};
function extractHtmlTokens(trimmed) {
  const tokens = [];
  if (trimmed.startsWith("<!--")) {
    tokens.push({
      token: "<!-- ... -->",
      meaning: "\uD654\uBA74\uC5D0 \uBCF4\uC774\uC9C0 \uC54A\uACE0 \uAC1C\uBC1C\uC790\uB07C\uB9AC \uBCF4\uB294 HTML \uC124\uBA85 \uC8FC\uC11D\uC785\uB2C8\uB2E4."
    });
    return tokens;
  }
  const tagRegex = /<\/?([!a-zA-Z0-9-]+)([^>]*)>/g;
  let match;
  while ((match = tagRegex.exec(trimmed)) !== null) {
    const fullTag = match[0];
    const isClosing = fullTag.startsWith("</");
    const rawTagName = match[1].toLowerCase();
    const attrPart = match[2] || "";
    const tagInfo = HTML_MASTER_DICTIONARY[rawTagName];
    if (isClosing) {
      tokens.push({
        token: `</${rawTagName}>`,
        meaning: tagInfo ? `<${rawTagName}> (${tagInfo.name}) \uAD6C\uC5ED\uC744 \uC5EC\uAE30\uC11C \uB2EB\uC544 \uB9C8\uBB34\uB9AC\uD569\uB2C8\uB2E4.` : `<${rawTagName}> \uD0DC\uADF8\uB97C \uB2EB\uB294 \uC885\uB8CC \uD0DC\uADF8\uC785\uB2C8\uB2E4.`
      });
    } else {
      tokens.push({
        token: rawTagName === "!doctype" ? "<!DOCTYPE html>" : `<${rawTagName}>`,
        meaning: tagInfo ? `${tagInfo.name}: ${tagInfo.easyExplanation}` : `<${rawTagName}> \uC694\uC18C\uB97C \uC2DC\uC791\uD558\uB294 HTML \uD0DC\uADF8\uC785\uB2C8\uB2E4.`
      });
      const attrRegex = /([a-zA-Z-]+)(?:="([^"]*)")?/g;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(attrPart)) !== null) {
        const attrName = attrMatch[1].toLowerCase();
        const attrVal = attrMatch[2];
        if (attrName === "html" && rawTagName === "!doctype") continue;
        const attrDesc = HTML_ATTR_DICTIONARY[attrName];
        if (attrDesc) {
          tokens.push({
            token: attrVal !== void 0 ? `${attrName}="${attrVal}"` : attrName,
            meaning: attrVal !== void 0 ? `'${attrVal}'\uB85C \uC124\uC815 \u2014 ${attrDesc}` : attrDesc
          });
        }
      }
    }
  }
  return tokens;
}
var HTML_LEVEL_DEPTH = {
  "!doctype": {
    isBasic: true,
    howItWorks: "\uBE0C\uB77C\uC6B0\uC800\uB294 \uBB38\uC11C\uB97C \uC77D\uAE30 \uC2DC\uC791\uD560 \uB54C \uCCAB \uC904\uC744 \uBCF4\uACE0 \uB80C\uB354\uB9C1 \uBC29\uC2DD\uC744 \uACE0\uB985\uB2C8\uB2E4. DOCTYPE\uC774 \uC788\uC73C\uBA74 \uD45C\uC900 \uBAA8\uB4DC, \uC5C6\uC73C\uBA74 \uC61B\uB0A0 \uD638\uD658 \uBAA8\uB4DC\uB85C CSS \uD06C\uAE30 \uACC4\uC0B0\uC744 \uD569\uB2C8\uB2E4.",
    technicalDetail: 'HTML Living Standard\uC758 tokenization \uB2E8\uACC4\uC5D0\uC11C DOCTYPE \uD1A0\uD070\uC774 emit\uB418\uBA74 Document\uC758 compatibility mode\uAC00 "no-quirks"\uB85C \uC124\uC815\uB429\uB2C8\uB2E4. \uB204\uB77D \uC2DC quirks mode\uB85C \uD3F4\uBC31\uB418\uC5B4 box model, line-height, table \uC140 \uB192\uC774 \uACC4\uC0B0 \uB4F1\uC5D0 CSS 2.1 \uC774\uC804 \uB808\uAC70\uC2DC \uB3D9\uC791\uC774 \uC801\uC6A9\uB429\uB2C8\uB2E4.'
  },
  html: {
    isBasic: true,
    howItWorks: "\uBE0C\uB77C\uC6B0\uC800\uAC00 \uB9CC\uB4DC\uB294 DOM \uD2B8\uB9AC\uC758 \uAC00\uC7A5 \uC704(\uB8E8\uD2B8) \uB178\uB4DC\uAC00 \uB429\uB2C8\uB2E4. lang \uAC12\uC740 \uBC88\uC5ED \uAE30\uB2A5\uACFC \uC2A4\uD06C\uB9B0\uB9AC\uB354 \uBC1C\uC74C \uD310\uB2E8\uC5D0 \uC4F0\uC785\uB2C8\uB2E4.",
    technicalDetail: "Document\uC758 documentElement(\uB8E8\uD2B8 \uB178\uB4DC)\uB97C \uC0DD\uC131\uD569\uB2C8\uB2E4. lang \uC18D\uC131\uC740 BCP 47 \uC5B8\uC5B4 \uD0DC\uADF8\uB85C \uD574\uC11D\uB418\uC5B4 \uC2A4\uD06C\uB9B0\uB9AC\uB354 TTS \uC5D4\uC9C4\uC758 \uC74C\uC131 \uD504\uB85C\uD30C\uC77C, CSS :lang() \uC140\uB809\uD130, hyphens: auto \uD558\uC774\uD508 \uCC98\uB9AC, \uBE0C\uB77C\uC6B0\uC800 \uC790\uB3D9 \uBC88\uC5ED \uD734\uB9AC\uC2A4\uD2F1\uC5D0 \uC0AC\uC6A9\uB429\uB2C8\uB2E4. \uB204\uB77D \uC2DC WCAG 3.1.1(Language of Page) \uC704\uBC18\uC785\uB2C8\uB2E4."
  },
  head: {
    isBasic: true,
    howItWorks: "\uC774 \uC548\uC758 \uB0B4\uC6A9\uC740 \uD654\uBA74\uC5D0 \uADF8\uB824\uC9C0\uC9C0 \uC54A\uACE0, \uBE0C\uB77C\uC6B0\uC800\uAC00 \uD398\uC774\uC9C0\uB97C \uADF8\uB9AC\uAE30 \uC804\uC5D0 \uBA3C\uC800 \uC77D\uB294 \uC124\uC815 \uC815\uBCF4\uB85C \uC4F0\uC785\uB2C8\uB2E4.",
    technicalDetail: 'Metadata content \uCEE8\uD14C\uC774\uB108\uB85C \uB80C\uB354 \uD2B8\uB9AC\uC5D0 \uD3EC\uD568\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4(display: none). \uB0B4\uBD80\uC758 \uB3D9\uAE30 <script>\uC640 <link rel="stylesheet">\uB294 render-blocking \uB9AC\uC18C\uC2A4\uB85C First Contentful Paint\uB97C \uC9C0\uC5F0\uC2DC\uD0A4\uBBC0\uB85C defer/async, preload \uC804\uB7B5\uC774 \uC911\uC694\uD569\uB2C8\uB2E4.'
  },
  meta: {
    isBasic: false,
    howItWorks: "\uBE0C\uB77C\uC6B0\uC800\uB294 \uBC1B\uC740 \uD30C\uC77C\uC758 \uBC14\uC774\uD2B8\uB97C \uAE00\uC790\uB85C \uBC14\uAFB8\uB294(\uB514\uCF54\uB529) \uADDC\uCE59\uC744 \uC774 \uC904\uC744 \uBCF4\uACE0 \uACB0\uC815\uD569\uB2C8\uB2E4. \uADF8\uB798\uC11C <head>\uC758 \uB9E8 \uC55E\uCABD\uC5D0 \uC788\uC5B4\uC57C \uD55C\uAE00\uC774 \uAE68\uC9C0\uC9C0 \uC54A\uACE0, \uB2A6\uAC8C \uB098\uC624\uBA74 \uD398\uC774\uC9C0\uB97C \uCC98\uC74C\uBD80\uD130 \uB2E4\uC2DC \uC77D\uC744 \uC218\uB3C4 \uC788\uC2B5\uB2C8\uB2E4.",
    technicalDetail: "Encoding sniffing \uC54C\uACE0\uB9AC\uC998\uC740 BOM \u2192 HTTP Content-Type \uD5E4\uB354 \u2192 <meta charset> prescan \uC21C\uC73C\uB85C \uBB38\uC790 \uC778\uCF54\uB529\uC744 \uACB0\uC815\uD569\uB2C8\uB2E4. prescan\uC740 \uCCAB 1024 bytes\uB9CC \uAC80\uC0AC\uD558\uBBC0\uB85C \uADF8 \uC774\uD6C4 \uC120\uC5B8\uC740 \uBB34\uC2DC\uB418\uAC70\uB098 reparse\uB97C \uC720\uBC1C\uD569\uB2C8\uB2E4. \uBAA8\uBC14\uC77C \uB300\uC751\uC744 \uC704\uD574 viewport \uBA54\uD0C0(width=device-width)\uB3C4 \uD568\uAED8 \uC120\uC5B8\uD574\uC57C \uD569\uB2C8\uB2E4."
  },
  title: {
    isBasic: false,
    howItWorks: "\uBE0C\uB77C\uC6B0\uC800\uB294 title \uC548\uC758 \uAE00\uC790\uB97C \uBCF8\uBB38\uC5D0 \uADF8\uB9AC\uC9C0 \uC54A\uACE0 \uD0ED \uC81C\uBAA9, \uC990\uACA8\uCC3E\uAE30 \uC774\uB984, \uBC29\uBB38 \uAE30\uB85D, \uAC80\uC0C9 \uACB0\uACFC \uC81C\uBAA9\uC73C\uB85C \uAC00\uC838\uB2E4 \uC501\uB2C8\uB2E4.",
    technicalDetail: "document.title\uB85C \uB178\uCD9C\uB418\uB294 \uBB38\uC11C \uBA54\uD0C0\uB370\uC774\uD130\uB85C \uD0ED/\uC708\uB3C4\uC6B0 UI, History \uC5D4\uD2B8\uB9AC, Open Graph \uBBF8\uC9C0\uC815 \uC2DC SNS \uD06C\uB864\uB7EC\uC758 fallback \uD0C0\uC774\uD2C0, SERP \uD0C0\uC774\uD2C0 \uB9C1\uD06C\uC5D0 \uC0AC\uC6A9\uB429\uB2C8\uB2E4. WCAG 2.4.2(Page Titled) \uC900\uC218 \uD56D\uBAA9\uC774\uBA70 SPA\uC5D0\uC11C\uB294 \uB77C\uC6B0\uD2B8 \uC804\uD658 \uC2DC \uB3D9\uC801 \uAC31\uC2E0\uC774 \uD544\uC694\uD569\uB2C8\uB2E4."
  },
  body: {
    isBasic: true,
    howItWorks: "\uC774 \uC548\uC758 \uC694\uC18C\uB4E4\uB9CC \uC2E4\uC81C \uD654\uBA74\uC5D0 \uADF8\uB824\uC9D1\uB2C8\uB2E4. \uBE0C\uB77C\uC6B0\uC800\uB294 \uAE30\uBCF8\uC73C\uB85C \uBC14\uAE65 \uC5EC\uBC31(margin 8px)\uC744 \uC90D\uB2C8\uB2E4.",
    technicalDetail: "\uB80C\uB354 \uD2B8\uB9AC\uC758 \uB8E8\uD2B8 \uCF58\uD150\uCE20 \uBC15\uC2A4\uB85C \uAE30\uBCF8 UA \uC2A4\uD0C0\uC77C\uC2DC\uD2B8\uC5D0\uC11C margin: 8px\uC774 \uC801\uC6A9\uB429\uB2C8\uB2E4. window \uB808\uBCA8 \uC774\uBCA4\uD2B8(onload \uB4F1)\uC758 \uD578\uB4E4\uB7EC attribute\uB97C \uBC18\uC601\uD558\uBA70, \uB300\uBD80\uBD84\uC758 \uC774\uBCA4\uD2B8 \uC704\uC784(event delegation)\uC774 \uC774 \uB178\uB4DC \uB610\uB294 document\uC5D0\uC11C \uCC98\uB9AC\uB429\uB2C8\uB2E4."
  },
  div: {
    isBasic: false,
    howItWorks: "div\uB294 \uC2A4\uC2A4\uB85C \uC758\uBBF8\uAC00 \uC5C6\uB294 \uBE14\uB85D \uC0C1\uC790\uC785\uB2C8\uB2E4. \uBE0C\uB77C\uC6B0\uC800\uAC00 \uAE30\uBCF8\uC73C\uB85C \uD55C \uC904 \uC804\uCCB4 \uD3ED\uC744 \uCC28\uC9C0\uD558\uAC8C \uADF8\uB9AC\uACE0, class \uC774\uB984\uC5D0 \uC5F0\uACB0\uB41C CSS \uADDC\uCE59\uC774 \uC801\uC6A9\uB418\uC5B4 \uBAA8\uC591\uACFC \uBC30\uCE58\uAC00 \uC815\uD574\uC9D1\uB2C8\uB2E4. \uC548\uCABD \uC694\uC18C\uB4E4\uC740 \uC774 \uC0C1\uC790\uB97C \uAE30\uC900\uC73C\uB85C \uBC30\uCE58\uB429\uB2C8\uB2E4.",
    technicalDetail: "Flow content\uB97C \uADF8\uB8E8\uD551\uD558\uB294 non-semantic \uC694\uC18C\uB85C \uC811\uADFC\uC131 \uD2B8\uB9AC\uC5D0\uC11C generic role\uB85C \uB9E4\uD551\uB429\uB2C8\uB2E4. display: block\uC73C\uB85C Block Formatting Context\uC5D0 \uCC38\uC5EC\uD558\uBA70, class \uC140\uB809\uD130\uB294 Style Recalc \uB2E8\uACC4\uC5D0\uC11C \uD574\uC2DC \uAE30\uBC18\uC73C\uB85C \uB9E4\uCE6D\uB429\uB2C8\uB2E4. \uC758\uBBF8 \uC788\uB294 \uC601\uC5ED\uC774\uB77C\uBA74 <main>, <section>, <form> \uAC19\uC740 \uC2DC\uB9E8\uD2F1 \uC694\uC18C\uB85C \uB79C\uB4DC\uB9C8\uD06C\uB97C \uC81C\uACF5\uD558\uB294 \uAC83\uC774 \uBC14\uB78C\uC9C1\uD569\uB2C8\uB2E4."
  },
  h1: {
    isBasic: false,
    howItWorks: "\uBE0C\uB77C\uC6B0\uC800\uB294 h1\uC5D0 \uD070 \uAE00\uC528\uC640 \uAD75\uC740 \uAE00\uAF34\uC744 \uAE30\uBCF8 \uC2A4\uD0C0\uC77C\uB85C \uC801\uC6A9\uD558\uACE0, \uB3D9\uC2DC\uC5D0 \uBB38\uC11C \uAD6C\uC870\uC5D0\uC11C \uAC00\uC7A5 \uB192\uC740 \uB2E8\uACC4\uC758 \uC81C\uBAA9\uC73C\uB85C \uB4F1\uB85D\uD569\uB2C8\uB2E4. \uC2A4\uD06C\uB9B0\uB9AC\uB354\uC640 \uAC80\uC0C9\uC5D4\uC9C4\uC740 \uC774 \uC81C\uBAA9 \uAD6C\uC870\uB97C \uB530\uB77C \uD398\uC774\uC9C0 \uC8FC\uC81C\uB97C \uD30C\uC545\uD569\uB2C8\uB2E4.",
    technicalDetail: 'Heading content\uB85C \uC811\uADFC\uC131 \uD2B8\uB9AC\uC5D0 role="heading", aria-level=1\uB85C \uB178\uCD9C\uB418\uC5B4 \uC2A4\uD06C\uB9B0\uB9AC\uB354\uC758 heading navigation(H \uD0A4) \uB300\uC0C1\uC774 \uB429\uB2C8\uB2E4. SEO \uD06C\uB864\uB7EC\uC758 \uD1A0\uD53D \uCD94\uCD9C \uC2E0\uD638\uC774\uBA70, \uD398\uC774\uC9C0\uB2F9 \uB2E8\uC77C h1\uACFC \uB808\uBCA8\uC744 \uAC74\uB108\uB6F0\uC9C0 \uC54A\uB294 heading \uACC4\uCE35 \uAD6C\uC870\uAC00 \uAD8C\uC7A5\uB429\uB2C8\uB2E4(WCAG 1.3.1 Info and Relationships).'
  },
  p: {
    isBasic: false,
    howItWorks: "\uBE0C\uB77C\uC6B0\uC800\uB294 p\uB97C \uBE14\uB85D \uC0C1\uC790\uB85C \uADF8\uB9AC\uACE0 \uC704\uC544\uB798\uC5D0 \uAE30\uBCF8 \uC5EC\uBC31(\uC57D 1em)\uC744 \uC90D\uB2C8\uB2E4. \uC548\uC758 \uAE00\uC790\uB294 \uC0C1\uC790 \uD3ED\uC5D0 \uB9DE\uCDB0 \uC790\uB3D9\uC73C\uB85C \uC904\uBC14\uAFC8\uB429\uB2C8\uB2E4.",
    technicalDetail: "Phrasing content\uB9CC \uD5C8\uC6A9\uD558\uB294 paragraph \uC694\uC18C\uC785\uB2C8\uB2E4. \uB0B4\uBD80\uC5D0 flow content(div \uB4F1)\uAC00 \uC624\uBA74 tree construction \uB2E8\uACC4\uC5D0\uC11C \uD30C\uC11C\uAC00 \uC554\uBB35\uC801\uC73C\uB85C </p>\uB97C \uC0BD\uC785\uD574 DOM\uC774 \uC758\uB3C4\uC640 \uB2E4\uB974\uAC8C \uBD84\uB9AC\uB429\uB2C8\uB2E4. \uB80C\uB354\uB9C1 \uC2DC Inline Formatting Context\uAC00 \uC0DD\uC131\uB418\uC5B4 line box \uB2E8\uC704\uB85C \uB808\uC774\uC544\uC6C3\uB429\uB2C8\uB2E4."
  },
  input: {
    isBasic: false,
    howItWorks: "type \uAC12\uC5D0 \uB530\uB77C \uBE0C\uB77C\uC6B0\uC800\uAC00 \uC11C\uB85C \uB2E4\uB978 \uC785\uB825 UI\uB97C \uADF8\uB824\uC90D\uB2C8\uB2E4. \uC0AC\uC6A9\uC790\uAC00 \uC785\uB825\uD55C \uAC12\uC740 \uC694\uC18C\uC758 value\uC5D0 \uC800\uC7A5\uB418\uC5B4 \uC788\uB2E4\uAC00, form\uC774 \uC81C\uCD9C\uB420 \uB54C name \uC18D\uC131\uACFC \uC9DD\uC9C0\uC5B4 \uC11C\uBC84\uB85C \uC804\uC1A1\uB429\uB2C8\uB2E4. required\uAC00 \uC788\uC73C\uBA74 \uC81C\uCD9C \uC9C1\uC804\uC5D0 \uBE0C\uB77C\uC6B0\uC800\uAC00 \uBE48\uCE78\uC778\uC9C0 \uAC80\uC0AC\uD574 \uC804\uC1A1\uC744 \uB9C9\uC2B5\uB2C8\uB2E4.",
    technicalDetail: "Void element\uB85C end tag\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. required\uB294 Constraint Validation API(validity.valueMissing)\uB85C \uCC98\uB9AC\uB418\uC5B4 submit \uC2DC invalid \uC774\uBCA4\uD2B8\uB97C \uBC1C\uC0DD\uC2DC\uD0B5\uB2C8\uB2E4. name \uC18D\uC131\uC774 \uC5C6\uC73C\uBA74 form data set \uAD6C\uC131\uC5D0\uC11C \uC81C\uC678\uB418\uBA70, <label for> \uB610\uB294 aria-label \uC5F0\uACB0\uC774 \uC5C6\uC73C\uBA74 accessible name\uC774 \uBE44\uC5B4 WCAG 4.1.2(Name, Role, Value) \uC704\uBC18\uC785\uB2C8\uB2E4. placeholder\uB294 label\uC758 \uB300\uCCB4\uC7AC\uAC00 \uC544\uB2D9\uB2C8\uB2E4."
  },
  button: {
    isBasic: false,
    howItWorks: 'form \uC548\uC758 \uBC84\uD2BC\uC740 type\uC744 \uB530\uB85C \uC801\uC9C0 \uC54A\uC73C\uBA74 \uAE30\uBCF8\uC774 "\uC81C\uCD9C(submit)"\uC785\uB2C8\uB2E4. \uD074\uB9AD\uD558\uAC70\uB098 \uC785\uB825\uCE78\uC5D0\uC11C Enter\uB97C \uB204\uB974\uBA74 \uBE0C\uB77C\uC6B0\uC800\uAC00 form\uC758 \uC785\uB825\uAC12\uC744 \uBAA8\uC544 \uAC80\uC0AC\uD55C \uB4A4 action \uC8FC\uC18C\uB85C \uC804\uC1A1\uD558\uB294 submit \uC774\uBCA4\uD2B8\uB97C \uBC1C\uC0DD\uC2DC\uD0B5\uB2C8\uB2E4.',
    technicalDetail: 'type \uAE30\uBCF8\uAC12\uC740 "submit"\uC73C\uB85C form owner\uC758 implicit submission\uC744 \uD2B8\uB9AC\uAC70\uD569\uB2C8\uB2E4. submit \uC774\uBCA4\uD2B8\uB294 \uBC84\uBE14\uB9C1\uB418\uBA70 preventDefault() \uD6C4 fetch\uB85C \uCC98\uB9AC\uD558\uB294 SPA \uD328\uD134\uC774 \uC77C\uBC18\uC801\uC785\uB2C8\uB2E4. \uB124\uC774\uD2F0\uBE0C button\uC740 \uD0A4\uBCF4\uB4DC \uD3EC\uCEE4\uC2A4, Enter/Space \uD65C\uC131\uD654, role=button\uC744 \uAE30\uBCF8 \uC81C\uACF5\uD558\uBBC0\uB85C div+onClick \uB300\uCCB4\uB294 \uC811\uADFC\uC131 \uD68C\uADC0\uB97C \uC720\uBC1C\uD569\uB2C8\uB2E4.'
  }
};
function getLevelDepth(line) {
  const trimmed = line.trim();
  if (!trimmed) {
    return {
      isBasic: true,
      howItWorks: "\uBE48 \uC904\uC740 \uC2E4\uD589\uC5D0 \uC544\uBB34 \uC601\uD5A5\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
      technicalDetail: "Whitespace \uD1A0\uD070\uC73C\uB85C HTML\uC5D0\uC11C\uB294 inter-element whitespace, JS\uC5D0\uC11C\uB294 lexer \uB2E8\uACC4\uC5D0\uC11C \uBB34\uC2DC\uB429\uB2C8\uB2E4."
    };
  }
  if (/^(\/\*|\*|\/\/)/.test(trimmed) || /^#\s/.test(trimmed)) {
    return {
      isBasic: true,
      howItWorks: "\uC8FC\uC11D\uC740 \uC2E4\uD589\uB418\uC9C0 \uC54A\uC73C\uBBC0\uB85C \uB3D9\uC791\uC5D0 \uC544\uBB34 \uC601\uD5A5\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
      technicalDetail: "Comment \uD1A0\uD070\uC740 tokenizer \uB2E8\uACC4\uC5D0\uC11C \uBC84\uB824\uC838 AST/CSSOM\uC5D0 \uD3EC\uD568\uB418\uC9C0 \uC54A\uC73C\uBA70, \uD504\uB85C\uB355\uC158 \uBE4C\uB4DC\uC758 minifier(Terser, cssnano \uB4F1)\uAC00 \uC81C\uAC70\uD569\uB2C8\uB2E4. \uB2E8 /*! */ \uD615\uD0DC\uC758 \uB77C\uC774\uC120\uC2A4 \uC8FC\uC11D\uC740 \uBCF4\uC874\uB429\uB2C8\uB2E4."
    };
  }
  if (trimmed.startsWith("<!--")) {
    return {
      isBasic: true,
      howItWorks: "\uBE0C\uB77C\uC6B0\uC800\uB294 \uC8FC\uC11D\uC744 \uD654\uBA74\uC5D0 \uADF8\uB9AC\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
      technicalDetail: "Comment \uB178\uB4DC\uB85C DOM\uC5D0\uB294 \uB0A8\uC9C0\uB9CC \uB80C\uB354 \uD2B8\uB9AC\uC5D0\uB294 \uD3EC\uD568\uB418\uC9C0 \uC54A\uC73C\uBA70, \uD504\uB85C\uB355\uC158 \uBE4C\uB4DC\uC758 HTML minifier\uAC00 \uC81C\uAC70 \uB300\uC0C1\uC73C\uB85C \uCC98\uB9AC\uD569\uB2C8\uB2E4."
    };
  }
  if (/^<\/[a-zA-Z0-9-]+>$/.test(trimmed)) {
    const tag = trimmed.replace(/<\/|>/g, "").toLowerCase();
    return {
      isBasic: true,
      howItWorks: `\uC704\uC5D0\uC11C \uC5F0 <${tag}> \uAD6C\uC5ED\uC774 \uC5EC\uAE30\uC11C \uB05D\uB0A9\uB2C8\uB2E4.`,
      technicalDetail: `End tag \uD1A0\uD070\uC73C\uB85C \uD30C\uC11C\uC758 stack of open elements\uC5D0\uC11C <${tag}>\uB97C pop\uD569\uB2C8\uB2E4. \uC9DD\uC774 \uB9DE\uC9C0 \uC54A\uC73C\uBA74 adoption agency algorithm \uB4F1 \uC5D0\uB7EC \uBCF5\uAD6C \uADDC\uCE59\uC774 \uB3D9\uC791\uD574 DOM\uC774 \uC758\uB3C4\uC640 \uB2E4\uB974\uAC8C \uC7AC\uAD6C\uC131\uB420 \uC218 \uC788\uC2B5\uB2C8\uB2E4.`
    };
  }
  if (trimmed.startsWith("<") && trimmed.includes(">")) {
    const tag = (trimmed.match(/^<([!a-zA-Z0-9-]+)/)?.[1] || "").toLowerCase();
    const known = HTML_LEVEL_DEPTH[tag];
    if (known) return known;
    return {
      isBasic: false,
      howItWorks: `\uBE0C\uB77C\uC6B0\uC800\uAC00 \uC774 \uC904\uC744 \uC77D\uC73C\uBA74 <${tag}> \uC694\uC18C\uB97C \uD398\uC774\uC9C0 \uAD6C\uC870(DOM \uD2B8\uB9AC)\uC5D0 \uCD94\uAC00\uD558\uACE0, \uAE30\uBCF8 \uC2A4\uD0C0\uC77C\uACFC CSS \uADDC\uCE59\uC744 \uC801\uC6A9\uD574 \uD654\uBA74\uC5D0 \uADF8\uB9BD\uB2C8\uB2E4.`,
      technicalDetail: `HTML tokenizer\uAC00 start tag \uD1A0\uD070\uC744 \uC0DD\uC131\uD558\uACE0 tree construction \uB2E8\uACC4\uC5D0\uC11C <${tag}> \uC694\uC18C \uB178\uB4DC\uAC00 \uC0BD\uC785\uB429\uB2C8\uB2E4. \uC774\uD6C4 CSSOM\uACFC \uACB0\uD569\uB41C Render Tree\uB97C \uAE30\uBC18\uC73C\uB85C Layout \u2192 Paint \u2192 Composite \uD30C\uC774\uD504\uB77C\uC778\uC744 \uAC70\uCE69\uB2C8\uB2E4.`
    };
  }
  if (/^[\]})(;,\s]+$/.test(trimmed)) {
    return {
      isBasic: true,
      howItWorks: "\uC704\uC5D0\uC11C \uC2DC\uC791\uD55C \uBE14\uB85D(\uBB36\uC74C)\uC744 \uB2EB\uB294 \uAE30\uD638\uC785\uB2C8\uB2E4.",
      technicalDetail: "Block/Expression \uC885\uB8CC \uD1A0\uD070\uC73C\uB85C \uB809\uC2DC\uCEEC \uC2A4\uCF54\uD504\uAC00 \uB2EB\uD788\uBA70, \uBE14\uB85D \uB0B4\uBD80\uC758 let/const \uBC14\uC778\uB529\uC740 \uC774 \uC2DC\uC810 \uC774\uD6C4 \uCC38\uC870\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
    };
  }
  if (/^(import|export)\s/.test(trimmed)) {
    return {
      isBasic: true,
      howItWorks: "\uB2E4\uB978 \uD30C\uC77C\uC758 \uCF54\uB4DC\uB97C \uAC00\uC838\uC624\uAC70\uB098 \uB0B4\uBCF4\uB0B4\uB294 \uC5F0\uACB0 \uC904\uC785\uB2C8\uB2E4.",
      technicalDetail: "ES Module\uC758 \uC815\uC801 import/export \uC120\uC5B8\uC73C\uB85C \uD30C\uC2F1 \uB2E8\uACC4\uC5D0\uC11C Module Record\uC758 \uC758\uC874\uC131 \uADF8\uB798\uD504\uAC00 \uAD6C\uC131\uB418\uBA70, \uBC88\uB4E4\uB7EC\uB294 \uC774\uB97C \uAE30\uBC18\uC73C\uB85C tree-shaking\uC744 \uC218\uD589\uD569\uB2C8\uB2E4."
    };
  }
  const decl = trimmed.match(/^(const|let|var)\s+/);
  if (decl) {
    const keyword = decl[1];
    return {
      isBasic: false,
      howItWorks: "\uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8 \uC5D4\uC9C4\uC740 \uCF54\uB4DC\uB97C \uC2E4\uD589\uD558\uAE30 \uC804\uC5D0 \uBCC0\uC218 \uC774\uB984\uC744 \uBA3C\uC800 \uB4F1\uB85D\uD574 \uB461\uB2C8\uB2E4. \uC2E4\uD589 \uC21C\uC11C\uAC00 \uC774 \uC904\uC5D0 \uC624\uBA74 \uB4F1\uD638(=) \uC624\uB978\uCABD\uC744 \uACC4\uC0B0\uD558\uACE0, \uADF8 \uACB0\uACFC\uB97C \uBCC0\uC218 \uC774\uB984\uC5D0 \uC5F0\uACB0\uD569\uB2C8\uB2E4. \uBC30\uC5F4\uC774\uB098 \uAC1D\uCCB4\uB77C\uBA74 \uBCC0\uC218\uC5D0\uB294 \uAC12 \uC790\uCCB4\uAC00 \uC544\uB2C8\uB77C \uADF8 \uB370\uC774\uD130\uAC00 \uC788\uB294 \uC704\uCE58\uAC00 \uC5F0\uACB0\uB429\uB2C8\uB2E4." + (keyword === "const" ? " const\uB294 \uC774\uD6C4 \uB2E4\uB978 \uAC12\uC73C\uB85C \uB2E4\uC2DC \uC5F0\uACB0\uD558\uB824 \uD558\uBA74 \uC624\uB958\uAC00 \uB0A9\uB2C8\uB2E4." : ""),
      technicalDetail: keyword === "var" ? "var\uB294 Variable Environment\uC5D0 \uD568\uC218 \uC2A4\uCF54\uD504\uB85C \uD638\uC774\uC2A4\uD305\uB418\uC5B4 undefined\uB85C \uCD08\uAE30\uD654\uB418\uBBC0\uB85C \uC120\uC5B8 \uC804 \uCC38\uC870\uAC00 \uC870\uC6A9\uD788 \uD1B5\uACFC\uD569\uB2C8\uB2E4. \uBE14\uB85D \uC2A4\uCF54\uD504\uAC00 \uC5C6\uC5B4 \uD074\uB85C\uC800 \uB8E8\uD504 \uBC84\uADF8\uC640 \uC804\uC5ED \uAC1D\uCCB4(window) \uD504\uB85C\uD37C\uD2F0 \uC624\uC5FC\uC744 \uC720\uBC1C\uD560 \uC218 \uC788\uC5B4 ES2015+ \uCF54\uB4DC\uBCA0\uC774\uC2A4\uC5D0\uC11C\uB294 no-var \uB9B0\uD2B8 \uADDC\uCE59\uC73C\uB85C \uAE08\uC9C0\uD558\uB294 \uAC83\uC774 \uC77C\uBC18\uC801\uC785\uB2C8\uB2E4." : `${keyword} \uD0A4\uC6CC\uB4DC\uB294 Lexical Environment\uC5D0 \uBE14\uB85D \uC2A4\uCF54\uD504 \uBC14\uC778\uB529\uC744 \uC0DD\uC131\uD558\uBA70, \uCD08\uAE30\uD654 \uC804 \uAD6C\uAC04\uC740 TDZ(Temporal Dead Zone)\uB85C \uC811\uADFC \uC2DC ReferenceError\uAC00 \uBC1C\uC0DD\uD569\uB2C8\uB2E4. \uAC1D\uCCB4/\uBC30\uC5F4 \uB9AC\uD130\uB7F4\uC740 \uD799\uC5D0 \uD560\uB2F9\uB418\uACE0 \uBCC0\uC218\uB294 \uCC38\uC870\uB9CC \uBCF4\uC720\uD558\uBBC0\uB85C const\uC5EC\uB3C4 \uB0B4\uBD80 mutation\uC740 \uAC00\uB2A5\uD569\uB2C8\uB2E4(\uBD88\uBCC0\uC131\uC774 \uD544\uC694\uD558\uBA74 Object.freeze \uB610\uB294 readonly \uD0C0\uC785).`
    };
  }
  if (trimmed.includes(".map(")) {
    return {
      isBasic: false,
      howItWorks: "map\uC740 \uBC30\uC5F4\uC758 \uAE38\uC774\uB9CC\uD07C \uAD04\uD638 \uC548\uC758 \uD568\uC218\uB97C \uC21C\uC11C\uB300\uB85C \uD638\uCD9C\uD569\uB2C8\uB2E4. \uAC01 \uD638\uCD9C\uC774 \uB3CC\uB824\uC900 \uAC12\uC744 \uAC19\uC740 \uC21C\uC11C\uB85C \uBAA8\uC544 \uC0C8 \uBC30\uC5F4\uC744 \uB9CC\uB4E4\uACE0, \uC6D0\uB798 \uBC30\uC5F4\uC740 \uADF8\uB300\uB85C \uB461\uB2C8\uB2E4.",
      technicalDetail: "Array.prototype.map\uC740 O(n) \uC2DC\uAC04 \uBCF5\uC7A1\uB3C4\uB85C \uB3D9\uC77C length\uC758 \uC0C8 \uBC30\uC5F4\uC744 \uD560\uB2F9\uD558\uB294 non-mutating \uACE0\uCC28 \uD568\uC218\uC785\uB2C8\uB2E4. sparse array\uC758 hole\uC5D0\uC11C\uB294 \uCF5C\uBC31\uC774 \uD638\uCD9C\uB418\uC9C0 \uC54A\uC73C\uBA70, V8\uC740 elements kind(PACKED_SMI_ELEMENTS \uB4F1)\uAC00 \uC720\uC9C0\uB420 \uB54C \uC778\uB77C\uC778 \uCE90\uC2DC\uC640 TurboFan \uCD5C\uC801\uD654\uB97C \uC801\uC6A9\uD569\uB2C8\uB2E4. \uCCB4\uC774\uB2DD \uC2DC \uC911\uAC04 \uBC30\uC5F4 \uD560\uB2F9 \uBE44\uC6A9\uC5D0 \uC720\uC758\uD574\uC57C \uD569\uB2C8\uB2E4."
    };
  }
  if (/console\.(log|error|warn|info)/.test(trimmed)) {
    return {
      isBasic: true,
      howItWorks: "\uAC12\uC744 \uAC1C\uBC1C\uC790 \uB3C4\uAD6C \uCF58\uC194\uC5D0 \uCD9C\uB825\uD569\uB2C8\uB2E4.",
      technicalDetail: "console\uC740 WHATWG Console Standard\uC758 namespace \uAC1D\uCCB4\uB85C \uBE0C\uB77C\uC6B0\uC800\uC5D0\uC11C\uB294 DevTools, Node.js\uC5D0\uC11C\uB294 process.stdout/stderr\uB85C \uCD9C\uB825\uB429\uB2C8\uB2E4. \uAC1D\uCCB4\uB294 live reference\uB85C \uD45C\uC2DC\uB418\uC5B4 lazy evaluation \uC774\uC288\uAC00 \uC788\uC73C\uBA70, \uD504\uB85C\uB355\uC158 \uBC88\uB4E4\uC5D0\uC11C\uB294 Terser drop_console \uB4F1\uC73C\uB85C \uC81C\uAC70\uD558\uB294 \uAC83\uC774 \uC77C\uBC18\uC801\uC785\uB2C8\uB2E4."
    };
  }
  if (/^(async\s+)?function\s|=>\s*\{?$/.test(trimmed)) {
    return {
      isBasic: false,
      howItWorks: "\uD568\uC218\uB294 \uC120\uC5B8\uB9CC\uC73C\uB85C\uB294 \uC2E4\uD589\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC774\uB984\uC73C\uB85C \uD638\uCD9C\uB418\uB294 \uC21C\uAC04 \uAD04\uD638 \uC548 \uAC12(\uB9E4\uAC1C\uBCC0\uC218)\uC744 \uBC1B\uC544 \uBE14\uB85D \uC548\uC758 \uCF54\uB4DC\uB97C \uC704\uC5D0\uC11C \uC544\uB798\uB85C \uC2E4\uD589\uD558\uACE0, return \uAC12\uC744 \uD638\uCD9C\uD55C \uACF3\uC73C\uB85C \uB3CC\uB824\uC90D\uB2C8\uB2E4.",
      technicalDetail: "\uD568\uC218 \uAC1D\uCCB4 \uC0DD\uC131 \uC2DC [[Environment]] \uB0B4\uBD80 \uC2AC\uB86F\uC5D0 \uC678\uBD80 Lexical Environment\uAC00 \uCEA1\uCC98\uB418\uC5B4 \uD074\uB85C\uC800\uAC00 \uD615\uC131\uB429\uB2C8\uB2E4. \uD638\uCD9C \uC2DC \uC0C8\uB85C\uC6B4 Execution Context\uAC00 \uCF5C \uC2A4\uD0DD\uC5D0 push\uB418\uBA70, \uD654\uC0B4\uD45C \uD568\uC218\uB294 \uC790\uCCB4 this/arguments \uBC14\uC778\uB529\uC774 \uC5C6\uC5B4 lexical this\uB97C \uC0AC\uC6A9\uD569\uB2C8\uB2E4."
    };
  }
  return {
    isBasic: false,
    howItWorks: "\uC2E4\uD589 \uC21C\uC11C\uAC00 \uC774 \uC904\uC5D0 \uC624\uBA74 \uC5D4\uC9C4\uC774 \uC2DD\uC744 \uACC4\uC0B0\uD558\uACE0, \uADF8 \uACB0\uACFC\uB85C \uBCC0\uC218 \uAC12\uC774 \uBC14\uB00C\uAC70\uB098 \uB2E4\uC74C \uB3D9\uC791\uC774 \uC774\uC5B4\uC9D1\uB2C8\uB2E4.",
    technicalDetail: "\uD30C\uC11C\uAC00 \uC774 \uAD6C\uBB38\uC744 AST\uC758 Statement \uB178\uB4DC\uB85C \uBCC0\uD658\uD55C \uB4A4 \uC778\uD130\uD504\uB9AC\uD130(V8 Ignition \uB4F1)\uAC00 \uBC14\uC774\uD2B8\uCF54\uB4DC\uB85C \uC2E4\uD589\uD569\uB2C8\uB2E4. \uBC18\uBCF5 \uC2E4\uD589\uB418\uB294 hot path\uB77C\uBA74 JIT \uCEF4\uD30C\uC77C\uB7EC\uC758 \uCD5C\uC801\uD654 \uB300\uC0C1\uC774 \uB429\uB2C8\uB2E4."
  };
}
function q(text) {
  return /[\s.,!?]/.test(text) ? `'${text}'` : text;
}
function parseAttributes(tagSource) {
  const attrs = {};
  const body = tagSource.replace(/^<[!a-zA-Z0-9-]+/, "").replace(/\/?>[\s\S]*$/, "");
  const re = /([a-zA-Z_:@][a-zA-Z0-9_:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const value = m[2] ?? m[3] ?? m[4];
    attrs[m[1].toLowerCase()] = value === void 0 ? true : value;
  }
  return attrs;
}
var PURPOSE_KEYWORDS = [
  [/로그인|login|sign-?in/i, "\uB85C\uADF8\uC778"],
  [/회원\s*가입|가입|sign-?up|register|join/i, "\uD68C\uC6D0\uAC00\uC785"],
  [/비밀번호|password|\bpw\b/i, "\uBE44\uBC00\uBC88\uD638"],
  [/이메일|e-?mail/i, "\uC774\uBA54\uC77C \uC8FC\uC18C"],
  [/아이디|\bid\b|user(name)?/i, "\uC544\uC774\uB514"],
  [/검색|search/i, "\uAC80\uC0C9"],
  [/장바구니|cart/i, "\uC7A5\uBC14\uAD6C\uB2C8"],
  [/결제|주문|checkout|pay|order/i, "\uACB0\uC81C"],
  [/전화|휴대폰|phone|tel/i, "\uC804\uD654\uBC88\uD638"],
  [/이름|name/i, "\uC774\uB984"],
  [/메뉴|nav/i, "\uBA54\uB274"],
  [/문의|contact/i, "\uBB38\uC758"]
];
function guessPurpose(...texts) {
  const joined = texts.filter(Boolean).join(" ");
  for (const [re, label] of PURPOSE_KEYWORDS) {
    if (re.test(joined)) return label;
  }
  return null;
}
var HEADING_SIZE = {
  h1: "\uC81C\uC77C \uD070 \uAE00\uC528\uB85C",
  h2: "\uB450 \uBC88\uC9F8\uB85C \uD070 \uAE00\uC528\uB85C",
  h3: "\uC138 \uBC88\uC9F8\uB85C \uD070 \uAE00\uC528\uB85C",
  h4: "\uC911\uAC04 \uD06C\uAE30\uC758 \uC81C\uBAA9 \uAE00\uC528\uB85C",
  h5: "\uC791\uC740 \uC81C\uBAA9 \uAE00\uC528\uB85C",
  h6: "\uAC00\uC7A5 \uC791\uC740 \uC81C\uBAA9 \uAE00\uC528\uB85C"
};
var HEADING_ORDER = {
  h1: "\uAC00\uC7A5 \uD070 \uCCAB\uBC88\uC9F8 \uC81C\uBAA9",
  h2: "\uB450 \uBC88\uC9F8 \uB2E8\uACC4\uC758 \uC18C\uC81C\uBAA9",
  h3: "\uC138 \uBC88\uC9F8 \uB2E8\uACC4\uC758 \uC791\uC740 \uC81C\uBAA9",
  h4: "\uB124 \uBC88\uC9F8 \uB2E8\uACC4\uC758 \uC791\uC740 \uC81C\uBAA9",
  h5: "\uB2E4\uC12F \uBC88\uC9F8 \uB2E8\uACC4\uC758 \uC791\uC740 \uC81C\uBAA9",
  h6: "\uC5EC\uC12F \uBC88\uC9F8 \uB2E8\uACC4\uC758 \uAC00\uC7A5 \uC791\uC740 \uC81C\uBAA9"
};
var INPUT_KIND = {
  text: "\uAE00\uC790\uB97C \uC9C1\uC811 \uC785\uB825\uD560 \uC218 \uC788\uB294 \uD55C \uC904 \uC785\uB825\uCE78",
  password: "\uC785\uB825\uD55C \uAE00\uC790\uAC00 \u25CF\u25CF\u25CF \uCC98\uB7FC \uAC00\uB824\uC838 \uBCF4\uC774\uB294 \uBE44\uBC00\uBC88\uD638 \uC785\uB825\uCE78",
  email: "\uC774\uBA54\uC77C \uC8FC\uC18C(@\uAC00 \uB4E4\uC5B4\uAC04 \uD615\uC2DD)\uB9CC \uBC1B\uB294 \uC785\uB825\uCE78",
  number: "\uC22B\uC790\uB9CC \uC785\uB825\uD560 \uC218 \uC788\uB294 \uC785\uB825\uCE78",
  tel: "\uC804\uD654\uBC88\uD638\uB97C \uC785\uB825\uD558\uB294 \uCE78",
  search: "\uAC80\uC0C9\uC5B4\uB97C \uC785\uB825\uD558\uB294 \uCE78",
  url: "\uC778\uD130\uB137 \uC8FC\uC18C(https://...)\uB97C \uC785\uB825\uD558\uB294 \uCE78",
  date: "\uB2EC\uB825\uC5D0\uC11C \uB0A0\uC9DC\uB97C \uACE0\uB97C \uC218 \uC788\uB294 \uCE78",
  checkbox: "\uCCB4\uD06C(\u2714) \uD45C\uC2DC\uB97C \uD560 \uC218 \uC788\uB294 \uB124\uBAA8 \uCE78",
  radio: "\uC5EC\uB7EC \uAC1C \uC911 \uD558\uB098\uB9CC \uACE0\uB97C \uC218 \uC788\uB294 \uB3D9\uADF8\uB77C\uBBF8 \uC120\uD0DD\uCE78",
  file: "\uB0B4 \uCEF4\uD4E8\uD130\uC758 \uD30C\uC77C\uC744 \uACE8\uB77C \uC62C\uB9B4 \uC218 \uC788\uB294 \uBC84\uD2BC",
  submit: "\uB204\uB974\uBA74 \uB0B4\uC6A9\uC744 \uC81C\uCD9C\uD558\uB294 \uBC84\uD2BC",
  hidden: "\uD654\uBA74\uC5D0\uB294 \uBCF4\uC774\uC9C0 \uC54A\uACE0 \uBAB0\uB798 \uAC12\uC744 \uD568\uAED8 \uBCF4\uB0B4\uB294 \uC228\uC740 \uCE78"
};
function describeHtmlForBeginner(trimmed, tagName) {
  const attrs = parseAttributes(trimmed);
  const textMatch = trimmed.match(/^<[^>]+>([^<]+)</);
  const text = textMatch ? textMatch[1].trim() : "";
  const cls = typeof attrs.class === "string" ? attrs.class : "";
  const id = typeof attrs.id === "string" ? attrs.id : "";
  const nameTag = cls || id;
  if (HEADING_SIZE[tagName]) {
    const size = HEADING_SIZE[tagName];
    const order = HEADING_ORDER[tagName];
    const easy = text ? `${size} ${josa(q(text), "\uC744/\uB97C")} \uCD9C\uB825\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.` : `${size} \uC81C\uBAA9\uC744 \uCD9C\uB825\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.`;
    const why = text ? `\uC774 \uD654\uBA74\uC5D0\uC11C ${order} \uAE00\uC790\uB97C \uD45C\uC2DC\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4. \uC0AC\uC6A9\uC790\uAC00 \uC774 \uAD6C\uC5ED\uC5D0 \uB4E4\uC5B4\uC654\uC744 \uB54C ${josa(q(text), "\uC744/\uB97C")} \uAC00\uC7A5 \uBA3C\uC800 \uB208\uC5D0 \uB744\uAC8C \uBCF4\uC5EC\uC8FC\uB824\uACE0 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.` : `\uC774 \uD654\uBA74\uC5D0\uC11C ${order} \uAE00\uC790\uB97C \uD45C\uC2DC\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.`;
    return { easy, why };
  }
  if (tagName === "button") {
    const type = typeof attrs.type === "string" ? attrs.type.toLowerCase() : "";
    const label = text || "(\uC774\uB984 \uC5C6\uC74C)";
    let kind = "";
    if (type === "submit") kind = "\uBC84\uD2BC\uC758 \uD0C0\uC785\uC744 \uC81C\uCD9C\uD560 \uC218 \uC788\uB294 \uBC84\uD2BC \uD615\uC2DD\uC73C\uB85C \uB9CC\uB4E0 \uD6C4";
    else if (type === "reset") kind = "\uBC84\uD2BC\uC758 \uD0C0\uC785\uC744 \uC785\uB825\uD55C \uB0B4\uC6A9\uC744 \uBAA8\uB450 \uC9C0\uC6B0\uB294 \uCD08\uAE30\uD654 \uBC84\uD2BC \uD615\uC2DD\uC73C\uB85C \uB9CC\uB4E0 \uD6C4";
    else if (type === "button") kind = "\uBC84\uD2BC\uC758 \uD0C0\uC785\uC744 \uB204\uB974\uBA74 \uC815\uD574\uC9C4 \uB3D9\uC791\uB9CC \uD558\uB294 \uC77C\uBC18 \uBC84\uD2BC \uD615\uC2DD\uC73C\uB85C \uB9CC\uB4E0 \uD6C4";
    else kind = "\uBC84\uD2BC\uC758 \uD0C0\uC785\uC744 \uB530\uB85C \uC801\uC9C0 \uC54A\uC544 \uAE30\uBCF8\uAC12\uC778 \uC81C\uCD9C \uBC84\uD2BC \uD615\uC2DD\uC73C\uB85C \uB9CC\uB4E0 \uD6C4";
    const easy = `${kind} \uADF8 \uBC84\uD2BC\uC758 \uC774\uB984\uC744 ${josa(q(label), "\uC73C\uB85C/\uB85C")} \uD45C\uC2DC\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`;
    const purpose = guessPurpose(text, cls, id);
    const why = type === "reset" ? "\uC0AC\uC6A9\uC790\uAC00 \uC798\uBABB \uC785\uB825\uD55C \uB0B4\uC6A9\uC744 \uD55C \uBC88\uC5D0 \uC9C0\uC6B0\uACE0 \uCC98\uC74C\uBD80\uD130 \uB2E4\uC2DC \uC4F8 \uC218 \uC788\uB3C4\uB85D \uBC30\uCE58\uD55C \uBC84\uD2BC\uC785\uB2C8\uB2E4." : type === "button" ? `\uC0AC\uC6A9\uC790\uAC00 \uB20C\uB800\uC744 \uB54C ${purpose ? `${purpose} \uAD00\uB828 ` : ""}\uB3D9\uC791(\uC608: \uCC3D \uC5F4\uAE30, \uD654\uBA74 \uBC14\uAFB8\uAE30)\uC744 \uC2E4\uD589\uD558\uB3C4\uB85D \uBC30\uCE58\uD55C \uBC84\uD2BC\uC785\uB2C8\uB2E4.` : `\uC0AC\uC6A9\uC790\uAC00 \uC785\uB825\uD55C ${purpose && purpose !== "\uB85C\uADF8\uC778" ? `${purpose} ` : ""}\uC591\uC2DD \uC815\uBCF4\uB97C \uC11C\uBC84\uB85C \uC804\uC1A1(\uC81C\uCD9C)\uD558\uAE30 \uC704\uD574 \uD074\uB9AD\uD560 \uC218 \uC788\uB3C4\uB85D \uBC30\uCE58\uD55C ${purpose === "\uB85C\uADF8\uC778" ? "\uB85C\uADF8\uC778 " : ""}\uD544\uC218 \uBC84\uD2BC\uC785\uB2C8\uB2E4.`;
    return { easy, why };
  }
  if (tagName === "input") {
    const type = typeof attrs.type === "string" ? attrs.type.toLowerCase() : "text";
    const kind = INPUT_KIND[type] || `${type} \uD615\uC2DD\uC758 \uC785\uB825\uCE78`;
    const parts = [`${josa(kind, "\uC744/\uB97C")} \uB9CC\uB4E4\uACE0`];
    if (typeof attrs.placeholder === "string") {
      parts.push(`\uCE78 \uC548\uC5D0 ${josa(q(attrs.placeholder), "\uC774\uB77C\uB294/\uB77C\uB294")} \uD750\uB9B0 \uC548\uB0B4 \uBB38\uAD6C\uB97C \uBBF8\uB9AC \uBCF4\uC5EC\uC8FC\uBA70`);
    }
    if (typeof attrs.value === "string" && type !== "submit") {
      parts.push(`\uCC98\uC74C\uBD80\uD130 ${josa(q(attrs.value), "\uC774/\uAC00")} \uC801\uD600 \uC788\uAC8C \uD558\uACE0`);
    }
    if (attrs.required) parts.push("\uBE44\uC6CC\uB450\uBA74 \uC81C\uCD9C\uB418\uC9C0 \uC54A\uB3C4\uB85D \uBC18\uB4DC\uC2DC \uCC44\uC6CC\uC57C \uD558\uB294 \uCE78\uC73C\uB85C \uC815\uD558\uB294");
    let easy = parts.join(", ");
    easy = easy.replace(
      /(만들고|보여주며|하고)$/,
      (m) => m === "\uB9CC\uB4E4\uACE0" ? "\uB9CC\uB4DC\uB294" : m === "\uBCF4\uC5EC\uC8FC\uBA70" ? "\uBCF4\uC5EC\uC8FC\uB294" : "\uD558\uB294"
    );
    if (type === "submit" && typeof attrs.value === "string") {
      easy = `\uB204\uB974\uBA74 \uB0B4\uC6A9\uC744 \uC81C\uCD9C\uD558\uB294 \uBC84\uD2BC\uC744 \uB9CC\uB4E4\uACE0 \uADF8 \uBC84\uD2BC\uC758 \uC774\uB984\uC744 ${josa(q(attrs.value), "\uC73C\uB85C/\uB85C")} \uD45C\uC2DC\uD558\uB294`;
    }
    easy += " \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.";
    const purpose = guessPurpose(
      typeof attrs.placeholder === "string" ? attrs.placeholder : "",
      typeof attrs.name === "string" ? attrs.name : "",
      id,
      type
    );
    const target = purpose === "\uB85C\uADF8\uC778" ? "\uB85C\uADF8\uC778\uC5D0 \uD544\uC694\uD55C \uC0AC\uC6A9\uC790\uC758 \uACC4\uC815 \uC815\uBCF4" : purpose ? `${purpose === "\uC544\uC774\uB514" || purpose === "\uBE44\uBC00\uBC88\uD638" ? "\uB85C\uADF8\uC778\uC5D0 \uD544\uC694\uD55C " : ""}\uC0AC\uC6A9\uC790\uC758 ${purpose}` : "\uC0AC\uC6A9\uC790\uC5D0\uAC8C \uD544\uC694\uD55C \uC815\uBCF4";
    const why = type === "checkbox" || type === "radio" ? `\uC0AC\uC6A9\uC790\uAC00 ${purpose ? `${purpose} \uAD00\uB828 ` : ""}\uD56D\uBAA9\uC744 \uC9C1\uC811 \uACE8\uB77C \uC120\uD0DD\uD560 \uC218 \uC788\uAC8C \uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.` : `${josa(target, "\uC744/\uB97C")} \uD654\uBA74\uC5D0\uC11C \uC9C1\uC811 \uC785\uB825\uBC1B\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`;
    return { easy, why };
  }
  if (tagName === "p") {
    if (!text) return null;
    return {
      easy: `${josa(q(text), "\uC774\uB77C\uB294/\uB77C\uB294")} \uBB38\uC7A5\uC744 \uBCF4\uD1B5 \uD06C\uAE30 \uAE00\uC528\uC758 \uD55C \uBB38\uB2E8\uC73C\uB85C \uD654\uBA74\uC5D0 \uCD9C\uB825\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.`,
      why: `\uC81C\uBAA9 \uC544\uB798\uC5D0\uC11C \uC0AC\uC6A9\uC790\uC5D0\uAC8C ${josa(q(text), "\uC774\uB77C\uACE0/\uB77C\uACE0")} \uB2E4\uC74C\uC5D0 \uD560 \uC77C\uC774\uB098 \uC0C1\uC138\uD55C \uB0B4\uC6A9\uC744 \uC548\uB0B4\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`
    };
  }
  if (tagName === "title") {
    if (!text) return null;
    return {
      easy: `\uBE0C\uB77C\uC6B0\uC800 \uD0ED \uB9E8 \uC704\uC5D0 ${josa(q(text), "\uC774\uB77C\uB294/\uB77C\uB294")} \uD398\uC774\uC9C0 \uC81C\uBAA9\uC744 \uD45C\uC2DC\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.`,
      why: `\uC0AC\uC6A9\uC790\uAC00 \uD0ED\uC744 \uC5EC\uB7EC \uAC1C \uC5F4\uC5B4\uB450\uAC70\uB098 \uC990\uACA8\uCC3E\uAE30\uC5D0 \uC800\uC7A5\uD588\uC744 \uB54C \uC774 \uD398\uC774\uC9C0\uAC00 ${josa(q(text), "\uC774\uB77C\uB294/\uB77C\uB294")} \uAC78 \uBC14\uB85C \uC54C\uC544\uBCFC \uC218 \uC788\uB3C4\uB85D \uC774\uB984\uD45C\uB97C \uBD99\uC774\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`
    };
  }
  if (["div", "section", "main", "article", "aside", "header", "footer", "nav", "span"].includes(tagName)) {
    const boxName = {
      div: "\uD654\uBA74\uC758 \uC5EC\uB7EC \uC694\uC18C\uB97C \uD558\uB098\uB85C \uBB36\uB294 \uBCF4\uC774\uC9C0 \uC54A\uB294 \uC0C1\uC790",
      span: "\uAE00\uC790 \uC77C\uBD80\uBD84\uB9CC \uB530\uB85C \uAFB8\uBBF8\uAE30 \uC704\uD574 \uAC10\uC2F8\uB294 \uC791\uC740 \uC0C1\uC790",
      section: "\uB0B4\uC6A9\uC744 \uC8FC\uC81C\uBCC4\uB85C \uB098\uB204\uB294 \uAD6C\uC5ED \uC0C1\uC790",
      main: "\uC774 \uD398\uC774\uC9C0\uC758 \uAC00\uC7A5 \uC911\uC694\uD55C \uBCF8\uBB38 \uB0B4\uC6A9\uC744 \uB2F4\uB294 \uC0C1\uC790",
      article: "\uD558\uB098\uC758 \uAE00(\uAC8C\uC2DC\uAE00, \uAE30\uC0AC)\uC744 \uD1B5\uC9F8\uB85C \uB2F4\uB294 \uC0C1\uC790",
      aside: "\uBCF8\uBB38 \uC606\uC5D0 \uBD99\uB294 \uBCF4\uC870 \uB0B4\uC6A9\uC744 \uB2F4\uB294 \uC0C1\uC790",
      header: "\uD398\uC774\uC9C0\uB098 \uAD6C\uC5ED\uC758 \uB9E8 \uC704 \uBA38\uB9AC \uBD80\uBD84\uC744 \uB2F4\uB294 \uC0C1\uC790",
      footer: "\uD398\uC774\uC9C0\uB098 \uAD6C\uC5ED\uC758 \uB9E8 \uC544\uB798 \uAF2C\uB9AC \uBD80\uBD84\uC744 \uB2F4\uB294 \uC0C1\uC790",
      nav: "\uB2E4\uB978 \uD398\uC774\uC9C0\uB85C \uC774\uB3D9\uD558\uB294 \uBA54\uB274 \uB9C1\uD06C\uB4E4\uC744 \uB2F4\uB294 \uC0C1\uC790"
    };
    const easy = nameTag ? `${boxName[tagName]}\uB97C \uB9CC\uB4E4\uACE0, \uADF8 \uC0C1\uC790\uC5D0 ${josa(q(nameTag), "\uC774\uB77C\uB294/\uB77C\uB294")} \uC774\uB984\uD45C\uB97C \uBD99\uC774\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.` : `${boxName[tagName]}\uB97C \uB9CC\uB4DC\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`;
    const purpose = guessPurpose(nameTag);
    const why = nameTag ? `\uC774\uB984\uD45C(${nameTag})\uB85C \uBCF4\uC544 ${purpose ? `${purpose} \uAD00\uB828 ` : "\uAC19\uC740 \uC5ED\uD560\uC744 \uD558\uB294 "}\uC81C\uBAA9\xB7\uC785\uB825\uCE78\xB7\uBC84\uD2BC \uAC19\uC740 \uC694\uC18C\uB4E4\uC744 \uD55C \uB369\uC5B4\uB9AC\uB85C \uBB36\uC5B4\uC11C \uD568\uAED8 \uAFB8\uBBF8\uAC70\uB098 \uC704\uCE58\uB97C \uC815\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.` : "\uC5EC\uB7EC \uC694\uC18C\uB97C \uD55C \uB369\uC5B4\uB9AC\uB85C \uBB36\uC5B4\uC11C \uD568\uAED8 \uAFB8\uBBF8\uAC70\uB098 \uC704\uCE58\uB97C \uC815\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.";
    return { easy, why };
  }
  if (tagName === "html") {
    const lang = typeof attrs.lang === "string" ? attrs.lang : "";
    const langName = { ko: "\uD55C\uAD6D\uC5B4", en: "\uC601\uC5B4", ja: "\uC77C\uBCF8\uC5B4", zh: "\uC911\uAD6D\uC5B4" };
    return {
      easy: lang ? `\uC6F9\uD398\uC774\uC9C0 \uC804\uCCB4\uB97C \uAC10\uC2F8\uB294 \uAC00\uC7A5 \uBC14\uAE65 \uC0C1\uC790\uB97C \uB9CC\uB4E4\uACE0, \uC774 \uD398\uC774\uC9C0\uAC00 ${langName[lang] || lang}(${lang})\uB85C \uC4F0\uC600\uB2E4\uACE0 \uBE0C\uB77C\uC6B0\uC800\uC5D0 \uC54C\uB824\uC8FC\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.` : "\uC6F9\uD398\uC774\uC9C0 \uC804\uCCB4\uB97C \uAC10\uC2F8\uB294 \uAC00\uC7A5 \uBC14\uAE65 \uC0C1\uC790\uB97C \uB9CC\uB4DC\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.",
      why: lang ? `\uD398\uC774\uC9C0\uC758 \uBAA8\uB4E0 \uB0B4\uC6A9\uC744 \uD558\uB098\uB85C \uB2F4\uACE0, \uBC88\uC5ED \uAE30\uB2A5\uC774\uB098 \uD654\uBA74 \uC77D\uC5B4\uC8FC\uAE30 \uD504\uB85C\uADF8\uB7A8\uC774 ${langName[lang] || lang}\uB85C \uC62C\uBC14\uB974\uAC8C \uC77D\uB3C4\uB85D \uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.` : "\uD398\uC774\uC9C0\uC758 \uBAA8\uB4E0 \uB0B4\uC6A9\uC744 \uD558\uB098\uB85C \uB2F4\uAE30 \uC704\uD574 \uBB38\uC11C \uB9E8 \uBC14\uAE65\uC5D0 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (tagName === "meta") {
    if (typeof attrs.charset === "string") {
      return {
        easy: `\uD55C\uAE00 \uAC19\uC740 \uAE00\uC790\uAC00 \uAE68\uC9C0\uC9C0 \uC54A\uB3C4\uB85D \uC774 \uD398\uC774\uC9C0\uC758 \uAE00\uC790\uB97C ${attrs.charset} \uBC29\uC2DD\uC73C\uB85C \uC77D\uC73C\uB77C\uACE0 \uBE0C\uB77C\uC6B0\uC800\uC5D0 \uC54C\uB824\uC8FC\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
        why: '\uC774 \uC904\uC774 \uC5C6\uC73C\uBA74 \uD55C\uAE00\uC774 "\xEB\u201A\u02DC\xEC\u02DC" \uAC19\uC740 \uC774\uC0C1\uD55C \uAE30\uD638\uB85C \uAE68\uC838 \uBCF4\uC77C \uC218 \uC788\uC5B4\uC11C, \uAE00\uC790\uAC00 \uC62C\uBC14\uB974\uAC8C \uBCF4\uC774\uB3C4\uB85D \uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.'
      };
    }
    if (attrs.name === "viewport") {
      return {
        easy: "\uD734\uB300\uD3F0\uCC98\uB7FC \uC791\uC740 \uD654\uBA74\uC5D0\uC11C\uB3C4 \uD398\uC774\uC9C0 \uD3ED\uC744 \uAE30\uAE30 \uD654\uBA74 \uD06C\uAE30\uC5D0 \uB531 \uB9DE\uCD94\uB77C\uACE0 \uBE0C\uB77C\uC6B0\uC800\uC5D0 \uC54C\uB824\uC8FC\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.",
        why: "\uD734\uB300\uD3F0\uC5D0\uC11C \uD398\uC774\uC9C0\uAC00 \uC544\uC8FC \uC791\uAC8C \uCD95\uC18C\uB418\uC5B4 \uBCF4\uC774\uC9C0 \uC54A\uACE0, \uC190\uAC00\uB77D\uC73C\uB85C \uC77D\uAE30 \uD3B8\uD55C \uD06C\uAE30\uB85C \uBCF4\uC774\uAC8C \uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
      };
    }
    return null;
  }
  if (tagName === "label") {
    const target = typeof attrs.for === "string" ? attrs.for : "";
    return {
      easy: target ? `${josa(q(text || "\uC774\uB984"), "\uC774\uB77C\uB294/\uB77C\uB294")} \uC548\uB0B4 \uAE00\uC790\uB97C \uD654\uBA74\uC5D0 \uD45C\uC2DC\uD558\uACE0, \uC774 \uAE00\uC790\uB97C \uB204\uB974\uBA74 ${josa(q(target), "\uC774\uB77C\uB294/\uB77C\uB294")} \uC785\uB825\uCE78\uC774 \uBC14\uB85C \uC120\uD0DD\uB418\uB3C4\uB85D \uC5F0\uACB0\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.` : `${josa(q(text || "\uC774\uB984"), "\uC774\uB77C\uB294/\uB77C\uB294")} \uC785\uB825\uCE78 \uC548\uB0B4 \uAE00\uC790\uB97C \uD654\uBA74\uC5D0 \uD45C\uC2DC\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.`,
      why: `\uC0AC\uC6A9\uC790\uAC00 \uC606\uC758 \uC785\uB825\uCE78\uC5D0 \uBB34\uC5C7\uC744 \uC801\uC5B4\uC57C \uD558\uB294\uC9C0(${text || "\uD56D\uBAA9 \uC774\uB984"}) \uC54C\uB824\uC8FC\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`
    };
  }
  if (tagName === "form") {
    const action = typeof attrs.action === "string" ? attrs.action : "";
    const method = typeof attrs.method === "string" ? attrs.method.toUpperCase() : "GET";
    const how = method === "POST" ? "\uC8FC\uC18C\uCC3D\uC5D0 \uB0B4\uC6A9\uC774 \uBCF4\uC774\uC9C0 \uC54A\uAC8C(POST \uBC29\uC2DD)" : "\uC8FC\uC18C\uCC3D \uB4A4\uC5D0 \uB0B4\uC6A9\uC744 \uBD99\uC5EC\uC11C(GET \uBC29\uC2DD)";
    const purpose = guessPurpose(action, cls, id);
    return {
      easy: action ? `\uC785\uB825\uCE78\uACFC \uBC84\uD2BC\uC744 \uD558\uB098\uC758 \uC2E0\uCCAD\uC11C\uB85C \uBB36\uACE0, \uC81C\uCD9C\uD558\uBA74 \uC801\uD78C \uB0B4\uC6A9\uC744 ${how} ${josa(q(action), "\uC73C\uB85C/\uB85C")} \uBCF4\uB0B4\uB3C4\uB85D \uC815\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.` : "\uC785\uB825\uCE78\uACFC \uBC84\uD2BC\uC744 \uD558\uB098\uC758 \uC2E0\uCCAD\uC11C(\uC591\uC2DD)\uB85C \uBB36\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.",
      why: `\uC0AC\uC6A9\uC790\uAC00 \uC785\uB825\uD55C ${purpose ? `${purpose} ` : ""}\uC815\uBCF4\uB97C \uD55C \uBC88\uC5D0 \uBAA8\uC544\uC11C \uC11C\uBC84\uB85C \uBCF4\uB0B4\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`
    };
  }
  if (tagName === "a") {
    const href = typeof attrs.href === "string" ? attrs.href : "";
    const newTab = attrs.target === "_blank";
    return {
      easy: `${josa(q(text || "\uB9C1\uD06C"), "\uC774\uB77C\uB294/\uB77C\uB294")} \uAE00\uC790\uB97C \uB204\uB97C \uC218 \uC788\uAC8C \uB9CC\uB4E4\uACE0, \uB204\uB974\uBA74 ${href ? josa(q(href), "\uC73C\uB85C/\uB85C") : "\uC815\uD574\uC9C4 \uC8FC\uC18C\uB85C"} ${newTab ? "\uC0C8 \uD0ED\uC5D0\uC11C " : ""}\uC774\uB3D9\uD558\uAC8C \uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.`,
      why: `\uC0AC\uC6A9\uC790\uAC00 ${text ? q(text) : "\uB2E4\uB978 \uD398\uC774\uC9C0"} \uD654\uBA74\uC73C\uB85C \uC27D\uAC8C \uB118\uC5B4\uAC08 \uC218 \uC788\uB3C4\uB85D \uAE38\uC744 \uC5F0\uACB0\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`
    };
  }
  if (tagName === "img") {
    const src = typeof attrs.src === "string" ? attrs.src : "";
    const alt = typeof attrs.alt === "string" ? attrs.alt : "";
    return {
      easy: `${src ? josa(q(src), "\uC774\uB77C\uB294/\uB77C\uB294") + " \uC704\uCE58\uC5D0 \uC788\uB294 " : ""}\uADF8\uB9BC\uC744 \uD654\uBA74\uC5D0 \uBCF4\uC5EC\uC8FC\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.${alt ? ` \uADF8\uB9BC\uC774 \uC548 \uBCF4\uC77C \uB54C\uB294 \uB300\uC2E0 ${josa(q(alt), "\uC774\uB77C\uB294/\uB77C\uB294")} \uC124\uBA85 \uAE00\uC790\uAC00 \uB098\uC635\uB2C8\uB2E4.` : ""}`,
      why: alt ? `\uAE00\uC790\uB9CC\uC73C\uB85C\uB294 \uC804\uB2EC\uD558\uAE30 \uC5B4\uB824\uC6B4 ${q(alt)} \uBAA8\uC2B5\uC744 \uC0AC\uC6A9\uC790\uC5D0\uAC8C \uB208\uC73C\uB85C \uBCF4\uC5EC\uC8FC\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.` : "\uAE00\uC790\uB9CC\uC73C\uB85C\uB294 \uC804\uB2EC\uD558\uAE30 \uC5B4\uB824\uC6B4 \uB0B4\uC6A9\uC744 \uADF8\uB9BC\uC73C\uB85C \uBCF4\uC5EC\uC8FC\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (tagName === "ul" || tagName === "ol") {
    return {
      easy: tagName === "ul" ? "\uC55E\uC5D0 \uC810(\u2022)\uC774 \uCC0D\uD788\uB294 \uC21C\uC11C \uC5C6\uB294 \uBAA9\uB85D \uC0C1\uC790\uB97C \uB9CC\uB4DC\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4." : "\uC55E\uC5D0 1, 2, 3 \uBC88\uD638\uAC00 \uBD99\uB294 \uC21C\uC11C \uC788\uB294 \uBAA9\uB85D \uC0C1\uC790\uB97C \uB9CC\uB4DC\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.",
      why: "\uC5EC\uB7EC \uD56D\uBAA9\uC744 \uD55C \uC904\uC529 \uAC00\uC9C0\uB7F0\uD788 \uB098\uC5F4\uD574\uC11C \uBCF4\uAE30 \uC27D\uAC8C \uC815\uB9AC\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (tagName === "li") {
    return {
      easy: text ? `\uBAA9\uB85D \uC548\uC5D0 ${josa(q(text), "\uC774\uB77C\uB294/\uB77C\uB294")} \uD56D\uBAA9 \uD55C \uC904\uC744 \uCD94\uAC00\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.` : "\uBAA9\uB85D \uC548\uC5D0 \uD56D\uBAA9 \uD55C \uC904\uC744 \uCD94\uAC00\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
      why: "\uBAA9\uB85D\uC758 \uAC01 \uD56D\uBAA9\uC744 \uD558\uB098\uC529 \uAD6C\uBD84\uD574\uC11C \uBCF4\uC5EC\uC8FC\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (tagName === "strong" || tagName === "b") {
    return {
      easy: `${josa(q(text || "\uAE00\uC790"), "\uC744/\uB97C")} \uAD75\uC740 \uAE00\uC528\uB85C \uAC15\uC870\uD574\uC11C \uCD9C\uB825\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.`,
      why: "\uC5EC\uB7EC \uAE00\uC790 \uC911\uC5D0\uC11C \uAF2D \uBD10\uC57C \uD558\uB294 \uC911\uC694\uD55C \uBD80\uBD84\uC744 \uB208\uC5D0 \uB744\uAC8C \uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (tagName === "textarea") {
    return {
      easy: `\uC5EC\uB7EC \uC904\uC758 \uAE34 \uAE00\uC744 \uC785\uB825\uD560 \uC218 \uC788\uB294 \uD070 \uC785\uB825\uCE78\uC744 \uB9CC\uB4DC\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.${typeof attrs.placeholder === "string" ? ` \uCE78 \uC548\uC5D0\uB294 ${josa(q(attrs.placeholder), "\uC774\uB77C\uB294/\uB77C\uB294")} \uC548\uB0B4 \uBB38\uAD6C\uAC00 \uD750\uB9AC\uAC8C \uBCF4\uC785\uB2C8\uB2E4.` : ""}`,
      why: "\uD55C \uC904\uB85C\uB294 \uBD80\uC871\uD55C \uAE34 \uB0B4\uC6A9(\uC758\uACAC, \uBB38\uC758 \uB4F1)\uC744 \uC0AC\uC6A9\uC790\uC5D0\uAC8C \uC785\uB825\uBC1B\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (tagName === "link" && typeof attrs.href === "string") {
    return {
      easy: `${josa(q(attrs.href), "\uC774\uB77C\uB294/\uB77C\uB294")} \uB2E4\uB978 \uD30C\uC77C\uC744 \uC774 \uD398\uC774\uC9C0\uC5D0 \uBD88\uB7EC\uC640 \uC5F0\uACB0\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.`,
      why: attrs.rel === "stylesheet" ? "\uD654\uBA74\uC758 \uC0C9\uAE54, \uAE00\uC528 \uD06C\uAE30, \uBC30\uCE58 \uAC19\uC740 \uAFB8\uBC08 \uADDC\uCE59\uC744 \uB530\uB85C \uB9CC\uB4E0 \uD30C\uC77C\uC5D0\uC11C \uAC00\uC838\uC624\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4." : "\uD398\uC774\uC9C0\uC5D0 \uD544\uC694\uD55C \uCD94\uAC00 \uD30C\uC77C\uC744 \uBD88\uB7EC\uC624\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (tagName === "script") {
    const src = typeof attrs.src === "string" ? attrs.src : "";
    return {
      easy: src ? `${josa(q(src), "\uC774\uB77C\uB294/\uB77C\uB294")} \uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8 \uD30C\uC77C\uC744 \uBD88\uB7EC\uC640 \uC2E4\uD589\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.` : "\uC774 \uC548\uC5D0 \uC801\uD78C \uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8 \uBA85\uB839\uC744 \uC2E4\uD589\uD558\uB294 \uAD6C\uC5ED\uC744 \uB9CC\uB4DC\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4.",
      why: "\uBC84\uD2BC\uC744 \uB20C\uB800\uC744 \uB54C \uBC18\uC751\uD558\uB294 \uAC83\uCC98\uB7FC \uD654\uBA74\uC774 \uC6C0\uC9C1\uC774\uACE0 \uB3D9\uC791\uD558\uAC8C \uB9CC\uB4E4\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  return null;
}
function applySyntaxError(item, err) {
  return {
    ...item,
    hasError: true,
    errorDetail: err.detail,
    subCommentBeginner: `[\uC624\uB958] ${err.detail}`,
    subCommentIntermediate: `[\uC624\uB958] ${err.detail}`,
    subCommentAdvanced: `[SYNTAX ERROR] ${err.detail}`,
    beginner: {
      ...item.beginner,
      betterExample: err.fixed ? { code: err.fixed, reason: "\uD2C0\uB9B0 \uBD80\uBD84\uC744 \uBC14\uB85C\uC7A1\uC740 \uC62C\uBC14\uB978 \uCF54\uB4DC\uC785\uB2C8\uB2E4. \uC774\uB807\uAC8C \uACE0\uCE58\uBA74 \uBE0C\uB77C\uC6B0\uC800\uAC00 \uC758\uB3C4\uD55C \uB300\uB85C \uD654\uBA74\uC744 \uADF8\uB9BD\uB2C8\uB2E4." } : item.beginner.betterExample
    },
    intermediate: {
      ...item.intermediate,
      isBasic: false,
      codeCheckVerdict: `\u274C \uC624\uB958\uAC00 \uC788\uC2B5\uB2C8\uB2E4. ${err.detail}`,
      betterRefactor: err.fixed ? { code: err.fixed, reason: "\uBB38\uBC95 \uC624\uB958\uB97C \uC218\uC815\uD55C \uCF54\uB4DC\uC785\uB2C8\uB2E4." } : item.intermediate.betterRefactor
    },
    advanced: {
      ...item.advanced,
      bugAudit: { hasIssue: true, severity: "error", issueTitle: "\uBB38\uBC95 \uC624\uB958 (Syntax Error)", issueDetail: err.detail },
      // 고친 코드를 알 수 없으면, 엉뚱한 예시 대신 패치를 비워 둠
      recommendedPatch: err.fixed
    }
  };
}
function detectLineSyntaxError(line) {
  const err = checkLine(line);
  return err ? { hasError: true, errorDetail: err.detail } : { hasError: false };
}
function cssPatch(decls) {
  const missing = [];
  const out = [];
  let changed = false;
  for (const d of decls) {
    if (d.prop === "width" && /px$/.test(d.value) && !decls.some((x) => x.prop === "max-width")) {
      out.push("width: 100%", `max-width: ${d.value}`);
      missing.push(`\uACE0\uC815 \uD3ED ${d.value}\uB294 \uD654\uBA74\uC774 \uC881\uC740 \uD734\uB300\uD3F0\uC5D0\uC11C \uAC00\uB85C \uC2A4\uD06C\uB864\uC744 \uB9CC\uB4ED\uB2C8\uB2E4 \u2192 width: 100%; max-width: ${d.value};`);
      changed = true;
    } else if (d.prop === "height" && /px$/.test(d.value)) {
      out.push(`min-height: ${d.value}`);
      missing.push(`\uACE0\uC815 \uB192\uC774 ${d.value}\uB294 \uB0B4\uC6A9\uC774 \uB9CE\uC544\uC9C0\uBA74 \uB118\uCE69\uB2C8\uB2E4 \u2192 min-height: ${d.value};`);
      changed = true;
    } else {
      out.push(`${d.prop}: ${d.value}`);
    }
  }
  if (!changed) return null;
  return { code: out.join("; ") + ";", reason: missing.join(" / "), missing };
}
function applyCssLevels(base, css, fallbackDepth) {
  const depth = css ? cssLevelDepth(css) : fallbackDepth;
  const patch = cssPatch(css.decls);
  const n = css.decls.length;
  return {
    ...base,
    subCommentIntermediate: depth.isBasic ? "\uAE30\uBCF8 \uCF54\uB4DC (\uC791\uB3D9 \uC6D0\uB9AC \uC124\uBA85 \uC0DD\uB7B5)" : n ? `CSS \uC120\uC5B8 ${n}\uAC1C \uC801\uC6A9 (${css.decls.map((d) => d.prop).join(", ")})` : `'${css.selector}' \uADDC\uCE59 \uC2DC\uC791 (\uBA85\uC2DC\uB3C4 \uC810\uAC80)`,
    subCommentAdvanced: patch ? `[RESPONSIVE] ${css.decls.filter((d) => /^(width|height)$/.test(d.prop)).map((d) => `${d.prop}:${d.value}`).join(", ")} \uACE0\uC815 \uD06C\uAE30 \uC810\uAC80 \uD544\uC694` : `[CSS] ${n ? `${n} declarations` : "rule block"} \u2014 cascade/specificity \uC815\uC0C1`,
    intermediate: {
      isBasic: depth.isBasic,
      howItWorks: depth.howItWorks,
      codeCheckVerdict: n ? `CSS \uC120\uC5B8 ${n}\uAC1C\uAC00 \uBAA8\uB450 '\uC18D\uC131: \uAC12;' \uBB38\uBC95\uC5D0 \uB9DE\uAC8C \uC791\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4.${n > 1 ? " \uB2E4\uB9CC \uD55C \uC904\uC5D0 \uC5EC\uB7EC \uAC1C\uB97C \uC774\uC5B4 \uC4F0\uBA74 \uC77D\uACE0 \uACE0\uCE58\uAE30 \uC5B4\uB824\uC6B0\uBBC0\uB85C \uD55C \uC904\uC5D0 \uD558\uB098\uC529 \uC4F0\uB294 \uAC83\uC774 \uC88B\uC2B5\uB2C8\uB2E4." : ""}` : "\uC120\uD0DD\uC790\uC640 \uC911\uAD04\uD638 \uBB38\uBC95\uC774 \uC62C\uBC14\uB985\uB2C8\uB2E4.",
      betterRefactor: patch ? { code: patch.code.split("; ").join(";\n"), reason: "\uACE0\uC815 \uD06C\uAE30 \uB300\uC2E0 \uBC18\uC751\uD615 \uD06C\uAE30\uB97C \uC4F0\uBA74 \uD734\uB300\uD3F0\uCC98\uB7FC \uC881\uC740 \uD654\uBA74\uC5D0\uC11C\uB3C4 \uB808\uC774\uC544\uC6C3\uC774 \uAE68\uC9C0\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4." } : n > 1 ? { code: css.decls.map((d) => `${d.prop}: ${d.value};`).join("\n"), reason: "\uD55C \uC904\uC5D0 \uC120\uC5B8 \uD558\uB098\uC529 \uC4F0\uBA74 \uC5B4\uB5A4 \uAC12\uC744 \uBC14\uAFE8\uB294\uC9C0 \uCC3E\uAE30 \uC27D\uACE0, \uBC84\uC804 \uAD00\uB9AC(git)\uC5D0\uC11C \uBCC0\uACBD \uB0B4\uC5ED\uB3C4 \uBA85\uD655\uD574\uC9D1\uB2C8\uB2E4." } : base.intermediate.betterRefactor,
      suggestedAdditions: base.intermediate.suggestedAdditions
    },
    advanced: {
      ...base.advanced,
      technicalDetail: depth.technicalDetail,
      missingAudit: patch ? { hasMissing: true, missingTitle: "\uBC18\uC751\uD615 \uD06C\uAE30 \uCC98\uB9AC \uB204\uB77D", missingSnippet: patch.code, reason: patch.reason } : base.advanced.missingAudit,
      bugAudit: patch ? { hasIssue: true, severity: "warning", issueTitle: "\uACE0\uC815 \uD06C\uAE30 \uB808\uC774\uC544\uC6C3", issueDetail: patch.missing.join(" ") } : base.advanced.bugAudit,
      recommendedPatch: patch ? patch.code : base.advanced.recommendedPatch
    }
  };
}
function htmlDefinition(trimmed) {
  if (trimmed.startsWith("<!--")) return "HTML \uC8FC\uC11D(<!-- -->)\uC740 \uD654\uBA74\uC5D0 \uBCF4\uC774\uC9C0 \uC54A\uACE0 \uAC1C\uBC1C\uC790\uB07C\uB9AC\uB9CC \uBCF4\uB294 \uC124\uBA85 \uBA54\uBAA8\uC785\uB2C8\uB2E4.";
  const close = trimmed.match(/^<\/([a-zA-Z][\w-]*)>$/);
  if (close) return `</${close[1]}>\uB294 \uC55E\uC5D0\uC11C \uC5F0 <${close[1]}> \uD0DC\uADF8\uAC00 \uC5EC\uAE30\uC11C \uB05D\uB09C\uB2E4\uB294 \uAC83\uC744 \uC54C\uB824\uC8FC\uB294 \uB2EB\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.`;
  if (/^<[A-Z]/.test(trimmed)) return "\uB300\uBB38\uC790\uB85C \uC2DC\uC791\uD558\uB294 \uD0DC\uADF8\uB294 \uB9AC\uC561\uD2B8\uC5D0\uC11C \uC9C1\uC811 \uB9CC\uB4E0 \uD654\uBA74 \uBD80\uD488(\uCEF4\uD3EC\uB10C\uD2B8)\uC744 \uBD88\uB7EC\uC640 \uC4F0\uB294 \uCF54\uB4DC\uC785\uB2C8\uB2E4.";
  const tag = trimmed.match(/^<([!a-zA-Z][\w-]*)/)?.[1]?.toLowerCase() || "";
  return TAG_DEFINITIONS[tag];
}
function interpretSingleLineFallback(line, lineNumber) {
  const base = interpretSingleLineBase(line, lineNumber);
  const depth = getLevelDepth(line);
  const trimmedLine = line.trim();
  const beginnerCode = trimmedLine.startsWith("<") ? null : describeCodeForBeginner(line);
  if (beginnerCode) {
    base.shortRole = beginnerCode.role;
    base.subCommentBeginner = beginnerCode.easy;
    base.beginner = {
      ...base.beginner,
      definition: beginnerCode.definition,
      easyExplanation: beginnerCode.easy,
      whyUsedHere: beginnerCode.why,
      tokens: beginnerCode.tokens ?? base.beginner.tokens
    };
  } else if (trimmedLine.startsWith("<")) {
    base.beginner = { ...base.beginner, definition: htmlDefinition(trimmedLine) };
  }
  const css = trimmedLine.startsWith("<") ? null : describeCssLine(line);
  if (css) return applyCssLevels(base, css, depth);
  return {
    ...base,
    subCommentIntermediate: depth.isBasic ? "\uAE30\uBCF8 \uCF54\uB4DC (\uC791\uB3D9 \uC6D0\uB9AC \uC124\uBA85 \uC0DD\uB7B5)" : base.subCommentIntermediate,
    intermediate: {
      ...base.intermediate,
      isBasic: depth.isBasic,
      howItWorks: depth.howItWorks
    },
    advanced: {
      ...base.advanced,
      technicalDetail: depth.technicalDetail
    }
  };
}
function interpretSingleLineBase(line, lineNumber) {
  const trimmed = line.trim();
  const errorCheck = detectLineSyntaxError(line);
  if (!trimmed) {
    return {
      lineNumber,
      code: line,
      isBlank: true,
      shortRole: "\uCF54\uB4DC \uB2E8\uB77D \uAD6C\uBD84 \uBE48 \uC904",
      subCommentBeginner: "\uAC00\uB3C5\uC131\uC744 \uC704\uD574 \uBE44\uC6CC\uB454 \uBE48 \uC904\uC785\uB2C8\uB2E4.",
      subCommentIntermediate: "\uCF54\uB4DC \uBE14\uB85D \uBD84\uB9AC\uB97C \uC704\uD55C \uAC1C\uD589 (\uAC00\uB3C5\uC131 \uC720\uC9C0)",
      subCommentAdvanced: "[EMPTY] Whitespace line token",
      beginner: {
        easyExplanation: "\uC544\uBB34 \uCF54\uB4DC\uB3C4 \uC801\uD788\uC9C0 \uC54A\uC740 \uBE48 \uC904\uC785\uB2C8\uB2E4. \uCEF4\uD4E8\uD130\uB294 \uC774 \uC904\uC744 \uBB34\uC2DC\uD558\uACE0 \uB2E4\uC74C \uC904\uB85C \uB118\uC5B4\uAC11\uB2C8\uB2E4.",
        whyUsedHere: "\uC0AC\uB78C\uC774 \uCF54\uB4DC\uB97C \uC77D\uC744 \uB54C \uC11C\uB85C \uB2E4\uB978 \uAD6C\uC5ED(\uC608: head\uC640 body, \uB610\uB294 \uACC4\uC0B0\uACFC \uCD9C\uB825)\uC744 \uD55C\uB208\uC5D0 \uAD6C\uBD84\uD558\uAE30 \uC27D\uAC8C \uB744\uC5B4 \uC4F4 \uAC83\uC785\uB2C8\uB2E4.",
        tokens: []
      },
      intermediate: {
        codeCheckVerdict: "\uB17C\uB9AC\uC801 \uBE14\uB85D \uAD6C\uBD84\uC744 \uC704\uD55C \uC77C\uBC18 \uACF5\uBC31 \uC904\uC785\uB2C8\uB2E4."
      },
      advanced: {
        bugAudit: {
          hasIssue: false,
          severity: "none",
          issueTitle: "\uC815\uC0C1 \uAC1C\uD589",
          issueDetail: "\uBD88\uD544\uC694\uD55C \uACF5\uBC31 \uB204\uC801 \uC5C6\uC74C."
        },
        missingAudit: {
          hasMissing: false,
          missingTitle: "\uB204\uB77D \uC5C6\uC74C",
          missingSnippet: "",
          reason: "\uACF5\uBC31 \uC904"
        }
      }
    };
  }
  const isPureClosing = /^<\/[a-zA-Z0-9-]+>$/.test(trimmed);
  if (isPureClosing) {
    const closingTagName = trimmed.replace(/<\/|>/g, "").toLowerCase();
    const info = HTML_MASTER_DICTIONARY[closingTagName];
    return {
      lineNumber,
      code: line,
      isBlank: false,
      shortRole: info ? `${info.name} \uB2EB\uAE30 (</${closingTagName}>)` : `</${closingTagName}> \uB2EB\uAE30`,
      subCommentBeginner: `\uC704\uC5D0\uC11C \uC5F4\uC5C8\uB358 <${closingTagName}> \uC0C1\uC790\uB97C \uC5EC\uAE30\uC11C \uB2EB\uC544 \uB9C8\uBB34\uB9AC\uD569\uB2C8\uB2E4.`,
      subCommentIntermediate: `</${closingTagName}> \uBE14\uB85D \uB2EB\uD798 (DOM \uBD80\uBAA8 \uB178\uB4DC \uB2EB\uAE30 \uD655\uC778)`,
      subCommentAdvanced: `[TAG CLOSE] </${closingTagName}> DOM \uC694\uC18C \uBC94\uC704 \uC885\uB8CC. \uC9DD\uB9DE\uCDA4 \uC77C\uCE58.`,
      beginner: {
        easyExplanation: `\uC704\uC5D0\uC11C \uC2DC\uC791\uB418\uC5C8\uB358 <${closingTagName}> \uAD6C\uC5ED\uC774 \uC774 \uC904\uC5D0\uC11C \uB05D\uB0AC\uC74C\uC744 \uBE0C\uB77C\uC6B0\uC800\uC5D0 \uC54C\uB9BD\uB2C8\uB2E4.`,
        whyUsedHere: "HTML\uC5D0\uC11C\uB294 \uC2DC\uC791 \uD0DC\uADF8(<\uD0DC\uADF8>)\uAC00 \uC788\uC73C\uBA74 \uC5B4\uB514\uC11C \uADF8 \uC0C1\uC790\uAC00 \uB05D\uB098\uB294\uC9C0 \uB2EB\uB294 \uD0DC\uADF8(</\uD0DC\uADF8>)\uB85C \uC9DD\uC744 \uB9DE\uCDB0 \uC54C\uB824\uC8FC\uC5B4\uC57C \uB2E4\uB978 \uC694\uC18C\uC640 \uB4A4\uC11E\uC5EC \uAE68\uC9C0\uB294 \uD604\uC0C1\uC744 \uB9C9\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        wrongExample: {
          code: `<${closingTagName}> (\uC2AC\uB798\uC2DC \uB204\uB77D)`,
          reason: "\uB2EB\uB294 \uC2AC\uB798\uC2DC(/)\uB97C \uBE7C\uBA39\uC73C\uBA74 \uBE0C\uB77C\uC6B0\uC800\uAC00 \uB610 \uB2E4\uB978 \uC5EC\uB294 \uD0DC\uADF8\uB85C \uCC29\uAC01\uD558\uC5EC \uB808\uC774\uC544\uC6C3\uC774 \uC5F0\uC1C4\uC801\uC73C\uB85C \uAE68\uC9D1\uB2C8\uB2E4."
        },
        betterExample: {
          code: `</${closingTagName}>`,
          reason: "\uC5EC\uB294 \uD0DC\uADF8\uC640 \uB2EB\uB294 \uD0DC\uADF8\uC758 \uC911\uCCA9 \uC21C\uC11C(\uB4E4\uC5EC\uC4F0\uAE30)\uB97C \uCE7C\uAC19\uC774 \uB9DE\uCDB0 \uB2EB\uC544\uC8FC\uB294 \uAC83\uC774 \uC88B\uC2B5\uB2C8\uB2E4."
        },
        tokens: extractHtmlTokens(trimmed)
      },
      intermediate: {
        codeCheckVerdict: `\uC0C1\uC704 <${closingTagName}> \uD0DC\uADF8\uC640 \uB2EB\uB294 \uD0DC\uADF8\uC758 \uC911\uCCA9 \uC2A4\uD0DD\uC774 \uC815\uD655\uD788 \uC77C\uCE58\uD569\uB2C8\uB2E4.`,
        betterRefactor: {
          code: `</${closingTagName}>`,
          reason: "\uB4E4\uC5EC\uC4F0\uAE30 \uADDC\uCE59 \uC900\uC218"
        }
      },
      advanced: {
        bugAudit: {
          hasIssue: false,
          severity: "none",
          issueTitle: "\uD0DC\uADF8 \uB2EB\uD798 \uAC80\uC99D \uD1B5\uACFC",
          issueDetail: `\uD0DC\uADF8 \uC2A4\uD0DD \uC815\uD569\uC131 \uC77C\uCE58. Unclosed Tag \uC624\uB958 \uC5C6\uC74C.`
        },
        missingAudit: {
          hasMissing: false,
          missingTitle: "\uB204\uB77D \uC5C6\uC74C",
          missingSnippet: "",
          reason: "\uC815\uC0C1 \uB2EB\uD798 \uD0DC\uADF8"
        }
      }
    };
  }
  if (trimmed.startsWith("<") && trimmed.includes(">")) {
    const firstTagMatch = trimmed.match(/^<\/?([!a-zA-Z0-9-]+)/);
    const tagName = firstTagMatch ? firstTagMatch[1].toLowerCase() : "";
    const info = HTML_MASTER_DICTIONARY[tagName];
    const innerTextMatch = trimmed.match(/>([^<]+)<\//);
    const innerText = innerTextMatch ? innerTextMatch[1].trim() : "";
    let shortRole = info ? info.name : `<${tagName}> \uC694\uC18C`;
    if (innerText) {
      shortRole = `${info ? info.name : `<${tagName}>`} ("${innerText.length > 12 ? innerText.slice(0, 12) + "..." : innerText}")`;
    }
    const subBeginner = info ? info.subBeginner : `<${tagName}> \uD0DC\uADF8\uB97C \uC0AC\uC6A9\uD574 \uD654\uBA74 \uC694\uC18C\uB97C \uB9CC\uB4ED\uB2C8\uB2E4.`;
    const subIntermediate = info ? info.subIntermediate : `<${tagName}> \uC694\uC18C \uC815\uC758 \uBC0F \uC81C\uC57D\uC870\uAC74 \uAC80\uC99D`;
    const subAdvanced = info ? info.subAdvanced : `[ELEMENT] <${tagName}> AST \uB178\uB4DC \uAC80\uC0AC.`;
    let easyExplanation = info ? info.easyExplanation : `\uD654\uBA74\uC5D0 <${tagName}> \uC694\uC18C\uB97C \uBC30\uCE58\uD558\uB294 HTML \uCF54\uB4DC\uC785\uB2C8\uB2E4.`;
    let whyUsedHere = info ? info.whyUsedHere : "\uC6F9\uD398\uC774\uC9C0\uC758 \uD654\uBA74 \uAD6C\uC870\uC640 \uCF58\uD150\uCE20\uB97C \uBE0C\uB77C\uC6B0\uC800\uC5D0 \uC815\uD655\uD558\uAC8C \uD45C\uC2DC\uD558\uAE30 \uC704\uD574 \uC791\uC131\uD588\uC2B5\uB2C8\uB2E4.";
    const beginnerDetail = /^<[A-Z]/.test(trimmed) ? null : describeHtmlForBeginner(trimmed, tagName);
    if (beginnerDetail) {
      easyExplanation = beginnerDetail.easy;
      whyUsedHere = beginnerDetail.why;
    } else if (!info || /^<[A-Z]/.test(trimmed)) {
      const byDef = describeHtmlByDefinition(trimmed, tagName);
      if (byDef) {
        easyExplanation = byDef.easy;
        whyUsedHere = byDef.why;
      }
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
        tokens: extractHtmlTokens(trimmed)
      },
      intermediate: {
        codeCheckVerdict: info ? info.codeCheckVerdict : `\uBB38\uBC95\uC801\uC73C\uB85C \uC815\uC0C1\uC801\uC778 <${tagName}> \uD0DC\uADF8\uC785\uB2C8\uB2E4.`,
        betterRefactor: info?.betterRefactor,
        suggestedAdditions: info?.suggestedAdditions
      },
      advanced: {
        bugAudit: {
          hasIssue: info?.bugSeverity !== "none",
          severity: info?.bugSeverity || "none",
          issueTitle: info?.bugIssueTitle || "\uCF54\uB4DC \uAD6C\uC870 \uC815\uC0C1",
          issueDetail: info?.bugIssueDetail || "\uC2E0\uD0DD\uC2A4 \uBC0F \uB7F0\uD0C0\uC784 \uC7A0\uC7AC \uACB0\uD568 \uC5C6\uC74C."
        },
        missingAudit: {
          hasMissing: Boolean(info?.missingSnippet),
          missingTitle: info?.missingTitle || "\uB204\uB77D \uC5C6\uC74C",
          missingSnippet: info?.missingSnippet || "",
          reason: info?.missingReason || ""
        },
        recommendedPatch: info?.recommendedPatch
      }
    };
  }
  if (/^(const|let|var)\s+/.test(trimmed)) {
    const parts = trimmed.split(/\s+/);
    const keyword = parts[0];
    const varName = parts[1] ? parts[1].replace(/[:=;]/g, "") : "\uBCC0\uC218";
    return {
      lineNumber,
      code: line,
      isBlank: false,
      shortRole: `\uBCC0\uC218 '${varName}' \uC120\uC5B8 \uBC0F \uAC12 \uC800\uC7A5`,
      subCommentBeginner: `${varName} \uBCC0\uC218 \uC0C1\uC790\uB97C \uB9CC\uB4E4\uC5B4 \uC624\uB978\uCABD \uAC12\uC744 \uC548\uC804\uD558\uAC8C \uC800\uC7A5\uD569\uB2C8\uB2E4.`,
      subCommentIntermediate: `\uBCC0\uC218 \uBC14\uC778\uB529 (${keyword} \uC2A4\uCF54\uD504, \uC7AC\uD560\uB2F9 \uC5EC\uBD80 \uC810\uAC80)`,
      subCommentAdvanced: `[SCOPE] ${keyword} \uC2DD\uBCC4\uC790 \uBC14\uC778\uB529. Immutable \uCC38\uC870 \uAD8C\uC7A5.`,
      beginner: {
        easyExplanation: `\uCEF4\uD4E8\uD130 \uAE30\uC5B5 \uACF5\uAC04(\uBA54\uBAA8\uB9AC)\uC5D0 '${varName}'\uC774\uB77C\uB294 \uC774\uB984\uD45C\uB97C \uBD99\uC778 \uC0C1\uC790\uB97C \uB9CC\uB4E4\uACE0, \uB4F1\uD638(=) \uC624\uB978\uCABD\uC758 \uB370\uC774\uD130\uB098 \uACC4\uC0B0 \uACB0\uACFC\uB97C \uADF8 \uC0C1\uC790\uC5D0 \uBCF4\uAD00\uD569\uB2C8\uB2E4.`,
        whyUsedHere: "\uB370\uC774\uD130\uB97C \uBCC0\uC218 \uC0C1\uC790\uC5D0 \uB2F4\uC544 \uC774\uB984\uC744 \uBD99\uC5EC\uB450\uC5B4\uC57C \uB2E4\uC74C \uC904 \uCF54\uB4DC\uC5D0\uC11C \uADF8 \uC774\uB984\uC744 \uBD88\uB7EC\uC640 \uACC4\uC0B0\uD558\uAC70\uB098 \uD654\uBA74\uC5D0 \uCD9C\uB825\uD560 \uC218 \uC788\uAE30 \uB54C\uBB38\uC5D0 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
        wrongExample: {
          code: `var ${varName} = ...`,
          reason: "var\uB294 \uBCC0\uC218 \uC911\uBCF5 \uC120\uC5B8\uACFC \uD568\uC218 \uC2A4\uCF54\uD504 \uD638\uC774\uC2A4\uD305\uC73C\uB85C \uC778\uD574 \uC608\uAE30\uCE58 \uBABB\uD55C \uBC84\uADF8\uB97C \uB9CC\uB4E4\uAE30 \uC26C\uC6B4 \uC624\uB798\uB41C \uBC29\uC2DD\uC785\uB2C8\uB2E4."
        },
        betterExample: {
          code: `const ${varName} = ...`,
          reason: "\uAC12\uC774 \uB2E4\uC2DC \uBC14\uB00C\uC9C0 \uC54A\uB294\uB2E4\uBA74 let \uB300\uC2E0 const\uB97C \uC4F0\uB294 \uAC83\uC774 \uC2E4\uC218\uB85C \uAC12\uC774 \uB36E\uC5B4\uC50C\uC6CC\uC9C0\uB294 \uBC84\uADF8\uB97C \uB9C9\uC544\uC90D\uB2C8\uB2E4."
        },
        tokens: [
          {
            token: keyword,
            meaning: keyword === "const" ? "\uC7AC\uD560\uB2F9\uC774 \uBD88\uAC00\uB2A5\uD55C \uC548\uC804\uD55C \uC0C1\uC218(\uACE0\uC815 \uBCC0\uC218) \uC120\uC5B8" : "\uC7AC\uD560\uB2F9\uC774 \uAC00\uB2A5\uD55C \uBE14\uB85D \uC2A4\uCF54\uD504 \uBCC0\uC218 \uC120\uC5B8"
          },
          { token: varName, meaning: "\uC6B0\uB9AC\uAC00 \uC9C0\uC5B4\uC900 \uBCC0\uC218 \uC774\uB984" },
          { token: "=", meaning: "\uC624\uB978\uCABD\uC758 \uAC12\uC744 \uC67C\uCABD \uBCC0\uC218\uC5D0 \uB300\uC785\uD558\uB294 \uC5F0\uC0B0\uC790" }
        ]
      },
      intermediate: {
        codeCheckVerdict: keyword === "var" ? "\u26A0\uFE0F ES5 \uAD6C\uD615 var \uD0A4\uC6CC\uB4DC\uAC00 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4. ES6+ \uBE14\uB85D \uC2A4\uCF54\uD504\uC778 const\uB098 let\uC73C\uB85C \uAD50\uCCB4\uD574\uC57C \uD569\uB2C8\uB2E4." : `${keyword} \uD0A4\uC6CC\uB4DC\uB85C \uC548\uC804\uD558\uAC8C \uC120\uC5B8\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBCC0\uC218 \uC7AC\uD560\uB2F9 \uC5EC\uBD80\uC5D0 \uB530\uB77C const \uC0AC\uC6A9\uC744 \uAD8C\uC7A5\uD569\uB2C8\uB2E4.`,
        betterRefactor: {
          code: `const ${varName} = ...;`,
          reason: "\uBD88\uBCC0\uC131(Immutability)\uC744 \uBCF4\uC7A5\uD558\uC5EC \uC0AC\uC774\uB4DC \uC774\uD399\uD2B8\uB97C \uCD5C\uC18C\uD654\uD569\uB2C8\uB2E4."
        },
        suggestedAdditions: [
          {
            code: `// Type / Null Check`,
            meaning: "\uBC29\uC5B4\uC801 \uC720\uD6A8\uC131 \uAC80\uC0AC \uCF54\uB4DC",
            whyAdd: "\uD574\uB2F9 \uBCC0\uC218\uC5D0 \uC608\uC0C1\uCE58 \uBABB\uD55C undefined\uB098 null\uC774 \uB4E4\uC5B4\uC654\uC744 \uB54C \uB7F0\uD0C0\uC784 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD558\uC9C0 \uC54A\uB3C4\uB85D \uAE30\uBCF8\uAC12\uC744 \uBCF4\uC7A5\uD558\uAE30 \uC704\uD568\uC785\uB2C8\uB2E4."
          }
        ]
      },
      advanced: {
        bugAudit: {
          hasIssue: keyword === "var",
          severity: keyword === "var" ? "warning" : "none",
          issueTitle: keyword === "var" ? "ES5 var \uD638\uC774\uC2A4\uD305 \uCDE8\uC57D\uC810" : "\uBCC0\uC218 \uC2A4\uCF54\uD504 \uBB34\uACB0\uC131 \uD1B5\uACFC",
          issueDetail: keyword === "var" ? "Temporal Dead Zone(TDZ) \uBD80\uC7AC\uB85C \uC778\uD55C \uBCC0\uC218 \uC624\uC5FC \uAC00\uB2A5\uC131" : "Lexical Environment \uBE14\uB85D \uC2A4\uCF54\uD504 \uBC14\uC778\uB529 \uC815\uC0C1."
        },
        missingAudit: {
          hasMissing: keyword === "let",
          missingTitle: "const \uBD88\uBCC0\uC131 \uC120\uC5B8 \uAD8C\uC7A5",
          missingSnippet: `const ${varName} = ...`,
          reason: "\uC7AC\uD560\uB2F9\uC774 \uBC1C\uC0DD\uD558\uC9C0 \uC54A\uB294 \uCC38\uC870 \uD0C0\uC785\uC758 \uACBD\uC6B0 const \uC120\uC5B8\uC73C\uB85C V8 \uC5D4\uC9C4 \uCD5C\uC801\uD654 \uC720\uB3C4"
        },
        recommendedPatch: `const ${varName} = ...;`
      }
    };
  }
  if (trimmed.includes(".map(")) {
    return {
      lineNumber,
      code: line,
      isBlank: false,
      shortRole: "\uBC30\uC5F4 \uC694\uC18C \uC77C\uAD04 \uBCC0\uD658 (map)",
      subCommentBeginner: "\uBAA9\uB85D \uC548\uC758 \uC22B\uC790\uB97C \uD558\uB098\uC529 \uAEBC\uB0B4 2\uB97C \uACF1\uD55C \uC0C8 \uBAA9\uB85D\uC744 \uB9CC\uB4ED\uB2C8\uB2E4.",
      subCommentIntermediate: "Array.prototype.map() \uBD88\uBCC0 \uACE0\uCC28 \uD568\uC218 \uB9E4\uD551",
      subCommentAdvanced: "[FUNCTIONAL] Pure Array.map Transform. \uC6D0\uBCF8 \uBC30\uC5F4 Mutation \uC5C6\uC74C.",
      beginner: {
        easyExplanation: "\uBC30\uC5F4(\uBAA9\uB85D) \uC548\uC5D0 \uB4E4\uC5B4\uC788\uB294 \uBAA8\uB4E0 \uB370\uC774\uD130\uB97C \uD558\uB098\uC529 \uCC28\uB840\uB300\uB85C \uAEBC\uB0B4 \uAD04\uD638 \uC548\uC758 \uADDC\uCE59\uB300\uB85C \uBCC0\uD658\uD55C \uB4A4, \uB611\uAC19\uC740 \uAC1C\uC218\uC758 \uC0C8\uB85C\uC6B4 \uBC30\uC5F4\uC744 \uB9CC\uB4E4\uC5B4\uB0C5\uB2C8\uB2E4.",
        whyUsedHere: "\uBCF5\uC7A1\uD55C for \uBC18\uBCF5\uBB38\uC744 \uC5EC\uB7EC \uC904 \uC4F0\uC9C0 \uC54A\uACE0\uB3C4 \uB370\uC774\uD130 \uBAA9\uB85D \uC804\uCCB4\uB97C \uB2E8 \uD55C \uC904\uB85C \uAE54\uB054\uD558\uACE0 \uC548\uC804\uD558\uAC8C \uBCC0\uD658\uD560 \uC218 \uC788\uAE30 \uB54C\uBB38\uC5D0 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
        wrongExample: {
          code: "for(let i=0; i<numbers.length; i++) { ... push() }",
          reason: "\uB2E8\uC21C\uD55C \uBCC0\uD658\uC5D0 \uBA85\uB839\uD615 for\uBB38\uC744 \uC4F0\uBA74 \uCF54\uB4DC\uAC00 4\uC904 \uC774\uC0C1 \uAE38\uC5B4\uC9C0\uACE0 \uC778\uB371\uC2A4(i) \uC2E4\uC218 \uBC84\uADF8\uAC00 \uC0DD\uAE30\uAE30 \uC27D\uC2B5\uB2C8\uB2E4."
        },
        betterExample: {
          code: "const result = numbers.map((num) => num * 2);",
          reason: "\uBD88\uBCC0\uC131\uC744 \uC9C0\uD0A4\uB294 map \uACE0\uCC28 \uD568\uC218\uC640 \uC758\uBBF8 \uC788\uB294 \uB9E4\uAC1C\uBCC0\uC218\uBA85(num)\uC744 \uC4F0\uBA74 \uCF54\uB4DC\uAC00 \uD6E8\uC52C \uAC04\uACB0\uD558\uACE0 \uC758\uB3C4\uAC00 \uBA85\uD655\uD574\uC9D1\uB2C8\uB2E4."
        },
        tokens: [
          { token: ".map(...)", meaning: "\uBC30\uC5F4 \uC694\uC18C\uB97C \uD558\uB098\uC529 \uAEBC\uB0B4 \uC0C8 \uBC30\uC5F4\uB85C \uBC18\uD658\uD558\uB294 \uACE0\uCC28 \uD568\uC218" },
          { token: "x => x * 2", meaning: "\uAEBC\uB0B8 \uAC12(x)\uC5D0 2\uB97C \uACF1\uD574 \uB3CC\uB824\uC8FC\uB294 \uD654\uC0B4\uD45C \uD568\uC218" }
        ]
      },
      intermediate: {
        codeCheckVerdict: '\uC6D0\uBCF8 \uBC30\uC5F4\uC744 \uC190\uC0C1\uC2DC\uD0A4\uC9C0 \uC54A\uB294 \uC21C\uC218 \uD568\uC218\uD615 \uBCC0\uD658\uC73C\uB85C \uB9E4\uC6B0 \uC6B0\uC218\uD569\uB2C8\uB2E4. \uB9E4\uAC1C\uBCC0\uC218\uBA85\uC774 "x" \uB300\uC2E0 "num" \uB4F1\uC73C\uB85C \uBA85\uD655\uD558\uBA74 \uB354\uC6B1 \uC88B\uC2B5\uB2C8\uB2E4.',
        betterRefactor: {
          code: "const result = numbers.map((num) => num * 2);",
          reason: "\uB2E8\uC77C \uBB38\uC790 x \uB300\uC2E0 \uB3C4\uBA54\uC778\uC744 \uB098\uD0C0\uB0B4\uB294 \uBCC0\uC218\uBA85(num)\uC744 \uC0AC\uC6A9\uD574 \uAC00\uB3C5\uC131\uC744 \uB192\uC785\uB2C8\uB2E4."
        },
        suggestedAdditions: [
          {
            code: ".filter(Boolean)",
            meaning: "\uBE48 \uAC12/\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uB370\uC774\uD130 \uC81C\uAC70 \uD544\uD130\uB9C1",
            whyAdd: "\uBC30\uC5F4\uC5D0 null\uC774\uB098 undefined\uAC00 \uC11E\uC5EC \uC788\uC744 \uB54C NaN(Not a Number) \uC5D0\uB7EC\uAC00 \uBC1C\uC0DD\uD558\uB294 \uAC83\uC744 \uBC29\uC9C0\uD558\uAE30 \uC704\uD568\uC785\uB2C8\uB2E4."
          }
        ]
      },
      advanced: {
        bugAudit: {
          hasIssue: false,
          severity: "none",
          issueTitle: "\uC21C\uC218 \uD568\uC218 \uB9E4\uD551 \uD1B5\uACFC",
          issueDetail: "No side-effects detected. \uBD88\uBCC0\uC131 \uC720\uC9C0."
        },
        missingAudit: {
          hasMissing: true,
          missingTitle: "\uC785\uB825 \uBC30\uC5F4 \uD0C0\uC785 \uAC00\uB4DC \uB204\uB77D",
          missingSnippet: "Array.isArray(numbers) ? numbers.map(...) : []",
          reason: "numbers\uAC00 undefined/null\uC77C \uACBD\uC6B0 TypeError: Cannot read property map of undefined \uB7F0\uD0C0\uC784 \uD06C\uB798\uC2DC \uBC29\uC9C0"
        },
        recommendedPatch: "const result = Array.isArray(numbers) ? numbers.map((num) => num * 2) : [];"
      }
    };
  }
  if (trimmed.includes("console.log") || trimmed.includes("console.error")) {
    return {
      lineNumber,
      code: line,
      isBlank: false,
      shortRole: "\uCF58\uC194 \uCD9C\uB825 (\uB514\uBC84\uAE45)",
      subCommentBeginner: "\uACC4\uC0B0\uB41C \uACB0\uACFC\uAC12\uC744 \uAC1C\uBC1C\uC790 \uB3C4\uAD6C(F12) \uCF58\uC194 \uCC3D\uC5D0 \uCD9C\uB825\uD569\uB2C8\uB2E4.",
      subCommentIntermediate: "\uD45C\uC900 \uCD9C\uB825 \uB85C\uAE45 (\uBC30\uD3EC \uC804 \uC81C\uAC70 \uB610\uB294 \uB85C\uAC70 \uB77C\uC774\uBE0C\uB7EC\uB9AC \uAC80\uD1A0)",
      subCommentAdvanced: "[I/O] stdout \uB514\uBC84\uAE45 \uAD6C\uBB38. \uD504\uB85C\uB355\uC158 \uBC88\uB4E4 \uD2B8\uB9AC\uC250\uC774\uD0B9 \uC810\uAC80 \uB300\uC0C1.",
      beginner: {
        easyExplanation: "\uAD04\uD638 \uC548\uC5D0 \uB4E4\uC5B4\uC788\uB294 \uAC12\uC774\uB098 \uBCC0\uC218 \uB0B4\uC6A9\uBB3C\uC744 \uBE0C\uB77C\uC6B0\uC800 \uAC1C\uBC1C\uC790 \uB3C4\uAD6C\uC758 \uCF58\uC194(Console) \uCC3D\uC5D0 \uCD9C\uB825\uD558\uC5EC \uB208\uC73C\uB85C \uD655\uC778\uD569\uB2C8\uB2E4.",
        whyUsedHere: "\uCF54\uB4DC\uAC00 \uC5D0\uB7EC \uC5C6\uC774 \uC6D0\uD558\uB294 \uB300\uB85C \uC798 \uACC4\uC0B0\uB418\uC5C8\uB294\uC9C0, \uBCC0\uC218\uC5D0 \uC5B4\uB5A4 \uB370\uC774\uD130\uAC00 \uB4E4\uC5B4\uC788\uB294\uC9C0 \uAC80\uC99D(\uB514\uBC84\uAE45)\uD558\uAE30 \uC704\uD574 \uC791\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
        wrongExample: {
          code: "alert(result);",
          reason: "alert()\uB294 \uC0AC\uC6A9\uC790\uC758 \uBE0C\uB77C\uC6B0\uC800 \uD654\uBA74 \uC804\uCCB4\uB97C \uBA48\uCD94\uAC8C \uB9CC\uB4E4\uC5B4 \uC2E4\uBB34\uC5D0\uC11C \uB514\uBC84\uAE45\uC6A9\uC73C\uB85C \uC808\uB300 \uC0AC\uC6A9\uD558\uBA74 \uC548 \uB429\uB2C8\uB2E4."
        },
        betterExample: {
          code: 'console.log("\uACC4\uC0B0 \uACB0\uACFC:", result);',
          reason: '\uCD9C\uB825\uD560 \uAC12 \uC55E\uC5D0 \uC124\uBA85 \uBB38\uC790\uC5F4("\uACC4\uC0B0 \uACB0\uACFC:")\uC744 \uD568\uAED8 \uB123\uC5B4\uC8FC\uBA74 \uCF58\uC194 \uCC3D\uC5D0\uC11C \uC5B4\uB5A4 \uAC12\uC778\uC9C0 \uBC14\uB85C \uD30C\uC545\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.'
        },
        tokens: [
          { token: "console.log(...)", meaning: "\uAC1C\uBC1C\uC790 \uCF58\uC194\uC5D0 \uAD04\uD638 \uC548\uC758 \uB370\uC774\uD130\uB97C \uCD9C\uB825\uD558\uB294 \uBA85\uB839" }
        ]
      },
      intermediate: {
        codeCheckVerdict: "\uB85C\uCEEC \uB514\uBC84\uAE45\uC6A9\uC73C\uB85C \uC801\uC808\uD569\uB2C8\uB2E4. \uC2E4\uC81C \uD504\uB85C\uB355\uC158(\uBC30\uD3EC) \uD658\uACBD\uC5D0\uC11C\uB294 \uCF58\uC194 \uCC3D\uC5D0 \uBBFC\uAC10 \uC815\uBCF4\uAC00 \uB178\uCD9C\uB418\uC9C0 \uC54A\uB3C4\uB85D \uC81C\uAC70\uD558\uAC70\uB098 logger \uD658\uACBD\uC744 \uBD84\uB9AC\uD574\uC57C \uD569\uB2C8\uB2E4.",
        betterRefactor: {
          code: 'console.log("[DEBUG] \uACB0\uACFC:", result);',
          reason: "\uB85C\uADF8 \uD504\uB9AC\uD53D\uC2A4\uB97C \uBD80\uC5EC\uD574 \uD544\uD130\uB9C1\uC744 \uC6A9\uC774\uD558\uAC8C \uD569\uB2C8\uB2E4."
        },
        suggestedAdditions: [
          {
            code: 'if (process.env.NODE_ENV === "development")',
            meaning: "\uAC1C\uBC1C \uD658\uACBD \uC870\uAC74\uBB38",
            whyAdd: "\uC2E4\uC81C \uC11C\uBE44\uC2A4 \uBC30\uD3EC \uC2DC \uBE0C\uB77C\uC6B0\uC800 \uCF58\uC194 \uCC3D\uC774 \uC9C0\uC800\uBD84\uD574\uC9C0\uAC70\uB098 \uC131\uB2A5 \uC800\uD558\uAC00 \uC77C\uC5B4\uB098\uB294 \uAC83\uC744 \uBC29\uC9C0\uD569\uB2C8\uB2E4."
          }
        ]
      },
      advanced: {
        bugAudit: {
          hasIssue: false,
          severity: "warning",
          issueTitle: "\uD504\uB85C\uB355\uC158 \uCF58\uC194 \uC794\uC874 \uC8FC\uC758",
          issueDetail: "\uBA54\uBAA8\uB9AC \uB204\uC218 \uBC0F \uBE0C\uB77C\uC6B0\uC800 \uCF58\uC194 \uAC1D\uCCB4 \uCC38\uC870 \uC720\uC9C0 \uBC29\uC9C0\uB97C \uC704\uD574 Terser drop_console \uC124\uC815 \uAD8C\uC7A5."
        },
        missingAudit: {
          hasMissing: true,
          missingTitle: "\uAD6C\uC870\uD654\uB41C \uB85C\uAE45 \uD504\uB9AC\uD53D\uC2A4 \uB204\uB77D",
          missingSnippet: 'console.info("[RESULT]", { result })',
          reason: "\uB2E8\uC21C \uC6D0\uC2DC\uAC12 \uCD9C\uB825 \uB300\uC2E0 \uAC1D\uCCB4 \uB798\uD551\uC73C\uB85C \uD0A4-\uAC12 \uC2DD\uBCC4\uC790 \uBCF4\uC7A5"
        },
        recommendedPatch: 'if (process.env.NODE_ENV !== "production") console.log("[RESULT]", result);'
      }
    };
  }
  return {
    lineNumber,
    code: line,
    isBlank: false,
    shortRole: "\uCF54\uB4DC \uBA85\uB839\uBB38 \uC2E4\uD589",
    subCommentBeginner: "\uC774 \uC904\uC758 \uBA85\uB839\uC744 \uC2E4\uD589\uD569\uB2C8\uB2E4.",
    subCommentIntermediate: "\uAD6C\uBB38 \uD3C9\uAC00 \uBC0F \uC2E4\uD589",
    subCommentAdvanced: "[STATEMENT] \uBA85\uB839\uBB38 \uC2E4\uD589 \uD3C9\uAC00.",
    beginner: {
      easyExplanation: `\uC774 \uC904\uC758 \uBA85\uB839(${trimmed})\uC744 \uC2E4\uD589\uD558\uC5EC \uB370\uC774\uD130\uB97C \uC870\uC791\uD558\uAC70\uB098 \uB3D9\uC791\uC744 \uC218\uD589\uD569\uB2C8\uB2E4.`,
      whyUsedHere: "\uD504\uB85C\uADF8\uB7A8\uC758 \uC804\uCCB4 \uC2E4\uD589 \uD750\uB984\uC744 \uC21C\uCC28\uC801\uC73C\uB85C \uC774\uC5B4\uAC00\uAE30 \uC704\uD574 \uC791\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
      tokens: []
    },
    intermediate: {
      codeCheckVerdict: "\uBB38\uBC95\uC801\uC73C\uB85C \uC720\uD6A8\uD55C \uB2E8\uC77C \uC2E4\uD589\uBB38\uC785\uB2C8\uB2E4."
    },
    advanced: {
      bugAudit: {
        hasIssue: false,
        severity: "none",
        issueTitle: "\uBA85\uB839\uBB38 \uAD6C\uBB38 \uAC80\uC99D \uC644\uB8CC",
        issueDetail: "\uD30C\uC2F1 \uC5D0\uB7EC \uC5C6\uC74C."
      },
      missingAudit: {
        hasMissing: false,
        missingTitle: "\uB204\uB77D \uC5C6\uC74C",
        missingSnippet: "",
        reason: "\uC77C\uBC18 \uAD6C\uBB38"
      }
    }
  };
}
var VOID_TAGS2 = /* @__PURE__ */ new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr", "!doctype"]);
function findOpenerLines(rawLines) {
  const result = [];
  const stacks = [];
  const braceStack = [];
  const tagStack = [];
  rawLines.forEach((line) => {
    const trimmed = line.trim();
    let ctx;
    if (trimmed.startsWith("<")) {
      const tagRe = /<(\/?)([!a-zA-Z][\w-]*)([^>]*?)(\/?)>/g;
      let m;
      let first = true;
      while ((m = tagRe.exec(trimmed)) !== null) {
        const [, closing, rawTag, attrs, selfClose] = m;
        const tag = rawTag.toLowerCase();
        if (closing) {
          let idx = -1;
          for (let i = tagStack.length - 1; i >= 0; i--) {
            if (tagStack[i].tag === tag) {
              idx = i;
              break;
            }
          }
          if (idx >= 0) {
            const open = tagStack[idx];
            tagStack.splice(idx);
            if (first && /^<\/[\w-]+>$/.test(trimmed)) {
              ctx = { kind: "tag", opener: open.line, tag, label: open.label };
            }
          }
        } else if (!selfClose && !VOID_TAGS2.has(tag)) {
          const cls = attrs.match(/(?:class|className|id)\s*=\s*["']([^"']+)["']/);
          tagStack.push({ tag, line: trimmed, label: cls ? cls[1] : "" });
        }
        first = false;
      }
    } else {
      stacks[result.length] = braceStack.filter((b) => b.ch === "{").map((b) => b.line);
      let quote = null;
      let firstPop = true;
      const code = trimmed.replace(/\/\/.*$/, "");
      for (const ch of code) {
        if (quote) {
          if (ch === quote) quote = null;
          continue;
        }
        if (ch === '"' || ch === "'" || ch === "`") {
          quote = ch;
          continue;
        }
        if ("{([".includes(ch)) braceStack.push({ ch, line: trimmed });
        else if ("})]".includes(ch)) {
          const open = braceStack.pop();
          if (firstPop && open && /^[\]})]/.test(trimmed)) ctx = { kind: "brace", opener: open.line };
          firstPop = false;
        }
      }
      if (!ctx && /^[\]})]/.test(trimmed)) ctx = { kind: "brace", opener: "" };
    }
    result.push(ctx);
  });
  return { openers: result, stacks };
}
function buildFallbackAnalysis(rawCode) {
  const cleanCode = rawCode.replace(/\r\n/g, "\n");
  const rawLines = cleanCode.split("\n");
  const isHtml = /<!doctype html>|<html|<head|<body|<div|<h1|<p|<form|<input|<button/i.test(
    cleanCode
  );
  const isCss = !isHtml && looksLikeCss(cleanCode);
  const language = isHtml ? "HTML" : isCss ? "CSS" : "JavaScript";
  const { openers, stacks } = findOpenerLines(rawLines);
  const docErrors = checkDocument(rawLines, language);
  const declared = collectDeclared(cleanCode);
  let inScript = false;
  const jsLine = rawLines.map((line) => {
    const t = line.trim();
    let on;
    if (language === "JavaScript") on = true;
    else if (language === "CSS") on = false;
    else on = inScript && !t.startsWith("<");
    if (/<script\b[^>]*>/i.test(t) && !/<\/script>/i.test(t.slice(t.search(/<script\b/i)))) inScript = !/\ssrc=/i.test(t);
    if (/<\/script>/i.test(t)) inScript = false;
    return on;
  });
  const lines = rawLines.map((line, index) => {
    const item = interpretSingleLineFallback(line, index + 1);
    const ctx = openers[index];
    const cssCtx = !line.trim().startsWith("<") ? describeCssLine(line, stacks[index] || []) : null;
    if (cssCtx) {
      const redone = applyCssLevels(item, cssCtx, getLevelDepth(line));
      Object.assign(item, redone);
      item.shortRole = cssCtx.role;
      item.subCommentBeginner = cssCtx.easy;
      item.beginner = { ...item.beginner, definition: cssCtx.definition, easyExplanation: cssCtx.easy, whyUsedHere: cssCtx.why, tokens: cssCtx.tokens };
    } else if (!line.trim().startsWith("<") && (ctx?.kind === "brace" || stacks[index] && stacks[index].length > 0)) {
      const d = describeCodeForBeginner(line, ctx?.kind === "brace" ? ctx.opener : void 0, stacks[index] || []);
      if (d) {
        item.shortRole = d.role;
        item.subCommentBeginner = d.easy;
        item.beginner = { ...item.beginner, definition: d.definition, easyExplanation: d.easy, whyUsedHere: d.why };
      }
    } else if (ctx?.kind === "tag") {
      const label = ctx.label ? `${ctx.label} \uC0C1\uC790` : `<${ctx.tag}> \uAD6C\uC5ED`;
      const easy = `\uC704\uC5D0\uC11C \uC5F4\uC5C8\uB358 ${josa(label, "\uC744/\uB97C")} \uC5EC\uAE30\uC11C \uB2EB\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4. \uC5EC\uB294 \uC904(${ctx.opener.trim()})\uBD80\uD130 \uC774 \uC904 \uC0AC\uC774\uC5D0 \uC788\uB294 \uB0B4\uC6A9\uC774 \uBAA8\uB450 \uADF8 \uC548\uC5D0 \uB4E4\uC5B4\uAC11\uB2C8\uB2E4.`;
      item.subCommentBeginner = `\uC704\uC5D0\uC11C \uC5F4\uC5C8\uB358 ${josa(label, "\uC744/\uB97C")} \uC5EC\uAE30\uC11C \uB2EB\uC2B5\uB2C8\uB2E4.`;
      item.beginner = {
        ...item.beginner,
        easyExplanation: easy,
        whyUsedHere: `${josa(label, "\uC774/\uAC00")} \uC5B4\uB514\uC11C \uB05D\uB098\uB294\uC9C0 \uC54C\uB824\uC918\uC57C, \uADF8 \uB2E4\uC74C\uC5D0 \uC624\uB294 \uB0B4\uC6A9\uC774 \uC0C1\uC790 \uBC16\uC5D0 \uC62C\uBC14\uB974\uAC8C \uB193\uC774\uACE0 \uD654\uBA74\uC774 \uAE68\uC9C0\uC9C0 \uC54A\uAE30 \uB54C\uBB38\uC5D0 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.`
      };
    }
    const err = checkLine(line, { js: jsLine[index], declared }) || docErrors.get(index);
    return err ? applySyntaxError(item, err) : { ...item, hasError: false, errorDetail: void 0 };
  });
  const commentedLinesBeginner = [];
  const commentedLinesIntermediate = [];
  const commentedLinesAdvanced = [];
  for (const item of lines) {
    if (item.isBlank) {
      commentedLinesBeginner.push("");
      commentedLinesIntermediate.push("");
      commentedLinesAdvanced.push("");
      continue;
    }
    const indentMatch = item.code.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1] : "";
    commentedLinesBeginner.push(item.code);
    commentedLinesBeginner.push(
      language === "HTML" && item.code.trim().startsWith("<") ? `${indent}<!-- ${item.subCommentBeginner} -->` : isCss ? `${indent}/* ${item.subCommentBeginner} */` : `${indent}// ${item.subCommentBeginner}`
    );
    commentedLinesIntermediate.push(item.code);
    commentedLinesIntermediate.push(
      language === "HTML" && item.code.trim().startsWith("<") ? `${indent}<!-- [CHECK] ${item.subCommentIntermediate} -->` : isCss ? `${indent}/* [CHECK] ${item.subCommentIntermediate} */` : `${indent}// [CHECK] ${item.subCommentIntermediate}`
    );
    commentedLinesAdvanced.push(item.code);
    commentedLinesAdvanced.push(
      language === "HTML" && item.code.trim().startsWith("<") ? `${indent}<!-- ${item.subCommentAdvanced} -->` : isCss ? `${indent}/* ${item.subCommentAdvanced} */` : `${indent}// ${item.subCommentAdvanced}`
    );
  }
  return {
    title: isHtml ? "HTML \uC6F9\uD398\uC774\uC9C0 \uAD6C\uC870 \uB808\uBCA8\uBCC4 \uB9DE\uCDA4 \uD574\uC11D" : isCss ? "CSS \uB514\uC790\uC778 \uADDC\uCE59 \uB808\uBCA8\uBCC4 \uB9DE\uCDA4 \uD574\uC11D" : "\uCF54\uB4DC \uB808\uBCA8\uBCC4 \uB9DE\uCDA4 \uD574\uC11D",
    language,
    summary: "\uCD08\uAE09\uC790(\uCE5C\uC808\uD55C \uD574\uC124 & \uC65C \uC4F0\uC600\uB294\uC9C0), \uC911\uAE09\uC790(\uCF54\uB4DC \uC624\uB958 \uAC80\uC99D & \uCD94\uAC00\uD558\uBA74 \uC88B\uC740 \uCF54\uB4DC), \uC804\uACF5\uC790(\uBC84\uADF8/\uCDE8\uC57D\uC810 & \uB204\uB77D\uB41C \uCF54\uB4DC \uC9C4\uB2E8) \uC218\uC900\uC5D0 \uB9DE\uCDB0 \uC644\uBCBD\uD558\uAC8C \uCC28\uBCC4\uD654\uB41C \uD574\uC11D\uC744 \uC81C\uACF5\uD569\uB2C8\uB2E4.",
    originalCode: cleanCode,
    commentedCodeBeginner: commentedLinesBeginner.join("\n"),
    commentedCodeIntermediate: commentedLinesIntermediate.join("\n"),
    commentedCodeAdvanced: commentedLinesAdvanced.join("\n"),
    lines
  };
}

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
async function startServer() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.post("/api/analyze-code", async (req, res) => {
    const { code } = req.body;
    if (!code || !code.trim()) {
      res.status(400).json({ error: "\uD574\uC11D\uD560 \uCF54\uB4DC\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694." });
      return;
    }
    const cleanCode = code.replace(/\r\n/g, "\n");
    const rawLines = cleanCode.split("\n");
    const numberedCode = rawLines.map((line, idx) => `${idx + 1}: ${line}`).join("\n");
    try {
      const ai = getGeminiClient();
      if (!ai) {
        throw new Error("GEMINI_API_KEY is not set");
      }
      const systemInstruction = `\uB2F9\uC2E0\uC740 \uAC19\uC740 \uCF54\uB4DC\uB97C \uCD08\uAE09\uC790, \uC911\uAE09\uC790, \uC804\uACF5\uC790 3\uAC1C \uC218\uC900\uC73C\uB85C "\uC644\uC804\uD788 \uB2E4\uB978 \uB0B4\uC6A9\uACFC \uB9D0\uD22C"\uB85C \uD574\uC11D\uD574\uC8FC\uB294 'CODEMATE' \uC218\uC11D \uCF54\uB4DC \uD29C\uD130\uC785\uB2C8\uB2E4.
\uC0AC\uC6A9\uC790\uAC00 \uC785\uB825\uD55C \uCF54\uB4DC\uB97C 1\uBC88 \uC904\uBD80\uD130 \uB9C8\uC9C0\uB9C9 ${rawLines.length}\uBC88 \uC904\uAE4C\uC9C0 \uAC01 \uC904\uB9C8\uB2E4 \uC544\uB798 \uADDC\uCE59\uB300\uB85C \uD574\uC11D\uD558\uC138\uC694.
\uC138 \uB808\uBCA8\uC740 \uAC19\uC740 \uBB38\uC7A5\uC744 \uBC18\uBCF5\uD558\uAC70\uB098 \uAC19\uC740 \uB0B4\uC6A9\uC744 \uB9D0\uB9CC \uBC14\uAFD4 \uC4F0\uBA74 \uC548 \uB429\uB2C8\uB2E4. \uB808\uBCA8\uB9C8\uB2E4 \uAD00\uC810 \uC790\uCCB4\uAC00 \uB2EC\uB77C\uC57C \uD569\uB2C8\uB2E4.

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
1. [\uCD08\uAE09\uC790] \uB300\uC0C1: \uCF54\uB529\uC744 \uD55C \uBC88\uB3C4 \uBC30\uC6B4 \uC801 \uC5C6\uB294 \uBE44\uC804\uACF5\uC790 / \uAD00\uC810: "\uC774 \uCF54\uB4DC\uB294 \uBB34\uC5C7\uC778\uAC00(\uC815\uC758)"
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
- IT \uC804\uBB38 \uC6A9\uC5B4(DOM, \uB80C\uB354\uB9C1, \uD30C\uC2F1, \uC2A4\uCF54\uD504, \uBC14\uC778\uB529, \uD638\uC774\uC2A4\uD305, \uC774\uBCA4\uD2B8 \uB4F1)\uB97C \uC4F0\uC9C0 \uB9C8\uC138\uC694. \uAF2D \uD544\uC694\uD558\uBA74 \uAD04\uD638\uB85C \uC77C\uC0C1\uC5B4 \uD480\uC774\uB97C \uBD99\uC774\uC138\uC694.
- \uC77C\uC0C1 \uBE44\uC720(\uC0C1\uC790, \uC774\uB984\uD45C, \uAC04\uD310, \uC6B0\uD3B8\uD568 \uB4F1)\uC640 "\uD654\uBA74\uC5D0 \uBB34\uC5C7\uC774 \uBCF4\uC774\uB294\uC9C0"\uB97C \uC911\uC2EC\uC73C\uB85C \uC124\uBA85\uD558\uC138\uC694.
- subCommentBeginner: \uC774 \uC904\uC774 \uBB34\uC5C7\uC778\uC9C0 \uC26C\uC6B4 \uB9D0 1\uBB38\uC7A5
- definition (\uCF54\uB4DC \uC815\uC758): \uC774 \uC904\uC5D0 \uC4F0\uC778 \uD0DC\uADF8/\uD0A4\uC6CC\uB4DC/\uAE30\uB2A5\uC774 \uC6D0\uB798 \uBB34\uC5C7\uC778\uC9C0 \uC77C\uBC18\uC801\uC778 \uC815\uC758\uB97C 1\uBB38\uC7A5\uC73C\uB85C. \uBC18\uB4DC\uC2DC \uADF8 \uC774\uB984\uC744 \uB123\uC5B4 "~\uB294 ~\uD558\uB294 \uBA85\uB839\uC5B4(\uD0DC\uADF8)\uC785\uB2C8\uB2E4" \uD615\uD0DC\uB85C \uC4F0\uC138\uC694.
  * \uC608: break; -> "break\uB294 \uBC18\uBCF5\uBB38(for, while)\uC774\uB098 switch \uBB38\uC744 \uADF8 \uC790\uB9AC\uC5D0\uC11C \uC989\uC2DC \uB05D\uB0B4\uACE0 \uBE60\uC838\uB098\uC624\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4."
  * \uC608: <h1>\uCF58\uD150\uCE20 \uC601\uC5ED</h1> -> "<h1>\uC740 \uC6F9\uD398\uC774\uC9C0\uC5D0 \uAC00\uC7A5 \uD070 \uC81C\uBAA9\uC744 \uD45C\uC2DC\uD558\uB294 \uCF54\uB4DC\uC785\uB2C8\uB2E4."
  * \uC608: localStorage.setItem('theme', 'dark'); -> "localStorage.setItem\uC740 \uBE0C\uB77C\uC6B0\uC800 \uC548\uC758 \uC800\uC7A5 \uACF5\uAC04\uC5D0 \uAC12\uC744 \uC774\uB984(\uD0A4)\uACFC \uD568\uAED8 \uC800\uC7A5\uD558\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4."
- easyExplanation (\uC774 \uC904\uC740 \uBB34\uC2A8 \uC758\uBBF8\uC778\uAC00\uC694?): definition\uACFC \uACB9\uCE58\uC9C0 \uC54A\uAC8C, "\uC774 \uC904\uC5D0\uC11C\uB294" \uC2E4\uC81C\uB85C \uBB34\uC5C7\uC744 \uD558\uB294\uC9C0 1~2\uBB38\uC7A5.
  * \uBC18\uB4DC\uC2DC \uADF8 \uC904\uC5D0 \uC2E4\uC81C\uB85C \uC801\uD78C \uAE00\uC790(\uD0DC\uADF8 \uC548 \uB0B4\uC6A9)\uC640 \uC18D\uC131 \uAC12(type, placeholder, class, href \uB4F1)\uC744 \uBB38\uC7A5 \uC548\uC5D0 \uADF8\uB300\uB85C \uB123\uC5B4\uC11C, \uADF8 \uCF54\uB4DC\uAC00 \uD654\uBA74\uC5D0\uC11C "\uC5B4\uB5A4 \uBAA8\uC591\uC73C\uB85C \uBB34\uC5C7\uC744" \uB9CC\uB4DC\uB294\uC9C0 \uAD6C\uCCB4\uC801\uC73C\uB85C \uC124\uBA85\uD558\uC138\uC694.
  * "~\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4", "~\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4"\uB85C \uB05D\uB0B4\uC138\uC694. "<h1>\uC740 \uC81C\uBAA9 \uD0DC\uADF8\uC785\uB2C8\uB2E4" \uAC19\uC740 \uC77C\uBC18\uC801\uC778 \uC0AC\uC804\uC2DD \uC815\uC758\uB294 \uAE08\uC9C0\uD569\uB2C8\uB2E4.
  * "\uC774 \uC904\uC758 \uBA85\uB839\uC744 \uC2E4\uD589\uD569\uB2C8\uB2E4", "\uCF54\uB4DC\uAC00 \uC218\uD589\uB429\uB2C8\uB2E4", "\uB3D9\uC791\uC744 \uCC98\uB9AC\uD569\uB2C8\uB2E4"\uCC98\uB7FC \uBB34\uC5C7\uC744 \uD558\uB294\uC9C0 \uC54C \uC218 \uC5C6\uB294 \uBB49\uB6B1\uADF8\uB9B0 \uBB38\uC7A5\uC740 \uC808\uB300 \uC4F0\uC9C0 \uB9C8\uC138\uC694. \uD568\uC218 \uC774\uB984, \uBCC0\uC218 \uC774\uB984, \uAC12, \uC870\uAC74\uC744 \uC2E4\uC81C\uB85C \uB123\uC5B4\uC11C \uADF8 \uC904\uC774 \uC815\uD655\uD788 \uBB34\uC2A8 \uB73B\uC778\uC9C0 \uD480\uC5B4 \uC4F0\uC138\uC694.
  * \uC790\uBC14\uC2A4\uD06C\uB9BD\uD2B8/\uD30C\uC774\uC36C/CSS\uB3C4 \uAC19\uC740 \uBC29\uC2DD\uC73C\uB85C \uC124\uBA85\uD558\uC138\uC694:
    - const [query, setQuery] = useState(''); -> "query\uB77C\uB294 \uAC12\uACFC, \uADF8 \uAC12\uC744 \uBC14\uAFC0 \uB54C \uC4F0\uB294 setQuery\uB77C\uB294 \uAE30\uB2A5\uC744 \uD55C \uC30D\uC73C\uB85C \uB9CC\uB4E4\uACE0, query\uC758 \uCC98\uC74C \uAC12\uC740 \uBE48 \uAE00\uC790('')\uB85C \uC815\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4."
    - if (!query.trim()) return; -> "\uB9CC\uC57D query\uC5D0 \uACF5\uBC31 \uB9D0\uACE0 \uC2E4\uC81C \uAE00\uC790\uAC00 \uD558\uB098\uB3C4 \uC5C6\uC73C\uBA74 \uC5EC\uAE30\uC11C \uBC14\uB85C \uBA48\uCD94\uACE0, \uC544\uB798\uC5D0 \uC788\uB294 \uBA85\uB839\uC740 \uC2E4\uD589\uD558\uC9C0 \uC54A\uB294 \uC870\uAC74\uBB38\uC785\uB2C8\uB2E4."
    - }, [query]); -> "\uC704\uC5D0\uC11C \uC2DC\uC791\uD55C useEffect \uC790\uB3D9 \uC2E4\uD589 \uBB36\uC74C\uC744 \uC5EC\uAE30\uC11C \uB2EB\uB294 \uB3D9\uC2DC\uC5D0, query \uAC12\uC774 \uBC14\uB014 \uB54C\uB9C8\uB2E4 \uC774 \uBB36\uC74C\uC744 \uB2E4\uC2DC \uC2E4\uD589\uD558\uB77C\uACE0 \uC815\uD558\uB294 \uC904\uC785\uB2C8\uB2E4."
    - color: white; -> "\uC774 \uC694\uC18C\uC758 \uAE00\uC790 \uC0C9(color)\uC744 white\uB85C \uC815\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4."
    - \uD55C \uC904\uC5D0 CSS \uC120\uC5B8\uC774 \uC5EC\uB7EC \uAC1C \uC788\uC73C\uBA74(\uC608: width:800px; margin: 0 auto; background:#accbe5; height: 150px; }) \uC808\uB300 \uBB49\uB6B1\uADF8\uB9AC\uC9C0 \uB9D0\uACE0 \u2460\u2461\u2462\u2463 \uBC88\uD638\uB97C \uBD99\uC5EC \uD558\uB098\uC529 \uBAA8\uB450 \uC124\uBA85\uD558\uC138\uC694:
      "\u2460 \uAC00\uB85C \uD3ED(width)\uC744 800\uD53D\uC140\uB85C \uC815\uD569\uB2C8\uB2E4. \u2461 \uBC14\uAE65 \uC5EC\uBC31(margin)\uC744 \uC704\uC544\uB798 0, \uC67C\uCABD\xB7\uC624\uB978\uCABD \uC790\uB3D9(auto)\uC73C\uB85C \uC815\uD569\uB2C8\uB2E4. \uC88C\uC6B0 \uC5EC\uBC31\uC744 \uBE0C\uB77C\uC6B0\uC800\uAC00 \uB611\uAC19\uC774 \uB098\uB220 \uC774 \uC694\uC18C\uAC00 \uAC00\uB85C \uAC00\uC6B4\uB370\uC5D0 \uB193\uC785\uB2C8\uB2E4. \u2462 \uBC30\uACBD(background)\uC744 #accbe5(\uC5F0\uD55C \uD558\uB298\uC0C9)\uB85C \uCE60\uD569\uB2C8\uB2E4. \u2463 \uC138\uB85C \uB192\uC774(height)\uB97C 150\uD53D\uC140\uB85C \uC815\uD569\uB2C8\uB2E4. \uB9C8\uC9C0\uB9C9\uC758 }\uB294 \uAFB8\uBC08 \uADDC\uCE59 \uBB36\uC74C\uC774 \uB05D\uB09C\uB2E4\uB294 \uD45C\uC2DC\uC785\uB2C8\uB2E4."
      \uC0C9 \uCF54\uB4DC(#accbe5, rgb(...))\uB294 \uC5B4\uB5A4 \uC0C9\uC778\uC9C0 \uC6B0\uB9AC\uB9D0 \uC0C9 \uC774\uB984\uB3C4 \uD568\uAED8 \uC54C\uB824\uC8FC\uC138\uC694.
  * \uC608: <h1>\uD658\uC601\uD569\uB2C8\uB2E4</h1> -> "\uC81C\uC77C \uD070 \uAE00\uC528\uB85C \uD658\uC601\uD569\uB2C8\uB2E4\uB97C \uCD9C\uB825\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4."
  * \uC608: <button type="submit">\uB85C\uADF8\uC778</button> -> "\uBC84\uD2BC\uC758 \uD0C0\uC785\uC744 \uC81C\uCD9C\uD560 \uC218 \uC788\uB294 \uBC84\uD2BC \uD615\uC2DD\uC73C\uB85C \uB9CC\uB4E0 \uD6C4 \uADF8 \uBC84\uD2BC\uC758 \uC774\uB984\uC744 \uB85C\uADF8\uC778\uC73C\uB85C \uD45C\uC2DC\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4."
  * \uC608: <input type="text" placeholder="\uC544\uC774\uB514\uB97C \uC785\uB825\uD558\uC138\uC694" required> -> "\uAE00\uC790\uB97C \uC9C1\uC811 \uC785\uB825\uD560 \uC218 \uC788\uB294 \uD55C \uC904 \uC785\uB825\uCE78\uC744 \uB9CC\uB4E4\uACE0, \uCE78 \uC548\uC5D0 '\uC544\uC774\uB514\uB97C \uC785\uB825\uD558\uC138\uC694'\uB77C\uB294 \uD750\uB9B0 \uC548\uB0B4 \uBB38\uAD6C\uB97C \uBBF8\uB9AC \uBCF4\uC5EC\uC8FC\uBA70, \uBE44\uC6CC\uB450\uBA74 \uC81C\uCD9C\uB418\uC9C0 \uC54A\uB3C4\uB85D \uBC18\uB4DC\uC2DC \uCC44\uC6CC\uC57C \uD558\uB294 \uCE78\uC73C\uB85C \uC815\uD558\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4."
  * \uC608: <p>\uC544\uC774\uB514\uB97C \uC785\uB825\uD558\uACE0 \uB85C\uADF8\uC778\uD558\uC138\uC694.</p> -> "'\uC544\uC774\uB514\uB97C \uC785\uB825\uD558\uACE0 \uB85C\uADF8\uC778\uD558\uC138\uC694.'\uB77C\uB294 \uBB38\uC7A5\uC744 \uBCF4\uD1B5 \uD06C\uAE30 \uAE00\uC528\uC758 \uD55C \uBB38\uB2E8\uC73C\uB85C \uD654\uBA74\uC5D0 \uCD9C\uB825\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4."
  * \uC608: <div class="login-box"> -> "\uD654\uBA74\uC758 \uC5EC\uB7EC \uC694\uC18C\uB97C \uD558\uB098\uB85C \uBB36\uB294 \uBCF4\uC774\uC9C0 \uC54A\uB294 \uC0C1\uC790\uB97C \uB9CC\uB4E4\uACE0, \uADF8 \uC0C1\uC790\uC5D0 login-box\uB77C\uB294 \uC774\uB984\uD45C\uB97C \uBD99\uC774\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4."
  * \uC608: const total = 10; -> "total\uC774\uB77C\uB294 \uC774\uB984\uD45C\uB97C \uBD99\uC778 \uC0C1\uC790\uB97C \uB9CC\uB4E4\uACE0 \uADF8 \uC548\uC5D0 \uC22B\uC790 10\uC744 \uB123\uC5B4\uB450\uB294 \uBA85\uB839\uC5B4\uC785\uB2C8\uB2E4."
- whyUsedHere (\uC65C \uC774 \uCF54\uB4DC\uAC00 \uC5EC\uAE30\uC11C \uC0AC\uC6A9\uB418\uC5C8\uB098\uC694? \uBAA9\uC801\uACFC \uC774\uC720 \uC608\uCE21):
  * \uC55E\uB4A4 \uC904\uACFC \uC804\uCCB4 \uD654\uBA74\uC758 \uD750\uB984\uC744 \uBCF4\uACE0, \uC774 \uCF54\uB4DC\uAC00 \uC774 \uD654\uBA74\uC5D0\uC11C "\uC5B4\uB5A4 \uC5ED\uD560"\uC744 \uB9E1\uACE0 \uC788\uB294\uC9C0 \uC2E4\uC81C \uB0B4\uC6A9\uC744 \uB123\uC5B4 \uC608\uCE21\uD574 1~2\uBB38\uC7A5\uC73C\uB85C \uC124\uBA85\uD558\uC138\uC694.
  * \uC608: <h1>\uD658\uC601\uD569\uB2C8\uB2E4</h1> -> "\uC774 \uD654\uBA74\uC5D0\uC11C \uAC00\uC7A5 \uD070 \uCCAB\uBC88\uC9F8 \uC81C\uBAA9 \uAE00\uC790\uB97C \uD45C\uC2DC\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4. \uC0AC\uC6A9\uC790\uAC00 \uC774 \uAD6C\uC5ED\uC5D0 \uB4E4\uC5B4\uC654\uC744 \uB54C \uD658\uC601\uD569\uB2C8\uB2E4\uB97C \uAC00\uC7A5 \uBA3C\uC800 \uB208\uC5D0 \uB744\uAC8C \uBCF4\uC5EC\uC8FC\uB824\uACE0 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
  * \uC608: <button type="submit">\uB85C\uADF8\uC778</button> -> "\uC0AC\uC6A9\uC790\uAC00 \uC785\uB825\uD55C \uC591\uC2DD \uC815\uBCF4\uB97C \uC11C\uBC84\uB85C \uC804\uC1A1(\uC81C\uCD9C)\uD558\uAE30 \uC704\uD574 \uD074\uB9AD\uD560 \uC218 \uC788\uB3C4\uB85D \uBC30\uCE58\uD55C \uB85C\uADF8\uC778 \uD544\uC218 \uBC84\uD2BC\uC785\uB2C8\uB2E4."
  * \uC608: <input type="text" placeholder="\uC544\uC774\uB514\uB97C \uC785\uB825\uD558\uC138\uC694"> -> "\uB85C\uADF8\uC778\uC5D0 \uD544\uC694\uD55C \uC0AC\uC6A9\uC790\uC758 \uC544\uC774\uB514\uB97C \uD654\uBA74\uC5D0\uC11C \uC9C1\uC811 \uC785\uB825\uBC1B\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
  * \uC608: <div class="login-box"> -> "\uC774\uB984\uD45C(login-box)\uB85C \uBCF4\uC544 \uB85C\uADF8\uC778 \uAD00\uB828 \uC81C\uBAA9\xB7\uC785\uB825\uCE78\xB7\uBC84\uD2BC \uAC19\uC740 \uC694\uC18C\uB4E4\uC744 \uD55C \uB369\uC5B4\uB9AC\uB85C \uBB36\uC5B4\uC11C \uD568\uAED8 \uAFB8\uBBF8\uAC70\uB098 \uC704\uCE58\uB97C \uC815\uD558\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
- wrongExample / betterExample: \uCD08\uBCF4\uC790\uAC00 \uD754\uD788 \uD558\uB294 \uC2E4\uC218\uC640 \uC62C\uBC14\uB978 \uAE30\uCD08 \uCF54\uB4DC (reason\uB3C4 \uC26C\uC6B4 \uB9D0)
- tokens: \uD0DC\uADF8\xB7\uC18D\uC131\xB7\uD0A4\uC6CC\uB4DC \uC870\uAC01\uB9C8\uB2E4 \uC26C\uC6B4 \uB9D0 \uB73B\uD480\uC774

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
2. [\uC911\uAE09\uC790] \uB300\uC0C1: \uAE30\uCD08 \uBB38\uBC95\uC740 \uC544\uB294 \uC8FC\uB2C8\uC5B4 \uAC1C\uBC1C\uC790 / \uAD00\uC810: "\uC774 \uCF54\uB4DC\uAC00 \uC5B4\uB5BB\uAC8C \uC791\uB3D9\uD558\uB294\uAC00(\uC791\uB3D9 \uC6D0\uB9AC)"
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
- "~\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4" \uAC19\uC740 \uC815\uC758 \uC124\uBA85\uC740 \uD558\uC9C0 \uB9C8\uC138\uC694. \uC911\uAE09\uC790\uB294 \uC774\uBBF8 \uC815\uC758\uB97C \uC555\uB2C8\uB2E4.
- \uB300\uC2E0 \uBE0C\uB77C\uC6B0\uC800/\uC5D4\uC9C4\uC774 \uC774 \uC904\uC744 \uC5B4\uB5A4 \uC21C\uC11C\uB85C \uCC98\uB9AC\uD558\uB294\uC9C0, \uAC12\uACFC \uB370\uC774\uD130\uAC00 \uC5B4\uB514\uC11C \uC5B4\uB514\uB85C \uD750\uB974\uB294\uC9C0, \uB2E4\uB978 \uC904\uACFC \uC5B4\uB5BB\uAC8C \uC5F0\uACB0\uB418\uC5B4 \uB3D9\uC791\uD558\uB294\uC9C0 \uC124\uBA85\uD558\uC138\uC694.
- isBasic: \uB2EB\uB294 \uD0DC\uADF8, \uAD04\uD638\uB9CC \uC788\uB294 \uC904, <!DOCTYPE>, <html>, <head>, <body>, \uB2E8\uC21C console.log, import \uBB38\uCC98\uB7FC \uC124\uBA85\uC774 \uD544\uC694 \uC5C6\uB294 \uAC04\uB2E8\uD55C \uAE30\uBCF8 \uCF54\uB4DC\uBA74 true, \uC544\uB2C8\uBA74 false.
  * isBasic\uC774 true\uBA74: howItWorks\uB294 \uC9E7\uC740 1\uBB38\uC7A5, subCommentIntermediate\uB294 "\uAE30\uBCF8 \uCF54\uB4DC (\uC791\uB3D9 \uC6D0\uB9AC \uC124\uBA85 \uC0DD\uB7B5)", betterRefactor\uC640 suggestedAdditions\uB294 \uC0DD\uB7B5\uD558\uC138\uC694.
- howItWorks (\uC5B4\uB5BB\uAC8C \uC791\uB3D9\uD558\uB098\uC694?): \uC791\uB3D9 \uC6D0\uB9AC 2~3\uBB38\uC7A5
- subCommentIntermediate: \uC791\uB3D9 \uC6D0\uB9AC \uD575\uC2EC \uD55C \uC904 \uC694\uC57D
- codeCheckVerdict: \uB3D9\uC791\uC0C1 \uBB38\uC81C\uAC00 \uC5C6\uB294\uC9C0 \uAC80\uC99D \uC18C\uACAC
- betterRefactor: \uB354 \uB098\uC740 \uCF54\uB4DC \uCD94\uCC9C (\uB9AC\uD329\uD1A0\uB9C1, \uC6F9 \uD45C\uC900, \uC131\uB2A5)
- suggestedAdditions: \uB354 \uCD94\uAC00\uD558\uBA74 \uC88B\uC744 \uCF54\uB4DC\uC640 \uADF8 \uC774\uC720

\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
3. [\uC804\uACF5\uC790] \uB300\uC0C1: \uD604\uC5C5 \uAC1C\uBC1C\uC790\xB7CS \uC804\uACF5\uC790 / \uAD00\uC810: "\uAE30\uC220 \uC2A4\uD399\uACFC \uB0B4\uBD80 \uB3D9\uC791, \uACB0\uD568"
\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
- \uC26C\uC6B4 \uD480\uC774\uB098 \uBE44\uC720\uB294 \uAE08\uC9C0\uD569\uB2C8\uB2E4. \uC815\uD655\uD55C IT \uC804\uBB38 \uC6A9\uC5B4\uB97C \uC801\uADF9 \uC0AC\uC6A9\uD558\uC138\uC694.
  (\uC608: HTML Living Standard, ECMAScript \uC2A4\uD399, tokenizer/tree construction, CSSOM, Render Tree, Layout/Paint, Lexical Environment, TDZ, \uD074\uB85C\uC800, \uC774\uBCA4\uD2B8 \uB8E8\uD504, \uC2DC\uAC04 \uBCF5\uC7A1\uB3C4, \uD799/\uC2A4\uD0DD, XSS/CSRF, WCAG/ARIA, accessible name, render-blocking, tree-shaking \uB4F1)
- technicalDetail (\uAE30\uC220 \uBD84\uC11D): \uC2A4\uD399\xB7\uB0B4\uBD80 \uCC98\uB9AC \uACFC\uC815\xB7\uC131\uB2A5\xB7\uBCF4\uC548\xB7\uC811\uADFC\uC131 \uAD00\uC810\uC5D0\uC11C 2~4\uBB38\uC7A5
- subCommentAdvanced: \uC804\uBB38 \uC6A9\uC5B4\uB85C \uB41C \uC7A0\uC7AC \uBC84\uADF8/\uB204\uB77D \uC810\uAC80 \uC8FC\uC11D
- bugAudit: \uB7F0\uD0C0\uC784 \uC624\uB958, \uCDE8\uC57D\uC810, \uC5E3\uC9C0 \uCF00\uC774\uC2A4 \uBD84\uC11D (hasIssue, severity, issueTitle, issueDetail)
- missingAudit: \uB204\uB77D\uB41C \uCF54\uB4DC(\uD544\uC218 \uC18D\uC131, A11y, \uC608\uC678\uCC98\uB9AC \uB4F1) \uC9C4\uB2E8 (hasMissing, missingTitle, missingSnippet, reason)
- recommendedPatch: \uCD5C\uC801\uD654 \uD328\uCE58 \uC644\uC131 \uCF54\uB4DC`;
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `\uB2E4\uC74C \uCF54\uB4DC\uB97C \uCD08\uAE09\uC790, \uC911\uAE09\uC790, \uC804\uACF5\uC790 3\uB2E8\uACC4 \uB808\uBCA8\uBCC4\uB85C \uC815\uBC00 \uBD84\uC11D\uD574\uC8FC\uC138\uC694:

${numberedCode}`,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: "\uC774 \uCF54\uB4DC\uAC00 \uBB34\uC5C7\uC744 \uD558\uB294 \uCF54\uB4DC\uC778\uC9C0 \uD55C \uC904 \uC81C\uBAA9"
              },
              language: {
                type: Type.STRING,
                description: "\uCF54\uB4DC \uC5B8\uC5B4 (\uC608: HTML, JavaScript, CSS, Python)"
              },
              summary: {
                type: Type.STRING,
                description: "\uC804\uCCB4 \uCF54\uB4DC 1~2\uBB38\uC7A5 \uC694\uC57D"
              },
              lines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    lineNumber: { type: Type.INTEGER },
                    shortRole: { type: Type.STRING },
                    subCommentBeginner: { type: Type.STRING },
                    subCommentIntermediate: { type: Type.STRING },
                    subCommentAdvanced: { type: Type.STRING },
                    beginner: {
                      type: Type.OBJECT,
                      properties: {
                        definition: { type: Type.STRING },
                        easyExplanation: { type: Type.STRING },
                        whyUsedHere: { type: Type.STRING },
                        wrongExample: {
                          type: Type.OBJECT,
                          properties: {
                            code: { type: Type.STRING },
                            reason: { type: Type.STRING }
                          },
                          required: ["code", "reason"]
                        },
                        betterExample: {
                          type: Type.OBJECT,
                          properties: {
                            code: { type: Type.STRING },
                            reason: { type: Type.STRING }
                          },
                          required: ["code", "reason"]
                        },
                        tokens: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              token: { type: Type.STRING },
                              meaning: { type: Type.STRING }
                            },
                            required: ["token", "meaning"]
                          }
                        }
                      },
                      required: ["definition", "easyExplanation", "whyUsedHere", "tokens"]
                    },
                    intermediate: {
                      type: Type.OBJECT,
                      properties: {
                        isBasic: { type: Type.BOOLEAN },
                        howItWorks: { type: Type.STRING },
                        codeCheckVerdict: { type: Type.STRING },
                        betterRefactor: {
                          type: Type.OBJECT,
                          properties: {
                            code: { type: Type.STRING },
                            reason: { type: Type.STRING }
                          },
                          required: ["code", "reason"]
                        },
                        suggestedAdditions: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              code: { type: Type.STRING },
                              meaning: { type: Type.STRING },
                              whyAdd: { type: Type.STRING }
                            },
                            required: ["code", "meaning", "whyAdd"]
                          }
                        }
                      },
                      required: ["isBasic", "howItWorks", "codeCheckVerdict"]
                    },
                    advanced: {
                      type: Type.OBJECT,
                      properties: {
                        technicalDetail: { type: Type.STRING },
                        bugAudit: {
                          type: Type.OBJECT,
                          properties: {
                            hasIssue: { type: Type.BOOLEAN },
                            severity: {
                              type: Type.STRING,
                              description: "none, warning, error, security \uC911 \uD558\uB098"
                            },
                            issueTitle: { type: Type.STRING },
                            issueDetail: { type: Type.STRING }
                          },
                          required: ["hasIssue", "severity", "issueTitle", "issueDetail"]
                        },
                        missingAudit: {
                          type: Type.OBJECT,
                          properties: {
                            hasMissing: { type: Type.BOOLEAN },
                            missingTitle: { type: Type.STRING },
                            missingSnippet: { type: Type.STRING },
                            reason: { type: Type.STRING }
                          },
                          required: ["hasMissing", "missingTitle", "missingSnippet", "reason"]
                        },
                        recommendedPatch: { type: Type.STRING }
                      },
                      required: ["technicalDetail", "bugAudit", "missingAudit"]
                    }
                  },
                  required: [
                    "lineNumber",
                    "shortRole",
                    "subCommentBeginner",
                    "subCommentIntermediate",
                    "subCommentAdvanced",
                    "beginner",
                    "intermediate",
                    "advanced"
                  ]
                }
              }
            },
            required: ["title", "language", "summary", "lines"]
          }
        }
      });
      const textOutput = response.text;
      if (!textOutput) {
        throw new Error("Empty AI response");
      }
      const aiParsed = JSON.parse(textOutput);
      const fallbackMaster = buildFallbackAnalysis(cleanCode);
      const mergedLines = rawLines.map((rawLine, idx) => {
        const lineNum = idx + 1;
        const isBlank = rawLine.trim().length === 0;
        const aiLine = aiParsed.lines?.find((l) => l.lineNumber === lineNum);
        const fallbackLine = fallbackMaster.lines[idx] ?? interpretSingleLineFallback(rawLine, lineNum);
        if (!aiLine || isBlank) {
          return fallbackLine;
        }
        const merged = {
          lineNumber: lineNum,
          code: rawLine,
          isBlank: false,
          shortRole: aiLine.shortRole || fallbackLine.shortRole,
          hasError: fallbackLine.hasError,
          errorDetail: fallbackLine.errorDetail,
          subCommentBeginner: aiLine.subCommentBeginner || fallbackLine.subCommentBeginner,
          subCommentIntermediate: aiLine.subCommentIntermediate || fallbackLine.subCommentIntermediate,
          subCommentAdvanced: aiLine.subCommentAdvanced || fallbackLine.subCommentAdvanced,
          beginner: {
            definition: aiLine.beginner?.definition || fallbackLine.beginner.definition,
            easyExplanation: aiLine.beginner?.easyExplanation || fallbackLine.beginner.easyExplanation,
            whyUsedHere: aiLine.beginner?.whyUsedHere || fallbackLine.beginner.whyUsedHere,
            wrongExample: aiLine.beginner?.wrongExample || fallbackLine.beginner.wrongExample,
            betterExample: aiLine.beginner?.betterExample || fallbackLine.beginner.betterExample,
            tokens: aiLine.beginner?.tokens && aiLine.beginner.tokens.length > 0 ? aiLine.beginner.tokens : fallbackLine.beginner.tokens
          },
          intermediate: {
            isBasic: typeof aiLine.intermediate?.isBasic === "boolean" ? aiLine.intermediate.isBasic : fallbackLine.intermediate.isBasic,
            howItWorks: aiLine.intermediate?.howItWorks || fallbackLine.intermediate.howItWorks,
            codeCheckVerdict: aiLine.intermediate?.codeCheckVerdict || fallbackLine.intermediate.codeCheckVerdict,
            betterRefactor: aiLine.intermediate?.betterRefactor || fallbackLine.intermediate.betterRefactor,
            suggestedAdditions: aiLine.intermediate?.suggestedAdditions || fallbackLine.intermediate.suggestedAdditions
          },
          advanced: {
            technicalDetail: aiLine.advanced?.technicalDetail || fallbackLine.advanced.technicalDetail,
            bugAudit: aiLine.advanced?.bugAudit || fallbackLine.advanced.bugAudit,
            missingAudit: aiLine.advanced?.missingAudit || fallbackLine.advanced.missingAudit,
            recommendedPatch: aiLine.advanced?.recommendedPatch || fallbackLine.advanced.recommendedPatch
          }
        };
        if (fallbackLine.hasError && fallbackLine.errorDetail) {
          return applySyntaxError(merged, {
            detail: fallbackLine.errorDetail,
            fixed: fallbackLine.advanced.bugAudit.issueTitle.startsWith("\uBB38\uBC95 \uC624\uB958") ? fallbackLine.advanced.recommendedPatch : void 0
          });
        }
        return merged;
      });
      const result = {
        title: aiParsed.title || fallbackMaster.title,
        language: aiParsed.language || fallbackMaster.language,
        summary: aiParsed.summary || fallbackMaster.summary,
        originalCode: cleanCode,
        commentedCodeBeginner: fallbackMaster.commentedCodeBeginner,
        commentedCodeIntermediate: fallbackMaster.commentedCodeIntermediate,
        commentedCodeAdvanced: fallbackMaster.commentedCodeAdvanced,
        lines: mergedLines
      };
      res.json(result);
    } catch (error) {
      console.warn("Using built-in multi-level analyzer fallback:", error);
      const fallbackResult = buildFallbackAnalysis(cleanCode);
      res.json(fallbackResult);
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  const PORT = Number(process.env.PORT) || 3e3;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CODEMATE server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
