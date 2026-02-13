import { MapPin, Mail, Phone, Linkedin, Globe } from 'lucide-react';
import { useCVStore } from '../../store/useCVStore';
import { useTemplateTheme } from '../../hooks/useTemplateTheme';
import type { ExperienceEntry, ProjectEntry, InvolvementEntry, CertificationEntry, AwardEntry, LanguageEntry, ReferenceEntry } from '../../types/cv';

const proficiencyLabels: Record<LanguageEntry['proficiency'], string> = {
  native: 'Native',
  fluent: 'Fluent',
  intermediate: 'Intermediate',
  beginner: 'Beginner',
};

export function TwoColumnTemplate() {
  const {
    personalInfo, summary, experience, projects, education, involvement,
    skills, certifications, languages, awards, hobbies, references, sections,
  } = useCVStore();
  const { fontFamily, zoom, lineHeight, margin, primaryColor, accentColor, titleTransform, sectionGap, photoSize, photoShape, photoVisible } = useTemplateTheme();

  const visibleSections = sections.filter((s) => s.visible);
  const sidebarTypes = new Set(['skills', 'education', 'languages', 'certifications']);
  const mainSections = visibleSections.filter((s) => !sidebarTypes.has(s.type) && s.type !== 'personalInfo');
  const sidebarSections = visibleSections.filter((s) => sidebarTypes.has(s.type));

  const MainSectionTitle = ({ title }: { title: string }) => (
    <div className="mb-2">
      <h2
        className="text-[13px] font-bold tracking-wider"
        style={{ color: primaryColor, textTransform: titleTransform }}
      >
        {title}
      </h2>
      <div className="border-b-2 mt-0.5" style={{ borderColor: accentColor, opacity: 0.3 }} />
    </div>
  );

  const SidebarSectionTitle = ({ title }: { title: string }) => (
    <h2
      className="text-[11px] font-bold tracking-wider mb-1.5"
      style={{ color: primaryColor, textTransform: titleTransform }}
    >
      {title}
    </h2>
  );

  const BulletList = ({ bullets }: { bullets: string[] }) => (
    <ul className="mt-0.5 space-y-0.5">
      {bullets.filter(Boolean).map((b, i) => (
        <li key={i} className="text-[10px] text-gray-700 flex leading-relaxed">
          <span className="mr-1.5 shrink-0" style={{ color: accentColor }}>•</span>
          <span>{b}</span>
        </li>
      ))}
    </ul>
  );

  const renderMainSection = (type: string, title: string) => {
    switch (type) {
      case 'summary':
        return summary ? (
          <div>
            <MainSectionTitle title={title} />
            <p className="text-[10.5px] text-gray-700 leading-relaxed">{summary}</p>
          </div>
        ) : null;
      case 'experience':
        return experience.length > 0 ? (
          <div>
            <MainSectionTitle title={title} />
            <div className="space-y-3">
              {experience.map((e: ExperienceEntry) => (
                <div key={e.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-[11px] font-bold text-gray-800">{e.title}</h3>
                    <span className="text-[9px] text-gray-400 ml-2 shrink-0">{e.startDate}{e.endDate ? ` – ${e.endDate}` : ''}</span>
                  </div>
                  <p className="text-[9.5px] text-gray-500">{e.company}{e.location ? `, ${e.location}` : ''}</p>
                  <BulletList bullets={e.bullets} />
                </div>
              ))}
            </div>
          </div>
        ) : null;
      case 'projects':
        return projects.length > 0 ? (
          <div>
            <MainSectionTitle title={title} />
            <div className="space-y-3">
              {projects.map((p: ProjectEntry) => (
                <div key={p.id}>
                  <h3 className="text-[11px] font-bold text-gray-800">{p.name}</h3>
                  <div className="text-[9px] text-gray-400">
                    {p.link && <span>{p.link}</span>}
                    {p.date && <span> · {p.date}</span>}
                  </div>
                  <BulletList bullets={p.bullets} />
                </div>
              ))}
            </div>
          </div>
        ) : null;
      case 'involvement':
        return involvement.length > 0 ? (
          <div>
            <MainSectionTitle title={title} />
            <div className="space-y-2">
              {involvement.map((inv: InvolvementEntry) => (
                <div key={inv.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-[11px] font-bold text-gray-800">{inv.role}</h3>
                    <span className="text-[9px] text-gray-400">{inv.startDate}{inv.endDate ? ` – ${inv.endDate}` : ''}</span>
                  </div>
                  <p className="text-[9.5px] text-gray-500">{inv.institution}{inv.organization ? ` · ${inv.organization}` : ''}</p>
                  <BulletList bullets={inv.bullets} />
                </div>
              ))}
            </div>
          </div>
        ) : null;
      case 'awards':
        return awards.length > 0 ? (
          <div>
            <MainSectionTitle title={title} />
            <div className="space-y-2">
              {awards.map((a: AwardEntry) => (
                <div key={a.id}>
                  <h3 className="text-[11px] font-bold text-gray-800">{a.title}</h3>
                  <p className="text-[9px] text-gray-400">{a.issuer}{a.year ? ` · ${a.year}` : ''}</p>
                  {a.description && <p className="text-[10px] text-gray-600 mt-0.5">{a.description}</p>}
                </div>
              ))}
            </div>
          </div>
        ) : null;
      case 'hobbies':
        return hobbies ? (
          <div>
            <MainSectionTitle title={title} />
            <p className="text-[10.5px] text-gray-700 leading-relaxed">{hobbies}</p>
          </div>
        ) : null;
      case 'references':
        return references.length > 0 ? (
          <div>
            <MainSectionTitle title={title} />
            <div className="space-y-2">
              {references.map((r: ReferenceEntry) => (
                <div key={r.id}>
                  <h3 className="text-[11px] font-bold text-gray-800">{r.name}</h3>
                  <p className="text-[9.5px] text-gray-500">{r.title}{r.company ? `, ${r.company}` : ''}</p>
                  <div className="flex gap-3 mt-0.5 text-[9px] text-gray-400">
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

  const renderSidebarSection = (type: string, title: string) => {
    switch (type) {
      case 'skills':
        return skills.length > 0 ? (
          <div>
            <SidebarSectionTitle title={title} />
            {skills.map((cat) => (
              <div key={cat.id} className="mb-2">
                {cat.category && <p className="text-[9px] font-semibold text-gray-700 mb-0.5">{cat.category}</p>}
                <p className="text-[9.5px] text-gray-600 leading-relaxed">{cat.items}</p>
              </div>
            ))}
          </div>
        ) : null;
      case 'education':
        return education.length > 0 ? (
          <div>
            <SidebarSectionTitle title={title} />
            {education.map((e) => (
              <div key={e.id} className="mb-2">
                <p className="text-[10px] font-semibold text-gray-800">{e.degree}</p>
                <p className="text-[9px] text-gray-500">{e.institution}</p>
                {e.year && <p className="text-[9px] text-gray-400">{e.year}</p>}
              </div>
            ))}
          </div>
        ) : null;
      case 'languages':
        return languages.length > 0 ? (
          <div>
            <SidebarSectionTitle title={title} />
            {languages.map((l: LanguageEntry) => (
              <div key={l.id} className="flex justify-between text-[9.5px] text-gray-600 mb-0.5">
                <span>{l.language}</span>
                <span className="text-gray-400">{proficiencyLabels[l.proficiency]}</span>
              </div>
            ))}
          </div>
        ) : null;
      case 'certifications':
        return certifications.length > 0 ? (
          <div>
            <SidebarSectionTitle title={title} />
            {certifications.map((c: CertificationEntry) => (
              <div key={c.id} className="mb-2">
                <p className="text-[10px] font-semibold text-gray-800">{c.name}</p>
                <p className="text-[9px] text-gray-400">{c.issuer}{c.year ? ` · ${c.year}` : ''}</p>
              </div>
            ))}
          </div>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="a4-page" style={{ fontFamily, zoom, lineHeight }}>
      {/* Header */}
      <div className="pt-8 pb-4" style={{ paddingLeft: margin, paddingRight: margin }}>
        <div className="flex items-center gap-4">
          {personalInfo.profilePhoto && photoVisible && (
            <img src={personalInfo.profilePhoto} alt="" className="object-cover shrink-0" style={{ width: photoSize, height: photoSize, borderRadius: photoShape }} />
          )}
          <div>
            <h1 className="text-[20px] font-bold" style={{ color: primaryColor }}>{personalInfo.fullName}</h1>
            {personalInfo.jobTitle && (
              <p className="text-[11px] text-gray-500 mt-0.5">{personalInfo.jobTitle}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {personalInfo.location && (
                <span className="flex items-center gap-1 text-[9px] text-gray-400">
                  <MapPin size={9} />{personalInfo.location}
                </span>
              )}
              {personalInfo.email && (
                <span className="flex items-center gap-1 text-[9px] text-gray-400">
                  <Mail size={9} />{personalInfo.email}
                </span>
              )}
              {personalInfo.phone && (
                <span className="flex items-center gap-1 text-[9px] text-gray-400">
                  <Phone size={9} />{personalInfo.phone}
                </span>
              )}
              {personalInfo.linkedin && (
                <span className="flex items-center gap-1 text-[9px] text-gray-400">
                  <Linkedin size={9} />{personalInfo.linkedin}
                </span>
              )}
              {personalInfo.website && (
                <span className="flex items-center gap-1 text-[9px] text-gray-400">
                  <Globe size={9} />{personalInfo.website}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-b" style={{ borderColor: primaryColor + '20', marginLeft: margin, marginRight: margin }} />

      {/* Two columns */}
      <div className="flex">
        {/* Main content - 60% */}
        <div className="w-[60%] py-4" style={{ paddingLeft: margin, paddingRight: '16px', display: 'flex', flexDirection: 'column', gap: sectionGap }}>
          {mainSections.map((section) => {
            const rendered = renderMainSection(section.type, section.title);
            return rendered ? <div key={section.id}>{rendered}</div> : null;
          })}
        </div>

        {/* Sidebar - 40% */}
        <div
          className="w-[40%] py-4"
          style={{
            paddingLeft: '16px',
            paddingRight: margin,
            backgroundColor: primaryColor + '08',
            display: 'flex',
            flexDirection: 'column',
            gap: sectionGap,
          }}
        >
          {sidebarSections.map((section) => {
            const rendered = renderSidebarSection(section.type, section.title);
            return rendered ? <div key={section.id}>{rendered}</div> : null;
          })}
        </div>
      </div>
    </div>
  );
}
