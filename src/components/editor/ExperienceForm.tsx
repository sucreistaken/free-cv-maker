import { Plus } from 'lucide-react';
import { useCVStore } from '../../store/useCVStore';
import { ExperienceEntryForm } from './ExperienceEntryForm';
import { EntryCard } from './shared/EntryCard';
import { SortableList } from './SectionReorder';

export function ExperienceForm() {
  const { experience, addExperience, removeExperience, reorderExperience } = useCVStore();

  return (
    <div className="space-y-2">
      <SortableList
        items={experience}
        onReorder={reorderExperience}
        renderItem={(entry, dragHandleProps) => (
          <EntryCard
            title={entry.title}
            subtitle={entry.company}
            onRemove={() => removeExperience(entry.id)}
            dragHandleProps={dragHandleProps}
          >
            <ExperienceEntryForm entry={entry} />
          </EntryCard>
        )}
      />
      <button
        type="button"
        onClick={addExperience}
        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark font-medium w-full justify-center py-2 border border-dashed border-gray-300 rounded-lg hover:border-primary/50 transition-colors"
      >
        <Plus size={16} />
        Add Experience
      </button>
    </div>
  );
}
