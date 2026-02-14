import { useTranslation } from 'react-i18next';
import { useCVStore } from '../../store/useCVStore';
import { FormField } from './shared/FormField';
import { DateRangeField } from './shared/DateRangeField';
import { BulletListEditor } from './shared/BulletListEditor';
import type { ExperienceEntry } from '../../types/cv';

interface Props {
  entry: ExperienceEntry;
}

export function ExperienceEntryForm({ entry }: Props) {
  const { t } = useTranslation();
  const updateExperience = useCVStore((s) => s.updateExperience);

  return (
    <div className="space-y-2">
      <FormField label={t('experienceForm.jobTitle')} value={entry.title} onChange={(v) => updateExperience(entry.id, 'title', v)} />
      <FormField label={t('experienceForm.company')} value={entry.company} onChange={(v) => updateExperience(entry.id, 'company', v)} />
      <FormField label={t('experienceForm.location')} value={entry.location} onChange={(v) => updateExperience(entry.id, 'location', v)} />
      <DateRangeField
        startDate={entry.startDate}
        endDate={entry.endDate}
        onStartChange={(v) => updateExperience(entry.id, 'startDate', v)}
        onEndChange={(v) => updateExperience(entry.id, 'endDate', v)}
      />
      <BulletListEditor bullets={entry.bullets} onChange={(bullets) => updateExperience(entry.id, 'bullets', bullets)} />
    </div>
  );
}
