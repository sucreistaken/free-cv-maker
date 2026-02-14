import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCVStore } from '../../store/useCVStore';
import { CertificationEntryForm } from './CertificationEntryForm';
import { EntryCard } from './shared/EntryCard';
import { SortableList } from './SectionReorder';

export function CertificationsForm() {
  const { t } = useTranslation();
  const { certifications, addCertification, removeCertification, reorderCertifications } = useCVStore();

  return (
    <div className="space-y-2">
      <SortableList
        items={certifications}
        onReorder={reorderCertifications}
        renderItem={(entry, dragHandleProps) => (
          <EntryCard
            title={entry.name}
            subtitle={entry.issuer}
            onRemove={() => removeCertification(entry.id)}
            dragHandleProps={dragHandleProps}
          >
            <CertificationEntryForm entry={entry} />
          </EntryCard>
        )}
      />
      <button
        type="button"
        onClick={addCertification}
        className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark font-medium w-full justify-center py-2 border border-dashed border-gray-300 rounded-lg hover:border-primary/50 transition-colors"
      >
        <Plus size={16} />
        {t('certificationsForm.add')}
      </button>
    </div>
  );
}
