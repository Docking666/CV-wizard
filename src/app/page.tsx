"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/lib/store";
import { loadTemplates, loadThemes } from "@/lib/config-loader";
import { validateResume, type Resume } from "@/lib/schemas/resume";
import { ClassicTemplate } from "@/lib/templates/ClassicTemplate";
import { ModernTemplate } from "@/lib/templates/ModernTemplate";
import { CreativeTemplate } from "@/lib/templates/CreativeTemplate";
import { AcademicTemplate } from "@/lib/templates/AcademicTemplate";
import { SAMPLE_RESUME } from "@/lib/sample-data";
import { AiPanel } from "@/components/AiPanel";
import { ResumeUploader } from "@/components/ResumeUploader";

const TEMPLATE_COMPONENTS: Record<string, React.FC<{ data: Resume; cssVariables?: Record<string, string> }>> = {
  "classic-single-col": ClassicTemplate,
  "modern-dual-col": ModernTemplate,
  "creative-aside": CreativeTemplate,
  "academic-paper": AcademicTemplate,
};

export default function Home() {
  const {
    resumeData,
    setResumeData,
    selectedTemplateId,
    setSelectedTemplateId,
    selectedThemeId,
    setSelectedThemeId,
    templates,
    setTemplates,
    themes,
    setThemes,
    isExporting,
    setIsExporting,
    error,
    setError,
    editMode,
    setEditMode,
    markdownInput,
    setMarkdownInput,
    leftTab,
    setLeftTab,
    jsonInput,
    setJsonInput,
  } = useAppStore();

  const previewRef = useRef<HTMLDivElement>(null);
  const lastSyncedResumeRef = useRef<Resume | null>(null);

  // 初始化
  useEffect(() => {
    setTemplates(loadTemplates());
    setThemes(loadThemes());
    const result = validateResume(SAMPLE_RESUME);
    if (result.success) {
      setResumeData(result.data);
      setJsonInput(JSON.stringify(result.data, null, 2));
      lastSyncedResumeRef.current = result.data;
    }
  }, [setTemplates, setThemes, setResumeData, setJsonInput]);

  // 当 resumeData 被外部更新时（上传/AI适配/Markdown解析），同步 jsonInput
  useEffect(() => {
    if (!resumeData) return;
    if (lastSyncedResumeRef.current === resumeData) return;
    const newJson = JSON.stringify(resumeData, null, 2);
    // 避免覆盖用户正在编辑的无效 JSON，只有当当前 jsonInput 解析后等于旧 resumeData 时才同步
    try {
      const parsed = JSON.parse(jsonInput);
      if (JSON.stringify(parsed) === JSON.stringify(lastSyncedResumeRef.current)) {
        setJsonInput(newJson);
        lastSyncedResumeRef.current = resumeData;
      }
    } catch {
      // 当前 JSON 无效，直接同步
      setJsonInput(newJson);
      lastSyncedResumeRef.current = resumeData;
    }
  }, [resumeData, jsonInput, setJsonInput]);

  // JSON 编辑器变更
  const handleJsonChange = useCallback(
    (value: string) => {
      setJsonInput(value);
      try {
        const parsed = JSON.parse(value);
        const result = validateResume(parsed);
        if (result.success) {
          setResumeData(result.data);
          lastSyncedResumeRef.current = result.data;
          setError(null);
        } else {
          setError(result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "));
        }
      } catch {
        setError("JSON 格式错误");
      }
    },
    [setResumeData, setError, setJsonInput],
  );

  // Markdown → JSON 解析
  const handleMarkdownParse = useCallback(async () => {
    if (!markdownInput.trim()) return;
    try {
      const res = await fetch("/api/parse-markdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: markdownInput }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setResumeData(data.data as Resume);
        setJsonInput(JSON.stringify(data.data, null, 2));
        setError(null);
      } else {
        setError(data.error || "解析失败");
      }
    } catch {
      setError("Markdown 解析请求失败");
    }
  }, [markdownInput, setResumeData, setError, setJsonInput]);

  // 导出功能
  const handleExport = useCallback(
    async (format: "pdf" | "png") => {
      if (!previewRef.current || !resumeData) return;

      setIsExporting(true);
      setError(null);

      try {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = previewRef.current.innerHTML;
        tempDiv.querySelectorAll("[data-preview-ui]").forEach((el) => el.remove());

        const res = await fetch("/api/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            html: tempDiv.innerHTML,
            format,
            themeId: selectedThemeId,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "导出失败");
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = format === "pdf" ? "resume.pdf" : "resume.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "导出失败");
      } finally {
        setIsExporting(false);
      }
    },
    [previewRef, resumeData, selectedThemeId, setIsExporting, setError],
  );

  const currentTheme = themes.find((t) => t.id === selectedThemeId);
  const TemplateComponent = TEMPLATE_COMPONENTS[selectedTemplateId];

  const cssVars = currentTheme?.cssVariables || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">AI 简历岗位适配器</h1>
          <p className="text-xs text-gray-500">上传简历 → AI 适配 → 导出 PDF/PNG</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExport("pdf")}
            disabled={isExporting || !resumeData}
            className="px-4 py-1.5 bg-teal-600 text-white text-sm rounded hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isExporting ? "导出 PDF 中..." : "导出 PDF"}
          </button>
          <button
            onClick={() => handleExport("png")}
            disabled={isExporting || !resumeData}
            className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isExporting ? "导出 PNG 中..." : "导出 PNG"}
          </button>
        </div>
      </header>

      {/* 主体：左编辑 + 右预览 */}
      <div className="flex flex-col md:flex-row h-[calc(100vh-56px)]">
        {/* 左侧编辑面板 */}
        <aside className="w-full md:w-[420px] flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          {/* 标签页切换 */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setLeftTab("template")}
              className={`flex-1 px-4 py-2.5 text-xs font-semibold transition ${
                leftTab === "template"
                  ? "text-teal-700 border-b-2 border-teal-600 bg-teal-50/50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              编辑 & 模板
            </button>
            <button
              onClick={() => setLeftTab("ai")}
              className={`flex-1 px-4 py-2.5 text-xs font-semibold transition ${
                leftTab === "ai"
                  ? "text-indigo-700 border-b-2 border-indigo-600 bg-indigo-50/50"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              AI 岗位适配
            </button>
          </div>

          {/* AI 面板 */}
          {leftTab === "ai" && (
            <div className="flex-1 overflow-y-auto p-4">
              <AiPanel />
            </div>
          )}

          {/* 模板 / 编辑面板 */}
          {leftTab === "template" && (
            <>
              <div className="p-4 border-b border-gray-100">
                <ResumeUploader />
              </div>

              <div className="p-4 border-b border-gray-100">
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                    简历模板
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {templates.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTemplateId(t.id)}
                        className={`px-3 py-1 text-xs rounded-full border transition ${
                          selectedTemplateId === t.id
                            ? "border-teal-600 bg-teal-50 text-teal-700 font-semibold"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {t.name}
                        <span className="ml-1 opacity-60">ATS {t.atsScore}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                    配色主题
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedThemeId(t.id)}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border transition"
                        style={{
                          borderColor: selectedThemeId === t.id ? t.cssVariables["--primary"] : "#e5e7eb",
                          backgroundColor: selectedThemeId === t.id ? t.cssVariables["--bg-secondary"] || "#f9fafb" : "#fff",
                          color: selectedThemeId === t.id ? t.cssVariables["--primary"] : "#6b7280",
                        }}
                      >
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.cssVariables["--primary"] }} />
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-4 pt-3 flex gap-2">
                <button
                  onClick={() => setEditMode("json")}
                  className={`px-3 py-1 text-xs rounded border transition ${
                    editMode === "json" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  JSON 编辑
                </button>
                <button
                  onClick={() => setEditMode("markdown")}
                  className={`px-3 py-1 text-xs rounded border transition ${
                    editMode === "markdown" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  Markdown 输入
                </button>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col">
                {editMode === "json" ? (
                  <textarea
                    value={jsonInput}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    className="flex-1 p-4 text-xs font-mono bg-gray-50 text-gray-800 resize-none outline-none border-0"
                    spellCheck={false}
                    placeholder="粘贴 JSON 格式的简历数据..."
                  />
                ) : (
                  <div className="flex-1 flex flex-col">
                    <textarea
                      value={markdownInput}
                      onChange={(e) => setMarkdownInput(e.target.value)}
                      className="flex-1 p-4 text-xs font-mono bg-gray-50 text-gray-800 resize-none outline-none border-0"
                      spellCheck={false}
                      placeholder="粘贴 Markdown 格式的简历..."
                    />
                    <button
                      onClick={handleMarkdownParse}
                      disabled={!markdownInput.trim()}
                      className="m-3 px-4 py-2 bg-teal-600 text-white text-xs rounded hover:bg-teal-700 disabled:opacity-40 transition"
                    >
                      解析 Markdown → JSON
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </aside>

        {/* 右侧预览 */}
        <main className="flex-1 overflow-auto bg-gray-100 p-4 md:p-8 flex justify-center">
          <div className="a4-preview" style={{ ...cssVars, fontFamily: cssVars["--font-body"] }}>
            {resumeData && TemplateComponent ? (
              <div ref={previewRef}>
                <TemplateComponent data={resumeData} cssVariables={cssVars} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                请上传简历或输入数据
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 全局错误提示 */}
      {error && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg shadow-lg max-w-md">
          <p className="text-xs text-red-600">{error}</p>
          <button onClick={() => setError(null)} className="absolute top-1 right-2 text-red-400 hover:text-red-600 text-xs">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
