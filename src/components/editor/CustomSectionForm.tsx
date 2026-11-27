import { Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCVStore } from '../../store/useCVStore';
import { toast } from '../ui/Toast';
import { removeCustomEntryWithUndo } from '../../utils/undoRemove';
import { EntryCard } from './shared/EntryCard';
import { FormField } from './shared/FormField';
import { DateRangeField } from './shared/DateRangeField';
import { BulletListEditor } from './shared/BulletListEditor';
import { SortableList } from './SectionReorder';
import type { CVSection } from '../../types/cv';

/** Editor for a section the user added: free entries plus a way to delete the whole section. */
export function CustomSectionForm({ section }: { section: CVSection }) {
  const { t } = useTranslation();
  const {
    addCustomEntry,
    updateCustomEntry,
    reorderCustomEntries,
    removeCustomSection,
    restoreSection,
  } = useCVStore();
  const items = section.items ?? [];

  const deleteSection = () => {
    const index = useCVStore.getState().sections.findIndex((s) => s.id === section.id);
    removeCustomSection(section.id);
    toast('info', t('customSectionForm.removed', { title: section.title }), {
      duration: 8000,
      action: { label: t('customSectionForm.undo'), onClick: () => restoreSection(section, index) },
    });
  };

  return (
    <div className="space-y-2">
      <SortableList
        items={items}
        onReorder={(entries) => reorderCustomEntries(section.id, entries)}
        renderItem={(entry, dragHandleProps) => (
          <EntryCard
            title={entry.title}
            subtitle={entry.subtitle}
            onRemove={() => removeCustomEntryWithUndo(section.id, entry.id)}
            dragHandleProps={dragHandleProps}
          >
            <FormField
              label={t('customSectionForm.title')}
              value={entry.title}
              placeholder={t('customSectionForm.titlePlaceholder')}
              onChange={(v) => updateCustomEntry(section.id, entry.id, 'title', v)}
            />
            <FormField
              label={t('customSectionForm.subtitle')}
              value={entry.subtitle}
              placeholder={t('customSectionForm.subtitlePlaceholder')}
              onChange={(v) => updateCustomEntry(section.id, entry.id, 'subtitle', v)}
            />
            <DateRangeField
              startDate={entry.startDate}
              endDate={entry.endDate}
              onStartChange={(v) => updateCustomEntry(section.id, entry.id, 'startDate', v)}
              onEndChange={(v) => updateCustomEntry(section.id, entry.id, 'endDate', v)}
            />
            <BulletListEditor
              bullets={entry.bullets}
              onChange={(bullets) => updateCustomEntry(section.id, entry.id, 'bullets', bullets)}
            />
          </EntryCard>
        )}
      />
      <button
        type="button"
        onClick={() => addCustomEntry(section.id)}
        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark font-medium w-full justify-center py-2 border border-dashed border-gray-300 rounded-lg hover:border-primary/50 transition-colors"
      >
        <Plus size={16} />
        {t('customSectionForm.add')}
      </button>
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={deleteSection}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 px-1 py-0.5 rounded transition-colors"
        >
          <Trash2 size={12} />
          {t('customSectionForm.removeSection')}
        </button>
      </div>
    </div>
  );
}
