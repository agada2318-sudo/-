import { SimpleCodeAnalysis } from '../types';
import { buildFallbackAnalysis } from '../utils/codeAnalyzer';

const HTML_SAMPLE = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>나의 첫 로그인 페이지</title>
</head>
<body>
  <div class="login-box">
    <h1>환영합니다</h1>
    <p>아이디를 입력하고 로그인하세요.</p>
    <input type="text" placeholder="아이디를 입력하세요" required>
    <button type="submit">로그인</button>
  </div>
</body>
</html>`;

const JS_SAMPLE = `let numbers = [1, 2, 3, 4, 5];
let result = numbers.map(x => x * 2);

console.log(result);`;

const HTML_FORM_SAMPLE = `<form action="/login" method="POST">
  <label for="user-email">이메일 주소</label>
  <input type="email" id="user-email" placeholder="name@example.com" required>
  
  <label for="user-pw">비밀번호</label>
  <input type="password" id="user-pw" placeholder="8자리 이상 입력" required>
  
  <button type="submit">로그인 완료</button>
</form>`;

export interface PresetItem {
  id: string;
  label: string;
  appName: string;
  category: 'Auth' | 'Data / State' | 'E-Commerce' | 'Form / Input' | 'Utility';
  platform: 'Web' | 'iOS' | 'Backend';
  flowType: 'Onboarding / Auth' | 'Data Pipeline' | 'Checkout Flow' | 'Interaction';
  description: string;
  data: SimpleCodeAnalysis;
}

const ECOMMERCE_CHECKOUT_SAMPLE = `<div class="checkout-card">
  <div class="product-summary">
    <span class="product-title">Pro Plan Subscription</span>
    <span class="price-tag">$29.00 / mo</span>
  </div>
  <form id="payment-form" action="/api/checkout" method="POST">
    <input type="email" name="customer_email" placeholder="you@company.com" required autocomplete="email">
    <input type="text" name="card_number" placeholder="4242 •••• •••• 4242" maxlength="19" required inputmode="numeric">
    <button type="submit" class="cta-pay-btn">Complete Purchase</button>
  </form>
</div>`;

const REACT_HOOK_SAMPLE = `import { useState, useEffect } from 'react';

export function useSearchQuery(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query.trim()) return;
    const timer = setTimeout(() => {
      fetch('/api/search?q=' + encodeURIComponent(query))
        .then(res => res.json())
        .then(data => setResults(data));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return { query, setQuery, results };
}`;

export const SAMPLE_PRESETS: PresetItem[] = [
  {
    id: 'html-basic',
    label: '로그인 모달 & 웰컴 카드',
    appName: 'Linear Web App',
    category: 'Auth',
    platform: 'Web',
    flowType: 'Onboarding / Auth',
    description: '깔끔한 시맨틱 구조와 폼 유효성 검사가 적용된 데스크톱 로그인 UI',
    data: buildFallbackAnalysis(HTML_SAMPLE),
  },
  {
    id: 'html-form',
    label: '결제 & 인증 폼 (Label/Input)',
    appName: 'Stripe Checkout',
    category: 'Form / Input',
    platform: 'Web',
    flowType: 'Checkout Flow',
    description: 'POST 엔드포인트와 접근성 label-for 바인딩이 적용된 정석 결제 폼',
    data: buildFallbackAnalysis(HTML_FORM_SAMPLE),
  },
  {
    id: 'js-map',
    label: '배열 데이터 변환 파이프라인 (map)',
    appName: 'Airbnb Explorer',
    category: 'Data / State',
    platform: 'Backend',
    flowType: 'Data Pipeline',
    description: '원본 데이터 불변성을 보장하며 값을 2배로 변환하는 순수 함수 연산',
    data: buildFallbackAnalysis(JS_SAMPLE),
  },
  {
    id: 'ecommerce-cart',
    label: '구독 플랜 결제 카드 레이아웃',
    appName: 'Notion Plus',
    category: 'E-Commerce',
    platform: 'Web',
    flowType: 'Checkout Flow',
    description: 'SaaS 구독 상품 구매를 위한 카드 요약 및 결제 요청 UI',
    data: buildFallbackAnalysis(ECOMMERCE_CHECKOUT_SAMPLE),
  },
  {
    id: 'react-hook',
    label: '디바운스 실시간 검색 훅 (Hook)',
    appName: 'Mobbin Search Engine',
    category: 'Utility',
    platform: 'Web',
    flowType: 'Interaction',
    description: '300ms 디바운싱을 통해 API 과호출을 방지하는 실시간 검색 커스텀 훅',
    data: buildFallbackAnalysis(REACT_HOOK_SAMPLE),
  },
];
