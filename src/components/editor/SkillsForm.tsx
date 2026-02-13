import { Plus } from 'lucide-react';
import { useCVStore } from '../../store/useCVStore';
import { SkillCategoryForm } from './SkillCategoryForm';
import { EntryCard } from './shared/EntryCard';
import { SortableList } from './SectionReorder';

export function SkillsForm() {
  const { skills, addSkillCategory, removeSkillCategory, reorderSkills } = useCVStore();

  return (
    <div className="space-y-2">
      <SortableList
        items={skills}
        onReorder={reorderSkills}
        renderItem={(entry, dragHandleProps) => (
          <EntryCard
            title={entry.category || 'Untitled Category'}
            onRemove={() => removeSkillCategory(entry.id)}
            dragHandleProps={dragHandleProps}
          >
            <SkillCategoryForm entry={entry} />
          </EntryCard>
        )}
      />
      <button
        type="button"
        onClick={addSkillCategory}
        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark font-medium w-full justify-center py-2 border border-dashed border-gray-300 rounded-lg hover:border-primary/50 transition-colors"
      >
        <Plus size={16} />
        Add Skill Category
      </button>
    </div>
  );
}
