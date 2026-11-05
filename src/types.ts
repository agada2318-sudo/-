export type UserLevel = 'beginner' | 'intermediate' | 'advanced';

export interface TokenBreakdown {
  token: string;
  meaning: string;
}

export interface CodeComparisonItem {
  code: string;
  reason: string;
}

// 중급자용: 추가하면 좋을 추천 코드
export interface CodeAdditionItem {
  code: string;
  meaning: string; // 그 코드가 의미하는 바
  whyAdd: string; // 왜 추가해야 하는지 이유
}

// 전공자용: 코드 오류 및 누락 진단
export interface BugAuditItem {
  hasIssue: boolean;
  severity: 'none' | 'warning' | 'error' | 'security';
  issueTitle: string;
  issueDetail: string;
}

export interface MissingCodeItem {
  hasMissing: boolean;
  missingTitle: string;
  missingSnippet: string;
  reason: string;
}

export interface LineInterpretation {
  lineNumber: number;
  code: string;
  isBlank: boolean;
  shortRole: string; // 이 줄의 핵심 역할
  hasError?: boolean; // 실제로 코드가 틀리게 작성되었는지 여부
  errorDetail?: string; // 틀린 코드에 대한 구체적인 오류 원인 설명

  // 1) 코드 아래 연한 회색 주석 (레벨별)
  subCommentBeginner: string; // 초급자: 친절하고 쉬운 풀이 주석
  subCommentIntermediate: string; // 중급자: 검증 및 개선 위주 주석
  subCommentAdvanced: string; // 전공자: 오류/누락/규격 점검 주석

  // 2) 초급자 전용 상세 분석
  beginner: {
    definition?: string; // 이 코드(태그/키워드/기능)의 일반적인 정의
    easyExplanation: string; // 하나하나 친절하게 설명
    whyUsedHere: string; // 왜 이 코드가 여기에서 사용된 건지 (목적과 이유)
    wrongExample?: CodeComparisonItem; // 초보자가 흔히 틀리는 코드
    betterExample?: CodeComparisonItem; // 더 좋은 기초 코드
    tokens: TokenBreakdown[]; // 태그/속성 단어 조각별 풀이
  };

  // 3) 중급자 전용 상세 분석
  intermediate: {
    isBasic?: boolean; // 간단한 기본 코드라 중급자 설명을 생략해도 되는 줄인지
    howItWorks: string; // 정의 대신 작동 원리 (브라우저/엔진이 어떻게 처리하는지)
    codeCheckVerdict: string; // 코드가 틀리지 않았는지 꼼꼼한 검증 소견
    betterRefactor?: CodeComparisonItem; // 더 나은 추천 코드 (리팩토링, 성능, 웹 표준)
    suggestedAdditions?: CodeAdditionItem[]; // 더 추가하면 좋을 코드 & 그 코드를 넣는 이유
  };

  // 4) 전공자 전용 상세 분석
  advanced: {
    technicalDetail: string; // IT 전문 용어 기반 기술 분석
    bugAudit: BugAuditItem; // 코드 오류/취약점/버그 분석
    missingAudit: MissingCodeItem; // 누락된 필수 코드 및 최적화 요소 진단
    recommendedPatch?: string; // 권장 패치/수정 코드
  };
}

export interface SimpleCodeAnalysis {
  title: string;
  language: string;
  summary: string;
  originalCode: string;
  commentedCodeBeginner: string;
  commentedCodeIntermediate: string;
  commentedCodeAdvanced: string;
  lines: LineInterpretation[];
}
