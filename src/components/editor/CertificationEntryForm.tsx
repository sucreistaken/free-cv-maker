import { useCVStore } from '../../store/useCVStore';
import { FormField } from './shared/FormField';
import { Textarea } from '../ui/Textarea';
import type { CertificationEntry } from '../../types/cv';

interface Props {
  entry: CertificationEntry;
}

export function CertificationEntryForm({ entry }: Props) {
  const updateCertification = useCVStore((s) => s.updateCertification);

  return (
    <div className="space-y-2">
      <FormField label="Certification Name" value={entry.name} onChange={(v) => updateCertification(entry.id, 'name', v)} />
      <FormField label="Issuer" value={entry.issuer} onChange={(v) => updateCertification(entry.id, 'issuer', v)} placeholder="e.g. harvard.edu" />
      <FormField label="Year" value={entry.year} onChange={(v) => updateCertification(entry.id, 'year', v)} />
      <Textarea
        label="Description"
        value={entry.description}
        onChange={(e) => updateCertification(entry.id, 'description', e.target.value)}
        rows={3}
      />
    </div>
  );
}
