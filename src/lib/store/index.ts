/**
 * 全局状态管理 — Zustand Store
 */

import { create } from "zustand";
import type { Resume } from "@/lib/schemas/resume";
export type { Resume };

export interface TemplateInfo {
  id: string;
  name: string;
  component: string;
  atsScore: number;
}

export interface ThemeInfo {
  id: string;
  name: string;
  cssVariables: Record<string, string>;
}

export interface JDAnalysis {
  job_title: string;
  company: string;
  hard_skills: string[];
  soft_skills: string[];
  industry_terms: string[];
  requirements: {
    education: string;
    experience_years: string;
    certificates: string[];
  };
  summary: string;
}

export interface MatchScore {
  overall_score: number;
  dimensions: Record<string, { score: number; comment: string }>;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export type AiActionType = "idle" | "analyzing" | "scoring" | "rewriting";

export interface AppState {
  resumeData: Resume | null;
  originalResumeData: Resume | null;
  setResumeData: (data: Resume | null) => void;
  backupOriginal: () => void;
  restoreOriginal: () => void;

  selectedTemplateId: string;
  setSelectedTemplateId: (id: string) => void;

  selectedThemeId: string;
  setSelectedThemeId: (id: string) => void;

  templates: TemplateInfo[];
  setTemplates: (templates: TemplateInfo[]) => void;

  themes: ThemeInfo[];
  setThemes: (themes: ThemeInfo[]) => void;

  isExporting: boolean;
  setIsExporting: (v: boolean) => void;

  error: string | null;
  setError: (error: string | null) => void;

  editMode: "json" | "markdown";
  setEditMode: (mode: "json" | "markdown") => void;

  markdownInput: string;
  setMarkdownInput: (v: string) => void;

  jdAnalysis: JDAnalysis | null;
  setJdAnalysis: (data: JDAnalysis | null) => void;

  matchScore: MatchScore | null;
  setMatchScore: (data: MatchScore | null) => void;

  aiAction: AiActionType;
  setAiAction: (action: AiActionType) => void;

  jsonInput: string;
  setJsonInput: (v: string) => void;

  leftTab: "template" | "ai";
  setLeftTab: (tab: "template" | "ai") => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  resumeData: null,
  originalResumeData: null,
  setResumeData: (data) => set({ resumeData: data }),
  backupOriginal: () => {
    const current = get().resumeData;
    if (current) set({ originalResumeData: current });
  },
  restoreOriginal: () => {
    const original = get().originalResumeData;
    if (original) set({ resumeData: original });
  },

  selectedTemplateId: "classic-single-col",
  setSelectedTemplateId: (id) => set({ selectedTemplateId: id }),

  selectedThemeId: "monochrome",
  setSelectedThemeId: (id) => set({ selectedThemeId: id }),

  templates: [],
  setTemplates: (templates) => set({ templates }),

  themes: [],
  setThemes: (themes) => set({ themes }),

  isExporting: false,
  setIsExporting: (v) => set({ isExporting: v }),

  error: null,
  setError: (error) => set({ error }),

  editMode: "json",
  setEditMode: (mode) => set({ editMode: mode }),

  markdownInput: "",
  setMarkdownInput: (v) => set({ markdownInput: v }),

  jdAnalysis: null,
  setJdAnalysis: (data) => set({ jdAnalysis: data }),

  matchScore: null,
  setMatchScore: (data) => set({ matchScore: data }),

  aiAction: "idle",
  setAiAction: (action) => set({ aiAction: action }),

  jsonInput: "",
  setJsonInput: (v) => set({ jsonInput: v }),

  leftTab: "template",
  setLeftTab: (tab) => set({ leftTab: tab }),
}));
