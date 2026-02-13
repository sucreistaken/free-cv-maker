import { useCVStore } from '../../store/useCVStore';
import { FormField } from './shared/FormField';
import type { EducationEntry } from '../../types/cv';

interface Props {
  entry: EducationEntry;
}

export function EducationEntryForm({ entry }: Props) {
  const updateEducation = useCVStore((s) => s.updateEducation);

  return (
    <div className="space-y-2">
      <FormField label="Degree / Field" value={entry.degree} onChange={(v) => updateEducation(entry.id, 'degree', v)} />
      <FormField label="Institution" value={entry.institution} onChange={(v) => updateEducation(entry.id, 'institution', v)} />
      <FormField label="Year" value={entry.year} onChange={(v) => updateEducation(entry.id, 'year', v)} placeholder="e.g. 2021" />
    </div>
  );
}
