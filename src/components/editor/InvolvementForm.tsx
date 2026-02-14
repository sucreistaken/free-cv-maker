import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCVStore } from '../../store/useCVStore';
import { InvolvementEntryForm } from './InvolvementEntryForm';
import { EntryCard } from './shared/EntryCard';
import { SortableList } from './SectionReorder';

export function InvolvementForm() {
  const { t } = useTranslation();
  const { involvement, addInvolvement, removeInvolvement, reorderInvolvement } = useCVStore();

  return (
    <div className="space-y-2">
      <SortableList
        items={involvement}
        onReorder={reorderInvolvement}
        renderItem={(entry, dragHandleProps) => (
          <EntryCard
            title={entry.role}
            subtitle={entry.organization}
            onRemove={() => removeInvolvement(entry.id)}
            dragHandleProps={dragHandleProps}
          >
            <InvolvementEntryForm entry={entry} />
          </EntryCard>
        )}
      />
      <button
        type="button"
        onClick={addInvolvement}
        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark font-medium w-full justify-center py-2 border border-dashed border-gray-300 rounded-lg hover:border-primary/50 transition-colors"
      >
        <Plus size={16} />
        {t('involvementForm.add')}
      </button>
    </div>
  );
}
