import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCVStore } from '../../store/useCVStore';
import { LanguageEntryForm } from './LanguageEntryForm';
import { EntryCard } from './shared/EntryCard';
import { SortableList } from './SectionReorder';

export function LanguagesForm() {
  const { t } = useTranslation();
  const { languages, addLanguage, updateLanguage, removeLanguage, reorderLanguages } = useCVStore();

  // Common languages that are not on the CV yet, offered as one-click additions.
  const present = new Set(languages.map((l) => l.language.trim().toLocaleLowerCase()));
  const suggestions = (t('languagesForm.suggestions', { returnObjects: true }) as string[]).filter(
    (name) => !present.has(name.toLocaleLowerCase()),
  );

  const addNamed = (name: string) => {
    addLanguage();
    const added = useCVStore.getState().languages.at(-1);
    if (added) updateLanguage(added.id, 'language', name);
  };

  return (
    <div className="space-y-2">
      <SortableList
        items={languages}
        onReorder={reorderLanguages}
        renderItem={(entry, dragHandleProps) => (
          <EntryCard
            title={entry.language}
            subtitle={t(`languagesForm.${entry.proficiency}`)}
            onRemove={() => removeLanguage(entry.id)}
            dragHandleProps={dragHandleProps}
          >
            <LanguageEntryForm entry={entry} />
          </EntryCard>
        )}
      />
      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-500">{t('languagesForm.quickAdd')}</span>
          {suggestions.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => addNamed(name)}
              className="px-2 py-1 text-xs rounded-full border border-gray-300 text-gray-600 hover:border-primary hover:text-primary transition-colors"
            >
              + {name}
            </button>
          ))}
        </div>
      )}
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
