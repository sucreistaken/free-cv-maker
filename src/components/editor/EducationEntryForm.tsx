import { useTranslation } from 'react-i18next';
import { useCVStore } from '../../store/useCVStore';
import { FormField } from './shared/FormField';
import type { EducationEntry } from '../../types/cv';

interface Props {
  entry: EducationEntry;
}

export function EducationEntryForm({ entry }: Props) {
  const { t } = useTranslation();
  const updateEducation = useCVStore((s) => s.updateEducation);

  return (
    <div className="space-y-2">
      <FormField label={t('educationForm.degree')} value={entry.degree} onChange={(v) => updateEducation(entry.id, 'degree', v)} />
      <FormField label={t('educationForm.institution')} value={entry.institution} onChange={(v) => updateEducation(entry.id, 'institution', v)} />
      <FormField label={t('educationForm.year')} value={entry.year} onChange={(v) => updateEducation(entry.id, 'year', v)} placeholder={t('educationForm.yearPlaceholder')} />
    </div>
  );
}
