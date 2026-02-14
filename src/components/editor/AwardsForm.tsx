import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCVStore } from '../../store/useCVStore';
import { AwardEntryForm } from './AwardEntryForm';
import { EntryCard } from './shared/EntryCard';
import { SortableList } from './SectionReorder';

export function AwardsForm() {
  const { t } = useTranslation();
  const { awards, addAward, removeAward, reorderAwards } = useCVStore();

  return (
    <div className="space-y-2">
      <SortableList
        items={awards}
        onReorder={reorderAwards}
        renderItem={(entry, dragHandleProps) => (
          <EntryCard
            title={entry.title}
            subtitle={entry.issuer}
            onRemove={() => removeAward(entry.id)}
            dragHandleProps={dragHandleProps}
          >
            <AwardEntryForm entry={entry} />
          </EntryCard>
        )}
      />
      <button
        type="button"
        onClick={addAward}
        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark font-medium w-full justify-center py-2 border border-dashed border-gray-300 rounded-lg hover:border-primary/50 transition-colors"
      >
        <Plus size={16} />
        {t('awardsForm.add')}
      </button>
    </div>
  );
}
