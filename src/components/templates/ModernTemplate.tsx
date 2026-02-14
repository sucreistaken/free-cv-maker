import { MapPin, Mail, Phone, Linkedin, Globe, Flag, Car } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useCVStore } from '../../store/useCVStore';
import { useTemplateTheme } from '../../hooks/useTemplateTheme';
import { ExperienceBlock } from './shared/ExperienceBlock';
import { ProjectBlock } from './shared/ProjectBlock';
import { EducationBlock } from './shared/EducationBlock';
import { InvolvementBlock } from './shared/InvolvementBlock';
import { CertificationBlock } from './shared/CertificationBlock';
import { AwardsBlock } from './shared/AwardsBlock';
import { ReferencesBlock } from './shared/ReferencesBlock';
import type { LanguageEntry } from '../../types/cv';

const proficiencyLabels: Record<LanguageEntry['proficiency'], string> = {
  native: 'Native',
  fluent: 'Fluent',
  intermediate: 'Intermediate',
  beginner: 'Beginner',
};

export function ModernTemplate() {
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
  const { fontFamily, zoom, effectiveA4Height, lineHeight, margin, primaryColor, accentColor, titleTransform, sectionGap, photoSize, photoShape, photoVisible } = useTemplateTheme();

  const visibleSections = sections.filter((s) => s.visible);
  const sidebarTypes = new Set(['personalInfo', 'skills', 'languages']);
  const mainSections = visibleSections.filter((s) => !sidebarTypes.has(s.type));

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
    <div className="mb-2">
      <h2
        className="text-[13px] font-bold tracking-wider"
        style={{ color: primaryColor, textTransform: titleTransform }}
      >
        {title}
      </h2>
      <div className="border-b-2 mt-1" style={{ borderColor: accentColor, opacity: 0.3 }} />
    </div>
  );

  const renderMainSection = (type: string, title: string) => {
    switch (type) {
      case 'summary':
        return summary ? (
          <div>
            <SectionTitle title={title} />
            <p className="text-[10.5px] text-gray-700 leading-relaxed">{summary}</p>
          </div>
        ) : null;
      case 'experience':
        return experience.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            <ExperienceBlock entries={experience} />
          </div>
        ) : null;
      case 'projects':
        return projects.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            <ProjectBlock entries={projects} />
          </div>
        ) : null;
      case 'education':
        return education.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            <EducationBlock entries={education} />
          </div>
        ) : null;
      case 'involvement':
        return involvement.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            <InvolvementBlock entries={involvement} />
          </div>
        ) : null;
      case 'certifications':
        return certifications.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            <CertificationBlock entries={certifications} />
          </div>
        ) : null;
      case 'awards':
        return awards.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            <AwardsBlock entries={awards} />
          </div>
        ) : null;
      case 'hobbies':
        return hobbies ? (
          <div>
            <SectionTitle title={title} />
            <p className="text-[10.5px] text-gray-700 leading-relaxed">{hobbies}</p>
          </div>
        ) : null;
      case 'references':
        return references.length > 0 ? (
          <div>
            <SectionTitle title={title} />
            <ReferencesBlock entries={references} />
          </div>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="a4-page flex" style={{ fontFamily, zoom, lineHeight, minHeight: `${effectiveA4Height}px`, ['--a4-break-height' as string]: `${effectiveA4Height}px` }}>
      {/* Sidebar */}
      <div className="w-[220px] shrink-0 px-5 py-8 text-white" style={{ backgroundColor: primaryColor }}>
        {personalInfo.profilePhoto && photoVisible ? (
          <img src={personalInfo.profilePhoto} alt="Profile photo" className="object-cover mx-auto mb-4 border-2 border-white/30" style={{ width: photoSize, height: photoSize, borderRadius: photoShape }} />
        ) : (
          <div className="bg-white/20 mx-auto mb-4 flex items-center justify-center text-2xl font-bold" style={{ width: photoSize, height: photoSize, borderRadius: photoShape }}>
            {personalInfo.fullName.split(' ').map((n) => n[0]).join('')}
          </div>
        )}
        <h1 className="text-[16px] font-bold text-center mb-1">{personalInfo.fullName}</h1>
        {personalInfo.jobTitle && (
          <p className="text-[10px] text-center opacity-80 mb-6">{personalInfo.jobTitle}</p>
        )}
        {!personalInfo.jobTitle && <div className="mb-6" />}

        {/* Contact */}
        <div className="space-y-2 mb-6">
          <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-70">Contact</h3>
          {contactItems.map((item, i) => {
            const href = getHref(item.icon, item.value!);
            return (
              <div key={i} className="flex items-start gap-2 text-[9.5px] opacity-90">
                <item.icon size={10} className="mt-0.5 shrink-0" />
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="break-all hover:underline">{item.value}</a>
                ) : (
                  <span className="break-all">{item.value}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Skills */}
        {skills.length > 0 && visibleSections.some((s) => s.type === 'skills') && (
          <div className="space-y-2 mb-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-70">Skills</h3>
            {skills.map((cat) => (
              <div key={cat.id}>
                {cat.category && (
                  <p className="text-[9px] font-semibold uppercase tracking-wide opacity-70 mb-0.5">
                    {cat.category}
                  </p>
                )}
                <p className="text-[9.5px] opacity-90 leading-relaxed">{cat.items}</p>
              </div>
            ))}
          </div>
        )}

        {/* Languages in sidebar */}
        {languages.length > 0 && visibleSections.some((s) => s.type === 'languages') && (
          <div className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest opacity-70">Languages</h3>
            {languages.map((l) => (
              <div key={l.id} className="flex justify-between text-[9.5px] opacity-90">
                <span>{l.language}</span>
                <span className="opacity-70">{proficiencyLabels[l.proficiency]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 py-8" style={{ paddingLeft: margin, paddingRight: margin, display: 'flex', flexDirection: 'column', gap: sectionGap }}>
        {mainSections
          .filter((s) => s.type !== 'personalInfo')
          .map((section) => {
            const rendered = renderMainSection(section.type, section.title);
            return rendered ? <div key={section.id}>{rendered}</div> : null;
          })}
      </div>
    </div>
  );
}
