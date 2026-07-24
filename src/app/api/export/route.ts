/**
 * 导出路由 — Playwright PDF/PNG
 */

import { NextRequest, NextResponse } from "next/server";
import { createContext } from "@/lib/browser";
import { loadExportConfig } from "@/lib/config-loader";
import { getThemeCssVariables } from "@/lib/config-loader";

export const maxDuration = 60;

/** 简单的 HTML 消毒：移除 script、iframe、object 等危险标签 */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^>]*>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
}

function buildFullHtml(html: string, themeId: string): string {
  const themeVars = getThemeCssVariables(themeId);
  const cssVars = themeVars
    ? Object.entries(themeVars)
        .map(([k, v]) => `${k}: ${v};`)
        .join("\n")
    : "";

  const fontFamily = themeVars?.["--font-body"] || "'Noto Sans SC', 'PingFang SC', sans-serif";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<script src="https://cdn.tailwindcss.com"></script>
<style>
  :root {
    ${cssVars}
  }
  body {
    font-family: ${fontFamily};
    margin: 0;
    padding: 0;
    background: white;
  }
  * { box-sizing: border-box; }
</style>
</head>
<body>
${html}
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { html, format, themeId } = body;

    if (!html || typeof html !== "string") {
      return NextResponse.json({ success: false, error: "缺少 html 参数" }, { status: 400 });
    }

    if (html.length > 2 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "HTML 内容超过 2MB 限制" }, { status: 400 });
    }

    format = format === "png" ? "png" : "pdf";
    themeId = themeId || "monochrome";

    const safeHtml = sanitizeHtml(html);
    const fullHtml = buildFullHtml(safeHtml, themeId);

    const exportConfig = loadExportConfig();
    const context = await createContext();
    const page = await context.newPage();

    try {
      await page.setContent(fullHtml, { waitUntil: "networkidle" });

      // 可靠地等待字体加载完成
      await page.waitForFunction(() => (document as any).fonts?.ready || true, { timeout: 5000 }).catch(() => {});

      let buffer: Buffer;

      if (format === "pdf") {
        buffer = await page.pdf({
          format: exportConfig.pdf.format as "A4",
          margin: exportConfig.pdf.margin,
          displayHeaderFooter: exportConfig.pdf.displayHeaderFooter,
          headerTemplate: exportConfig.pdf.headerTemplate,
          footerTemplate: exportConfig.pdf.footerTemplate,
          printBackground: exportConfig.pdf.printBackground,
        });
      } else {
        const pngConfig = exportConfig.png;
        // 检测内容高度，动态决定是否全页截图
        const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
        const useFullPage = bodyHeight > (pngConfig.clip?.height || 1123);
        buffer = await page.screenshot({
          type: "png",
          fullPage: useFullPage ? true : false,
          omitBackground: pngConfig.omitBackground,
          clip: useFullPage ? undefined : pngConfig.clip,
        });
      }

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": format === "pdf" ? "application/pdf" : "image/png",
          "Content-Disposition": `attachment; filename="resume.${format}"`,
        },
      });
    } finally {
      await page.close();
      await context.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "导出失败";
    console.error("[export]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
