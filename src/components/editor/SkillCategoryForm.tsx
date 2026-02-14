import { useTranslation } from 'react-i18next';
import { useCVStore } from '../../store/useCVStore';
import { FormField } from './shared/FormField';
import type { SkillCategory } from '../../types/cv';

interface Props {
  entry: SkillCategory;
}

export function SkillCategoryForm({ entry }: Props) {
  const { t } = useTranslation();
  const updateSkillCategory = useCVStore((s) => s.updateSkillCategory);

  return (
    <div className="space-y-2">
      <FormField label={t('skillsForm.category')} value={entry.category} onChange={(v) => updateSkillCategory(entry.id, 'category', v)} placeholder={t('skillsForm.categoryPlaceholder')} />
      <FormField label={t('skillsForm.skills')} value={entry.items} onChange={(v) => updateSkillCategory(entry.id, 'items', v)} placeholder={t('skillsForm.skillsPlaceholder')} />
    </div>
  );
}
