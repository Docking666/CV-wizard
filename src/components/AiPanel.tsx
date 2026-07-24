"use client";

import React, { useCallback, useState } from "react";
import { useAppStore } from "@/lib/store";

const DIMENSION_LABELS: Record<string, string> = {
  skill_match: "技能匹配",
  experience_relevance: "经验相关度",
  achievement_quantification: "成果量化",
  keyword_density: "关键词密度",
  format_quality: "格式规范",
};

export function AiPanel() {
  const {
    resumeData,
    setResumeData,
    jdAnalysis,
    setJdAnalysis,
    matchScore,
    setMatchScore,
    aiAction,
    setAiAction,
    backupOriginal,
    restoreOriginal,
  } = useAppStore();

  const [jdInput, setJdInput] = useState("");
  const [rewriteProgress, setRewriteProgress] = useState(0);
  const [rewriteTotal, setRewriteTotal] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleAnalyzeJD = useCallback(async () => {
    if (!jdInput.trim()) return;
    setAiAction("analyzing");
    setLocalError(null);
    try {
      const res = await fetch("/api/ai?action=analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd: jdInput }),
      });
      const data = await res.json();
      if (data.success) {
        setJdAnalysis(data.data);
      } else {
        setLocalError(data.error || "JD 分析失败");
      }
    } catch {
      setLocalError("JD 分析请求失败");
    } finally {
      setAiAction("idle");
    }
  }, [jdInput, setJdAnalysis, setAiAction]);

  const handleScore = useCallback(async () => {
    if (!resumeData || !jdAnalysis) return;
    setAiAction("scoring");
    setLocalError(null);
    try {
      const res = await fetch("/api/ai?action=score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: resumeData, jd: jdInput }),
      });
      const data = await res.json();
      if (data.success) {
        setMatchScore(data.data);
      } else {
        setLocalError(data.error || "评分失败");
      }
    } catch {
      setLocalError("评分请求失败");
    } finally {
      setAiAction("idle");
    }
  }, [resumeData, jdAnalysis, jdInput, setMatchScore, setAiAction]);

  const handleAutoAdapt = useCallback(async () => {
    if (!resumeData || !jdAnalysis) return;

    const confirmed = window.confirm("一键适配将使用 AI 重写所有工作经历描述。建议先备份原始简历。是否继续？");
    if (!confirmed) return;

    backupOriginal();
    setAiAction("rewriting");
    setLocalError(null);

    const work = resumeData.work || [];
    setRewriteTotal(work.length);
    const adaptedWork = [...work];

    try {
      for (let i = 0; i < work.length; i++) {
        setRewriteProgress(i + 1);
        const item = work[i];
        if (!item.highlights || item.highlights.length === 0) continue;

        const res = await fetch("/api/ai?action=rewrite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            highlights: item.highlights,
            keywords: [...jdAnalysis.hard_skills, ...jdAnalysis.soft_skills, ...jdAnalysis.industry_terms],
          }),
        });

        const data = await res.json();
        if (data.success && data.data?.rewritten_highlights) {
          adaptedWork[i] = { ...item, highlights: data.data.rewritten_highlights };
        }
      }

      setResumeData({ ...resumeData, work: adaptedWork });
    } catch {
      setLocalError("简历适配请求失败");
    } finally {
      setAiAction("idle");
      setRewriteProgress(0);
    }
  }, [resumeData, jdAnalysis, backupOriginal, setResumeData, setAiAction]);

  const isAnalyzing = aiAction === "analyzing";
  const isScoring = aiAction === "scoring";
  const isRewriting = aiAction === "rewriting";
  const isProcessing = isAnalyzing || isScoring || isRewriting;

  return (
    <div className="space-y-4">
      {/* JD 输入 */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
          岗位描述 (JD)
        </label>
        <textarea
          value={jdInput}
          onChange={(e) => { setJdInput(e.target.value); setLocalError(null); }}
          maxLength={10000}
          className="w-full h-32 p-3 text-xs bg-gray-50 border border-gray-200 rounded resize-none outline-none focus:border-indigo-400"
          placeholder="粘贴目标岗位的招聘描述..."
        />
        <div className="flex justify-between mt-1">
          <span className="text-[11px] text-gray-400">{jdInput.length}/10000</span>
          <button
            onClick={handleAnalyzeJD}
            disabled={isProcessing || !jdInput.trim()}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {isAnalyzing ? "解析中..." : "解析 JD 提取关键词"}
          </button>
        </div>
        {localError && (
          <p className="mt-2 text-[11px] text-red-600 bg-red-50 px-2 py-1 rounded">{localError}</p>
        )}
      </div>

      {/* JD 分析结果 */}
      {jdAnalysis && (
        <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
          <h4 className="text-xs font-semibold text-indigo-800 mb-2">JD 分析结果</h4>
          <div className="space-y-1.5 text-[11px]">
            <p><span className="text-gray-500">岗位：</span>{jdAnalysis.job_title}</p>
            {jdAnalysis.hard_skills.length > 0 && (
              <p><span className="text-gray-500">硬技能：</span>{jdAnalysis.hard_skills.join(", ")}</p>
            )}
            {jdAnalysis.soft_skills.length > 0 && (
              <p><span className="text-gray-500">软技能：</span>{jdAnalysis.soft_skills.join(", ")}</p>
            )}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <button
          onClick={handleScore}
          disabled={isProcessing || !resumeData || !jdAnalysis}
          title={!resumeData ? "请先上传或输入简历" : !jdAnalysis ? "请先解析 JD" : ""}
          className="flex-1 px-3 py-2 bg-teal-600 text-white text-xs rounded hover:bg-teal-700 disabled:opacity-50 transition"
        >
          {isScoring ? "评分中..." : "匹配度评分"}
        </button>
        <button
          onClick={handleAutoAdapt}
          disabled={isProcessing || !resumeData || !jdAnalysis}
          title={!resumeData ? "请先上传或输入简历" : !jdAnalysis ? "请先解析 JD" : ""}
          className="flex-1 px-3 py-2 bg-rose-600 text-white text-xs rounded hover:bg-rose-700 disabled:opacity-50 transition"
        >
          {isRewriting ? `适配中 ${rewriteProgress}/${rewriteTotal}...` : "一键适配简历"}
        </button>
      </div>

      {isRewriting && (
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-rose-500 h-1.5 rounded-full transition-all"
            style={{ width: `${rewriteTotal > 0 ? (rewriteProgress / rewriteTotal) * 100 : 0}%` }}
          />
        </div>
      )}

      {/* 恢复原始 */}
      <button
        onClick={restoreOriginal}
        className="w-full px-3 py-1.5 border border-gray-300 text-gray-600 text-xs rounded hover:bg-gray-50 transition"
      >
        恢复原始简历
      </button>

      {/* 匹配度评分结果 */}
      {matchScore && (
        <div className="p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-gray-800">匹配度评分</h4>
            <span className="text-lg font-bold text-indigo-600">{matchScore.overall_score}</span>
          </div>

          {Object.entries(matchScore.dimensions).map(([key, dim]) => (
            <div key={key} className="mb-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] text-gray-600">{DIMENSION_LABELS[key] || key}</span>
                <span className="text-[11px] font-medium text-gray-800">{dim.score}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-indigo-500 h-1.5 rounded-full"
                  style={{ width: `${dim.score}%` }}
                />
              </div>
              {dim.comment && (
                <p className="text-[11px] text-gray-500 mt-0.5">{dim.comment}</p>
              )}
            </div>
          ))}

          {matchScore.suggestions.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-100">
              <p className="text-[11px] font-semibold text-gray-600 mb-1">改进建议</p>
              <ul className="space-y-1">
                {matchScore.suggestions.map((s, i) => (
                  <li key={i} className="text-[11px] text-gray-500">• {s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
