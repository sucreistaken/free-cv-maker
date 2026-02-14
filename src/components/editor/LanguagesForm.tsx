import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCVStore } from '../../store/useCVStore';
import { LanguageEntryForm } from './LanguageEntryForm';
import { EntryCard } from './shared/EntryCard';
import { SortableList } from './SectionReorder';

export function LanguagesForm() {
  const { t } = useTranslation();
  const { languages, addLanguage, removeLanguage, reorderLanguages } = useCVStore();

  return (
    <div className="space-y-2">
      <SortableList
        items={languages}
        onReorder={reorderLanguages}
        renderItem={(entry, dragHandleProps) => (
          <EntryCard
            title={entry.language}
            subtitle={entry.proficiency}
            onRemove={() => removeLanguage(entry.id)}
            dragHandleProps={dragHandleProps}
          >
            <LanguageEntryForm entry={entry} />
          </EntryCard>
        )}
      />
      <button
        type="button"
        onClick={addLanguage}
        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark font-medium w-full justify-center py-2 border border-dashed border-gray-300 rounded-lg hover:border-primary/50 transition-colors"
      >
        <Plus size={16} />
        {t('languagesForm.add')}
      </button>
    </div>
  );
}
