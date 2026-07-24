/**
 * 简历上传解析路由 — PDF + OCR + LLM 结构化
 */

import { NextRequest, NextResponse } from "next/server";
import { loadPromptConfigs, callLLM } from "@/lib/llm-service";
import { validateResume } from "@/lib/schemas/resume";

export const maxDuration = 120;
export const runtime = "nodejs";

const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ─── Tesseract Worker 单例 ───────────────────────────────────────────────
import type { Worker as TesseractWorker } from "tesseract.js";

let workerInstance: TesseractWorker | null = null;
let workerInitPromise: Promise<TesseractWorker | null> | null = null;

/**
 * 初始化 Tesseract worker 单例（带加锁 + 超时）。
 * 并发调用只会有一次实际的初始化过程，其余调用共享同一个 Promise。
 */
function initializeWorker(): Promise<TesseractWorker | null> {
  // 如果已经初始化完成，直接返回
  if (workerInstance) {
    return Promise.resolve(workerInstance);
  }
  // 如果正在初始化中，返回同一个 Promise（加锁）
  if (workerInitPromise) {
    return workerInitPromise;
  }

  workerInitPromise = (async () => {
    try {
      const { createWorker } = await import("tesseract.js");
      // 30 秒超时保护
      const worker = await Promise.race([
        createWorker("chi_sim+eng"),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Tesseract worker 初始化超时（30s）")), 30_000)
        ),
      ]);
      workerInstance = worker;
      console.log("[parse-resume] Tesseract worker 初始化完成");
      return worker;
    } catch (error) {
      console.error("[parse-resume] Tesseract worker 初始化失败:", error);
      workerInitPromise = null; // 允许后续重试
      return null;
    }
  })();

  return workerInitPromise;
}

/**
 * 获取可用的 worker 单例，如果 worker 断开则自动重新初始化。
 */
async function getWorker(): Promise<TesseractWorker | null> {
  // 检查已有 worker 是否仍然有效
  if (workerInstance) {
    try {
      // 如果 worker 已经 terminate 或断开，recognize 会抛错
      // 提前重置以便重新初始化
      return workerInstance;
    } catch {
      // 预留防护，实际断开检测在 recognize 时处理
    }
  }
  return initializeWorker();
}

// ─── OCR 文本提取 ──────────────────────────────────────────────────────────

async function extractTextFromPDF(buffer: Buffer): Promise<string | null> {
  const pdf = await import("pdf-parse");
  const data = await (pdf as unknown as { default: (b: Buffer) => Promise<{ text: string }> }).default(buffer);
  const text = (data.text || "").trim();
  if (text.length <= 50) {
    return null;
  }
  return text;
}

async function extractTextFromImage(buffer: Buffer): Promise<string> {
  const sharp = (await import("sharp")).default;
  const processed = await sharp(buffer).greyscale().normalize().toBuffer();

  const worker = await getWorker();
  if (!worker) {
    console.error("[parse-resume] Tesseract worker 不可用，跳过 OCR");
    return "";
  }

  try {
    const {
      data: { text },
    } = await worker.recognize(processed);
    return text || "";
  } catch (error) {
    // worker 可能已断开连接，重置单例以便下次重新初始化
    console.error("[parse-resume] Tesseract recognize 失败，可能 worker 已断开，将重置单例:", error);
    workerInstance = null;
    workerInitPromise = null;
    return "";
  }
}

function extractJSON(raw: string): string {
  const codeBlockMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  return raw.trim();
}

function checkFileExtension(filename: string, mimeType: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string[]> = {
    "application/pdf": ["pdf"],
    "image/png": ["png"],
    "image/jpeg": ["jpg", "jpeg"],
    "image/webp": ["webp"],
  };
  const expected = map[mimeType];
  return expected ? expected.includes(ext) : false;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: "请上传文件，字段名为 file" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: "文件大小超过 10MB 限制" }, { status: 400 });
    }

    const mimeType = file.type;
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { success: false, error: `不支持的文件类型: ${mimeType}，请上传 PDF 或图片（PNG/JPEG/WebP）` },
        { status: 400 }
      );
    }

    if (!checkFileExtension(file.name, mimeType)) {
      return NextResponse.json({ success: false, error: "文件扩展名与 MIME 类型不匹配" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text: string;

    if (mimeType === "application/pdf") {
      const pdfText = await extractTextFromPDF(buffer);
      if (pdfText) {
        text = pdfText;
      } else {
        // 扫描型 PDF：尝试用 sharp + OCR 降级处理（需要系统安装 libvips-poppler）
        try {
          const sharp = (await import("sharp")).default;
          // sharp 仅在编译时启用了 poppler 支持时才能读取 PDF
          const pdfBuffer = await sharp(buffer, { pages: 1, density: 150 }).png().toBuffer();
          text = await extractTextFromImage(pdfBuffer);
        } catch {
          return NextResponse.json(
            {
              success: false,
              error: "该 PDF 为扫描型（无文字层），服务器缺少 PDF 转图片依赖（libvips-poppler / poppler-utils）。请尝试上传图片格式，或使用文本版 PDF。",
            },
            { status: 422 }
          );
        }
      }
    } else {
      // 图片类型（PNG/JPEG/WebP）
      text = await extractTextFromImage(buffer);
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ success: false, error: "无法从文件中提取到文本内容" }, { status: 422 });
    }

    const configs = loadPromptConfigs();
    const llmResponse = await callLLM(configs.resumeParse, text);

    const jsonStr = extractJSON(llmResponse);
    let resumeData: unknown;

    try {
      resumeData = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({ success: false, error: "LLM 返回的数据格式异常，无法解析为 JSON" }, { status: 502 });
    }

    const result = validateResume(resumeData);

    if (!result.success) {
      const errorMessages = result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
      return NextResponse.json(
        { success: false, error: `简历数据验证失败: ${errorMessages}` },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "简历解析过程中发生未知错误";
    console.error("[parse-resume]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
