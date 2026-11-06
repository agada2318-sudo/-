// 고른 줄을 "이렇게 바꾸고 싶어"라고 말하면 Qwen2.5-1.5B-Instruct가 고치는 방법과 새 코드를 알려주는 패널
import React, { useEffect, useState } from 'react';
import { Bot, Loader2, Send, Check, Copy, Wand2, AlertTriangle } from 'lucide-react';

interface EditResult {
  keyChange: string;
  explanation: string;
  modifiedCode: string;
  originalCode: string;
  startLine: number;
  endLine: number;
}

const EXAMPLES = ['이 줄의 공백을 더 넓히고 싶어', '글자 색을 파란색으로 바꾸고 싶어', '이 부분을 함수로 묶고 싶어'];

export default function QwenEditAssistant({
  code,
  startLine,
  endLine,
  fileName,
  onApply,
}: {
  code: string;
  startLine: number;
  endLine: number;
  fileName?: string | null;
  onApply: (newCode: string, startLine: number) => void;
}) {
  const [request, setRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EditResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [modelReady, setModelReady] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/qwen/status')
      .then((r) => r.json())
      .then((s) => setModelReady(Boolean(s.modelFileExists)))
      .catch(() => setModelReady(false));
  }, []);

  // 다른 줄을 고르면 이전 결과는 지움
  useEffect(() => {
    setResult(null);
    setError(null);
  }, [startLine, endLine, code]);

  const rangeLabel = startLine === endLine ? `${startLine}번째 줄` : `${startLine}~${endLine}번째 줄`;

  const ask = async (text = request) => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/qwen/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, startLine, endLine, request: text, fileName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '요청에 실패했어요.');
      setResult(data as EditResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : '요청에 실패했어요.');
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    if (!result) return;
    const lines = code.replace(/\r\n/g, '\n').split('\n');
    lines.splice(result.startLine - 1, result.endLine - result.startLine + 1, ...result.modifiedCode.split('\n'));
    onApply(lines.join('\n'), result.startLine);
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.modifiedCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="p-4 rounded-xl bg-[#232637] border border-[#7C6CF6]/40 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
          <Bot className="w-3.5 h-3.5 text-[#A99CFF]" />
          <span>이렇게 바꾸고 싶어요</span>
        </div>
        <span className="text-[10px] text-[#7D839C]">Qwen2.5-1.5B · {rangeLabel}</span>
      </div>

      {modelReady === false && (
        <p className="text-[11px] text-amber-300 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
          Qwen 모델 파일이 아직 없어요. 터미널에서 <code className="font-mono">npm run download-model</code>을 실행해 주세요.
        </p>
      )}

      <p className="text-[11px] text-[#7D839C]">
        Shift를 누른 채 다른 줄을 클릭하면 여러 줄을 한꺼번에 고를 수 있어요.
      </p>

      <div className="flex gap-2">
        <textarea
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              ask();
            }
          }}
          rows={2}
          placeholder={`${rangeLabel}을(를) 어떻게 바꾸고 싶나요?`}
          className="flex-1 resize-none px-3 py-2 rounded-lg bg-[#171923] border border-[#2A2D3D] text-sm text-[#E6E8F0] placeholder:text-[#555B75] focus:outline-none focus:border-[#7C6CF6]"
        />
        <button
          type="button"
          onClick={() => ask()}
          disabled={loading || !request.trim()}
          aria-label="질문 보내기"
          className="px-3 rounded-lg bg-[#7C6CF6] hover:bg-[#6B5AE8] disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            disabled={loading}
            onClick={() => {
              setRequest(ex);
              ask(ex);
            }}
            className="text-[11px] px-2 py-1 rounded-full bg-[#2A2D40] text-[#B4B9CC] hover:text-white border border-[#34384F] cursor-pointer disabled:opacity-40"
          >
            {ex}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-xs text-[#A99CFF] flex items-center gap-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Qwen이 고치는 방법을 생각하고 있어요… (처음 한 번은 모델을 불러오느라 더 걸려요)
        </p>
      )}

      {error && <p className="text-xs text-red-300">{error}</p>}

      {result && (
        <div className="space-y-2.5">
          <div className="px-3 py-2 rounded-lg bg-[#7C6CF6]/15 border border-[#7C6CF6]/40 text-[13px] text-[#D9D4FF]">
            <span className="font-bold text-[#B5ABFF]">이렇게 하세요 </span>
            {result.keyChange}
          </div>
          <p className="text-sm text-[#E6E8F0] leading-relaxed whitespace-pre-wrap">{result.explanation}</p>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-red-300">바꾸기 전</span>
            <pre className="p-2.5 bg-[#171923] font-mono text-xs rounded-lg overflow-x-auto whitespace-pre border border-red-500/30 text-red-200/80">
              {result.originalCode || ' '}
            </pre>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-300">바꾼 후</span>
              <button
                type="button"
                onClick={copy}
                className="text-[11px] text-[#9AA0B8] hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? '복사됨' : '복사'}
              </button>
            </div>
            <pre className="p-2.5 bg-[#171923] font-mono text-xs rounded-lg overflow-x-auto whitespace-pre border border-emerald-500/30 text-emerald-200">
              {result.modifiedCode || ' '}
            </pre>
          </div>

          <button
            type="button"
            onClick={apply}
            className="w-full py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Wand2 className="w-4 h-4" />
            내 코드에 적용하기
          </button>
          <p className="text-[10px] text-[#6E7491]">작은 AI 모델이라 틀릴 수 있어요. 적용한 뒤 꼭 실행해서 확인해 보세요.</p>
        </div>
      )}
    </div>
  );
}
