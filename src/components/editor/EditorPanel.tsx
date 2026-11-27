import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
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
import { CustomSectionForm } from './CustomSectionForm';
import { cleanSectionTitle, isDefaultSectionTitle } from '../../utils/sections';
import type { BuiltInSectionType, CVSection } from '../../types/cv';

const sectionForms: Record<BuiltInSectionType, React.ComponentType> = {
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

/** `showTheme` is off in the A2C embed, where the Europass look is fixed. */
export function EditorPanel({ showTheme = true }: { showTheme?: boolean } = {}) {
  const { t } = useTranslation();
  const { sections, toggleSectionVisibility, reorderSections, updateSectionTitle, addCustomSection } = useCVStore();
  const activeDocument = useAppStore((s) => s.activeDocument);
  const template = useAppStore((s) => s.template);
  // The section added last opens with its name selected so the user can type over it.
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const clearJustAdded = useCallback(() => setJustAddedId(null), []);

  if (activeDocument === 'coverLetter') {
    return (
      <div className="h-full overflow-y-auto custom-scrollbar bg-surface-alt">
        <ThemePanel />
        <CoverLetterForm />
      </div>
    );
  }

  const stockTitle = (section: CVSection) => t(`sections.${section.type}`);
  // Stock names are shown in the UI language; a name the user typed is shown as written.
  const label = (section: CVSection) =>
    isDefaultSectionTitle(section.type, section.title) ? stockTitle(section) : section.title;

  const addSection = () => {
    setJustAddedId(addCustomSection(t('sections.custom')));
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-surface-alt">
      <div className="p-4 space-y-3">
        {showTheme && <ThemePanel />}
        <SortableList
          items={sections}
          onReorder={reorderSections}
          renderItem={(section, dragHandleProps) => {
            const isCustom = section.type === 'custom';
            const FormComponent = isCustom ? null : sectionForms[section.type as BuiltInSectionType];
            return (
              <SectionAccordion
                sectionId={section.id}
                title={label(section)}
                visible={section.visible}
                onToggleVisibility={() => toggleSectionVisibility(section.id)}
                dragHandleProps={dragHandleProps}
                defaultOpen={section.type === 'personalInfo'}
                startRenaming={section.id === justAddedId}
                onStartRenamingHandled={clearJustAdded}
                stockTitle={stockTitle(section)}
                // Templates never print a heading for personal info, so renaming it would change nothing.
                onRename={
                  section.type === 'personalInfo'
                    ? undefined
                    : (title) => updateSectionTitle(section.id, cleanSectionTitle(title, stockTitle(section)))
                }
                renameHint={template === 'europass' && !isCustom ? t('sectionAccordion.europassTitleHint') : undefined}
              >
                {FormComponent ? <FormComponent /> : <CustomSectionForm section={section} />}
              </SectionAccordion>
            );
          }}
        />
        <button
          type="button"
          onClick={addSection}
          className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark font-medium w-full justify-center py-2.5 border border-dashed border-gray-300 rounded-lg bg-white/60 hover:border-primary/50 transition-colors"
        >
          <Plus size={16} />
          {t('editorPanel.addSection')}
        </button>
      </div>
    </div>
  );
}
