import { useTranslation } from 'react-i18next';
import { useCVStore } from '../../store/useCVStore';
import { FormField } from './shared/FormField';
import { DateRangeField } from './shared/DateRangeField';
import { BulletListEditor } from './shared/BulletListEditor';
import type { InvolvementEntry } from '../../types/cv';

interface Props {
  entry: InvolvementEntry;
}

export function InvolvementEntryForm({ entry }: Props) {
  const { t } = useTranslation();
  const updateInvolvement = useCVStore((s) => s.updateInvolvement);

  return (
    <div className="space-y-2">
      <FormField label={t('involvementForm.role')} value={entry.role} onChange={(v) => updateInvolvement(entry.id, 'role', v)} />
      <FormField label={t('involvementForm.organization')} value={entry.organization} onChange={(v) => updateInvolvement(entry.id, 'organization', v)} />
      <FormField label={t('involvementForm.institution')} value={entry.institution} onChange={(v) => updateInvolvement(entry.id, 'institution', v)} />
      <DateRangeField
        startDate={entry.startDate}
        endDate={entry.endDate}
        onStartChange={(v) => updateInvolvement(entry.id, 'startDate', v)}
        onEndChange={(v) => updateInvolvement(entry.id, 'endDate', v)}
      />
      <BulletListEditor bullets={entry.bullets} onChange={(bullets) => updateInvolvement(entry.id, 'bullets', bullets)} />
    </div>
  );
}
