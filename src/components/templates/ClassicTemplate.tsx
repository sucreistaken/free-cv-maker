import { useCVStore } from '../../store/useCVStore';
import { useTemplateTheme } from '../../hooks/useTemplateTheme';
import { TemplateWrapper } from './TemplateWrapper';
import { SectionHeading } from './shared/SectionHeading';
import { ContactBar } from './shared/ContactBar';
import { ExperienceBlock } from './shared/ExperienceBlock';
import { ProjectBlock } from './shared/ProjectBlock';
import { EducationBlock } from './shared/EducationBlock';
import { InvolvementBlock } from './shared/InvolvementBlock';
import { SkillsBlock } from './shared/SkillsBlock';
import { CertificationBlock } from './shared/CertificationBlock';
import { LanguagesBlock } from './shared/LanguagesBlock';
import { AwardsBlock } from './shared/AwardsBlock';
import { ReferencesBlock } from './shared/ReferencesBlock';

export function ClassicTemplate() {
  const { primaryColor, accentColor, titleTransform, photoSize, photoShape, photoVisible } = useTemplateTheme();
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

  const renderSection = (type: string, title: string) => {
    switch (type) {
      case 'summary':
        return summary ? (
          <div>
            <SectionHeading title={title} color={primaryColor} textTransform={titleTransform} />
            <p className="text-[10.5px] text-gray-700 mt-2 leading-relaxed">{summary}</p>
          </div>
        ) : null;
      case 'experience':
        return experience.length > 0 ? (
          <div>
            <SectionHeading title={title} color={primaryColor} textTransform={titleTransform} />
            <div className="mt-2">
              <ExperienceBlock entries={experience} />
            </div>
          </div>
        ) : null;
      case 'projects':
        return projects.length > 0 ? (
          <div>
            <SectionHeading title={title} color={primaryColor} textTransform={titleTransform} />
            <div className="mt-2">
              <ProjectBlock entries={projects} />
            </div>
          </div>
        ) : null;
      case 'education':
        return education.length > 0 ? (
          <div>
            <SectionHeading title={title} color={primaryColor} textTransform={titleTransform} />
            <div className="mt-2">
              <EducationBlock entries={education} />
            </div>
          </div>
        ) : null;
      case 'involvement':
        return involvement.length > 0 ? (
          <div>
            <SectionHeading title={title} color={primaryColor} textTransform={titleTransform} />
            <div className="mt-2">
              <InvolvementBlock entries={involvement} />
            </div>
          </div>
        ) : null;
      case 'skills':
        return skills.length > 0 ? (
          <div>
            <SectionHeading title={title} color={primaryColor} textTransform={titleTransform} />
            <div className="mt-2">
              <SkillsBlock categories={skills} />
            </div>
          </div>
        ) : null;
      case 'certifications':
        return certifications.length > 0 ? (
          <div>
            <SectionHeading title={title} color={primaryColor} textTransform={titleTransform} />
            <div className="mt-2">
              <CertificationBlock entries={certifications} />
            </div>
          </div>
        ) : null;
      case 'languages':
        return languages.length > 0 ? (
          <div>
            <SectionHeading title={title} color={primaryColor} textTransform={titleTransform} />
            <div className="mt-2">
              <LanguagesBlock entries={languages} accentColor={accentColor} />
            </div>
          </div>
        ) : null;
      case 'awards':
        return awards.length > 0 ? (
          <div>
            <SectionHeading title={title} color={primaryColor} textTransform={titleTransform} />
            <div className="mt-2">
              <AwardsBlock entries={awards} />
            </div>
          </div>
        ) : null;
      case 'hobbies':
        return hobbies ? (
          <div>
            <SectionHeading title={title} color={primaryColor} textTransform={titleTransform} />
            <p className="text-[10.5px] text-gray-700 mt-2 leading-relaxed">{hobbies}</p>
          </div>
        ) : null;
      case 'references':
        return references.length > 0 ? (
          <div>
            <SectionHeading title={title} color={primaryColor} textTransform={titleTransform} />
            <div className="mt-2">
              <ReferencesBlock entries={references} />
            </div>
          </div>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <TemplateWrapper>
      {/* Header */}
      <div className="text-center mb-2">
        {personalInfo.profilePhoto && photoVisible && (
          <img src={personalInfo.profilePhoto} alt="Profile photo" className="object-cover mx-auto mb-2" style={{ width: photoSize, height: photoSize, borderRadius: photoShape }} />
        )}
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">
          {personalInfo.fullName}
        </h1>
        {personalInfo.jobTitle && (
          <p className="text-[12px] text-gray-600 mt-0.5">{personalInfo.jobTitle}</p>
        )}
        <div className="mt-1">
          <ContactBar info={personalInfo} iconColor={accentColor} />
        </div>
      </div>

      <div className="border-b border-gray-300 mb-3" />

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cv-section-gap, 12px)' }}>
        {visibleSections
          .filter((s) => s.type !== 'personalInfo')
          .map((section) => {
            const rendered = renderSection(section.type, section.title);
            return rendered ? <div key={section.id}>{rendered}</div> : null;
          })}
      </div>
    </TemplateWrapper>
  );
}
