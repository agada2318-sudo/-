// server.ts
import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

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
    easyExplanation: "\uC774 \uD654\uBA74\uC5D0\uC11C \uAC00\uC7A5 \uC911\uC694\uD558\uACE0 \uD070 \uCCAB \uBC88\uC9F8 \uB300\uD45C \uC81C\uBAA9 \uAE00\uC790\uB97C \uD45C\uC2DC\uD558\uB294 \uD0DC\uADF8\uC785\uB2C8\uB2E4.",
    whyUsedHere: '\uC0AC\uC6A9\uC790\uAC00 \uD654\uBA74\uC744 \uCF30\uC744 \uB54C "\uC5EC\uAE30\uAC00 \uB85C\uADF8\uC778\uD558\uB294 \uACF3\uC774\uAD6C\uB098"\uB77C\uACE0 \uD55C\uB208\uC5D0 \uC54C \uC218 \uC788\uB3C4\uB85D \uC2DC\uAC01\uC801\uC774\uACE0 \uAD6C\uC870\uC801\uC778 \uCCAB\uC778\uC0C1\uC744 \uC8FC\uAE30 \uC704\uD574 \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.',
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
    easyExplanation: "\uC0AC\uC6A9\uC790\uAC00 \uB9C8\uC6B0\uC2A4\uB85C \uD074\uB9AD\uD558\uAC70\uB098 \uC2A4\uB9C8\uD2B8\uD3F0\uC5D0\uC11C \uD130\uCE58\uD558\uC5EC \uB85C\uADF8\uC778 \uB3D9\uC791\uC744 \uC11C\uBC84\uB85C \uC81C\uCD9C\uD558\uB294 \uBC84\uD2BC\uC785\uB2C8\uB2E4.",
    whyUsedHere: '\uC544\uC774\uB514 \uC785\uB825\uC744 \uB9C8\uCE5C \uC0AC\uC6A9\uC790\uAC00 "\uC774\uC81C \uC774 \uC815\uBCF4\uB97C \uBCF4\uB0B4\uC918!"\uB77C\uACE0 \uBA85\uB839\uC744 \uB0B4\uB9AC\uB294 \uCD5C\uC885 \uC2E4\uD589 \uD2B8\uB9AC\uAC70\uB85C \uC0AC\uC6A9\uB418\uC5C8\uC2B5\uB2C8\uB2E4.',
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
function detectLineSyntaxError(line) {
  const trimmed = line.trim();
  if (!trimmed) return { hasError: false };
  if (trimmed.startsWith("<") && !trimmed.endsWith(">") && !trimmed.includes(">")) {
    return {
      hasError: true,
      errorDetail: "\uD0DC\uADF8 \uB05D\uC744 \uB2EB\uB294 \uAD04\uD638(>)\uAC00 \uB204\uB77D\uB418\uC5C8\uC2B5\uB2C8\uB2E4. <\uD0DC\uADF8> \uD615\uD0DC\uB85C \uC644\uC131\uD574\uC57C \uD569\uB2C8\uB2E4."
    };
  }
  if (!trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return {
      hasError: true,
      errorDetail: "\uD0DC\uADF8 \uC2DC\uC791 \uAD04\uD638(<)\uAC00 \uB204\uB77D\uB418\uC5C8\uC2B5\uB2C8\uB2E4. <" + trimmed + " \uD615\uD0DC\uB85C \uC5F4\uC5B4\uC57C \uD569\uB2C8\uB2E4."
    };
  }
  if ((trimmed.match(/"/g)?.length || 0) % 2 !== 0 || (trimmed.match(/'/g)?.length || 0) % 2 !== 0) {
    return {
      hasError: true,
      errorDetail: `\uC18D\uC131\uAC12\uC774\uB098 \uBB38\uC790\uC5F4\uC758 \uB530\uC634\uD45C(" \uB610\uB294 ') \uC9DD\uC774 \uB9DE\uC9C0 \uC54A\uC544 \uB2EB\uD788\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.`
    };
  }
  if (/^(let|const|var)\s*=\s*/.test(trimmed)) {
    return {
      hasError: true,
      errorDetail: "\uBCC0\uC218 \uD0A4\uC6CC\uB4DC(let/const) \uB4A4\uC5D0 \uBCC0\uC218 \uC774\uB984\uC774 \uB204\uB77D\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
    };
  }
  if (/^(let|const|var)\s+[a-zA-Z0-9_$]+\s*==\s*/.test(trimmed)) {
    return {
      hasError: true,
      errorDetail: "\uBCC0\uC218\uC5D0 \uAC12\uC744 \uB300\uC785\uD560 \uB54C\uB294 ==(\uBE44\uAD50)\uAC00 \uC544\uB2CC =(\uB300\uC785)\uC744 \uC0AC\uC6A9\uD574\uC57C \uD569\uB2C8\uB2E4."
    };
  }
  const openParens = (trimmed.match(/\(/g) || []).length;
  const closeParens = (trimmed.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    return {
      hasError: true,
      errorDetail: "\uC18C\uAD04\uD638 ()\uC758 \uC5F4\uB9BC/\uB2EB\uD798 \uAC1C\uC218\uAC00 \uB9DE\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."
    };
  }
  if (/^<[a-zA-Z0-9-]+\/\s*>/.test(trimmed) === false && /^<[a-zA-Z0-9-]+\/$/.test(trimmed)) {
    return {
      hasError: true,
      errorDetail: "\uC2AC\uB798\uC2DC(/) \uC704\uCE58\uAC00 \uC798\uBABB\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uB2EB\uB294 \uD0DC\uADF8\uB294 </\uD0DC\uADF8> \uD615\uD0DC\uC5EC\uC57C \uD569\uB2C8\uB2E4."
    };
  }
  return { hasError: false };
}
function interpretSingleLineFallback(line, lineNumber) {
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
    return {
      lineNumber,
      code: line,
      isBlank: false,
      shortRole,
      subCommentBeginner: subBeginner,
      subCommentIntermediate: subIntermediate,
      subCommentAdvanced: subAdvanced,
      beginner: {
        easyExplanation: info ? info.easyExplanation : `\uD654\uBA74\uC5D0 <${tagName}> \uC694\uC18C\uB97C \uBC30\uCE58\uD558\uB294 HTML \uCF54\uB4DC\uC785\uB2C8\uB2E4.`,
        whyUsedHere: info ? info.whyUsedHere : "\uC6F9\uD398\uC774\uC9C0\uC758 \uD654\uBA74 \uAD6C\uC870\uC640 \uCF58\uD150\uCE20\uB97C \uBE0C\uB77C\uC6B0\uC800\uC5D0 \uC815\uD655\uD558\uAC8C \uD45C\uC2DC\uD558\uAE30 \uC704\uD574 \uC791\uC131\uD588\uC2B5\uB2C8\uB2E4.",
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
function buildFallbackAnalysis(rawCode) {
  const cleanCode = rawCode.replace(/\r\n/g, "\n");
  const rawLines = cleanCode.split("\n");
  const isHtml = /<!doctype html>|<html|<head|<body|<div|<h1|<p|<form|<input|<button/i.test(
    cleanCode
  );
  const language = isHtml ? "HTML" : "JavaScript";
  const lines = rawLines.map((line, index) => {
    const item = interpretSingleLineFallback(line, index + 1);
    const errorCheck = detectLineSyntaxError(line);
    item.hasError = errorCheck.hasError;
    item.errorDetail = errorCheck.errorDetail;
    return item;
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
      language === "HTML" && item.code.trim().startsWith("<") ? `${indent}<!-- ${item.subCommentBeginner} -->` : `${indent}// ${item.subCommentBeginner}`
    );
    commentedLinesIntermediate.push(item.code);
    commentedLinesIntermediate.push(
      language === "HTML" && item.code.trim().startsWith("<") ? `${indent}<!-- [CHECK] ${item.subCommentIntermediate} -->` : `${indent}// [CHECK] ${item.subCommentIntermediate}`
    );
    commentedLinesAdvanced.push(item.code);
    commentedLinesAdvanced.push(
      language === "HTML" && item.code.trim().startsWith("<") ? `${indent}<!-- ${item.subCommentAdvanced} -->` : `${indent}// ${item.subCommentAdvanced}`
    );
  }
  return {
    title: isHtml ? "HTML \uC6F9\uD398\uC774\uC9C0 \uAD6C\uC870 \uB808\uBCA8\uBCC4 \uB9DE\uCDA4 \uD574\uC11D" : "\uCF54\uB4DC \uB808\uBCA8\uBCC4 \uB9DE\uCDA4 \uD574\uC11D",
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
      const systemInstruction = `\uB2F9\uC2E0\uC740 \uCD08\uAE09\uC790, \uC911\uAE09\uC790, \uC804\uACF5\uC790 3\uAC1C \uC218\uC900\uBCC4\uB85C \uCF54\uB4DC\uB97C \uC815\uD655\uD788 \uCC28\uBCC4\uD654\uD558\uC5EC \uD574\uC11D\uD574\uC8FC\uB294 'CODE EASY' \uC218\uC11D \uCF54\uB4DC \uD29C\uD130\uC785\uB2C8\uB2E4.
\uC0AC\uC6A9\uC790\uAC00 \uC785\uB825\uD55C \uCF54\uB4DC\uB97C 1\uBC88 \uC904\uBD80\uD130 \uB9C8\uC9C0\uB9C9 ${rawLines.length}\uBC88 \uC904\uAE4C\uC9C0 \uAC01 \uC904\uB9C8\uB2E4 \uC544\uB798 3\uAC00\uC9C0 \uB808\uBCA8\uBCC4 \uAD00\uC810\uC73C\uB85C \uD574\uC11D\uD558\uC138\uC694:

1. [\uCD08\uAE09\uC790 \uB808\uBCA8]:
   - subCommentBeginner: \uCF54\uB4DC \uBC14\uB85C \uC544\uB798\uC5D0 \uB2EC\uB9B4 \uC544\uC8FC \uCE5C\uC808\uD558\uACE0 \uC26C\uC6B4 1\uBB38\uC7A5 \uC77C\uC0C1\uC5B4 \uC8FC\uC11D
   - easyExplanation: \uCF54\uB4DC\uB97C \uD558\uB098\uD558\uB098 \uB2E4 \uD480\uC5B4\uC11C \uC124\uBA85
   - whyUsedHere: \uC65C \uC774 \uCF54\uB4DC\uAC00 \uC5EC\uAE30\uC5D0\uC11C \uC0AC\uC6A9\uC774 \uB41C \uAC74\uC9C0 (\uC0AC\uC6A9 \uBAA9\uC801\uACFC \uC774\uC720)
   - wrongExample / betterExample: \uCD08\uBCF4\uC790\uAC00 \uD754\uD788 \uD2C0\uB9AC\uB294 \uCF54\uB4DC\uC640 \uB354 \uC88B\uC740 \uAE30\uCD08 \uCF54\uB4DC
   - tokens: \uD0DC\uADF8/\uC18D\uC131/\uD0A4\uC6CC\uB4DC\uBCC4 \uC870\uAC01 \uB2E8\uC5B4 \uC758\uBBF8

2. [\uC911\uAE09\uC790 \uB808\uBCA8]:
   - subCommentIntermediate: \uCF54\uB4DC \uAC80\uC99D \uD3EC\uC778\uD2B8 \uBC0F \uB9AC\uD329\uD1A0\uB9C1 \uD575\uC2EC \uC8FC\uC11D
   - codeCheckVerdict: \uCF54\uB4DC\uAC00 \uD2C0\uB9AC\uC9C0 \uC54A\uC558\uB294\uC9C0 \uB354 \uAF3C\uAF3C\uD558\uAC8C \uAC80\uC99D\uD55C \uC18C\uACAC
   - betterRefactor: \uB354 \uB098\uC740 \uCF54\uB4DC \uCD94\uCC9C (\uB9AC\uD329\uD1A0\uB9C1, \uD074\uB9B0 \uCF54\uB4DC, \uC6F9 \uD45C\uC900, \uC131\uB2A5)
   - suggestedAdditions: \uC9C0\uAE08\uAE4C\uC9C0 \uB9CC\uB4E0 \uCF54\uB4DC\uC5D0\uC11C \uB354 \uCD94\uAC00\uD558\uBA74 \uC88B\uC744 \uCF54\uB4DC\uC640 \uADF8 \uCF54\uB4DC\uB97C \uC65C \uB123\uB294\uC9C0(\uC758\uBBF8/\uC774\uC720)

3. [\uC804\uACF5\uC790 \uB808\uBCA8]:
   - subCommentAdvanced: \uBED4\uD55C \uC124\uBA85 \uC5C6\uC774 \uCF54\uB4DC\uC758 \uC7A0\uC7AC \uBC84\uADF8/\uB204\uB77D \uC810\uAC80 \uC911\uC2EC \uC8FC\uC11D
   - bugAudit: \uCF54\uB4DC\uC758 \uB7F0\uD0C0\uC784 \uC624\uB958, \uCDE8\uC57D\uC810, \uC5E3\uC9C0 \uCF00\uC774\uC2A4 \uBC84\uADF8 \uBD84\uC11D (hasIssue, severity, issueTitle, issueDetail)
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
                      required: ["easyExplanation", "whyUsedHere", "tokens"]
                    },
                    intermediate: {
                      type: Type.OBJECT,
                      properties: {
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
                      required: ["codeCheckVerdict"]
                    },
                    advanced: {
                      type: Type.OBJECT,
                      properties: {
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
                      required: ["bugAudit", "missingAudit"]
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
        const fallbackLine = interpretSingleLineFallback(rawLine, lineNum);
        if (!aiLine || isBlank) {
          return fallbackLine;
        }
        return {
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
            easyExplanation: aiLine.beginner?.easyExplanation || fallbackLine.beginner.easyExplanation,
            whyUsedHere: aiLine.beginner?.whyUsedHere || fallbackLine.beginner.whyUsedHere,
            wrongExample: aiLine.beginner?.wrongExample || fallbackLine.beginner.wrongExample,
            betterExample: aiLine.beginner?.betterExample || fallbackLine.beginner.betterExample,
            tokens: aiLine.beginner?.tokens && aiLine.beginner.tokens.length > 0 ? aiLine.beginner.tokens : fallbackLine.beginner.tokens
          },
          intermediate: {
            codeCheckVerdict: aiLine.intermediate?.codeCheckVerdict || fallbackLine.intermediate.codeCheckVerdict,
            betterRefactor: aiLine.intermediate?.betterRefactor || fallbackLine.intermediate.betterRefactor,
            suggestedAdditions: aiLine.intermediate?.suggestedAdditions || fallbackLine.intermediate.suggestedAdditions
          },
          advanced: {
            bugAudit: aiLine.advanced?.bugAudit || fallbackLine.advanced.bugAudit,
            missingAudit: aiLine.advanced?.missingAudit || fallbackLine.advanced.missingAudit,
            recommendedPatch: aiLine.advanced?.recommendedPatch || fallbackLine.advanced.recommendedPatch
          }
        };
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
    console.log(`CODE EASY server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
