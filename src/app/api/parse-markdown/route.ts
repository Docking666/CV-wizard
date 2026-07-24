/**
 * Markdown 解析路由
 */

import { NextRequest, NextResponse } from "next/server";
import { parseMarkdownToResume } from "@/lib/markdown-parser";
import { validateResume } from "@/lib/schemas/resume";

export async function POST(request: NextRequest) {
  try {
    const { markdown } = await request.json();

    if (!markdown || typeof markdown !== "string") {
      return NextResponse.json({ success: false, error: "缺少 markdown 参数" }, { status: 400 });
    }

    const parsed = parseMarkdownToResume(markdown);
    const result = validateResume(parsed);

    if (!result.success) {
      const warnings = result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`);
      return NextResponse.json(
        {
          success: false,
          error: "Markdown 解析后的数据格式不符合要求",
          warnings,
          data: parsed,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "解析失败";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
