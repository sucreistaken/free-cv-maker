import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCVStore } from '../../store/useCVStore';
import { EducationEntryForm } from './EducationEntryForm';
import { EntryCard } from './shared/EntryCard';
import { SortableList } from './SectionReorder';

export function EducationForm() {
  const { t } = useTranslation();
  const { education, addEducation, removeEducation, reorderEducation } = useCVStore();

  return (
    <div className="space-y-2">
      <SortableList
        items={education}
        onReorder={reorderEducation}
        renderItem={(entry, dragHandleProps) => (
          <EntryCard
            title={entry.degree}
            subtitle={entry.institution}
            onRemove={() => removeEducation(entry.id)}
            dragHandleProps={dragHandleProps}
          >
            <EducationEntryForm entry={entry} />
          </EntryCard>
        )}
      />
      <button
        type="button"
        onClick={addEducation}
        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark font-medium w-full justify-center py-2 border border-dashed border-gray-300 rounded-lg hover:border-primary/50 transition-colors"
      >
        <Plus size={16} />
        {t('educationForm.add')}
      </button>
    </div>
  );
}
