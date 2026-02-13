import { Plus } from 'lucide-react';
import { useCVStore } from '../../store/useCVStore';
import { ReferenceEntryForm } from './ReferenceEntryForm';
import { EntryCard } from './shared/EntryCard';
import { SortableList } from './SectionReorder';

export function ReferencesForm() {
  const { references, addReference, removeReference, reorderReferences } = useCVStore();

  return (
    <div className="space-y-2">
      <SortableList
        items={references}
        onReorder={reorderReferences}
        renderItem={(entry, dragHandleProps) => (
          <EntryCard
            title={entry.name}
            subtitle={entry.company}
            onRemove={() => removeReference(entry.id)}
            dragHandleProps={dragHandleProps}
          >
            <ReferenceEntryForm entry={entry} />
          </EntryCard>
        )}
      />
      <button
        type="button"
        onClick={addReference}
        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark font-medium w-full justify-center py-2 border border-dashed border-gray-300 rounded-lg hover:border-primary/50 transition-colors"
      >
        <Plus size={16} />
        Add Reference
      </button>
    </div>
  );
}
