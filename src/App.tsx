import React, { useState, useEffect, useRef } from 'react';
import {
  Code2,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  XCircle,
  CheckCircle2,
  Loader2,
  HelpCircle,
  ShieldAlert,
  AlertTriangle,
  PlusCircle,
  Wrench,
  SearchCheck,
  Zap,
  ArrowLeft,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Microscope,
  MinusCircle,
  FilePlus,
  Lightbulb,
  ChevronDown,
  Upload,
  FileCode2,
} from 'lucide-react';
import { SimpleCodeAnalysis, LineInterpretation, UserLevel } from './types.ts';
import { SAMPLE_PRESETS, PresetItem } from './data/presets.ts';

// 끌어다 놓은 파일 하나의 상태
interface OpenFile {
  id: string;
  name: string;
  code: string;
  analysis: SimpleCodeAnalysis;
  selectedLine: number;
  isEditing: boolean;
}
const MAIN_KEY = '__main__'; // 파일이 아닌 직접 입력/예시 코드

const SECONDARY_BTN =
  'py-3 text-sm font-semibold text-[#D5D8E5] bg-[#2A2D40] hover:bg-[#33374D] border border-[#34384F] rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap';
const PRIMARY_BTN =
  'py-3 text-sm font-bold text-white bg-[#7C6CF6] hover:bg-[#6B5AE8] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap';
import { buildFallbackAnalysis } from './utils/codeAnalyzer.ts';

// 레벨 아이콘: 막대 3개 중 채워진 개수로 수준 표시 (초급 1칸 · 중급 2칸 · 전공 3칸)
function LevelBars({ filled, active }: { filled: number; active: boolean }) {
  const on = active ? '#A99CFF' : '#9AA0B8';
  const off = active ? 'rgba(169,156,255,0.25)' : '#3A3F57';
  const heights = [6, 11, 16];
  return (
    <svg width="18" height="16" viewBox="0 0 18 16" aria-hidden="true">
      {heights.map((h, i) => (
        <rect key={i} x={i * 6.5} y={16 - h} width="4.5" height={h} rx="1.2" fill={i < filled ? on : off} />
      ))}
    </svg>
  );
}

const LEVELS: {
  id: UserLevel;
  label: string;
  desc: string;
  bars: number;
}[] = [
  { id: 'beginner', label: '초급자', desc: '정의를 쉬운 말로', bars: 1 },
  { id: 'intermediate', label: '중급자', desc: '작동 원리 중심', bars: 2 },
  { id: 'advanced', label: '전공자', desc: '기술 분석 · 결함 진단', bars: 3 },
];

export default function App() {
  const [level, setLevel] = useState<UserLevel>('beginner');
  const [inputCode, setInputCode] = useState<string>(
    SAMPLE_PRESETS[0].data.originalCode
  );
  const [analysis, setAnalysis] = useState<SimpleCodeAnalysis>(
    SAMPLE_PRESETS[0].data
  );
  const [selectedLineNum, setSelectedLineNum] = useState<number>(1);
  const [isEditing, setIsEditing] = useState<boolean>(false); // 코드 변경/편집 모드 여부

  // ---------- 여러 파일 ----------
  // 끌어다 놓은 파일마다 코드·해석·선택한 줄·편집 상태를 따로 보관하고, 점(●)으로 오갈 수 있게 함
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFileId, setActiveFileIdState] = useState<string | null>(null);
  const activeFileIdRef = useRef<string | null>(null);
  const setActiveFileId = (id: string | null) => {
    activeFileIdRef.current = id;
    setActiveFileIdState(id);
  };
  const [pendingIds, setPendingIds] = useState<string[]>([]); // AI 해석을 기다리는 파일들
  const requestSeq = useRef<Record<string, number>>({});
  const activeKey = activeFileId ?? MAIN_KEY;
  const isAiLoading = pendingIds.includes(activeKey);
  const activeIndex = openFiles.findIndex((f) => f.id === activeFileId);
  const loadedFileName = activeIndex >= 0 ? openFiles[activeIndex].name : null;
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [showExamples, setShowExamples] = useState<boolean>(false); // 예시 코드 메뉴 열림 여부
  const [isDragging, setIsDragging] = useState<boolean>(false); // 파일을 끌어오는 중인지
  const [dropMessage, setDropMessage] = useState<string | null>(null); // 파일 불러오기 안내/오류
  const dragDepth = useRef(0);

  const errorLines = analysis.lines.filter((l) => l.hasError).map((l) => l.lineNumber);

  const selectedLine: LineInterpretation =
    analysis.lines.find((l) => l.lineNumber === selectedLineNum) ||
    analysis.lines[0];

  // 코드 입력 카드 밖에 파일을 떨어뜨려도 브라우저가 파일을 열어버리지 않도록 막기
  useEffect(() => {
    const block = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
    };
    window.addEventListener('dragover', block);
    window.addEventListener('drop', block);
    return () => {
      window.removeEventListener('dragover', block);
      window.removeEventListener('drop', block);
    };
  }, []);

  // 안내 메시지는 4초 뒤 자동으로 사라짐
  useEffect(() => {
    if (!dropMessage) return;
    const id = window.setTimeout(() => setDropMessage(null), 4000);
    return () => window.clearTimeout(id);
  }, [dropMessage]);

  // 방향키(↑ ↓)로 줄 이동
  useEffect(() => {
    if (isEditing) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedLineNum((n) => Math.min(analysis.lines.length, n + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedLineNum((n) => Math.max(1, n - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // 여러 파일을 열었을 때 ← → 로 파일 넘기기
        switchByOffsetRef.current(e.key === 'ArrowLeft' ? -1 : 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isEditing, analysis.lines.length]);

  // 선택된 줄이 코드 목록에서 보이도록 스크롤
  useEffect(() => {
    document
      .getElementById(`code-line-${selectedLineNum}`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [selectedLineNum]);

  // 다른 새 코드를 검사하기 위해 기존 코드를 모두 삭제하고 새 입력 상태로 초기화
  const handleResetNewCode = () => {
    setOpenFiles([]);
    setActiveFileId(null);
    setInputCode('');
    setIsEditing(true);
    const emptyAnalysis = buildFallbackAnalysis('');
    setAnalysis(emptyAnalysis);
    setSelectedLineNum(1);
  };

  const firstLineOf = (a: SimpleCodeAnalysis) => a.lines.find((l) => !l.isBlank)?.lineNumber || 1;

  // 백엔드 Gemini AI 해석 보강 (파일마다 따로). 그사이 다른 파일로 넘어가도 결과가 엉뚱한 파일에 들어가지 않음
  const requestAi = async (key: string, code: string) => {
    const seq = (requestSeq.current[key] = (requestSeq.current[key] || 0) + 1);
    setPendingIds((p) => (p.includes(key) ? p : [...p, key]));
    try {
      const res = await fetch('/api/analyze-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) return;
      const aiData = (await res.json()) as SimpleCodeAnalysis;
      if (!aiData || !Array.isArray(aiData.lines) || aiData.lines.length === 0) return;
      if (requestSeq.current[key] !== seq) return; // 그사이 코드가 다시 분석됨 → 옛 결과 버림
      if ((activeFileIdRef.current ?? MAIN_KEY) === key) setAnalysis(aiData);
      if (key !== MAIN_KEY) setOpenFiles((fs) => fs.map((f) => (f.id === key ? { ...f, analysis: aiData } : f)));
    } catch {
      // 로컬 해석 결과 유지
    } finally {
      if (requestSeq.current[key] === seq) setPendingIds((p) => p.filter((k) => k !== key));
    }
  };

  const handleRunAnalysis = async (customCodeToRun?: string) => {
    const codeToAnalyze = (customCodeToRun ?? inputCode).replace(/\r\n/g, '\n');
    if (!codeToAnalyze.trim()) return;

    // 1. 즉시 로컬 정밀 분석 결과 반영 (0초 지연)
    const instant = buildFallbackAnalysis(codeToAnalyze);
    setAnalysis(instant);
    setSelectedLineNum(firstLineOf(instant));
    setIsEditing(false); // 분석 완료 후 검사 모드로 전환

    const key = activeFileIdRef.current ?? MAIN_KEY;
    if (key !== MAIN_KEY) {
      setOpenFiles((fs) =>
        fs.map((f) =>
          f.id === key ? { ...f, code: codeToAnalyze, analysis: instant, selectedLine: firstLineOf(instant), isEditing: false } : f
        )
      );
    }

    // 2. 백엔드 Gemini AI 분석 보강
    await requestAi(key, codeToAnalyze);
  };

  // 다른 파일로 넘어가기: 지금 파일의 상태를 저장하고, 고른 파일의 상태를 불러옴
  const switchFile = (targetId: string) => {
    const currentId = activeFileIdRef.current;
    if (targetId === currentId) return;
    const target = openFiles.find((f) => f.id === targetId);
    if (!target) return;
    setOpenFiles((fs) =>
      fs.map((f) => (f.id === currentId ? { ...f, code: inputCode, analysis, selectedLine: selectedLineNum, isEditing } : f))
    );
    setActiveFileId(targetId);
    setInputCode(target.code);
    setAnalysis(target.analysis);
    setSelectedLineNum(target.selectedLine);
    setIsEditing(target.isEditing);
    setShowExamples(false);
  };
  const switchByOffset = (offset: number) => {
    if (openFiles.length < 2) return;
    const i = activeIndex < 0 ? 0 : activeIndex;
    const next = Math.min(openFiles.length - 1, Math.max(0, i + offset));
    if (next !== i) switchFile(openFiles[next].id);
  };
  const switchByOffsetRef = useRef(switchByOffset);
  switchByOffsetRef.current = switchByOffset;

  const handleCopyCodeSnippet = (snippet: string, key: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(key);
    window.setTimeout(() => setCopiedSnippet(null), 2000);
  };

  // 어렵지 않은 기본 코드라 해석을 건너뛸 줄인지 (중급자·전공자)
  //  전공자는 기본 코드라도 오류·결함·누락이 있으면 점검 결과를 그대로 보여줌
  const isSkippedLine = (line: LineInterpretation) => {
    if (level === 'beginner' || line.isBlank || !line.intermediate.isBasic || line.hasError) return false;
    if (level === 'advanced') {
      const a = line.advanced;
      if (a.bugAudit?.hasIssue && a.bugAudit.severity !== 'none') return false;
      if (a.missingAudit?.hasMissing) return false;
    }
    return true;
  };

  // 현재 레벨에 맞는 줄 아래 주석 반환
  const getSubCommentByLevel = (line: LineInterpretation) => {
    if (level === 'beginner') return line.subCommentBeginner;
    if (level === 'intermediate') return line.subCommentIntermediate;
    return line.subCommentAdvanced;
  };

  const CopyButton = ({ code, id, label = '복사' }: { code: string; id: string; label?: string }) => (
    <button
      type="button"
      onClick={() => handleCopyCodeSnippet(code, id)}
      className="text-[11px] font-semibold text-[#A99CFF] hover:text-white flex items-center gap-1 cursor-pointer bg-[#7C6CF6]/10 hover:bg-[#7C6CF6]/25 px-2.5 py-1 rounded-full border border-[#7C6CF6]/30 transition-colors"
    >
      {copiedSnippet === id ? (
        <>
          <Check className="w-3 h-3 text-emerald-400" />
          <span>복사됨</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          <span>{label}</span>
        </>
      )}
    </button>
  );

  // ---------- 파일 끌어다 놓기 ----------
  const CODE_EXTENSIONS = new Set([
    'html', 'htm', 'css', 'scss', 'sass', 'less', 'js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'json', 'vue', 'svelte',
    'py', 'java', 'kt', 'c', 'h', 'cpp', 'hpp', 'cs', 'go', 'rs', 'php', 'rb', 'swift', 'dart', 'sql', 'sh', 'bat',
    'xml', 'svg', 'yml', 'yaml', 'md', 'txt', 'ini', 'env',
  ]);
  const MAX_FILE_BYTES = 1024 * 1024; // 1MB

  const MAX_FILES = 20;

  // 파일 하나 읽기: 코드 파일이 아니거나 너무 크면 이유를 돌려줌
  const readCodeFile = async (file: File): Promise<{ text: string } | { problem: string }> => {
    const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
    const looksText = file.type.startsWith('text/') || /json|javascript|xml|svg/.test(file.type) || CODE_EXTENSIONS.has(ext);
    if (!looksText) return { problem: '코드 파일이 아님' };
    if (file.size > MAX_FILE_BYTES) return { problem: `${(file.size / 1024 / 1024).toFixed(1)}MB로 너무 큼` };
    const text = (await file.text()).replace(/^\uFEFF/, ''); // 파일 맨 앞의 BOM 문자 제거
    if (text.includes('\u0000')) return { problem: '글자로 된 코드가 아님' };
    if (!text.trim()) return { problem: '빈 파일' };
    return { text: text.replace(/\r\n/g, '\n') };
  };

  const handleFileDrop = async (fileList: FileList | null) => {
    const all = Array.from(fileList ?? []);
    if (!all.length) return;
    const picked = all.slice(0, MAX_FILES);
    const loaded: OpenFile[] = [];
    const skipped: string[] = [];
    for (const [i, file] of picked.entries()) {
      const r = await readCodeFile(file);
      if ('problem' in r) {
        skipped.push(`${file.name}(${r.problem})`);
        continue;
      }
      const a = buildFallbackAnalysis(r.text);
      loaded.push({ id: `${Date.now()}-${i}-${file.name}`, name: file.name, code: r.text, analysis: a, selectedLine: firstLineOf(a), isEditing: false });
    }
    if (all.length > MAX_FILES) skipped.push(`그 외 ${all.length - MAX_FILES}개(한 번에 최대 ${MAX_FILES}개)`);

    if (!loaded.length) {
      setDropMessage(`불러올 수 있는 코드 파일이 없어요: ${skipped.join(', ')}. .html, .css, .js, .py 같은 1MB 이하 코드 파일을 넣어주세요.`);
      return;
    }

    // 지금 보던 파일 상태를 저장한 뒤, 새 파일들을 뒤에 이어 붙임 (같은 이름이면 새 내용으로 교체)
    const currentId = activeFileIdRef.current;
    const saved = openFiles.map((f) =>
      f.id === currentId ? { ...f, code: inputCode, analysis, selectedLine: selectedLineNum, isEditing } : f
    );
    const newNames = new Set(loaded.map((f) => f.name));
    const nextFiles = [...saved.filter((f) => !newNames.has(f.name)), ...loaded];
    setOpenFiles(nextFiles);

    const first = loaded[0];
    setActiveFileId(first.id);
    setInputCode(first.code);
    setAnalysis(first.analysis);
    setSelectedLineNum(first.selectedLine);
    setIsEditing(false);
    setShowExamples(false);

    const skippedNote = skipped.length ? ` (건너뜀: ${skipped.join(', ')})` : '';
    setDropMessage(
      nextFiles.length > 1
        ? `파일 ${loaded.length}개를 불러와 각각 해석했어요. 아래 점(●)이나 ← → 키로 파일을 넘겨 보세요.${skippedNote}`
        : `'${first.name}' 파일을 불러와 분석했어요.${skippedNote}`
    );

    // AI 해석은 파일마다 차례대로 요청 (서버에 한꺼번에 몰리지 않게)
    (async () => {
      for (const f of loaded) await requestAi(f.id, f.code);
    })();
  };

  const dropHandlers = {
    onDragEnter: (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes('Files')) return;
      e.preventDefault();
      dragDepth.current += 1;
      setIsDragging(true);
    },
    onDragOver: (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes('Files')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes('Files')) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setIsDragging(false);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      dragDepth.current = 0;
      setIsDragging(false);
      handleFileDrop(e.dataTransfer.files);
    },
  };

  // 예시 코드 불러오기
  const handleLoadExample = (preset: PresetItem) => {
    setOpenFiles([]);
    setActiveFileId(null);
    setInputCode(preset.data.originalCode);
    setAnalysis(preset.data);
    setSelectedLineNum(preset.data.lines.find((l) => !l.isBlank)?.lineNumber || 1);
    setIsEditing(false);
    setShowExamples(false);
  };

  // 여러 파일 사이를 오가는 점(●) 내비게이션 — 파일이 2개 이상일 때만 표시
  const fileDots =
    openFiles.length > 1 ? (
      <div className="flex flex-col items-center gap-1.5 py-1" aria-label="열린 파일 목록">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="이전 파일"
            disabled={activeIndex <= 0}
            onClick={() => switchByOffset(-1)}
            className="p-1 rounded-md text-[#9AA0B8] hover:text-white hover:bg-white/5 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-[420px]">
            {openFiles.map((f, i) => {
              const active = i === activeIndex;
              const hasErr = (active ? analysis : f.analysis).lines.some((l) => l.hasError);
              const waiting = pendingIds.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => switchFile(f.id)}
                  title={`${i + 1}. ${f.name}${hasErr ? ' — 오류 있음' : ''}${waiting ? ' — AI 해석 중' : ''}`}
                  aria-label={`${i + 1}번째 파일 ${f.name}${active ? ' (보는 중)' : ''}`}
                  aria-current={active}
                  className="p-1 cursor-pointer group"
                >
                  <span
                    className={`block rounded-full transition-all ${active ? 'w-6 h-2.5' : 'w-2.5 h-2.5 group-hover:scale-125'} ${
                      hasErr
                        ? active ? 'bg-red-400' : 'bg-red-500/70'
                        : active ? 'bg-[#8B7CFF]' : 'bg-[#4E546E] group-hover:bg-[#7D839C]'
                    } ${waiting ? 'animate-pulse' : ''}`}
                  />
                </button>
              );
            })}
          </div>
          <button
            type="button"
            aria-label="다음 파일"
            disabled={activeIndex >= openFiles.length - 1}
            onClick={() => switchByOffset(1)}
            className="p-1 rounded-md text-[#9AA0B8] hover:text-white hover:bg-white/5 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-[#9AA0B8] flex items-center gap-1.5 max-w-full">
          <span className="font-mono text-[#6E7491]">
            {activeIndex + 1} / {openFiles.length}
          </span>
          <span className="truncate max-w-[260px] text-[#D5D8E5] font-semibold">{loadedFileName}</span>
          <span className="text-[#6E7491]">· ← → 키로도 넘길 수 있어요</span>
        </p>
      </div>
    ) : null;

  // 코드 상자 아래 버튼 줄: [새 코드 작성] [예시 코드 ▾] [주 버튼]
  const ActionBar = ({ primary }: { primary: React.ReactNode }) => (
    <div className="grid grid-cols-3 gap-2.5">
      <button
        type="button"
        onClick={() => {
          setShowExamples(false);
          handleResetNewCode();
        }}
        className={SECONDARY_BTN}
        title="지금 코드를 지우고 새 코드를 입력합니다"
      >
        <FilePlus className="w-4 h-4" />
        새 코드 작성
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowExamples((v) => !v)}
          className={`${SECONDARY_BTN} w-full ${showExamples ? 'border-[#7C6CF6] text-white' : ''}`}
          aria-expanded={showExamples}
          aria-haspopup="menu"
        >
          <Lightbulb className="w-4 h-4" />
          예시 코드
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExamples ? 'rotate-180' : ''}`} />
        </button>
        {showExamples && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowExamples(false)} />
            <div
              role="menu"
              className="absolute z-20 bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-1.5 rounded-xl bg-[#232637] border border-[#3A3F58] shadow-2xl shadow-black/50"
            >
              <p className="px-2.5 pt-1.5 pb-2 text-[10px] font-bold tracking-wider text-[#7D839C]">
                예시 코드 불러오기
              </p>
              {SAMPLE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="menuitem"
                  onClick={() => handleLoadExample(p)}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#7C6CF6]/15 cursor-pointer transition-colors"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#E6E8F0]">{p.label}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#30344A] text-[#A99CFF] shrink-0">
                      {p.data.language}
                    </span>
                  </span>
                  <span className="block mt-0.5 text-[10px] text-[#7D839C] leading-snug">{p.description}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {primary}
    </div>
  );

  const levelMeta = LEVELS.find((l) => l.id === level)!;

  return (
    <div className="min-h-screen bg-[#181A24] text-[#E6E8F0] flex flex-col font-sans selection:bg-[#7C6CF6] selection:text-white">
      {/* 1. 상단 헤더 */}
      <header className="bg-[#1D1F2B]/95 backdrop-blur-md border-b border-[#2A2D3D] sticky top-0 z-30 w-full">
        <div className="w-full px-6 lg:px-8 py-3.5 flex items-center justify-between gap-6">
          <a href="#top" className="flex items-center gap-1.5 shrink-0">
            <Sparkles className="w-5 h-5 text-[#8B7CFF]" />
            <span className="text-xl font-extrabold tracking-tight">
              <span className="text-white">code</span>
              <span className="text-[#8B7CFF]">mate</span>
            </span>
            <span className="ml-1 text-[10px] font-bold text-white bg-[#7C6CF6] px-1.5 py-0.5 rounded-md leading-none">
              AI
            </span>
          </a>
          <span className="hidden sm:block text-xs text-[#9AA0B8]">
            내 수준에 맞춰 코드를 한 줄씩 설명해 드려요
          </span>
        </div>
      </header>

      <main id="top" className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-10">
        {/* 2. 히어로 */}
        <div className="mb-8">
          <p className="text-[11px] font-bold tracking-[0.18em] text-[#8B7CFF] uppercase mb-2">
            Your personal code guide
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            코드를 입력하면, 이해가 시작돼요.
          </h1>
          <p className="mt-2 text-sm text-[#9AA0B8]">
            설명 수준을 고르고 코드를 분석해 보세요.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ========================================================= */}
          {/* [좌측] 코드 입력 카드 */}
          {/* ========================================================= */}
          <section
            {...dropHandlers}
            className="relative lg:col-span-7 bg-[#1F2130] rounded-2xl border border-[#2E3145] overflow-hidden flex flex-col"
          >
            {/* 파일을 끌어오는 동안 덮개 표시 */}
            {isDragging && (
              <div className="pointer-events-none absolute inset-0 z-30 m-2 rounded-xl border-2 border-dashed border-[#8B7CFF] bg-[#181A24]/90 flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#7C6CF6]/20 flex items-center justify-center">
                  <Upload className="w-7 h-7 text-[#B5ABFF]" />
                </div>
                <p className="text-base font-bold text-white">여기에 파일을 놓으면 바로 분석해요</p>
                <p className="text-xs text-[#9AA0B8]">.html .css .js .ts .py .java 등 코드 파일 · 여러 개도 한 번에 · 파일당 1MB 이하</p>
              </div>
            )}
            <div className="px-5 py-4 border-b border-[#2A2D3D] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Code2 className="w-4 h-4 text-[#8B7CFF] shrink-0" />
                <span className="font-bold text-white text-sm shrink-0">코드 입력</span>
                {loadedFileName && (
                  <span
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#2A2D40] border border-[#34384F] text-[11px] text-[#D5D8E5] min-w-0"
                    title={loadedFileName}
                  >
                    <FileCode2 className="w-3 h-3 text-[#A99CFF] shrink-0" />
                    <span className="truncate max-w-[160px]">{loadedFileName}</span>
                  </span>
                )}
                {isAiLoading && (
                  <span className="flex items-center gap-1 text-[#A99CFF] text-[11px]">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    AI 분석 중
                  </span>
                )}
              </div>
              <span className="hidden sm:flex items-center gap-1 text-[11px] text-[#6E7491]">
                <Upload className="w-3 h-3" />
                코드 파일을 끌어다 놓아도 돼요
              </span>
            </div>

            {dropMessage && (
              <div
                className={`mx-4 sm:mx-5 mt-4 px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
                  /아니에요|커요|없어요|비어/.test(dropMessage)
                    ? 'bg-red-500/10 border border-red-500/40 text-red-300'
                    : 'bg-[#7C6CF6]/10 border border-[#7C6CF6]/40 text-[#C9C2FF]'
                }`}
                role="status"
              >
                <FileCode2 className="w-3.5 h-3.5 shrink-0" />
                {dropMessage}
              </div>
            )}

            <div className="p-4 sm:p-5 flex flex-col gap-4">
              {/* 레벨 선택 카드 */}
              <div className="grid grid-cols-3 gap-2.5" role="tablist" aria-label="설명 수준 선택">
                {LEVELS.map(({ id, label, desc, bars }) => {
                  const active = level === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setLevel(id)}
                      className={`py-3.5 px-2 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        active
                          ? 'bg-[#7C6CF6]/15 border-[#7C6CF6] shadow-[0_0_0_1px_rgba(124,108,246,0.35)]'
                          : 'bg-[#232637] border-[#30344A] hover:border-[#4A4F6A]'
                      }`}
                    >
                      <LevelBars filled={bars} active={active} />
                      <span className={`text-sm font-bold ${active ? 'text-white' : 'text-[#D5D8E5]'}`}>
                        {label}
                      </span>
                      <span className="text-[10px] text-[#7D839C]">{desc}</span>
                    </button>
                  );
                })}
              </div>

              {isEditing ? (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">분석할 코드를 붙여넣으세요</span>
                    <span className="font-mono text-[#6E7491]">{inputCode.split('\n').length}줄</span>
                  </div>
                  <textarea
                    rows={18}
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="검사할 코드를 여기에 붙여넣거나 수정하세요... 코드 파일(.html, .css, .js 등)을 이곳으로 끌어다 놓아도 됩니다."
                    className="w-full p-4 font-mono text-xs sm:text-sm text-[#E6E8F0] bg-[#171923] rounded-xl border border-[#2E3145] focus:outline-none focus:border-[#7C6CF6] leading-relaxed resize-y placeholder:text-[#555B75]"
                  />
                  {fileDots}
                  <ActionBar
                    primary={
                      <button
                        type="button"
                        onClick={() => handleRunAnalysis()}
                        disabled={!inputCode.trim()}
                        className={PRIMARY_BTN}
                      >
                        <Sparkles className="w-4 h-4" />
                        코드 분석하기
                      </button>
                    }
                  />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-white">궁금한 줄을 눌러보세요</span>
                    <span className="flex items-center gap-2">
                      {errorLines.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next =
                              errorLines.find((n) => n > selectedLine.lineNumber) ?? errorLines[0];
                            setSelectedLineNum(next);
                          }}
                          title="누를 때마다 다음 오류 줄로 이동합니다"
                          className="px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 font-bold flex items-center gap-1 cursor-pointer hover:bg-red-500/25 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          오류 {errorLines.length}개
                        </button>
                      )}
                      {analysis.language && (
                        <span className="px-2.5 py-1 rounded-lg bg-[#232637] border border-[#30344A] text-[#D5D8E5] font-semibold">
                          {analysis.language}
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-[#6E7491]">
                        {selectedLine.lineNumber} / {analysis.lines.length}
                      </span>
                    </span>
                  </div>

                  {/* 코드 리스트 */}
                  {/* 가로·세로 스크롤을 이 상자 하나에서 처리 → 가로 스크롤바가 항상 코드 상자 맨 아래에 고정 */}
                  <div className="code-scroll bg-[#171923] rounded-xl border border-[#2A2D3D] overflow-auto max-h-[560px] font-mono">
                    <div className="min-w-full w-max py-2">
                    {analysis.lines.map((line) => {
                      const isSelected = line.lineNumber === selectedLine.lineNumber;
                      const subComment = getSubCommentByLevel(line);
                      const isLineError = Boolean(line.hasError);
                      const isDimmed = isSkippedLine(line) && !isSelected;

                      return (
                        <div
                          key={line.lineNumber}
                          id={`code-line-${line.lineNumber}`}
                          onClick={() => setSelectedLineNum(line.lineNumber)}
                          className={`w-full py-1.5 pr-3 cursor-pointer flex flex-col gap-0.5 border-l-2 transition-colors ${isDimmed ? 'opacity-40 ' : ''}${
                            isLineError
                              ? isSelected
                                ? 'bg-red-500/15 border-red-400'
                                : 'bg-red-500/5 border-red-500/50 hover:bg-red-500/10'
                              : isSelected
                              ? 'bg-[#7C6CF6]/15 border-[#8B7CFF]'
                              : 'border-transparent hover:bg-white/[0.03]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`w-9 text-right select-none text-xs tabular-nums shrink-0 pt-0.5 ${
                                isLineError
                                  ? 'text-red-400'
                                  : isSelected
                                  ? 'text-white font-bold'
                                  : 'text-[#4E546E]'
                              }`}
                            >
                              {line.lineNumber}
                            </span>
                            <div className="flex-1 flex items-center gap-2">
                              <pre
                                className={`text-xs sm:text-[13px] whitespace-pre leading-relaxed ${
                                  isLineError ? 'text-red-400 font-semibold' : 'text-[#E6E8F0]'
                                }`}
                              >
                                {line.code || ' '}
                              </pre>
                              {isLineError && (
                                <span className="shrink-0 text-[10px] font-sans font-bold bg-red-500/15 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <XCircle className="w-3 h-3" />
                                  오류 코드
                                </span>
                              )}
                            </div>
                          </div>

                          {!line.isBlank && (isSelected || isLineError) && (
                            <div className="sticky left-0 max-w-[36rem] pl-12 text-[11px] font-sans flex items-start gap-1.5 leading-normal whitespace-normal">
                              <span className="text-[#555B75] font-mono select-none">//</span>
                              <span className={isLineError ? 'text-red-300' : 'text-[#A99CFF]'}>
                                {line.hasError && line.errorDetail
                                  ? `[오류 감지] ${line.errorDetail}`
                                  : subComment}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  </div>

                  {fileDots}

                  <p className="text-[11px] text-[#7D839C] flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#8B7CFF]" />
                    {level !== 'beginner'
                      ? '흐리게 표시된 줄은 기본 코드라 설명을 생략했어요. 방향키(↑ ↓)로도 이동할 수 있어요.'
                      : '줄을 누르면 오른쪽에 그 줄의 설명이 나와요. 방향키(↑ ↓)로도 이동할 수 있어요.'}
                  </p>

                  <ActionBar
                    primary={
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className={PRIMARY_BTN}
                      >
                        <Pencil className="w-4 h-4" />
                        코드 수정
                      </button>
                    }
                  />
                </>
              )}
            </div>
          </section>

          {/* ========================================================= */}
          {/* [우측] 맞춤 코드 설명 카드 */}
          {/* ========================================================= */}
          <section className="lg:col-span-5 bg-[#1F2130] rounded-2xl border border-[#2E3145] overflow-hidden lg:sticky lg:top-20">
            <div className="px-5 py-4 border-b border-[#2A2D3D] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8B7CFF]" />
                <span className="font-bold text-white text-sm">맞춤 코드 설명</span>
              </div>
              <span className="text-[11px] text-[#A99CFF]">{levelMeta.label} 모드</span>
            </div>

            <div className="code-scroll p-4 sm:p-5 space-y-4 max-h-[calc(100vh-10rem)] overflow-y-auto">
              {/* 선택된 줄 카드 */}
              <div className="p-4 rounded-xl bg-[#232637] border border-[#30344A] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#7C6CF6]/20 text-[#B5ABFF]">
                      {selectedLine.lineNumber}번째 줄
                    </span>
                    {selectedLine.shortRole && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300">
                        {selectedLine.shortRole}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label="이전 줄"
                      disabled={selectedLine.lineNumber <= 1}
                      onClick={() => setSelectedLineNum((n) => Math.max(1, n - 1))}
                      className="p-1 rounded-md text-[#9AA0B8] hover:text-white hover:bg-white/5 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="다음 줄"
                      disabled={selectedLine.lineNumber >= analysis.lines.length}
                      onClick={() =>
                        setSelectedLineNum((n) => Math.min(analysis.lines.length, n + 1))
                      }
                      className="p-1 rounded-md text-[#9AA0B8] hover:text-white hover:bg-white/5 disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div
                  className={`px-3 py-2.5 rounded-lg font-mono text-xs overflow-x-auto flex items-center justify-between gap-2 ${
                    selectedLine.hasError
                      ? 'bg-red-500/10 text-red-300 border border-red-500/40'
                      : 'bg-[#2B2F44] text-[#D5D8E5]'
                  }`}
                >
                  <code className="whitespace-pre">{selectedLine.code || '(공백 라인)'}</code>
                  {selectedLine.hasError && (
                    <span className="text-[10px] font-sans font-bold bg-red-500 text-white px-2 py-0.5 rounded-full shrink-0">
                      틀린 코드
                    </span>
                  )}
                </div>
              </div>

              {/* 🟢 초급자 */}
              {level === 'beginner' && (
                <div className="space-y-3">
                  <InfoBlock icon={<BookOpen className="w-3.5 h-3.5 text-emerald-400" />} title="이 줄은 무슨 의미인가요?">
                    {selectedLine.beginner.definition && (
                      <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-[13px] text-emerald-200 leading-relaxed">
                        <span className="font-bold text-emerald-300">정의 </span>
                        {selectedLine.beginner.definition}
                      </div>
                    )}
                    <p className="text-sm text-[#E6E8F0] leading-relaxed">
                      {selectedLine.beginner.definition && (
                        <span className="font-bold text-[#A99CFF]">이 줄에서는 </span>
                      )}
                      {selectedLine.beginner.easyExplanation}
                    </p>
                  </InfoBlock>

                  <InfoBlock icon={<HelpCircle className="w-3.5 h-3.5 text-[#A99CFF]" />} title="왜 여기서 사용되었나요?">
                    <p className="text-sm text-[#B4B9CC] leading-relaxed">
                      {selectedLine.beginner.whyUsedHere}
                    </p>
                  </InfoBlock>

                  {selectedLine.hasError ? (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/40 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-red-300">
                        <XCircle className="w-4 h-4 shrink-0" />
                        주의: 이 줄의 코드가 틀리게 작성되었어요!
                      </div>
                      <pre className="p-3 bg-[#171923] text-red-300 font-mono text-xs rounded-lg overflow-x-auto whitespace-pre-wrap">
                        {selectedLine.code}
                      </pre>
                      <p className="text-xs text-red-200/90 leading-relaxed">
                        <strong className="text-red-200">어디가 틀렸나요? </strong>
                        {selectedLine.errorDetail ||
                          selectedLine.beginner.wrongExample?.reason ||
                          '문법적 오류나 태그/따옴표 닫힘이 누락되었습니다.'}
                      </p>
                    </div>
                  ) : (
                    <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      이 줄은 문법 오류 없이 정상적으로 작성되었어요.
                    </div>
                  )}

                  {/* 모범 코드는 이 줄에 오류가 있을 때만 보여줌 */}
                  {selectedLine.hasError && selectedLine.beginner.betterExample && (
                    <InfoBlock
                      icon={<CheckCircle2 className="w-3.5 h-3.5 text-[#A99CFF]" />}
                      title="권장하는 모범 코드"
                      action={<CopyButton code={selectedLine.beginner.betterExample.code} id="beginner-better" />}
                    >
                      <CodeBox className="text-[#B5ABFF]">{selectedLine.beginner.betterExample.code}</CodeBox>
                      <p className="text-xs text-[#B4B9CC] leading-relaxed">
                        {selectedLine.beginner.betterExample.reason}
                      </p>
                    </InfoBlock>
                  )}

                  {selectedLine.beginner.tokens && selectedLine.beginner.tokens.length > 0 && (
                    <InfoBlock title="태그 · 속성 키워드 사전">
                      <div className="divide-y divide-[#30344A] text-xs">
                        {selectedLine.beginner.tokens.map((t, idx) => (
                          <div key={`${t.token}-${idx}`} className="py-2 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-baseline gap-2">
                            <code className="font-mono font-semibold text-[#B5ABFF] bg-[#7C6CF6]/10 px-2 py-0.5 rounded-md shrink-0">
                              {t.token}
                            </code>
                            <span className="text-[#B4B9CC] leading-relaxed">{t.meaning}</span>
                          </div>
                        ))}
                      </div>
                    </InfoBlock>
                  )}
                </div>
              )}

              {/* 🔵 중급자 */}
              {/* 중급자·전공자: 어렵지 않은 기본 코드는 해석 생략 */}
              {isSkippedLine(selectedLine) && (
                <div className="px-4 py-3.5 rounded-xl bg-[#232637] border border-dashed border-[#3A3F58] text-xs text-[#9AA0B8] flex items-start gap-2">
                  <MinusCircle className="w-4 h-4 shrink-0 text-[#6E7491]" />
                  <span>
                    <strong className="text-[#D5D8E5]">기본 코드라서 설명을 생략했어요.</strong>{' '}
                    {selectedLine.intermediate.howItWorks}
                  </span>
                </div>
              )}

              {level === 'intermediate' && !isSkippedLine(selectedLine) && (
                <div className="space-y-3">
                  <InfoBlock icon={<Settings2 className="w-3.5 h-3.5 text-[#A99CFF]" />} title="어떻게 작동하나요?">
                    <p className="text-sm text-[#E6E8F0] leading-relaxed">
                      {selectedLine.intermediate.howItWorks}
                    </p>
                  </InfoBlock>

                  <InfoBlock icon={<SearchCheck className="w-3.5 h-3.5 text-sky-400" />} title="코드 무결성 & 구문 검증">
                    <p className="text-sm text-[#B4B9CC] leading-relaxed">
                      {selectedLine.intermediate.codeCheckVerdict}
                    </p>
                  </InfoBlock>

                  {selectedLine.intermediate.betterRefactor && (
                    <InfoBlock
                      icon={<Zap className="w-3.5 h-3.5 text-amber-400" />}
                      title="더 나은 리팩토링 추천"
                      action={<CopyButton code={selectedLine.intermediate.betterRefactor.code} id="refactor-better" label="코드 복사" />}
                    >
                      <CodeBox className="text-emerald-300">{selectedLine.intermediate.betterRefactor.code}</CodeBox>
                      <p className="text-xs text-[#B4B9CC] leading-relaxed">
                        <strong className="text-[#E6E8F0]">개선 효과: </strong>
                        {selectedLine.intermediate.betterRefactor.reason}
                      </p>
                    </InfoBlock>
                  )}

                  <InfoBlock icon={<PlusCircle className="w-3.5 h-3.5 text-[#A99CFF]" />} title="더 추가하면 좋을 코드">
                    {selectedLine.intermediate.suggestedAdditions &&
                    selectedLine.intermediate.suggestedAdditions.length > 0 ? (
                      <div className="space-y-2.5">
                        {selectedLine.intermediate.suggestedAdditions.map((addition, idx) => (
                          <div key={idx} className="p-3 bg-[#1B1D2A] rounded-lg border border-[#30344A] space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <code className="font-mono text-xs font-semibold text-[#B5ABFF] overflow-x-auto">
                                {addition.code}
                              </code>
                              <CopyButton code={addition.code} id={`add-${idx}`} />
                            </div>
                            <div className="text-xs text-[#E6E8F0]">
                              <strong>의미: </strong>
                              {addition.meaning}
                            </div>
                            <div className="text-xs text-[#B4B9CC] leading-relaxed">
                              <strong className="text-[#E6E8F0]">왜 넣어야 하나요? </strong>
                              {addition.whyAdd}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#7D839C]">
                        현재 구문은 핵심 요소가 충실히 갖추어져 있어 추가할 코드가 없어요.
                      </p>
                    )}
                  </InfoBlock>
                </div>
              )}

              {/* 🟣 전공자 */}
              {level === 'advanced' && !isSkippedLine(selectedLine) && (
                <div className="space-y-3">
                  {selectedLine.advanced.technicalDetail && (
                    <InfoBlock icon={<Microscope className="w-3.5 h-3.5 text-[#A99CFF]" />} title="기술 분석">
                      <p className="text-[13px] text-[#E6E8F0] leading-relaxed">
                        {selectedLine.advanced.technicalDetail}
                      </p>
                    </InfoBlock>
                  )}
                  <div
                    className={`p-4 rounded-xl border space-y-1.5 ${
                      selectedLine.advanced.bugAudit.hasIssue
                        ? 'bg-red-500/10 border-red-500/40'
                        : 'bg-[#232637] border-[#30344A]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        {selectedLine.advanced.bugAudit.hasIssue ? (
                          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span>
                          {selectedLine.advanced.bugAudit.hasIssue
                            ? `오류 & 결함: ${selectedLine.advanced.bugAudit.issueTitle}`
                            : `오류 없음: ${selectedLine.advanced.bugAudit.issueTitle}`}
                        </span>
                      </div>
                      {selectedLine.advanced.bugAudit.hasIssue && (
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-red-500/20 text-red-300 rounded-full font-bold">
                          {selectedLine.advanced.bugAudit.severity}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#B4B9CC] leading-relaxed">
                      {selectedLine.advanced.bugAudit.issueDetail}
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-xl border space-y-2 ${
                      selectedLine.advanced.missingAudit.hasMissing
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-[#232637] border-[#30344A]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>
                        {selectedLine.advanced.missingAudit.hasMissing
                          ? `누락된 필수 코드: ${selectedLine.advanced.missingAudit.missingTitle}`
                          : '누락된 필수 요소 없음 (검증 통과)'}
                      </span>
                    </div>
                    {selectedLine.advanced.missingAudit.hasMissing && (
                      <>
                        <CodeBox className="text-amber-200">{selectedLine.advanced.missingAudit.missingSnippet}</CodeBox>
                        <p className="text-xs text-amber-100/80 leading-relaxed">
                          <strong>누락 시 영향: </strong>
                          {selectedLine.advanced.missingAudit.reason}
                        </p>
                      </>
                    )}
                  </div>

                  {selectedLine.advanced.recommendedPatch && (
                    <InfoBlock
                      icon={<Wrench className="w-3.5 h-3.5 text-[#A99CFF]" />}
                      title="추천 패치 코드"
                      action={<CopyButton code={selectedLine.advanced.recommendedPatch} id="patch-code" label="패치 복사" />}
                    >
                      <CodeBox className="text-[#B5ABFF]">{selectedLine.advanced.recommendedPatch}</CodeBox>
                      <p className="text-xs text-[#7D839C]">
                        오류와 누락 요소를 보완한 완성형 코드예요.
                      </p>
                    </InfoBlock>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        <p className="mt-6 text-[11px] text-[#6E7491]">
          AI가 만든 설명은 틀릴 수 있으니 중요한 코드는 직접 실행해 확인해 보세요.
        </p>
      </main>
    </div>
  );
}

function InfoBlock({
  icon,
  title,
  action,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 rounded-xl bg-[#232637] border border-[#30344A] space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
          {icon}
          <span>{title}</span>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function CodeBox({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <pre className={`p-2.5 bg-[#171923] font-mono text-xs rounded-lg overflow-x-auto whitespace-pre-wrap border border-[#2A2D3D] ${className}`}>
      {children}
    </pre>
  );
}
