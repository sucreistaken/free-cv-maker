import { useCVStore } from '../../store/useCVStore';
import { FormField } from './shared/FormField';
import type { ReferenceEntry } from '../../types/cv';

interface Props {
  entry: ReferenceEntry;
}

export function ReferenceEntryForm({ entry }: Props) {
  const updateReference = useCVStore((s) => s.updateReference);

  return (
    <div className="space-y-2">
      <FormField label="Name" value={entry.name} onChange={(v) => updateReference(entry.id, 'name', v)} />
      <FormField label="Title" value={entry.title} onChange={(v) => updateReference(entry.id, 'title', v)} placeholder="e.g. Senior Developer" />
      <FormField label="Company" value={entry.company} onChange={(v) => updateReference(entry.id, 'company', v)} />
      <FormField label="Email" value={entry.email} onChange={(v) => updateReference(entry.id, 'email', v)} type="email" />
      <FormField label="Phone" value={entry.phone} onChange={(v) => updateReference(entry.id, 'phone', v)} />
    </div>
  );
}
