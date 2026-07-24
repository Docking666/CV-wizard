/**
 * LLM 服务 — 统一的 LLM 调用接口
 */

export type PromptType = "jdAnalysis" | "resumeRewrite" | "matchScoring" | "resumeParse";

export interface PromptConfig {
  type: PromptType;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  outputFormat?: string;
}

export interface PromptConfigs {
  jdAnalysis: PromptConfig;
  resumeRewrite: PromptConfig;
  matchScoring: PromptConfig;
  resumeParse: PromptConfig;
}

function getModel(): string {
  return process.env.LLM_MODEL || "gpt-4o";
}

export function loadPromptConfigs(): PromptConfigs {
  const model = getModel();

  return {
    jdAnalysis: {
      type: "jdAnalysis",
      model,
      temperature: 0.2,
      maxTokens: 2000,
      systemPrompt: `你是一位专业的简历优化专家。请仔细分析以下岗位JD，提取以下信息，以JSON格式返回：

{
  "job_title": "岗位名称",
  "company": "公司名称（如能识别）",
  "hard_skills": ["硬技能1", "硬技能2"],
  "soft_skills": ["软技能1", "软技能2"],
  "industry_terms": ["行业术语1", "行业术语2"],
  "requirements": {
    "education": "学历要求",
    "experience_years": "经验年限",
    "certificates": ["证书要求"]
  },
  "summary": "一句话概括岗位核心要求"
}

注意：硬技能包括技术栈/工具/语言；软技能包括管理/沟通/领导力；如果某字段无法提取，使用空数组或空字符串；只返回JSON。`,
    },

    resumeRewrite: {
      type: "resumeRewrite",
      model,
      temperature: 0.4,
      maxTokens: 4000,
      systemPrompt: `你是一位资深的简历优化专家。请根据目标岗位的关键词要求，重写简历中的工作经历。

规则：
1. 使用 STAR+R 前置法则：量化结果放在最前面
2. 每条经历不超过 2 行，必须包含量化数据
3. 自然嵌入岗位关键词，避免堆砌，关键词密度控制在 65%–75%
4. 保持事实真实性，不要编造经历
5. 用行业术语替换大白话描述

输出JSON格式：
{
  "rewritten_highlights": ["重写后经历1", "重写后经历2"],
  "matched_keywords": ["已匹配关键词"],
  "missing_keywords": ["缺失关键词"],
  "suggestions": ["改进建议"]
}`,
    },

    matchScoring: {
      type: "matchScoring",
      model,
      temperature: 0.1,
      maxTokens: 1500,
      outputFormat: "json",
      systemPrompt: `你是一位严格的HR，评估简历与目标岗位的匹配程度。

评估维度：技能匹配(35%)、经验相关度(25%)、成果量化(20%)、关键词密度(10%)、格式规范(10%)

输出JSON格式：
{
  "overall_score": 0-100,
  "dimensions": {
    "skill_match": { "score": 0-100, "comment": "评语" },
    "experience_relevance": { "score": 0-100, "comment": "评语" },
    "achievement_quantification": { "score": 0-100, "comment": "评语" },
    "keyword_density": { "score": 0-100, "comment": "评语" },
    "format_quality": { "score": 0-100, "comment": "评语" }
  },
  "strengths": ["优势1", "优势2"],
  "weaknesses": ["待改进1", "待改进2"],
  "suggestions": ["具体建议1", "具体建议2"]
}
`,
    },

    resumeParse: {
      type: "resumeParse",
      model,
      temperature: 0.1,
      maxTokens: 4000,
      outputFormat: "json",
      systemPrompt: `你是一位专业的简历解析专家。请从以下简历纯文本中提取结构化信息，严格按照 JSON Resume Schema 格式输出。

输出JSON格式：
{
  "basics": {
    "name": "姓名",
    "label": "职位标签",
    "title": "目标岗位",
    "email": "邮箱",
    "phone": "电话",
    "website": "个人网站",
    "summary": "个人总结",
    "location": { "city": "城市", "region": "省份/地区" },
    "profiles": [{ "network": "平台", "username": "用户名", "url": "链接" }]
  },
  "work": [
    {
      "name": "公司名称",
      "position": "职位",
      "url": "公司网址",
      "startDate": "YYYY-MM 或 YYYY",
      "endDate": "YYYY-MM 或 YYYY（在职则为 null）",
      "isCurrent": true/false,
      "summary": "工作概述",
      "highlights": ["工作亮点1", "工作亮点2"]
    }
  ],
  "education": [
    {
      "institution": "学校名称",
      "area": "专业",
      "studyType": "学历（本科/硕士/博士等）",
      "startDate": "YYYY-MM 或 YYYY",
      "endDate": "YYYY-MM 或 YYYY",
      "courses": ["课程1", "课程2"]
    }
  ],
  "skills": [
    { "name": "技能分类", "level": "Beginner/Intermediate/Advanced/Expert", "keywords": ["具体技能1", "具体技能2"] }
  ],
  "projects": [
    {
      "name": "项目名称",
      "description": "项目描述",
      "url": "项目链接",
      "highlights": ["项目亮点1"],
      "startDate": "YYYY-MM 或 YYYY",
      "endDate": "YYYY-MM 或 YYYY"
    }
  ],
  "awards": [
    { "title": "奖项名称", "date": "YYYY", "awarder": "颁发机构", "summary": "描述" }
  ],
  "certificates": [
    { "name": "证书名称", "date": "YYYY", "issuer": "颁发机构" }
  ],
  "languages": [
    { "language": "语言", "fluency": "熟练程度" }
  ]
}

规则：
1. 只返回纯 JSON，不要包含任何 markdown 标记或注释
2. 如果某个字段在简历中找不到对应信息，设为 null 或空数组 []
3. 保持简历的原始语言（中文简历输出中文，英文简历输出英文）
4. 日期格式统一为 YYYY-MM 或 YYYY
5. 尽可能完整地提取所有信息，包括项目描述和工作亮点
6. skills 中的 level 必须是以下之一：Beginner, Intermediate, Advanced, Expert`,
    },
  };
}

export async function callLLM(
  promptConfig: PromptConfig,
  userMessage: string
): Promise<string> {
  const apiUrl = process.env.LLM_API_URL;
  const apiKey = process.env.LLM_API_KEY;

  if (!apiUrl || !apiKey) {
    return generateMockResponse(promptConfig);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: promptConfig.model,
          temperature: promptConfig.temperature,
          max_tokens: promptConfig.maxTokens,
          messages: [
            { role: "system", content: promptConfig.systemPrompt },
            { role: "user", content: userMessage },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 429 && attempt === 0) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        throw new Error(`LLM API 调用失败: ${response.status}`);
      }

      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
      if (data.output?.text) {
        return data.output.text;
      }
      if (data.content) {
        return data.content;
      }
      if (typeof data === "string") {
        return data;
      }

      throw new Error("无法解析 LLM 响应");
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  clearTimeout(timeoutId);
  throw lastError || new Error("LLM API 调用失败");
}

function generateMockResponse(promptConfig: PromptConfig): string {
  switch (promptConfig.type) {
    case "resumeParse":
      return JSON.stringify({
        basics: {
          name: "张三",
          label: "高级前端工程师",
          title: "前端开发工程师",
          email: "zhangsan@example.com",
          phone: "138-0000-0000",
          website: "https://zhangsan.dev",
          summary: "5年前端开发经验",
          location: { city: "北京", region: "北京市" },
          profiles: [{ network: "GitHub", username: "zhangsan", url: "https://github.com/zhangsan" }],
        },
        work: [
          {
            name: "示例公司",
            position: "高级工程师",
            startDate: "2021-03",
            endDate: null,
            isCurrent: true,
            highlights: ["主导项目开发", "性能优化提升50%"],
          },
        ],
        education: [
          {
            institution: "示例大学",
            area: "计算机科学",
            studyType: "本科",
            startDate: "2014-09",
            endDate: "2018-06",
          },
        ],
        skills: [{ name: "前端开发", level: "Expert", keywords: ["React", "TypeScript"] }],
        projects: [],
        awards: [],
        certificates: [],
        languages: [{ language: "中文", fluency: "母语" }],
      });

    case "matchScoring":
      return JSON.stringify({
        overall_score: 72,
        dimensions: {
          skill_match: { score: 78, comment: "技能覆盖面较广，缺少部分岗位特定技术栈" },
          experience_relevance: { score: 82, comment: "工作经历与目标岗位高度相关" },
          achievement_quantification: { score: 75, comment: "大部分经历有量化数据，建议补充业务影响指标" },
          keyword_density: { score: 68, comment: "关键词密度在合理范围内，部分高频词可增加" },
          format_quality: { score: 85, comment: "简历结构清晰，排版规范" },
        },
        strengths: ["有大厂背景和团队管理经验", "项目成果有量化数据支撑", "技术栈覆盖面广"],
        weaknesses: ["缺少目标岗位要求的特定工具经验", "部分经历描述偏技术细节，缺少业务价值"],
        suggestions: ["在个人总结中嵌入 2-3 个核心岗位关键词", "将「负责 XX」改为「主导 XX，实现 YY% 的增长」", "补充与目标岗位直接相关的项目经验描述"],
      });

    case "jdAnalysis":
      return JSON.stringify({
        job_title: "高级前端工程师",
        company: "示例科技",
        hard_skills: ["React", "TypeScript", "Next.js", "Webpack"],
        soft_skills: ["团队协作", "项目管理"],
        industry_terms: ["微前端", "SSR", "性能优化"],
        requirements: { education: "本科及以上", experience_years: "3年以上", certificates: [] },
        summary: "寻找有丰富React生态经验的高级前端工程师",
      });

    case "resumeRewrite":
      return JSON.stringify({
        rewritten_highlights: ["主导前端架构升级，首屏加载时间降低65%", "搭建企业级组件库，代码复用率提升30%"],
        matched_keywords: ["React", "TypeScript", "性能优化"],
        missing_keywords: ["微前端", "SSR"],
        suggestions: ["增加微前端项目经验描述", "补充SSR相关技术实践"],
      });

    default:
      return "{}";
  }
}
