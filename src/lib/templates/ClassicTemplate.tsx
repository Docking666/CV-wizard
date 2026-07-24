import type { Resume } from "@/lib/schemas/resume";

export function ClassicTemplate({ data, cssVariables }: { data: Resume; cssVariables?: Record<string, string> }) {
  const { basics, work, education, skills, projects, certificates, languages } = data;
  const primary = cssVariables?.["--primary"] || "#1f2937";

  return (
    <div className="p-8 text-sm" style={{ color: "#374151", fontFamily: cssVariables?.["--font-body"] }}>
      {/* Header */}
      <div className="border-b-2 pb-4 mb-4" style={{ borderColor: primary }}>
        <h1 className="text-2xl font-bold" style={{ color: primary }}>{basics.name}</h1>
        {basics.label && <p className="text-base mt-1" style={{ color: cssVariables?.["--secondary"] || "#6b7280" }}>{basics.label}</p>}
        <div className="flex flex-wrap gap-3 mt-2 text-xs">
          {basics.email && <span>{basics.email}</span>}
          {basics.phone && <span>{basics.phone}</span>}
          {basics.location?.city && <span>{basics.location.city}</span>}
          {basics.website && <a href={basics.website} target="_blank" rel="noreferrer" className="underline">{basics.website}</a>}
        </div>
        {basics.profiles && basics.profiles.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-1 text-xs">
            {basics.profiles.map((p, i) => (
              p.url ? <a key={i} href={p.url} target="_blank" rel="noreferrer" className="underline">{p.network}</a> : <span key={i}>{p.network}</span>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {basics.summary && (
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: primary }}>个人简介</h2>
          <p className="text-xs leading-relaxed">{basics.summary}</p>
        </div>
      )}

      {/* Work */}
      {work && work.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: primary }}>工作经历</h2>
          {work.map((w, i) => (
            <div key={w.name + i} className="mb-3">
              <div className="flex justify-between items-baseline">
                <h3 className="font-semibold text-xs">{w.name}{w.url && <a href={w.url} target="_blank" rel="noreferrer" className="ml-1 text-[10px] underline">↗</a>}</h3>
                <span className="text-[11px] text-gray-500">{w.startDate} – {w.isCurrent ? "至今" : w.endDate}</span>
              </div>
              <p className="text-[11px] text-gray-600">{w.position}</p>
              {w.summary && <p className="text-[11px] mt-0.5">{w.summary}</p>}
              {w.highlights && w.highlights.length > 0 && (
                <ul className="list-disc list-inside mt-1 text-[11px]">
                  {w.highlights.map((h, hi) => <li key={hi}>{h}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: primary }}>教育背景</h2>
          {education.map((e, i) => (
            <div key={e.institution + i} className="mb-2">
              <div className="flex justify-between items-baseline">
                <h3 className="font-semibold text-xs">{e.institution}{e.url && <a href={e.url} target="_blank" rel="noreferrer" className="ml-1 text-[10px] underline">↗</a>}</h3>
                <span className="text-[11px] text-gray-500">{e.startDate} – {e.endDate}</span>
              </div>
              <p className="text-[11px] text-gray-600">{e.area} {e.studyType && `· ${e.studyType}`}</p>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: primary }}>技能</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((s, i) => (
              <div key={s.name + i} className="text-[11px]">
                <span className="font-medium">{s.name}:</span>{" "}
                {s.keywords?.join(", ")}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: primary }}>项目经历</h2>
          {projects.map((p, i) => (
            <div key={p.name + i} className="mb-2">
              <h3 className="font-semibold text-xs">{p.name}{p.url && <a href={p.url} target="_blank" rel="noreferrer" className="ml-1 text-[10px] underline">↗</a>}</h3>
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

      {/* Certificates */}
      {certificates && certificates.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: primary }}>证书</h2>
          <div className="text-[11px]">
            {certificates.map((c, i) => (
              <span key={c.name + i}>{c.name}{c.issuer && ` (${c.issuer})`}{i < certificates.length - 1 ? " · " : ""}</span>
            ))}
          </div>
        </div>
      )}

      {/* Languages */}
      {languages && languages.length > 0 && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: primary }}>语言</h2>
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
