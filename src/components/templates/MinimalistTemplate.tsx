import { useCVStore } from '../../store/useCVStore';
import { useTemplateTheme } from '../../hooks/useTemplateTheme';
import type { ExperienceEntry, ProjectEntry, InvolvementEntry, CertificationEntry, AwardEntry, LanguageEntry, ReferenceEntry } from '../../types/cv';

const proficiencyLabels: Record<LanguageEntry['proficiency'], string> = {
  native: 'Native',
  fluent: 'Fluent',
  intermediate: 'Intermediate',
  beginner: 'Beginner',
};

export function MinimalistTemplate() {
  const { fontFamily, zoom, effectiveA4Height, lineHeight, margin, sectionGap, titleTransform, primaryColor, photoSize, photoShape, photoVisible } = useTemplateTheme();
  const {
    personalInfo,
    summary,
    experience,
    projects,
    education,
    involvement,
    skills,
    certifications,
    languages,
    awards,
    hobbies,
    references,
    sections,
  } = useCVStore();

  const visibleSections = sections.filter((s) => s.visible);

  const SectionTitle = ({ title }: { title: string }) => (
    <h2
      className="text-[14px] font-normal tracking-[0.2em] mb-3 pb-1"
      style={{
        color: primaryColor,
        textTransform: titleTransform,
      }}
    >
      {title}
    </h2>
  );

  const BulletList = ({ bullets }: { bullets: string[] }) => (
    <ul className="mt-1 space-y-0.5">
      {bullets.filter(Boolean).map((b, i) => (
        <li key={i} className="text-[10.5px] text-gray-600 flex leading-relaxed">
          <span className="mr-2 shrink-0">—</span>
          <span>{b}</span>
        </li>
      ))}
    </ul>
  );

  const renderSection = (type: string, title: string) => {
    switch (type) {
      case 'summary':
        return summary ? (
          <div>
            <SectionTitle title={title} />
            <p className="text-[10.5px] text-gray-600 leading-relaxed italic">{summary}</p>
          </div>
        ) : null;
      case 'experience':
        return experience.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            <div className="space-y-4">
              {experience.map((e: ExperienceEntry) => (
                <div key={e.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-[11.5px] font-semibold text-gray-800">
                      {e.title}
                    </h3>
                    <span className="text-[9.5px] text-gray-400 ml-2">
                      {e.startDate}{e.endDate ? ` — ${e.endDate}` : ''}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500">{e.company}{e.location ? `, ${e.location}` : ''}</p>
                  <BulletList bullets={e.bullets} />
                </div>
              ))}
            </div>
          </div>
        ) : null;
      case 'projects':
        return projects.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            <div className="space-y-4">
              {projects.map((p: ProjectEntry) => (
                <div key={p.id}>
                  <h3 className="text-[11.5px] font-semibold text-gray-800">
                    {p.name}
                  </h3>
                  <div className="text-[9.5px] text-gray-400">
                    {p.link && <a href={p.link.startsWith('http') ? p.link : `https://${p.link}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{p.link}</a>}
                    {p.date && <span> · {p.date}</span>}
                  </div>
                  <BulletList bullets={p.bullets} />
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
              <div key={e.id} className="mb-1">
                <span className="text-[11px] font-semibold text-gray-800">
                  {e.degree}
                </span>
                <span className="text-[10px] text-gray-500"> — {e.institution}{e.year ? `, ${e.year}` : ''}</span>
              </div>
            ))}
          </div>
        ) : null;
      case 'involvement':
        return involvement.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            <div className="space-y-3">
              {involvement.map((inv: InvolvementEntry) => (
                <div key={inv.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-[11.5px] font-semibold text-gray-800">
                      {inv.role}
                    </h3>
                    <span className="text-[9.5px] text-gray-400">
                      {inv.startDate}{inv.endDate ? ` — ${inv.endDate}` : ''}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500">{inv.institution}{inv.organization ? ` · ${inv.organization}` : ''}</p>
                  <BulletList bullets={inv.bullets} />
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
              <p key={cat.id} className="text-[10.5px] text-gray-600 mb-1">
                {cat.category && <span className="text-gray-800 font-medium">{cat.category}: </span>}
                {cat.items}
              </p>
            ))}
          </div>
        ) : null;
      case 'certifications':
        return certifications.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            <div className="space-y-3">
              {certifications.map((c: CertificationEntry) => (
                <div key={c.id}>
                  <h3 className="text-[11.5px] font-semibold text-gray-800">
                    {c.name}
                  </h3>
                  <p className="text-[9.5px] text-gray-400">{c.issuer}{c.year ? ` · ${c.year}` : ''}</p>
                  {c.description && <BulletList bullets={[c.description]} />}
                </div>
              ))}
            </div>
          </div>
        ) : null;
      case 'languages':
        return languages.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {languages.map((l: LanguageEntry) => (
                <span key={l.id} className="text-[10.5px] text-gray-600">
                  <span className="text-gray-800 font-medium">{l.language}</span>
                  {' — '}
                  {proficiencyLabels[l.proficiency]}
                </span>
              ))}
            </div>
          </div>
        ) : null;
      case 'awards':
        return awards.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            <div className="space-y-3">
              {awards.map((a: AwardEntry) => (
                <div key={a.id}>
                  <h3 className="text-[11.5px] font-semibold text-gray-800">{a.title}</h3>
                  <p className="text-[9.5px] text-gray-400">{a.issuer}{a.year ? ` · ${a.year}` : ''}</p>
                  {a.description && <BulletList bullets={[a.description]} />}
                </div>
              ))}
            </div>
          </div>
        ) : null;
      case 'hobbies':
        return hobbies ? (
          <div>
            <SectionTitle title={title} />
            <p className="text-[10.5px] text-gray-600 leading-relaxed">{hobbies}</p>
          </div>
        ) : null;
      case 'references':
        return references.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            <div className="space-y-3">
              {references.map((r: ReferenceEntry) => (
                <div key={r.id}>
                  <h3 className="text-[11.5px] font-semibold text-gray-800">{r.name}</h3>
                  <p className="text-[10px] text-gray-500">{r.title}{r.company ? `, ${r.company}` : ''}</p>
                  <div className="flex gap-3 mt-0.5 text-[9.5px] text-gray-400">
                    {r.email && <span>{r.email}</span>}
                    {r.phone && <span>{r.phone}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div
      className="a4-page"
      style={{
        fontFamily,
        zoom,
        lineHeight,
        minHeight: `${effectiveA4Height}px`,
        ['--a4-break-height' as string]: `${effectiveA4Height}px`,
        paddingLeft: margin,
        paddingRight: margin,
        paddingTop: '50px',
        paddingBottom: '50px',
      }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        {personalInfo.profilePhoto && photoVisible && (
          <img src={personalInfo.profilePhoto} alt="Profile photo" className="object-cover mx-auto mb-2" style={{ width: photoSize, height: photoSize, borderRadius: photoShape }} />
        )}
        <h1 className="text-[24px] font-normal tracking-[0.15em] text-gray-800 uppercase">
          {personalInfo.fullName}
        </h1>
        {personalInfo.jobTitle && (
          <p className="text-[11px] text-gray-500 tracking-wide mt-1">{personalInfo.jobTitle}</p>
        )}
        <div className="flex items-center justify-center gap-3 mt-2 text-[9.5px] text-gray-400">
          {personalInfo.location && <span>{personalInfo.location}</span>}
          {personalInfo.email && <><span>·</span><a href={`mailto:${personalInfo.email}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{personalInfo.email}</a></>}
          {personalInfo.phone && <><span>·</span><a href={`tel:${personalInfo.phone}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{personalInfo.phone}</a></>}
          {personalInfo.linkedin && <><span>·</span><a href={personalInfo.linkedin.startsWith('http') ? personalInfo.linkedin : `https://${personalInfo.linkedin}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{personalInfo.linkedin}</a></>}
          {personalInfo.website && <><span>·</span><a href={personalInfo.website.startsWith('http') ? personalInfo.website : `https://${personalInfo.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{personalInfo.website}</a></>}
          {personalInfo.nationality && <><span>·</span><span>{personalInfo.nationality}</span></>}
          {personalInfo.drivingLicense && <><span>·</span><span>License: {personalInfo.drivingLicense}</span></>}
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6" />

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
