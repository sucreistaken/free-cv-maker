import { useTranslation } from 'react-i18next';
import { useCVStore } from '../../store/useCVStore';
import { FormField } from './shared/FormField';
import type { ReferenceEntry } from '../../types/cv';

interface Props {
  entry: ReferenceEntry;
}

export function ReferenceEntryForm({ entry }: Props) {
  const { t } = useTranslation();
  const updateReference = useCVStore((s) => s.updateReference);

  return (
    <div className="space-y-2">
      <FormField label={t('referencesForm.name')} value={entry.name} onChange={(v) => updateReference(entry.id, 'name', v)} />
      <FormField label={t('referencesForm.title')} value={entry.title} onChange={(v) => updateReference(entry.id, 'title', v)} placeholder={t('referencesForm.titlePlaceholder')} />
      <FormField label={t('referencesForm.company')} value={entry.company} onChange={(v) => updateReference(entry.id, 'company', v)} />
      <FormField label={t('referencesForm.email')} value={entry.email} onChange={(v) => updateReference(entry.id, 'email', v)} type="email" />
      <FormField label={t('referencesForm.phone')} value={entry.phone} onChange={(v) => updateReference(entry.id, 'phone', v)} />
    </div>
  );
}
