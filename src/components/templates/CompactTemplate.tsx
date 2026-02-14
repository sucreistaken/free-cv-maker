import { useCVStore } from '../../store/useCVStore';
import { useTemplateTheme } from '../../hooks/useTemplateTheme';
import type { ExperienceEntry, ProjectEntry, InvolvementEntry, CertificationEntry, AwardEntry, LanguageEntry, ReferenceEntry } from '../../types/cv';

const proficiencyLabels: Record<LanguageEntry['proficiency'], string> = {
  native: 'Native',
  fluent: 'Fluent',
  intermediate: 'Intermediate',
  beginner: 'Beginner',
};

export function CompactTemplate() {
  const {
    personalInfo, summary, experience, projects, education, involvement,
    skills, certifications, languages, awards, hobbies, references, sections,
  } = useCVStore();
  const { fontFamily, primaryColor, accentColor, titleTransform, sectionGap, margin } = useTemplateTheme();

  const visibleSections = sections.filter((s) => s.visible);

  const SectionTitle = ({ title }: { title: string }) => (
    <h2
      className="text-[10px] font-bold tracking-wider mb-1 pb-0.5 border-b"
      style={{ color: primaryColor, textTransform: titleTransform, borderColor: accentColor + '40' }}
    >
      {title}
    </h2>
  );

  const renderSection = (type: string, title: string) => {
    switch (type) {
      case 'summary':
        return summary ? (
          <div>
            <SectionTitle title={title} />
            <p className="text-[9px] text-gray-700 leading-[1.3]">{summary}</p>
          </div>
        ) : null;
      case 'experience':
        return experience.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            <div className="space-y-1.5">
              {experience.map((e: ExperienceEntry) => (
                <div key={e.id}>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[9.5px] font-bold text-gray-800">{e.title}</span>
                    <span className="text-[8px] text-gray-400 ml-1 shrink-0">{e.startDate}{e.endDate ? ` - ${e.endDate}` : ''}</span>
                  </div>
                  <p className="text-[8.5px] text-gray-500">{e.company}{e.location ? ` | ${e.location}` : ''}</p>
                  <ul className="mt-0.5">
                    {e.bullets.filter(Boolean).map((b, i) => (
                      <li key={i} className="text-[9px] text-gray-700 flex leading-[1.2]">
                        <span className="mr-1 shrink-0">-</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      case 'projects':
        return projects.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            <div className="space-y-1.5">
              {projects.map((p: ProjectEntry) => (
                <div key={p.id}>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[9.5px] font-bold text-gray-800">{p.name}</span>
                    {p.link && <a href={p.link.startsWith('http') ? p.link : `https://${p.link}`} target="_blank" rel="noopener noreferrer" className="text-[8px] text-gray-400 hover:underline">({p.link})</a>}
                    {p.date && <span className="text-[8px] text-gray-400 ml-auto shrink-0">{p.date}</span>}
                  </div>
                  <ul className="mt-0.5">
                    {p.bullets.filter(Boolean).map((b, i) => (
                      <li key={i} className="text-[9px] text-gray-700 flex leading-[1.2]">
                        <span className="mr-1 shrink-0">-</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      case 'education':
        return education.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            {education.map((e) => (
              <p key={e.id} className="text-[9px] text-gray-700">
                <span className="font-bold">{e.degree}</span> — {e.institution}{e.year ? `, ${e.year}` : ''}
              </p>
            ))}
          </div>
        ) : null;
      case 'involvement':
        return involvement.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            <div className="space-y-1">
              {involvement.map((inv: InvolvementEntry) => (
                <div key={inv.id}>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[9.5px] font-bold text-gray-800">{inv.role}</span>
                    <span className="text-[8px] text-gray-400">{inv.startDate}{inv.endDate ? ` - ${inv.endDate}` : ''}</span>
                  </div>
                  <p className="text-[8.5px] text-gray-500">{inv.institution}{inv.organization ? ` · ${inv.organization}` : ''}</p>
                  <ul className="mt-0.5">
                    {inv.bullets.filter(Boolean).map((b, i) => (
                      <li key={i} className="text-[9px] text-gray-700 flex leading-[1.2]">
                        <span className="mr-1 shrink-0">-</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      case 'skills':
        return skills.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            {skills.map((cat) => (
              <p key={cat.id} className="text-[9px] text-gray-700 leading-[1.2]">
                {cat.category && <span className="font-bold">{cat.category}: </span>}
                {cat.items}
              </p>
            ))}
          </div>
        ) : null;
      case 'certifications':
        return certifications.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            {certifications.map((c: CertificationEntry) => (
              <p key={c.id} className="text-[9px] text-gray-700">
                <span className="font-bold">{c.name}</span> — {c.issuer}{c.year ? `, ${c.year}` : ''}
              </p>
            ))}
          </div>
        ) : null;
      case 'languages':
        return languages.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            <p className="text-[9px] text-gray-700">
              {languages.map((l: LanguageEntry, i: number) => (
                <span key={l.id}>
                  {l.language} ({proficiencyLabels[l.proficiency]})
                  {i < languages.length - 1 ? ', ' : ''}
                </span>
              ))}
            </p>
          </div>
        ) : null;
      case 'awards':
        return awards.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            {awards.map((a: AwardEntry) => (
              <p key={a.id} className="text-[9px] text-gray-700">
                <span className="font-bold">{a.title}</span> — {a.issuer}{a.year ? `, ${a.year}` : ''}
              </p>
            ))}
          </div>
        ) : null;
      case 'hobbies':
        return hobbies ? (
          <div>
            <SectionTitle title={title} />
            <p className="text-[9px] text-gray-700 leading-[1.2]">{hobbies}</p>
          </div>
        ) : null;
      case 'references':
        return references.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            <div className="grid grid-cols-2 gap-1">
              {references.map((r: ReferenceEntry) => (
                <div key={r.id} className="text-[8.5px] text-gray-600">
                  <span className="font-bold text-gray-800">{r.name}</span>
                  {r.title && <span> — {r.title}</span>}
                  {r.email && <span> · {r.email}</span>}
                </div>
              ))}
            </div>
          </div>
        ) : null;
      default:
        return null;
    }
  };

  const contactParts: { value: string; href: string | null }[] = [
    { value: personalInfo.location || '', href: null },
    { value: personalInfo.email || '', href: personalInfo.email ? `mailto:${personalInfo.email}` : null },
    { value: personalInfo.phone || '', href: personalInfo.phone ? `tel:${personalInfo.phone}` : null },
    { value: personalInfo.linkedin || '', href: personalInfo.linkedin ? (personalInfo.linkedin.startsWith('http') ? personalInfo.linkedin : `https://${personalInfo.linkedin}`) : null },
    { value: personalInfo.website || '', href: personalInfo.website ? (personalInfo.website.startsWith('http') ? personalInfo.website : `https://${personalInfo.website}`) : null },
    { value: personalInfo.nationality || '', href: null },
    { value: personalInfo.drivingLicense ? `License: ${personalInfo.drivingLicense}` : '', href: null },
  ].filter((p) => p.value);

  return (
    <div
      className="a4-page"
      style={{
        fontFamily,
        fontSize: '9.5px',
        lineHeight: 1.2,
        paddingLeft: margin,
        paddingRight: margin,
        paddingTop: '20px',
        paddingBottom: '20px',
      }}
    >
      {/* Header */}
      <div className="text-center mb-1.5">
        <h1 className="text-[16px] font-bold text-gray-900">{personalInfo.fullName}</h1>
        {personalInfo.jobTitle && (
          <p className="text-[9.5px] text-gray-600">{personalInfo.jobTitle}</p>
        )}
        <p className="text-[8.5px] text-gray-400 mt-0.5">
          {contactParts.map((part, i) => (
            <span key={i}>
              {i > 0 && ' | '}
              {part.href ? (
                <a href={part.href} target="_blank" rel="noopener noreferrer" className="hover:underline">{part.value}</a>
              ) : (
                part.value
              )}
            </span>
          ))}
        </p>
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: sectionGap }}>
        {visibleSections
          .filter((s) => s.type !== 'personalInfo')
          .map((section) => {
            const rendered = renderSection(section.type, section.title);
            return rendered ? <div key={section.id}>{rendered}</div> : null;
          })}
      </div>
    </div>
  );
}
