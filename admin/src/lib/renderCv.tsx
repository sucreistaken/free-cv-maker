import type { CVData, CVSection } from '../types/cv';

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-sm text-gray-900">{value}</div>
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="list-disc list-inside text-sm text-gray-700 mt-1 space-y-0.5">
      {items.filter(Boolean).map((b, i) => (
        <li key={i}>{b}</li>
      ))}
    </ul>
  );
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-gray-100 pt-4 mt-4 first:border-0 first:pt-0 first:mt-0">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{title}</h3>
      {children}
    </div>
  );
}

export function renderSection(section: CVSection, cv: CVData) {
  if (!section.visible) return null;

  switch (section.type) {
    case 'personalInfo':
      return (
        <SectionBlock key={section.id} title={section.title}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ad Soyad" value={cv.personalInfo.fullName} />
            <Field label="Unvan" value={cv.personalInfo.jobTitle} />
            <Field label="Konum" value={cv.personalInfo.location} />
            <Field label="E-posta" value={cv.personalInfo.email} />
            <Field label="Telefon" value={cv.personalInfo.phone} />
            <Field label="LinkedIn" value={cv.personalInfo.linkedin} />
            <Field label="GitHub" value={cv.personalInfo.github} />
            <Field label="Web Sitesi" value={cv.personalInfo.website} />
          </div>
        </SectionBlock>
      );
    case 'summary':
      return cv.summary ? (
        <SectionBlock key={section.id} title={section.title}>
          <p className="text-sm text-gray-700">{cv.summary}</p>
        </SectionBlock>
      ) : null;
    case 'experience':
      return cv.experience.length ? (
        <SectionBlock key={section.id} title={section.title}>
          <div className="space-y-3">
            {cv.experience.map((e) => (
              <div key={e.id}>
                <div className="text-sm font-medium text-gray-900">
                  {e.title} — {e.company}
                </div>
                <div className="text-xs text-gray-400">
                  {e.location} · {e.startDate} – {e.endDate}
                </div>
                <Bullets items={e.bullets} />
              </div>
            ))}
          </div>
        </SectionBlock>
      ) : null;
    case 'projects':
      return cv.projects.length ? (
        <SectionBlock key={section.id} title={section.title}>
          <div className="space-y-3">
            {cv.projects.map((p) => (
              <div key={p.id}>
                <div className="text-sm font-medium text-gray-900">{p.name}</div>
                <div className="text-xs text-gray-400">
                  {p.link} · {p.date}
                </div>
                <Bullets items={p.bullets} />
              </div>
            ))}
          </div>
        </SectionBlock>
      ) : null;
    case 'education':
      return cv.education.length ? (
        <SectionBlock key={section.id} title={section.title}>
          <div className="space-y-2">
            {cv.education.map((e) => (
              <div key={e.id} className="text-sm text-gray-900">
                {e.degree} — {e.institution}
                <span className="text-xs text-gray-400 ml-2">
                  {e.startDate} – {e.year} {e.gpa && `· GPA ${e.gpa}`}
                </span>
              </div>
            ))}
          </div>
        </SectionBlock>
      ) : null;
    case 'involvement':
      return cv.involvement.length ? (
        <SectionBlock key={section.id} title={section.title}>
          <div className="space-y-3">
            {cv.involvement.map((i) => (
              <div key={i.id}>
                <div className="text-sm font-medium text-gray-900">
                  {i.role} — {i.organization}
                </div>
                <div className="text-xs text-gray-400">
                  {i.institution} · {i.startDate} – {i.endDate}
                </div>
                <Bullets items={i.bullets} />
              </div>
            ))}
          </div>
        </SectionBlock>
      ) : null;
    case 'skills':
      return cv.skills.length ? (
        <SectionBlock key={section.id} title={section.title}>
          <div className="space-y-1">
            {cv.skills.map((s) => (
              <div key={s.id} className="text-sm">
                <span className="font-medium text-gray-900">{s.category}: </span>
                <span className="text-gray-700">{s.items}</span>
              </div>
            ))}
          </div>
        </SectionBlock>
      ) : null;
    case 'certifications':
      return cv.certifications.length ? (
        <SectionBlock key={section.id} title={section.title}>
          <div className="space-y-1">
            {cv.certifications.map((c) => (
              <div key={c.id} className="text-sm text-gray-900">
                {c.name} — {c.issuer} <span className="text-xs text-gray-400">{c.year}</span>
              </div>
            ))}
          </div>
        </SectionBlock>
      ) : null;
    case 'languages':
      return cv.languages.length ? (
        <SectionBlock key={section.id} title={section.title}>
          <div className="flex flex-wrap gap-2">
            {cv.languages.map((l) => (
              <span key={l.id} className="text-xs bg-gray-100 rounded-full px-2.5 py-1 text-gray-700">
                {l.language} · {l.proficiency}
              </span>
            ))}
          </div>
        </SectionBlock>
      ) : null;
    case 'awards':
      return cv.awards.length ? (
        <SectionBlock key={section.id} title={section.title}>
          <div className="space-y-1">
            {cv.awards.map((a) => (
              <div key={a.id} className="text-sm text-gray-900">
                {a.title} — {a.issuer} <span className="text-xs text-gray-400">{a.year}</span>
              </div>
            ))}
          </div>
        </SectionBlock>
      ) : null;
    case 'hobbies':
      return cv.hobbies ? (
        <SectionBlock key={section.id} title={section.title}>
          <p className="text-sm text-gray-700">{cv.hobbies}</p>
        </SectionBlock>
      ) : null;
    case 'references':
      return cv.references.length ? (
        <SectionBlock key={section.id} title={section.title}>
          <div className="space-y-1">
            {cv.references.map((r) => (
              <div key={r.id} className="text-sm text-gray-900">
                {r.name} — {r.title}, {r.company}
              </div>
            ))}
          </div>
        </SectionBlock>
      ) : null;
    default:
      return null;
  }
}
