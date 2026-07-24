/**
 * AI 路由 — JD 分析 / 简历重写 / 匹配度评分
 */

import { NextRequest, NextResponse } from "next/server";
import { loadPromptConfigs, callLLM } from "@/lib/llm-service";

export const maxDuration = 120;

function extractJSON(raw: string): string {
  const codeBlockMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  return raw.trim();
}

function validateStringArray(arr: unknown, fieldName: string): string[] {
  if (!Array.isArray(arr)) {
    throw new Error(`${fieldName} 必须是字符串数组`);
  }
  return arr.map((item) => String(item));
}

async function handleAnalyzeJD(jd: string) {
  if (!jd || typeof jd !== "string") {
    return NextResponse.json({ success: false, error: "JD 内容不能为空" }, { status: 400 });
  }
  if (jd.length > 10000) {
    return NextResponse.json({ success: false, error: "JD 内容超过 10000 字符限制" }, { status: 400 });
  }

  const configs = loadPromptConfigs();
  const result = await callLLM(configs.jdAnalysis, jd);
  const jsonStr = extractJSON(result);

  try {
    const data = JSON.parse(jsonStr);
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "AI 返回格式异常，无法解析" }, { status: 502 });
  }
}

async function handleRewrite(body: Record<string, unknown>) {
  const { highlights, keywords } = body;

  try {
    const highlightsArr = validateStringArray(highlights, "highlights");
    const keywordsArr = validateStringArray(keywords, "keywords");

    if (highlightsArr.length === 0) {
      return NextResponse.json({ success: false, error: "highlights 不能为空" }, { status: 400 });
    }

    const configs = loadPromptConfigs();
    const input = JSON.stringify({ highlights: highlightsArr, keywords: keywordsArr });
    const result = await callLLM(configs.resumeRewrite, input);
    const jsonStr = extractJSON(result);

    const data = JSON.parse(jsonStr);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "重写失败";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

async function handleScore(body: Record<string, unknown>) {
  const { resume, jd } = body;

  if (!jd || typeof jd !== "string" || jd.length > 10000) {
    return NextResponse.json({ success: false, error: "JD 参数无效或过长" }, { status: 400 });
  }

  const resumeStr = JSON.stringify(resume);
  if (resumeStr.length > 30000) {
    return NextResponse.json({ success: false, error: "简历数据过大，请精简后重试" }, { status: 400 });
  }

  const configs = loadPromptConfigs();
  const input = JSON.stringify({ resume, jd });
  const result = await callLLM(configs.matchScoring, input);
  const jsonStr = extractJSON(result);

  try {
    const data = JSON.parse(jsonStr);
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "AI 返回格式异常，无法解析" }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const body = await request.json();

    switch (action) {
      case "analyze":
        return handleAnalyzeJD(body.jd);
      case "rewrite":
        return handleRewrite(body);
      case "score":
        return handleScore(body);
      default:
        return NextResponse.json({ success: false, error: "未知 action" }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 处理失败";
    console.error("[ai]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
