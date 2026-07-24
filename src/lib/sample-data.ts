import type { Resume } from "@/lib/schemas/resume";

export const SAMPLE_RESUME: Resume = {
  basics: {
    name: "张三",
    label: "高级前端工程师",
    title: "前端开发工程师",
    email: "zhangsan@example.com",
    phone: "138-0000-0000",
    website: "https://zhangsan.dev",
    summary:
      "5年前端开发经验，专注于React生态系统和性能优化。曾主导多个大型项目的前端架构设计，擅长组件化开发和工程化建设。",
    location: { city: "北京", region: "北京市" },
    profiles: [
      { network: "GitHub", username: "zhangsan", url: "https://github.com/zhangsan" },
    ],
  },
  work: [
    {
      name: "字节跳动",
      position: "高级前端工程师",
      url: "https://bytedance.com",
      startDate: "2021-03",
      endDate: null,
      isCurrent: true,
      summary: "负责公司核心产品的前端架构与性能优化",
      highlights: [
        "主导平台前端架构升级，首屏加载时间从3.2s降至1.1s，性能提升65%",
        "搭建企业级组件库，覆盖50+业务组件，代码复用率提升30%",
        "推动前端工程化建设，构建时间从8分钟优化至2分钟",
      ],
    },
    {
      name: "阿里巴巴集团",
      position: "前端工程师",
      url: "https://alibaba.com",
      startDate: "2018-07",
      endDate: "2021-02",
      isCurrent: false,
      summary: "参与电商平台前端开发与维护",
      highlights: [
        "负责商品详情页重构，转化率提升12%",
        "开发通用图表组件库，支撑10+业务线数据可视化需求",
      ],
    },
  ],
  education: [
    {
      institution: "清华大学",
      area: "计算机科学与技术",
      studyType: "本科",
      startDate: "2014-09",
      endDate: "2018-06",
      url: "https://tsinghua.edu.cn",
      courses: ["数据结构与算法", "操作系统", "计算机网络"],
    },
  ],
  skills: [
    {
      name: "前端框架",
      level: "Expert",
      keywords: ["React", "Vue", "Next.js", "TypeScript"],
    },
    {
      name: "工程化工具",
      level: "Advanced",
      keywords: ["Webpack", "Vite", "Rollup", "ESLint"],
    },
    {
      name: "后端技术",
      level: "Intermediate",
      keywords: ["Node.js", "Express", "PostgreSQL"],
    },
  ],
  projects: [
    {
      name: "智能简历适配系统",
      description: "基于AI的简历岗位适配平台，支持多模板渲染与高清导出",
      url: "https://github.com/Docking666/CV-wizard",
      highlights: ["集成LLM实现JD分析与简历重写", "Playwright服务端渲染导出PDF/PNG"],
      startDate: "2024-01",
      endDate: null,
    },
  ],
  certificates: [
    { name: "AWS Certified Solutions Architect", date: "2023-06", issuer: "Amazon Web Services" },
  ],
  languages: [
    { language: "中文", fluency: "母语" },
    { language: "英语", fluency: "CET-6" },
  ],
};
