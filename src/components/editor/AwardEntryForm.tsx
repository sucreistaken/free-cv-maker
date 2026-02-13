import { useCVStore } from '../../store/useCVStore';
import { FormField } from './shared/FormField';
import { Textarea } from '../ui/Textarea';
import type { AwardEntry } from '../../types/cv';

interface Props {
  entry: AwardEntry;
}

export function AwardEntryForm({ entry }: Props) {
  const updateAward = useCVStore((s) => s.updateAward);

  return (
    <div className="space-y-2">
      <FormField label="Award Title" value={entry.title} onChange={(v) => updateAward(entry.id, 'title', v)} />
      <FormField label="Issuer" value={entry.issuer} onChange={(v) => updateAward(entry.id, 'issuer', v)} placeholder="e.g. Google" />
      <FormField label="Year" value={entry.year} onChange={(v) => updateAward(entry.id, 'year', v)} />
      <Textarea
        label="Description"
        value={entry.description}
        onChange={(e) => updateAward(entry.id, 'description', e.target.value)}
        rows={3}
      />
    </div>
  );
}
