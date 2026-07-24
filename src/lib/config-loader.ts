/**
 * 配置文件加载器
 */

import registryJson from "@/config/registry.json";
import themesJson from "@/config/themes.json";
import exportJson from "@/config/export.json";

export interface TemplateRegistry {
  templates: Array<{
    id: string;
    name: string;
    component: string;
    atsScore: number;
  }>;
}

export interface ThemeConfig {
  themes: Array<{
    id: string;
    name: string;
    cssVariables: Record<string, string>;
  }>;
}

export interface ExportConfig {
  pdf: {
    format: string;
    margin: { top: string; right: string; bottom: string; left: string };
    displayHeaderFooter: boolean;
    headerTemplate: string;
    footerTemplate: string;
    printBackground: boolean;
  };
  png: {
    fullPage: boolean;
    omitBackground: boolean;
    clip: { x: number; y: number; width: number; height: number };
    deviceScaleFactor: number;
  };
}

function validateRegistry(data: unknown): TemplateRegistry {
  if (!data || typeof data !== "object") throw new Error("registry.json 格式错误");
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.templates)) throw new Error("registry.json 缺少 templates 数组");
  const ids = new Set<string>();
  for (const t of d.templates) {
    if (!t.id || typeof t.id !== "string") throw new Error("模板缺少 id");
    if (!t.name || typeof t.name !== "string") throw new Error("模板缺少 name");
    if (ids.has(t.id)) throw new Error(`模板 id 重复: ${t.id}`);
    ids.add(t.id);
  }
  return d as unknown as TemplateRegistry;
}

function validateThemes(data: unknown): ThemeConfig {
  if (!data || typeof data !== "object") throw new Error("themes.json 格式错误");
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.themes)) throw new Error("themes.json 缺少 themes 数组");
  const ids = new Set<string>();
  for (const t of d.themes) {
    if (!t.id || typeof t.id !== "string") throw new Error("主题缺少 id");
    if (ids.has(t.id)) throw new Error(`主题 id 重复: ${t.id}`);
    ids.add(t.id);
  }
  return d as unknown as ThemeConfig;
}

function validateExport(data: unknown): ExportConfig {
  if (!data || typeof data !== "object") throw new Error("export.json 格式错误");
  const d = data as Record<string, unknown>;
  if (!d.pdf || !d.png) throw new Error("export.json 缺少 pdf 或 png 配置");
  return d as unknown as ExportConfig;
}

export function loadTemplates() {
  const registry = validateRegistry(registryJson);
  return registry.templates.map((t) => ({
    id: t.id,
    name: t.name,
    component: t.component,
    atsScore: t.atsScore,
  }));
}

export function loadThemes() {
  const config = validateThemes(themesJson);
  return config.themes.map((t) => ({
    id: t.id,
    name: t.name,
    cssVariables: t.cssVariables,
  }));
}

export function loadExportConfig(): ExportConfig {
  return validateExport(exportJson);
}

export function getTemplateById(id: string) {
  return loadTemplates().find((t) => t.id === id);
}

export function getThemeCssVariables(id: string): Record<string, string> | null {
  const theme = loadThemes().find((t) => t.id === id);
  return theme?.cssVariables || null;
}
