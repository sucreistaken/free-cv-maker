import { useTranslation } from 'react-i18next';
import { useCVStore } from '../../store/useCVStore';
import { FormField } from './shared/FormField';
import { Textarea } from '../ui/Textarea';
import type { AwardEntry } from '../../types/cv';

interface Props {
  entry: AwardEntry;
}

export function AwardEntryForm({ entry }: Props) {
  const { t } = useTranslation();
  const updateAward = useCVStore((s) => s.updateAward);

  return (
    <div className="space-y-2">
      <FormField label={t('awardsForm.title')} value={entry.title} onChange={(v) => updateAward(entry.id, 'title', v)} />
      <FormField label={t('awardsForm.issuer')} value={entry.issuer} onChange={(v) => updateAward(entry.id, 'issuer', v)} placeholder={t('awardsForm.issuerPlaceholder')} />
      <FormField label={t('awardsForm.year')} value={entry.year} onChange={(v) => updateAward(entry.id, 'year', v)} />
      <Textarea
        label={t('awardsForm.description')}
        value={entry.description}
        onChange={(e) => updateAward(entry.id, 'description', e.target.value)}
        rows={3}
      />
    </div>
  );
}
