import { useCVStore } from '../../store/useCVStore';
import { FormField } from './shared/FormField';
import type { SkillCategory } from '../../types/cv';

interface Props {
  entry: SkillCategory;
}

export function SkillCategoryForm({ entry }: Props) {
  const updateSkillCategory = useCVStore((s) => s.updateSkillCategory);

  return (
    <div className="space-y-2">
      <FormField label="Category" value={entry.category} onChange={(v) => updateSkillCategory(entry.id, 'category', v)} placeholder="e.g. Technical" />
      <FormField label="Skills (comma-separated)" value={entry.items} onChange={(v) => updateSkillCategory(entry.id, 'items', v)} placeholder="e.g. JavaScript, React, Node.js" />
    </div>
  );
}
