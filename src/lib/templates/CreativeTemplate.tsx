import type { Resume } from "@/lib/schemas/resume";

export function CreativeTemplate({ data, cssVariables }: { data: Resume; cssVariables?: Record<string, string> }) {
  const { basics, work, education, skills, projects, certificates, languages } = data;
  const primary = cssVariables?.["--primary"] || "#4f46e5";
  const accent = cssVariables?.["--accent"] || "#4338ca";

  return (
    <div className="text-sm" style={{ color: "#374151", fontFamily: cssVariables?.["--font-body"] }}>
      {/* 顶部色块 */}
      <div className="p-8 text-white" style={{ backgroundColor: primary }}>
        <h1 className="text-3xl font-bold">{basics.name}</h1>
        {basics.label && <p className="text-base mt-1 opacity-90">{basics.label}</p>}
        <div className="flex flex-wrap gap-4 mt-3 text-xs opacity-90">
          {basics.email && <span>{basics.email}</span>}
          {basics.phone && <span>{basics.phone}</span>}
          {basics.location?.city && <span>{basics.location.city}</span>}
          {basics.website && <span>{basics.website}</span>}
        </div>
      </div>

      <div className="p-8">
        {basics.summary && (
          <div className="mb-5">
            <h2 className="text-sm font-bold mb-2" style={{ color: accent }}>关于我</h2>
            <p className="text-xs leading-relaxed">{basics.summary}</p>
          </div>
        )}

        {work && work.length > 0 && (
          <div className="mb-5">
            <h2 className="text-sm font-bold mb-3" style={{ color: accent }}>工作经历</h2>
            <div className="space-y-4">
              {work.map((w, i) => (
                <div key={w.name + i} className="relative pl-4 border-l-2" style={{ borderColor: primary + "40" }}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold text-xs">{w.name}</h3>
                    <span className="text-[11px] text-gray-500">{w.startDate} – {w.isCurrent ? "至今" : w.endDate}</span>
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
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div>
            {education && education.length > 0 && (
              <div className="mb-5">
                <h2 className="text-sm font-bold mb-3" style={{ color: accent }}>教育背景</h2>
                {education.map((e, i) => (
                  <div key={e.institution + i} className="mb-2">
                    <h3 className="font-semibold text-xs">{e.institution}</h3>
                    <p className="text-[11px] text-gray-600">{e.area} {e.studyType && `· ${e.studyType}`}</p>
                    <p className="text-[10px] text-gray-500">{e.startDate} – {e.endDate}</p>
                  </div>
                ))}
              </div>
            )}

            {skills && skills.length > 0 && (
              <div>
                <h2 className="text-sm font-bold mb-3" style={{ color: accent }}>技能</h2>
                <div className="flex flex-wrap gap-1.5">
                  {skills.flatMap((s) => s.keywords || []).map((k, i) => (
                    <span
                      key={k + i}
                      className="px-2 py-0.5 text-[10px] rounded-full text-white"
                      style={{ backgroundColor: primary }}
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            {projects && projects.length > 0 && (
              <div className="mb-5">
                <h2 className="text-sm font-bold mb-3" style={{ color: accent }}>项目经历</h2>
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

            {certificates && certificates.length > 0 && (
              <div className="mb-5">
                <h2 className="text-sm font-bold mb-2" style={{ color: accent }}>证书</h2>
                <div className="text-[11px]">
                  {certificates.map((c, i) => (
                    <div key={c.name + i}>{c.name}{c.issuer && ` · ${c.issuer}`}</div>
                  ))}
                </div>
              </div>
            )}

            {languages && languages.length > 0 && (
              <div>
                <h2 className="text-sm font-bold mb-2" style={{ color: accent }}>语言</h2>
                <div className="text-[11px]">
                  {languages.map((l, i) => (
                    <span key={l.language + i}>{l.language}{l.fluency && ` · ${l.fluency}`}{i < languages.length - 1 ? " · " : ""}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
