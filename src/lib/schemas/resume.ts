import { z } from "zod";

/** 宽松日期校验：支持 YYYY-MM、YYYY、YYYY/MM、YYYY.MM、YYYY年MM月等 */
const looseDateRegex = /^(\d{4})(?:[-/.年](\d{1,2})?)?(?:月)?$/;

const ProfileSchema = z.object({
  network: z.string().optional(),
  username: z.string().optional(),
  url: z.string().optional(),
});

const LocationSchema = z.object({
  city: z.string().optional(),
  region: z.string().optional(),
});

const BasicsSchema = z.object({
  name: z.string().min(1),
  label: z.string().optional(),
  title: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  summary: z.string().optional(),
  location: LocationSchema.optional(),
  profiles: z.array(ProfileSchema).optional(),
});

const WorkSchema = z.object({
  name: z.string().min(1),
  position: z.string().optional(),
  url: z.string().url().optional().or(z.literal("")),
  startDate: z.string().regex(looseDateRegex, "日期格式应为 YYYY-MM 或 YYYY").optional(),
  endDate: z.string().regex(looseDateRegex, "日期格式应为 YYYY-MM 或 YYYY").optional().or(z.null()),
  isCurrent: z.boolean().optional(),
  summary: z.string().optional(),
  highlights: z.array(z.string()).optional(),
});

const EducationSchema = z.object({
  institution: z.string().min(1),
  area: z.string().optional(),
  studyType: z.string().optional(),
  startDate: z.string().regex(looseDateRegex, "日期格式应为 YYYY-MM 或 YYYY").optional(),
  endDate: z.string().regex(looseDateRegex, "日期格式应为 YYYY-MM 或 YYYY").optional(),
  url: z.string().url().optional().or(z.literal("")),
  courses: z.array(z.string()).optional(),
});

const SkillSchema = z.object({
  name: z.string().min(1),
  level: z.enum(["Beginner", "Intermediate", "Advanced", "Expert"]).optional(),
  keywords: z.array(z.string()).optional(),
});

const ProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  url: z.string().url().optional().or(z.literal("")),
  highlights: z.array(z.string()).optional(),
  startDate: z.string().regex(looseDateRegex, "日期格式应为 YYYY-MM 或 YYYY").optional(),
  endDate: z.string().regex(looseDateRegex, "日期格式应为 YYYY-MM 或 YYYY").optional().or(z.null()),
});

const AwardSchema = z.object({
  title: z.string(),
  date: z.string().optional(),
  awarder: z.string().optional(),
  summary: z.string().optional(),
});

const CertificateSchema = z.object({
  name: z.string(),
  date: z.string().optional(),
  issuer: z.string().optional(),
});

const LanguageSchema = z.object({
  language: z.string(),
  fluency: z.string().optional(),
});

export const ResumeSchema = z.object({
  basics: BasicsSchema,
  work: z.array(WorkSchema).optional(),
  education: z.array(EducationSchema).optional(),
  skills: z.array(SkillSchema).optional(),
  projects: z.array(ProjectSchema).optional(),
  awards: z.array(AwardSchema).optional(),
  certificates: z.array(CertificateSchema).optional(),
  languages: z.array(LanguageSchema).optional(),
  publications: z.array(z.object({
    name: z.string(),
    publisher: z.string().optional(),
    releaseDate: z.string().optional(),
    url: z.string().url().optional().or(z.literal("")),
    summary: z.string().optional(),
  })).optional(),
});

export type Resume = z.infer<typeof ResumeSchema>;

export function validateResume(data: unknown) {
  return ResumeSchema.safeParse(data);
}
