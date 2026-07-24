import type { Resume } from "@/lib/schemas/resume";

export function AcademicTemplate({ data, cssVariables }: { data: Resume; cssVariables?: Record<string, string> }) {
  const { basics, work, education, skills, projects, awards, publications, languages } = data;
  const primary = cssVariables?.["--primary"] || "#1e3a5f";

  return (
    <div className="p-10 text-sm" style={{ color: "#1f2937", fontFamily: cssVariables?.["--font-body"] }}>
      {/* 标题 */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: primary }}>{basics.name}</h1>
        {basics.label && <p className="text-sm mt-1 text-gray-600">{basics.label}</p>}
        <div className="flex flex-wrap justify-center gap-4 mt-2 text-xs text-gray-600">
          {basics.email && <span>{basics.email}</span>}
          {basics.phone && <span>{basics.phone}</span>}
          {basics.location?.city && <span>{basics.location.city}</span>}
          {basics.website && <span>{basics.website}</span>}
        </div>
      </div>

      {/* 教育背景优先 */}
      {education && education.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-3 border-b pb-1" style={{ color: primary, borderColor: primary + "30" }}>教育背景</h2>
          {education.map((e, i) => (
            <div key={e.institution + i} className="mb-3">
              <div className="flex justify-between items-baseline">
                <h3 className="font-semibold text-xs">{e.institution}</h3>
                <span className="text-[11px] text-gray-500">{e.startDate} – {e.endDate}</span>
              </div>
              <p className="text-[11px] text-gray-600">{e.area} {e.studyType && `· ${e.studyType}`}</p>
              {e.courses && e.courses.length > 0 && (
                <p className="text-[11px] mt-0.5">核心课程: {e.courses.join(", ")}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 研究/工作经历 */}
      {work && work.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-3 border-b pb-1" style={{ color: primary, borderColor: primary + "30" }}>研究 / 工作经历</h2>
          {work.map((w, i) => (
            <div key={w.name + i} className="mb-4">
              <div className="flex justify-between items-baseline">
                <h3 className="font-semibold text-xs">{w.name}</h3>
                <span className="text-[11px] text-gray-500">{w.startDate} – {w.isCurrent ? "至今" : w.endDate}</span>
              </div>
              <p className="text-[11px] text-gray-600">{w.position}</p>
              {w.summary && <p className="text-[11px] mt-0.5 italic">{w.summary}</p>}
              {w.highlights && w.highlights.length > 0 && (
                <ul className="list-disc list-inside mt-1 text-[11px]">
                  {w.highlights.map((h, hi) => <li key={hi}>{h}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 发表论文 */}
      {publications && publications.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-3 border-b pb-1" style={{ color: primary, borderColor: primary + "30" }}>发表论文</h2>
          <ol className="list-decimal list-inside text-[11px] space-y-1">
            {publications.map((p, i) => (
              <li key={p.name + i}>
                <span className="font-medium">{p.name}</span>
                {p.publisher && <span className="text-gray-600"> · {p.publisher}</span>}
                {p.releaseDate && <span className="text-gray-500"> · {p.releaseDate}</span>}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* 获奖 */}
      {awards && awards.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-3 border-b pb-1" style={{ color: primary, borderColor: primary + "30" }}>荣誉奖项</h2>
          <div className="text-[11px] space-y-1">
            {awards.map((a, i) => (
              <div key={a.title + i} className="flex justify-between">
                <span>{a.title}{a.awarder && ` · ${a.awarder}`}</span>
                {a.date && <span className="text-gray-500">{a.date}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 项目 */}
      {projects && projects.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-3 border-b pb-1" style={{ color: primary, borderColor: primary + "30" }}>研究项目</h2>
          {projects.map((p, i) => (
            <div key={p.name + i} className="mb-3">
              <h3 className="font-semibold text-xs">{p.name}{p.url && <span className="text-[10px] text-gray-500 ml-1">{p.url}</span>}</h3>
              <p className="text-[11px]">{p.description}</p>
              {p.highlights && p.highlights.length > 0 && (
                <ul className="list-disc list-inside mt-0.5 text-[11px]">
                  {p.highlights.map((h, hi) => <li key={hi}>{h}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 技能 */}
      {skills && skills.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-3 border-b pb-1" style={{ color: primary, borderColor: primary + "30" }}>专业技能</h2>
          <div className="text-[11px]">
            {skills.map((s, i) => (
              <div key={s.name + i} className="mb-1">
                <span className="font-medium">{s.name}:</span>{" "}
                {s.keywords?.join(", ")}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 语言 */}
      {languages && languages.length > 0 && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-3 border-b pb-1" style={{ color: primary, borderColor: primary + "30" }}>语言能力</h2>
          <div className="text-[11px]">
            {languages.map((l, i) => (
              <span key={l.language + i}>{l.language}{l.fluency && ` · ${l.fluency}`}{i < languages.length - 1 ? " · " : ""}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
