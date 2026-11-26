import { useTranslation } from 'react-i18next';
import { useCVStore } from '../../store/useCVStore';
import { useAppStore } from '../../store/useAppStore';
import { FormField } from './shared/FormField';
import type { EducationEntry } from '../../types/cv';

interface Props {
  entry: EducationEntry;
}

export function EducationEntryForm({ entry }: Props) {
  const { t } = useTranslation();
  const updateEducation = useCVStore((s) => s.updateEducation);
  const isEuropass = useAppStore((s) => s.template === 'europass');

  return (
    <div className="space-y-2">
      <FormField label={t('educationForm.degree')} value={entry.degree} onChange={(v) => updateEducation(entry.id, 'degree', v)} />
      <FormField label={t('educationForm.institution')} value={entry.institution} onChange={(v) => updateEducation(entry.id, 'institution', v)} />
      <div className="grid grid-cols-3 gap-2">
        <FormField label={t('educationForm.startDate')} value={entry.startDate || ''} onChange={(v) => updateEducation(entry.id, 'startDate', v)} placeholder={t('educationForm.startDatePlaceholder')} />
        <FormField label={t('educationForm.year')} value={entry.year} onChange={(v) => updateEducation(entry.id, 'year', v)} placeholder={t('educationForm.yearPlaceholder')} />
        <FormField label={t('educationForm.gpa')} value={entry.gpa || ''} onChange={(v) => updateEducation(entry.id, 'gpa', v)} placeholder={t('educationForm.gpaPlaceholder')} />
      </div>
      {isEuropass && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <FormField label={t('educationForm.location')} value={entry.location ?? ''} onChange={(v) => updateEducation(entry.id, 'location', v)} placeholder={t('educationForm.locationPlaceholder')} />
          <FormField label={t('educationForm.website')} value={entry.website ?? ''} onChange={(v) => updateEducation(entry.id, 'website', v)} placeholder={t('educationForm.websitePlaceholder')} />
        </div>
      )}
    </div>
  );
}
