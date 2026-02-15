import { useTranslation } from 'react-i18next';
import { useCVStore } from '../../store/useCVStore';
import { FormField } from './shared/FormField';
import { Textarea } from '../ui/Textarea';
import type { CertificationEntry } from '../../types/cv';

interface Props {
  entry: CertificationEntry;
}

export function CertificationEntryForm({ entry }: Props) {
  const { t } = useTranslation();
  const updateCertification = useCVStore((s) => s.updateCertification);

  return (
    <div className="space-y-2">
      <FormField label={t('certificationsForm.name')} value={entry.name} onChange={(v) => updateCertification(entry.id, 'name', v)} />
      <FormField label={t('certificationsForm.issuer')} value={entry.issuer} onChange={(v) => updateCertification(entry.id, 'issuer', v)} placeholder={t('certificationsForm.issuerPlaceholder')} />
      <FormField label={t('certificationsForm.year')} value={entry.year} onChange={(v) => updateCertification(entry.id, 'year', v)} />
      <Textarea
        label={t('certificationsForm.description')}
        value={entry.description}
        onChange={(e) => updateCertification(entry.id, 'description', e.target.value)}
        onValueChange={(v) => updateCertification(entry.id, 'description', v)}
        rows={3}
      />
    </div>
  );
}
