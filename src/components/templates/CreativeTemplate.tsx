import { MapPin, Mail, Phone, Linkedin, Globe, Flag, Car } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCVStore } from '../../store/useCVStore';
import { useTemplateTheme } from '../../hooks/useTemplateTheme';
import type { ExperienceEntry, ProjectEntry, InvolvementEntry, CertificationEntry, AwardEntry, LanguageEntry, ReferenceEntry } from '../../types/cv';

const proficiencyLabels: Record<LanguageEntry['proficiency'], string> = {
  native: 'Native',
  fluent: 'Fluent',
  intermediate: 'Intermediate',
  beginner: 'Beginner',
};

export function CreativeTemplate() {
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
  const { fontFamily, zoom, effectiveA4Height, lineHeight, margin, accentColor, titleTransform, sectionGap, photoSize, photoShape, photoVisible } = useTemplateTheme();

  const visibleSections = sections.filter((s) => s.visible);

  const getHref = (icon: LucideIcon, value: string): string | null => {
    if (icon === Mail) return `mailto:${value}`;
    if (icon === Phone) return `tel:${value}`;
    if (icon === Linkedin || icon === Globe) return value.startsWith('http') ? value : `https://${value}`;
    return null;
  };

  const contactItems = [
    { icon: MapPin, value: personalInfo.location },
    { icon: Mail, value: personalInfo.email },
    { icon: Phone, value: personalInfo.phone },
    { icon: Linkedin, value: personalInfo.linkedin },
    { icon: Globe, value: personalInfo.website },
    { icon: Flag, value: personalInfo.nationality },
    { icon: Car, value: personalInfo.drivingLicense ? `License: ${personalInfo.drivingLicense}` : '' },
  ].filter((item) => item.value);

  const SectionTitle = ({ title }: { title: string }) => (
    <div className="flex items-center gap-2 mb-2">
      <div className="w-1 h-5 rounded-full" style={{ backgroundColor: accentColor }} />
      <h2
        className="text-[13px] font-bold tracking-wider text-gray-800"
        style={{ textTransform: titleTransform }}
      >
        {title}
      </h2>
    </div>
  );

  const BulletList = ({ bullets }: { bullets: string[] }) => (
    <ul className="mt-1 space-y-0.5">
      {bullets.filter(Boolean).map((b, i) => (
        <li key={i} className="text-[10.5px] text-gray-700 flex">
          <span className="mr-1.5 shrink-0" style={{ color: accentColor }}>&#9656;</span>
          <span>{b}</span>
        </li>
      ))}
    </ul>
  );

  const TimelineEntry = ({
    date,
    children,
  }: {
    date: string;
    children: React.ReactNode;
  }) => (
    <div className="flex gap-4">
      <div className="w-[90px] shrink-0 text-right">
        <span className="text-[9px] text-gray-400 leading-tight">{date}</span>
      </div>
      <div className="relative flex-1 pb-3 border-l-2 pl-4" style={{ borderColor: accentColor + '30' }}>
        <div
          className="absolute -left-[5px] top-1 w-2 h-2 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
        {children}
      </div>
    </div>
  );

  const renderSection = (type: string, title: string) => {
    switch (type) {
      case 'summary':
        return summary ? (
          <div>
            <SectionTitle title={title} />
            <p className="text-[10.5px] text-gray-700 leading-relaxed pl-3 border-l-2" style={{ borderColor: accentColor + '40' }}>
              {summary}
            </p>
          </div>
        ) : null;
      case 'experience':
        return experience.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            {experience.map((e: ExperienceEntry) => (
              <TimelineEntry
                key={e.id}
                date={`${e.startDate}${e.endDate ? ` - ${e.endDate}` : ''}`}
              >
                <h3 className="text-[11.5px] font-bold text-gray-800">{e.title}</h3>
                <p className="text-[10px] text-gray-500">{e.company}{e.location ? `, ${e.location}` : ''}</p>
                <BulletList bullets={e.bullets} />
              </TimelineEntry>
            ))}
          </div>
        ) : null;
      case 'projects':
        return projects.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            {projects.map((p: ProjectEntry) => (
              <TimelineEntry key={p.id} date={p.date || ''}>
                <h3 className="text-[11.5px] font-bold text-gray-800">{p.name}</h3>
                {p.link && <a href={p.link.startsWith('http') ? p.link : `https://${p.link}`} target="_blank" rel="noopener noreferrer" className="text-[9.5px] hover:underline block" style={{ color: accentColor }}>{p.link}</a>}
                <BulletList bullets={p.bullets} />
              </TimelineEntry>
            ))}
          </div>
        ) : null;
      case 'education':
        return education.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            {education.map((e) => (
              <TimelineEntry key={e.id} date={e.year || ''}>
                <h3 className="text-[11.5px] font-bold text-gray-800">{e.degree}</h3>
                <p className="text-[10px] text-gray-500">{e.institution}</p>
              </TimelineEntry>
            ))}
          </div>
        ) : null;
      case 'involvement':
        return involvement.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            {involvement.map((inv: InvolvementEntry) => (
              <TimelineEntry
                key={inv.id}
                date={`${inv.startDate}${inv.endDate ? ` - ${inv.endDate}` : ''}`}
              >
                <h3 className="text-[11.5px] font-bold text-gray-800">{inv.role}</h3>
                <p className="text-[10px] text-gray-500">{inv.institution}{inv.organization ? ` · ${inv.organization}` : ''}</p>
                <BulletList bullets={inv.bullets} />
              </TimelineEntry>
            ))}
          </div>
        ) : null;
      case 'skills':
        return skills.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            <div className="flex flex-wrap gap-1.5 pl-3">
              {skills.map((cat) =>
                cat.items.split(',').map((item, i) => (
                  <span
                    key={`${cat.id}-${i}`}
                    className="px-2 py-0.5 rounded-full text-[9px] font-medium"
                    style={{
                      backgroundColor: accentColor + '15',
                      color: accentColor,
                      border: `1px solid ${accentColor}30`,
                    }}
                  >
                    {item.trim()}
                  </span>
                ))
              )}
            </div>
          </div>
        ) : null;
      case 'certifications':
        return certifications.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            {certifications.map((c: CertificationEntry) => (
              <TimelineEntry key={c.id} date={c.year || ''}>
                <h3 className="text-[11.5px] font-bold text-gray-800">{c.name}</h3>
                <p className="text-[9.5px] text-gray-400">{c.issuer}</p>
                {c.description && <BulletList bullets={[c.description]} />}
              </TimelineEntry>
            ))}
          </div>
        ) : null;
      case 'languages':
        return languages.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            <div className="flex flex-wrap gap-1.5 pl-3">
              {languages.map((l: LanguageEntry) => (
                <span
                  key={l.id}
                  className="px-2 py-0.5 rounded-full text-[9px] font-medium"
                  style={{
                    backgroundColor: accentColor + '15',
                    color: accentColor,
                    border: `1px solid ${accentColor}30`,
                  }}
                >
                  {l.language} — {proficiencyLabels[l.proficiency]}
                </span>
              ))}
            </div>
          </div>
        ) : null;
      case 'awards':
        return awards.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            {awards.map((a: AwardEntry) => (
              <TimelineEntry key={a.id} date={a.year || ''}>
                <h3 className="text-[11.5px] font-bold text-gray-800">{a.title}</h3>
                <p className="text-[9.5px] text-gray-400">{a.issuer}</p>
                {a.description && <BulletList bullets={[a.description]} />}
              </TimelineEntry>
            ))}
          </div>
        ) : null;
      case 'hobbies':
        return hobbies ? (
          <div>
            <SectionTitle title={title} />
            <p className="text-[10.5px] text-gray-700 leading-relaxed pl-3 border-l-2" style={{ borderColor: accentColor + '40' }}>
              {hobbies}
            </p>
          </div>
        ) : null;
      case 'references':
        return references.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            {references.map((r: ReferenceEntry) => (
              <div key={r.id} className="mb-2 pl-3">
                <h3 className="text-[11.5px] font-bold text-gray-800">{r.name}</h3>
                <p className="text-[10px] text-gray-500">{r.title}{r.company ? `, ${r.company}` : ''}</p>
                <div className="flex gap-3 mt-0.5 text-[9.5px] text-gray-400">
                  {r.email && <span>{r.email}</span>}
                  {r.phone && <span>{r.phone}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="a4-page" style={{ fontFamily, zoom, lineHeight, minHeight: `${effectiveA4Height}px`, ['--a4-break-height' as string]: `${effectiveA4Height}px` }}>
      {/* Banner Header */}
      <div style={{ paddingLeft: margin, paddingRight: margin, paddingTop: '24px', paddingBottom: '24px', backgroundColor: accentColor }} className="text-white">
        <div className="flex items-center gap-4">
          {personalInfo.profilePhoto && photoVisible && (
            <img src={personalInfo.profilePhoto} alt="Profile photo" className="object-cover border-2 border-white/40 shrink-0" style={{ width: photoSize, height: photoSize, borderRadius: photoShape }} />
          )}
          <div>
            <h1 className="text-[24px] font-bold">{personalInfo.fullName}</h1>
        {personalInfo.jobTitle && (
          <p className="text-[12px] opacity-85 mt-0.5">{personalInfo.jobTitle}</p>
        )}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {contactItems.map((item, i) => {
            const href = getHref(item.icon, item.value!);
            return href ? (
              <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[9.5px] opacity-90 hover:underline">
                <item.icon size={10} />
                {item.value}
              </a>
            ) : (
              <span key={i} className="flex items-center gap-1 text-[9.5px] opacity-90">
                <item.icon size={10} />
                {item.value}
              </span>
            );
          })}
        </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ paddingLeft: margin, paddingRight: margin, paddingTop: '24px', paddingBottom: '24px', display: 'flex', flexDirection: 'column', gap: sectionGap }}>
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
