import React, { useState, useMemo } from 'react';
import {
  Code2,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  XCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  HelpCircle,
  ShieldAlert,
  AlertTriangle,
  PlusCircle,
  Wrench,
  SearchCheck,
  Zap,
  Search,
  Layers,
  SlidersHorizontal,
  Compass,
  ArrowUpRight,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { SimpleCodeAnalysis, LineInterpretation, UserLevel } from './types.ts';
import { SAMPLE_PRESETS, PresetItem } from './data/presets.ts';
import { buildFallbackAnalysis } from './utils/codeAnalyzer.ts';

export default function App() {
  const [level, setLevel] = useState<UserLevel>('beginner');
  const [inputCode, setInputCode] = useState<string>(
    SAMPLE_PRESETS[0].data.originalCode
  );
  const [analysis, setAnalysis] = useState<SimpleCodeAnalysis>(
    SAMPLE_PRESETS[0].data
  );
  const [selectedLineNum, setSelectedLineNum] = useState<number>(1);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false); // 코드 변경/편집 모드 여부
  const [copiedCommented, setCopiedCommented] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const selectedLine: LineInterpretation =
    analysis.lines.find((l) => l.lineNumber === selectedLineNum) ||
    analysis.lines[0];

  // 다른 새 코드를 검사하기 위해 기존 코드를 모두 삭제하고 새 입력 상태로 초기화
  const handleResetNewCode = () => {
    setInputCode('');
    setIsEditing(true);
    const emptyAnalysis = buildFallbackAnalysis('');
    setAnalysis(emptyAnalysis);
    setSelectedLineNum(1);
  };

  const handleRunAnalysis = async (customCodeToRun?: string) => {
    const codeToAnalyze = (customCodeToRun ?? inputCode).replace(/\r\n/g, '\n');
    if (!codeToAnalyze.trim()) return;

    // 1. 즉시 로컬 정밀 분석 결과 반영 (0초 지연)
    const instant = buildFallbackAnalysis(codeToAnalyze);
    setAnalysis(instant);
    const firstValidLine =
      instant.lines.find((l) => !l.isBlank)?.lineNumber || 1;
    setSelectedLineNum(firstValidLine);
    setIsEditing(false); // 분석 완료 후 검사 모드로 전환

    // 2. 백엔드 Gemini AI 분석 보강
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/analyze-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToAnalyze }),
      });
      if (res.ok) {
        const aiData = (await res.json()) as SimpleCodeAnalysis;
        if (aiData && Array.isArray(aiData.lines) && aiData.lines.length > 0) {
          setAnalysis(aiData);
        }
      }
    } catch {
      // 로컬 마스터 분석 데이터 유지
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopyCommentedCode = () => {
    let textToCopy = analysis.commentedCodeBeginner;
    if (level === 'intermediate') {
      textToCopy = analysis.commentedCodeIntermediate;
    } else if (level === 'advanced') {
      textToCopy = analysis.commentedCodeAdvanced;
    }

    navigator.clipboard.writeText(textToCopy);
    setCopiedCommented(true);
    window.setTimeout(() => setCopiedCommented(false), 2000);
  };

  const handleCopyCodeSnippet = (snippet: string, key: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(key);
    window.setTimeout(() => setCopiedSnippet(null), 2000);
  };

  // 현재 레벨에 맞는 줄 아래 주석 반환
  const getSubCommentByLevel = (line: LineInterpretation) => {
    if (level === 'beginner') return line.subCommentBeginner;
    if (level === 'intermediate') return line.subCommentIntermediate;
    return line.subCommentAdvanced;
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#121212] flex flex-col font-sans selection:bg-[#121212] selection:text-white">
      {/* 1. 상단 메뉴바: 사용자 요청대로 불필요한 요소는 모두 지우고 [초보자 / 중급자 / 전공자] 버튼만 큼직하게 유지 */}
      <header className="bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E6E6E6] sticky top-0 z-30 w-full transition-all">
        <div className="w-full px-6 sm:px-10 lg:px-14 py-3.5 flex items-center justify-between gap-6">
          {/* 브랜드 로고 */}
          <a
            href="#top"
            className="group flex items-baseline gap-2.5 text-[#121212] tracking-tighter shrink-0"
          >
            <span className="font-syne font-extrabold text-2xl lg:text-3xl tracking-tight uppercase">
              CODE·EASY
            </span>
          </a>

          {/* 메뉴바 중앙/우측: [초보자 / 중급자 / 전공자] 3개 탭 버튼만 깔끔하고 큼직하게 배치 */}
          <div
            className="flex items-center p-1.5 bg-[#F2F2F2] rounded-full border border-[#E5E5E5] shadow-xs"
            role="tablist"
            aria-label="학습자 레벨 선택"
          >
            <button
              type="button"
              role="tab"
              aria-selected={level === 'beginner'}
              onClick={() => setLevel('beginner')}
              className={`px-6 py-2.5 text-sm sm:text-base font-bold rounded-full transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                level === 'beginner'
                  ? 'bg-white text-[#121212] shadow-sm ring-1 ring-[#E2E2E2]'
                  : 'text-[#666666] hover:text-[#121212] hover:bg-white/60'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-xs" />
              <span>초보자</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={level === 'intermediate'}
              onClick={() => setLevel('intermediate')}
              className={`px-6 py-2.5 text-sm sm:text-base font-bold rounded-full transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                level === 'intermediate'
                  ? 'bg-white text-[#121212] shadow-sm ring-1 ring-[#E2E2E2]'
                  : 'text-[#666666] hover:text-[#121212] hover:bg-white/60'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#0066FF] shrink-0 shadow-xs" />
              <span>중급자</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={level === 'advanced'}
              onClick={() => setLevel('advanced')}
              className={`px-6 py-2.5 text-sm sm:text-base font-bold rounded-full transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                level === 'advanced'
                  ? 'bg-white text-[#121212] shadow-sm ring-1 ring-[#E2E2E2]'
                  : 'text-[#666666] hover:text-[#121212] hover:bg-white/60'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0 shadow-xs" />
              <span>전공자</span>
            </button>
          </div>

          {/* 우측 유틸리티: 코드 해석 버튼 */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => handleRunAnalysis()}
              className="px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#0066FF] hover:bg-[#0055D6] rounded-full transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-98"
              title="현재 작성된 코드를 분석하고 해설을 생성합니다"
            >
              {isAiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>해석 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-sky-200" />
                  <span>코드 해석</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 2. 메인 워크스페이스: 화면을 가득 채우는 와이드 캔버스 (Full-Width Studio Grid) */}
      <main className="flex-1 w-full px-6 sm:px-10 lg:px-14 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================= */}
        {/* [좌측: 7 cols] 코드 작성 및 실시간 해설 에디터 */}
        {/* ========================================================= */}
        <section className="lg:col-span-7 bg-[#121212] rounded-2xl border border-[#242424] shadow-sm overflow-hidden flex flex-col">
          {/* 코드 뷰어 상단 바: 맨 왼쪽 위 화살표(코드가 있을 때만 표시), 코드 수정 모드 토글, 코드 검사 버튼 탑재 */}
          <div className="px-5 py-3.5 bg-[#1C1C1C] border-b border-[#262626] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              {/* [사용자 요청] 코드가 아무것도 적혀져 있지 않은 상태에서는 안 뜨게 조건부 렌더링 */}
              {inputCode.trim().length > 0 && (
                <button
                  type="button"
                  onClick={handleResetNewCode}
                  title="코드가 없는 화면으로 돌아가기 (새 코드 입력)"
                  className="px-2.5 py-1.5 text-xs font-semibold text-[#D4D4D4] hover:text-white bg-[#262626] hover:bg-[#333333] border border-[#3E3E3E] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 group"
                  aria-label="코드가 없는 화면으로 돌아가기"
                >
                  <ArrowLeft className="w-4 h-4 text-sky-400 group-hover:-translate-x-0.5 transition-transform" />
                  <span className="hidden sm:inline font-medium text-[11px] text-[#CCCCCC] group-hover:text-white">
                    새 코드 입력
                  </span>
                </button>
              )}

              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#383838]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#383838]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#383838]" />
              </div>
              <span className="text-[#A3A3A3] font-mono text-[11px]">|</span>
              <span className="font-semibold text-white tracking-tight">
                {isEditing ? '코드 직접 입력 및 수정 중' : analysis.title || '코드 해설 뷰어'}
              </span>
              {isAiLoading && (
                <span className="flex items-center gap-1 text-[#0066FF] text-[11px] font-sans">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  AI 분석 중
                </span>
              )}
            </div>

            {/* 우측 액션: [코드 검사] / [코드 수정하기] (화살표 없는 중복 초기화 버튼 제거) */}
            <div className="flex items-center gap-2">
              {isEditing ? (
                <button
                  type="button"
                  onClick={() => handleRunAnalysis()}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#0066FF] hover:bg-[#0055D6] rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-98"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>코드 검사</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#D4D4D4] bg-[#2A2A2A] hover:bg-[#383838] border border-[#3E3E3E] rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Code2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>코드 수정하기</span>
                </button>
              )}
            </div>
          </div>

          {/* 코드 수정 모드일 때: 직접 코드를 자유롭게 타이핑/수정할 수 있는 텍스트에어리어 */}
          {isEditing ? (
            <div className="p-4 sm:p-5 flex flex-col gap-3 bg-[#121212]">
              <div className="flex items-center justify-between text-xs text-[#8E8E8E]">
                <span>코드를 자유롭게 변경하고 우측 상단의 <strong>[코드 검사]</strong> 버튼을 누르세요.</span>
                <span className="font-mono">{inputCode.split('\n').length}줄</span>
              </div>
              <textarea
                rows={16}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="검사할 코드를 여기에 붙여넣거나 수정하세요..."
                className="w-full p-4 font-mono text-xs sm:text-sm text-white bg-[#181818] rounded-xl border border-[#333333] focus:outline-none focus:border-[#0066FF] leading-relaxed resize-y"
              />
            </div>
          ) : (
            <>
              {/* 서브 안내 헤더 */}
              <div className="px-5 py-2.5 bg-[#181818] border-b border-[#262626] text-[11px] flex items-center justify-between text-[#8E8E8E]">
                <span>
                  {level === 'beginner' &&
                    '💡 줄을 클릭하면 우측에서 쉬운 풀이를 확인합니다. [코드 수정하기]를 누르면 언제든 코드를 고칠 수 있습니다.'}
                  {level === 'intermediate' &&
                    '🔍 줄을 클릭하면 우측에서 정밀 검증을 확인합니다. [코드 수정하기]를 누르면 언제든 코드를 고칠 수 있습니다.'}
                  {level === 'advanced' &&
                    '🚨 줄을 클릭하면 우측에서 잠재 버그와 누락 코드를 확인합니다. [코드 수정하기]를 누르면 언제든 코드를 고칠 수 있습니다.'}
                </span>
                <span className="font-mono text-[10px] text-[#666666]">
                  {selectedLine.lineNumber} / {analysis.lines.length} L
                </span>
              </div>

          {/* 코드 리스트 (요구사항: 코드는 흰색, 선택 효과도 흰색, 코드 아래 주석은 연한 회색) */}
          <div className="p-4 sm:p-5 overflow-y-auto max-h-[820px] divide-y divide-[#222222] font-mono">
            {analysis.lines.map((line) => {
              const isSelected = line.lineNumber === selectedLine.lineNumber;
              const subComment = getSubCommentByLevel(line);
              const isLineError = Boolean(line.hasError);

              return (
                <div
                  key={line.lineNumber}
                  onClick={() => setSelectedLineNum(line.lineNumber)}
                  className={`w-full text-left py-2.5 px-3 rounded-xl transition-all cursor-pointer group flex flex-col gap-1 border-l-2 ${
                    isLineError
                      ? isSelected
                        ? 'bg-red-950/40 border-red-500 ring-1 ring-red-500/50'
                        : 'bg-red-950/20 border-red-500/60 hover:bg-red-950/30'
                      : isSelected
                      ? 'bg-white/10 border-white ring-1 ring-white/40'
                      : 'border-transparent hover:bg-[#1A1A1A]'
                  }`}
                >
                  {/* 1) 코드 텍스트: 문법 오류 시 선명한 빨간색, 정상 시 완전한 순수 흰색 */}
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-7 text-right select-none text-xs tabular-nums shrink-0 pt-0.5 font-bold ${
                        isLineError
                          ? 'text-red-400'
                          : isSelected
                          ? 'text-white font-extrabold'
                          : 'text-[#525252]'
                      }`}
                    >
                      {line.lineNumber}
                    </span>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <pre
                        className={`font-mono text-xs sm:text-sm font-medium whitespace-pre overflow-x-auto leading-relaxed ${
                          isLineError ? 'text-red-400 font-semibold' : 'text-white'
                        }`}
                      >
                        {line.code || ' '}
                      </pre>
                      {isLineError && (
                        <span className="shrink-0 text-[10px] font-sans font-bold bg-red-900/60 text-red-200 border border-red-700/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-red-400" />
                          <span>오류 코드</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2) 코드 바로 아래 주석: 연한 회색 (text-[#A3A3A3] / slate-400 계열) */}
                  {!line.isBlank && (
                    <div className="pl-10 text-xs font-sans text-[#A3A3A3] flex items-center gap-1.5 leading-normal">
                      <span className="text-[#666666] font-mono select-none">
                        //
                      </span>
                      <span
                        className={
                          isLineError
                            ? 'text-red-300 font-medium'
                            : isSelected
                            ? 'text-[#D4D4D4] font-medium'
                            : 'text-[#A3A3A3]'
                        }
                      >
                        {line.hasError && line.errorDetail ? `[오류 감지] ${line.errorDetail}` : subComment}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
            </>
          )}
        </section>

        {/* ========================================================= */}
        {/* [우측: 5 cols] Mobbin 갤러리 카드형 상세 분석 패널 */}
        {/* ========================================================= */}
        <section className="lg:col-span-5 bg-white rounded-2xl border border-[#EAEAEA] shadow-sm p-6 space-y-6 sticky top-24">
          {/* Header Zone: 선택된 줄 & 윗줄/아랫줄 내비게이터 */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#F0F0F0]">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-mono text-xs font-semibold bg-[#F5F5F5] text-[#141414] px-3 py-0.5 rounded-full border border-[#E5E5E5] tabular-nums">
                  Line {selectedLine.lineNumber}
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    level === 'beginner'
                      ? 'bg-emerald-50 text-emerald-800'
                      : level === 'intermediate'
                      ? 'bg-blue-50 text-[#0066FF]'
                      : 'bg-purple-50 text-purple-800'
                  }`}
                >
                  {level === 'beginner' && '초급자 튜터'}
                  {level === 'intermediate' && '중급자 코드 리뷰'}
                  {level === 'advanced' && '전공자 보안 & 감사'}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#141414] tracking-tight">
                {selectedLine.shortRole}
              </h3>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={selectedLine.lineNumber <= 1}
                onClick={() => setSelectedLineNum((n) => Math.max(1, n - 1))}
                className="px-3 py-1 text-xs font-semibold text-[#141414] bg-[#F5F5F5] hover:bg-[#EAEAEA] disabled:opacity-30 rounded-full cursor-pointer transition-colors"
              >
                이전 줄
              </button>
              <button
                type="button"
                disabled={selectedLine.lineNumber >= analysis.lines.length}
                onClick={() =>
                  setSelectedLineNum((n) =>
                    Math.min(analysis.lines.length, n + 1)
                  )
                }
                className="px-3 py-1 text-xs font-semibold text-[#141414] bg-[#F5F5F5] hover:bg-[#EAEAEA] disabled:opacity-30 rounded-full cursor-pointer transition-colors"
              >
                다음 줄
              </button>
            </div>
          </div>

          {/* 현재 선택된 코드 스니펫 미리보기 */}
          <div
            className={`p-3 rounded-xl font-mono text-xs overflow-x-auto border ${
              selectedLine.hasError
                ? 'bg-red-950/80 text-red-300 border-red-700 ring-1 ring-red-600'
                : 'bg-[#141414] text-white border-[#2E2E2E]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <code>{selectedLine.code || '(공백 라인)'}</code>
              {selectedLine.hasError && (
                <span className="text-[10px] font-sans font-bold bg-red-600 text-white px-2 py-0.5 rounded-full shrink-0">
                  틀린 코드 감지됨
                </span>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* 🟢 [초보자 모드 전용 패널] */}
          {/* ========================================================= */}
          {level === 'beginner' && (
            <div className="space-y-4">
              {/* 1) 이 줄의 쉬운 풀이 */}
              <div className="p-4 bg-[#F8F9FA] rounded-2xl border border-[#EAEAEA] space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#141414]">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  <span>이 줄은 무슨 의미인가요?</span>
                </div>
                <p className="text-sm text-[#333333] leading-relaxed">
                  {selectedLine.beginner.easyExplanation}
                </p>
              </div>

              {/* 2) 왜 이 코드가 여기서 사용되었나요? (목적과 이유 예측) */}
              <div className="p-4 bg-white rounded-2xl border border-[#EAEAEA] space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#141414]">
                  <HelpCircle className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span>왜 이 코드가 여기서 사용되었나요? (목적과 이유 예측)</span>
                </div>
                <p className="text-sm text-[#525252] leading-relaxed">
                  {selectedLine.beginner.whyUsedHere}
                </p>
              </div>

              {/* 3) 사용자의 핵심 요청: 진짜 코드가 틀리게 작성되었을 때만 뜨는 틀린 코드 경고창 (빨간색 강조) */}
              <div className="space-y-3 pt-1">
                {selectedLine.hasError ? (
                  <div className="p-4 rounded-2xl bg-[#FFF5F5] border border-red-300 space-y-2.5 shadow-xs ring-1 ring-red-400/40 animate-pulse">
                    <div className="flex items-center gap-2 text-xs font-bold text-red-700">
                      <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>🚨 주의: 이 줄의 코드가 틀리게 작성되었습니다!</span>
                    </div>
                    <pre className="p-3 bg-red-950 text-red-300 font-mono text-xs rounded-xl overflow-x-auto whitespace-pre-wrap border border-red-800 font-semibold">
                      {selectedLine.code}
                    </pre>
                    <p className="text-xs text-red-800 leading-relaxed font-medium">
                      <strong className="font-bold text-red-950">어디가 틀렸나요? </strong>
                      {selectedLine.errorDetail ||
                        selectedLine.beginner.wrongExample?.reason ||
                        '문법적 오류나 태그/따옴표 닫힘이 누락되었습니다.'}
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>현재 이 줄은 문법적 오류 없이 정상적으로 작성되었습니다.</span>
                  </div>
                )}

                {/* 올바른 모범 코드 추천 안내 */}
                {selectedLine.beginner.betterExample && (
                  <div className="p-4 rounded-2xl bg-[#F0F7FF] border border-[#DBEAFE] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E40AF]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0066FF] shrink-0" />
                        <span>💡 권장하는 올바른 모범 코드</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyCodeSnippet(
                            selectedLine.beginner.betterExample!.code,
                            'beginner-better'
                          )
                        }
                        className="text-[11px] font-semibold text-[#0066FF] hover:text-[#0055D6] flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-full border border-[#BFDBFE]"
                      >
                        {copiedSnippet === 'beginner-better' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>복사됨</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>복사</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-2.5 bg-[#141414] text-[#93C5FD] font-mono text-xs rounded-xl overflow-x-auto whitespace-pre-wrap border border-[#2E2E2E]">
                      {selectedLine.beginner.betterExample.code}
                    </pre>
                    <p className="text-xs text-[#1E3A8A] leading-relaxed">
                      {selectedLine.beginner.betterExample.reason}
                    </p>
                  </div>
                )}
              </div>

              {/* 4) 태그 및 속성 단어별 의미 */}
              {selectedLine.beginner.tokens && selectedLine.beginner.tokens.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-[#F0F0F0]">
                  <span className="text-xs font-bold text-[#141414]">
                    태그 · 속성 키워드 사전
                  </span>
                  <div className="divide-y divide-[#F0F0F0] border border-[#EAEAEA] rounded-2xl overflow-hidden text-xs bg-white">
                    {selectedLine.beginner.tokens.map((t, idx) => (
                      <div
                        key={`${t.token}-${idx}`}
                        className="p-3 flex flex-col sm:flex-row sm:items-baseline gap-2"
                      >
                        <code className="font-mono font-semibold text-[#141414] bg-[#F5F5F5] px-2 py-0.5 rounded-md shrink-0">
                          {t.token}
                        </code>
                        <span className="text-[#525252] leading-relaxed">
                          {t.meaning}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 🔵 [중급자 모드 전용 패널] */}
          {/* ========================================================= */}
          {level === 'intermediate' && (
            <div className="space-y-4">
              {/* 1) 코드가 틀리지 않았는지 꼼꼼한 확인 */}
              <div className="p-4 bg-[#F0F7FF] rounded-2xl border border-[#DBEAFE] space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1E40AF]">
                  <SearchCheck className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span>코드 무결성 & 구문 정밀 검증</span>
                </div>
                <p className="text-sm text-[#1E3A8A] leading-relaxed">
                  {selectedLine.intermediate.codeCheckVerdict}
                </p>
              </div>

              {/* 2) 더 나은 코드 추천 (리팩토링, 성능, 웹 표준) */}
              {selectedLine.intermediate.betterRefactor && (
                <div className="p-4 rounded-2xl bg-white border border-[#EAEAEA] space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#141414]">
                      <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>더 나은 리팩토링 추천 코드</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyCodeSnippet(
                          selectedLine.intermediate.betterRefactor!.code,
                          'refactor-better'
                        )
                      }
                      className="text-[11px] font-semibold text-[#525252] hover:text-[#141414] flex items-center gap-1 cursor-pointer bg-[#F5F5F5] px-2.5 py-1 rounded-full border border-[#E5E5E5]"
                    >
                      {copiedSnippet === 'refactor-better' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>복사됨</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>코드 복사</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-2.5 bg-[#141414] text-emerald-300 font-mono text-xs rounded-xl overflow-x-auto whitespace-pre-wrap border border-[#2E2E2E]">
                    {selectedLine.intermediate.betterRefactor.code}
                  </pre>
                  <p className="text-xs text-[#525252] leading-relaxed">
                    <strong className="text-[#141414]">개선 효과: </strong>
                    {selectedLine.intermediate.betterRefactor.reason}
                  </p>
                </div>
              )}

              {/* 3) 지금까지 만든 코드에서 더 추가하면 좋을 코드 & 넣는 이유 */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#141414]">
                  <PlusCircle className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span>더 추가하면 좋을 추천 코드 & 넣는 이유</span>
                </div>

                {selectedLine.intermediate.suggestedAdditions &&
                selectedLine.intermediate.suggestedAdditions.length > 0 ? (
                  <div className="space-y-3">
                    {selectedLine.intermediate.suggestedAdditions.map((addition, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-[#F8F9FA] rounded-2xl border border-[#EAEAEA] space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <code className="font-mono text-xs font-bold text-[#141414] bg-white px-2.5 py-1 rounded-lg border border-[#E0E0E0]">
                            {addition.code}
                          </code>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyCodeSnippet(addition.code, `add-${idx}`)
                            }
                            className="text-[11px] font-semibold text-[#0066FF] hover:text-[#0055D6] flex items-center gap-1 cursor-pointer bg-white px-2.5 py-0.5 rounded-full border border-[#BFDBFE]"
                          >
                            {copiedSnippet === `add-${idx}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>코드 복사</span>
                          </button>
                        </div>
                        <div className="text-xs text-[#141414] font-medium">
                          <strong>의미: </strong>
                          {addition.meaning}
                        </div>
                        <div className="text-xs text-[#525252] leading-relaxed">
                          <strong className="text-[#141414]">왜 넣어야 하나요? </strong>
                          {addition.whyAdd}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 bg-[#F5F5F5] border border-[#EAEAEA] rounded-2xl text-xs text-[#737373]">
                    현재 구문은 핵심 요소가 충실히 갖추어져 있어 추가적인 옵션이 불필요합니다.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 🟣 [전공자 모드 전용 패널] */}
          {/* ========================================================= */}
          {level === 'advanced' && (
            <div className="space-y-4">
              {/* 1) 코드 오류 & 런타임 결함 분석 */}
              <div
                className={`p-4 rounded-2xl border space-y-1.5 ${
                  selectedLine.advanced.bugAudit.hasIssue
                    ? 'bg-[#FFF8F8] border-[#FEE2E2]'
                    : 'bg-[#F8F9FA] border-[#EAEAEA]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#141414]">
                    {selectedLine.advanced.bugAudit.hasIssue ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span>
                      {selectedLine.advanced.bugAudit.hasIssue
                        ? `오류 & 결함: ${selectedLine.advanced.bugAudit.issueTitle}`
                        : `오류 없음: ${selectedLine.advanced.bugAudit.issueTitle}`}
                    </span>
                  </div>
                  {selectedLine.advanced.bugAudit.hasIssue && (
                    <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 bg-red-100 text-red-800 rounded-full font-bold">
                      {selectedLine.advanced.bugAudit.severity}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#525252] leading-relaxed font-mono">
                  {selectedLine.advanced.bugAudit.issueDetail}
                </p>
              </div>

              {/* 2) 누락된 코드 찾아주기 */}
              <div
                className={`p-4 rounded-2xl border space-y-2 ${
                  selectedLine.advanced.missingAudit.hasMissing
                    ? 'bg-[#FFFBEB] border-[#FEF3C7]'
                    : 'bg-[#F8F9FA] border-[#EAEAEA]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#92400E]">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    {selectedLine.advanced.missingAudit.hasMissing
                      ? `누락된 필수 코드: ${selectedLine.advanced.missingAudit.missingTitle}`
                      : '누락된 필수 요소 없음 (검증 통과)'}
                  </span>
                </div>

                {selectedLine.advanced.missingAudit.hasMissing && (
                  <>
                    <pre className="p-2.5 bg-[#141414] text-amber-200 font-mono text-xs rounded-xl overflow-x-auto whitespace-pre-wrap border border-[#2E2E2E]">
                      {selectedLine.advanced.missingAudit.missingSnippet}
                    </pre>
                    <p className="text-xs text-[#78350F] leading-relaxed">
                      <strong>누락 시 영향: </strong>
                      {selectedLine.advanced.missingAudit.reason}
                    </p>
                  </>
                )}
              </div>

              {/* 3) 전공자 추천 패치 코드 (오류 & 누락 보완 완료본) */}
              {selectedLine.advanced.recommendedPatch && (
                <div className="p-4 rounded-2xl bg-white border border-[#EAEAEA] space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#141414]">
                      <Wrench className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>추천 패치 코드 (Recommended Patch)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyCodeSnippet(
                          selectedLine.advanced.recommendedPatch!,
                          'patch-code'
                        )
                      }
                      className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1 cursor-pointer bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200"
                    >
                      {copiedSnippet === 'patch-code' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>패치 복사됨</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>패치 복사</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-2.5 bg-[#141414] text-purple-200 font-mono text-xs rounded-xl overflow-x-auto whitespace-pre-wrap border border-[#2E2E2E]">
                    {selectedLine.advanced.recommendedPatch}
                  </pre>
                  <p className="text-xs text-[#737373]">
                    오류 및 누락 요소를 패치한 표준 규격 완성형 코드 스니펫입니다.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
