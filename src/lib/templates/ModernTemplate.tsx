import type { Resume } from "@/lib/schemas/resume";

export function ModernTemplate({ data, cssVariables }: { data: Resume; cssVariables?: Record<string, string> }) {
  const { basics, work, education, skills, projects, certificates, languages } = data;
  const primary = cssVariables?.["--primary"] || "#0d9488";
  const bgSecondary = cssVariables?.["--bg-secondary"] || "#f0fdfa";

  return (
    <div className="flex text-sm" style={{ color: "#374151", fontFamily: cssVariables?.["--font-body"] }}>
      {/* 左侧边栏 */}
      <div className="w-[32%] p-6" style={{ backgroundColor: bgSecondary }}>
        <div className="mb-6">
          <h1 className="text-xl font-bold" style={{ color: primary }}>{basics.name}</h1>
          {basics.label && <p className="text-xs mt-1 opacity-80">{basics.label}</p>}
        </div>

        <div className="space-y-2 text-[11px] mb-6">
          {basics.email && <div>{basics.email}</div>}
          {basics.phone && <div>{basics.phone}</div>}
          {basics.location?.city && <div>{basics.location.city}</div>}
          {basics.website && <div>{basics.website}</div>}
        </div>

        {skills && skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: primary }}>技能</h2>
            <div className="space-y-2">
              {skills.map((s, i) => (
                <div key={s.name + i}>
                  <div className="text-[11px] font-medium">{s.name}</div>
                  <div className="text-[10px] opacity-70">{s.keywords?.join(", ")}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {languages && languages.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: primary }}>语言</h2>
            <div className="text-[11px]">
              {languages.map((l, i) => (
                <div key={l.language + i}>{l.language}{l.fluency && ` · ${l.fluency}`}</div>
              ))}
            </div>
          </div>
        )}

        {certificates && certificates.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: primary }}>证书</h2>
            <div className="text-[11px]">
              {certificates.map((c, i) => (
                <div key={c.name + i}>{c.name}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 右侧主内容 */}
      <div className="flex-1 p-6">
        {basics.summary && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: primary }}>个人简介</h2>
            <p className="text-[11px] leading-relaxed">{basics.summary}</p>
          </div>
        )}

        {work && work.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: primary }}>工作经历</h2>
            {work.map((w, i) => (
              <div key={w.name + i} className="mb-4">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold text-xs">{w.name}</h3>
                  <span className="text-[10px] text-gray-500">{w.startDate} – {w.isCurrent ? "至今" : w.endDate}</span>
                </div>
                <p className="text-[11px] text-gray-600">{w.position}</p>
                {w.highlights && w.highlights.length > 0 && (
                  <ul className="list-disc list-inside mt-1 text-[11px]">
                    {w.highlights.map((h, hi) => <li key={hi}>{h}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {education && education.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: primary }}>教育背景</h2>
            {education.map((e, i) => (
              <div key={e.institution + i} className="mb-2">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold text-xs">{e.institution}</h3>
                  <span className="text-[10px] text-gray-500">{e.startDate} – {e.endDate}</span>
                </div>
                <p className="text-[11px] text-gray-600">{e.area} {e.studyType && `· ${e.studyType}`}</p>
              </div>
            ))}
          </div>
        )}

        {projects && projects.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: primary }}>项目经历</h2>
            {projects.map((p, i) => (
              <div key={p.name + i} className="mb-3">
                <h3 className="font-semibold text-xs">{p.name}</h3>
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
      </div>
    </div>
  );
}
