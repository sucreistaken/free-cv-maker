import { useCVStore } from '../../store/useCVStore';
import { FormField } from './shared/FormField';
import { BulletListEditor } from './shared/BulletListEditor';
import type { ProjectEntry } from '../../types/cv';

interface Props {
  entry: ProjectEntry;
}

export function ProjectEntryForm({ entry }: Props) {
  const updateProject = useCVStore((s) => s.updateProject);

  return (
    <div className="space-y-2">
      <FormField label="Project Name" value={entry.name} onChange={(v) => updateProject(entry.id, 'name', v)} />
      <FormField label="Link" value={entry.link} onChange={(v) => updateProject(entry.id, 'link', v)} placeholder="e.g. github.com/user/repo" />
      <FormField label="Date" value={entry.date} onChange={(v) => updateProject(entry.id, 'date', v)} placeholder="e.g. Oct 2024 - Present" />
      <BulletListEditor bullets={entry.bullets} onChange={(bullets) => updateProject(entry.id, 'bullets', bullets)} />
    </div>
  );
}
