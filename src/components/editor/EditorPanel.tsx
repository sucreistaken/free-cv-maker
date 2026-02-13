import { useCVStore } from '../../store/useCVStore';
import { useAppStore } from '../../store/useAppStore';
import { SectionAccordion } from './SectionAccordion';
import { SortableList } from './SectionReorder';
import { PersonalInfoForm } from './PersonalInfoForm';
import { SummaryForm } from './SummaryForm';
import { ExperienceForm } from './ExperienceForm';
import { ProjectsForm } from './ProjectsForm';
import { EducationForm } from './EducationForm';
import { InvolvementForm } from './InvolvementForm';
import { SkillsForm } from './SkillsForm';
import { CertificationsForm } from './CertificationsForm';
import { LanguagesForm } from './LanguagesForm';
import { AwardsForm } from './AwardsForm';
import { HobbiesForm } from './HobbiesForm';
import { ReferencesForm } from './ReferencesForm';
import { ThemePanel } from './ThemePanel';
import { CoverLetterForm } from './CoverLetterForm';
import type { SectionType } from '../../types/cv';

const sectionForms: Record<SectionType, React.ComponentType> = {
  personalInfo: PersonalInfoForm,
  summary: SummaryForm,
  experience: ExperienceForm,
  projects: ProjectsForm,
  education: EducationForm,
  involvement: InvolvementForm,
  skills: SkillsForm,
  certifications: CertificationsForm,
  languages: LanguagesForm,
  awards: AwardsForm,
  hobbies: HobbiesForm,
  references: ReferencesForm,
};

export function EditorPanel() {
  const { sections, toggleSectionVisibility, reorderSections } = useCVStore();
  const activeDocument = useAppStore((s) => s.activeDocument);

  if (activeDocument === 'coverLetter') {
    return (
      <div className="h-full overflow-y-auto custom-scrollbar bg-surface-alt">
        <ThemePanel />
        <CoverLetterForm />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-surface-alt">
      <div className="p-4 space-y-3">
        <ThemePanel />
        <SortableList
          items={sections}
          onReorder={reorderSections}
          renderItem={(section, dragHandleProps) => {
            const FormComponent = sectionForms[section.type];
            return (
              <SectionAccordion
                title={section.title}
                visible={section.visible}
                onToggleVisibility={() => toggleSectionVisibility(section.id)}
                dragHandleProps={dragHandleProps}
                defaultOpen={section.type === 'personalInfo'}
              >
                <FormComponent />
              </SectionAccordion>
            );
          }}
        />
      </div>
    </div>
  );
}
