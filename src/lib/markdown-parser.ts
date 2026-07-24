/**
 * Markdown → JSON Resume 解析器
 */

import MarkdownIt from "markdown-it";
import type { Resume } from "@/lib/schemas/resume";

const md = new MarkdownIt();

const SECTION_MARKERS: Record<string, string[]> = {
  basics: ["基本信息", "basic", "about", "个人简介"],
  work: ["工作经历", "work", "experience", "工作经验"],
  education: ["教育背景", "education", "学历", "学习经历"],
  skills: ["技能", "skills", "技术栈"],
  projects: ["项目经历", "projects", "项目经验"],
  awards: ["获奖", "awards", "荣誉"],
  certificates: ["证书", "certificates", "资格认证"],
  languages: ["语言", "languages", "语言能力"],
};

function buildSectionRegex(titles: string[]): RegExp {
  const escaped = titles.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`^(?:##\\s*(?:${escaped.join("|")}))\\s*$`, "i");
}

type WorkEntry = NonNullable<Resume["work"]>[number];
type EducationEntry = NonNullable<Resume["education"]>[number];
type ProjectEntry = NonNullable<Resume["projects"]>[number];

export function parseMarkdownToResume(markdown: string): Resume {
  const lines = markdown.split("\n");
  const resume: Partial<Resume> = { basics: { name: "" } };
  let currentSection = "";
  let currentItem: Record<string, unknown> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // 检测 section 标题
    let matchedSection = "";
    for (const [section, titles] of Object.entries(SECTION_MARKERS)) {
      if (buildSectionRegex(titles).test(line)) {
        matchedSection = section;
        break;
      }
    }

    if (matchedSection) {
      // 保存上一个 item 的 highlights
      if (currentItem && currentSection === "work") {
        if (!resume.work) resume.work = [];
        resume.work.push(currentItem as WorkEntry);
      }
      if (currentItem && currentSection === "education") {
        if (!resume.education) resume.education = [];
        resume.education.push(currentItem as EducationEntry);
      }
      if (currentItem && currentSection === "projects") {
        if (!resume.projects) resume.projects = [];
        resume.projects.push(currentItem as ProjectEntry);
      }
      currentSection = matchedSection;
      currentItem = null;
      continue;
    }

    if (currentSection === "basics") {
      parseBasicsLine(line, resume);
    } else if (currentSection === "work") {
      currentItem = parseWorkLine(line, currentItem);
    } else if (currentSection === "education") {
      currentItem = parseEducationLine(line, currentItem);
    } else if (currentSection === "skills") {
      parseSkillLine(line, resume);
    } else if (currentSection === "projects") {
      currentItem = parseProjectLine(line, currentItem);
    } else if (currentSection === "languages") {
      parseLanguageLine(line, resume);
    }
  }

  // 保存最后一个 item
  if (currentItem && currentSection === "work") {
    if (!resume.work) resume.work = [];
    resume.work.push(currentItem as WorkEntry);
  }
  if (currentItem && currentSection === "education") {
    if (!resume.education) resume.education = [];
    resume.education.push(currentItem as EducationEntry);
  }
  if (currentItem && currentSection === "projects") {
    if (!resume.projects) resume.projects = [];
    resume.projects.push(currentItem as ProjectEntry);
  }

  return resume as Resume;
}

function parseBasicsLine(line: string, resume: Partial<Resume>) {
  if (!resume.basics) resume.basics = { name: "" };
  const basics = resume.basics;

  if (line.startsWith("### ")) {
    basics.name = line.replace("### ", "").trim();
  } else if (line.startsWith("- ")) {
    const content = line.replace("- ", "").trim();
    if (content.includes("邮箱") || content.includes("email")) {
      basics.email = content.split(/[:：]/).pop()?.trim() || "";
    } else if (content.includes("电话") || content.includes("phone")) {
      basics.phone = content.split(/[:：]/).pop()?.trim() || "";
    } else if (content.includes("目标") || content.includes("岗位")) {
      basics.title = content.split(/[:：]/).pop()?.trim() || "";
    } else if (content.includes("城市") || content.includes("地区")) {
      const loc = content.split(/[:：]/).pop()?.trim() || "";
      basics.location = { city: loc, region: loc };
    }
  }
}

function parseWorkLine(line: string, current: Record<string, unknown> | null): Record<string, unknown> | null {
  if (line.startsWith("### ") || line.match(/^[^-].*\|/)) {
    // 新的工作经历
    if (current) return current;
    const parts = line.replace("### ", "").split("|").map((s) => s.trim());
    return {
      name: parts[0] || "",
      position: parts[1] || "",
      startDate: parts[2]?.split("-")[0]?.trim() || "",
      endDate: parts[2]?.split("-")[1]?.trim() || null,
      highlights: [],
    };
  }
  if (line.startsWith("- ") && current) {
    const hl = current.highlights as string[] || [];
    hl.push(line.replace("- ", "").trim());
    current.highlights = hl;
  }
  return current;
}

function parseEducationLine(line: string, current: Record<string, unknown> | null): Record<string, unknown> | null {
  if (line.startsWith("### ") || line.match(/^[^-].*\|/)) {
    if (current) return current;
    const parts = line.replace("### ", "").split("|").map((s) => s.trim());
    return {
      institution: parts[0] || "",
      area: parts[1] || "",
      studyType: parts[2] || "",
      startDate: parts[3]?.split("-")[0]?.trim() || "",
      endDate: parts[3]?.split("-")[1]?.trim() || "",
    };
  }
  return current;
}

function parseSkillLine(line: string, resume: Partial<Resume>) {
  if (line.startsWith("- ")) {
    if (!resume.skills) resume.skills = [];
    const content = line.replace("- ", "").trim();
    const parts = content.split(/[:：]/);
    resume.skills.push({
      name: parts[0]?.trim() || content,
      keywords: parts[1]?.split(/[,，]/).map((s) => s.trim()).filter(Boolean) || [],
    });
  }
}

function parseProjectLine(line: string, current: Record<string, unknown> | null): Record<string, unknown> | null {
  if (line.startsWith("### ") || line.match(/^[^-].*\|/)) {
    if (current) return current;
    const parts = line.replace("### ", "").split("|").map((s) => s.trim());
    return {
      name: parts[0] || "",
      description: parts[1] || "",
      highlights: [],
    };
  }
  if (line.startsWith("- ") && current) {
    const hl = current.highlights as string[] || [];
    hl.push(line.replace("- ", "").trim());
    current.highlights = hl;
  }
  return current;
}

function parseLanguageLine(line: string, resume: Partial<Resume>) {
  if (line.startsWith("- ")) {
    if (!resume.languages) resume.languages = [];
    const content = line.replace("- ", "").trim();
    const parts = content.split(/[:：]/);
    resume.languages.push({
      language: parts[0]?.trim() || content,
      fluency: parts[1]?.trim() || "",
    });
  }
}

export function renderMarkdownToHtml(markdown: string): string {
  return md.render(markdown);
}
