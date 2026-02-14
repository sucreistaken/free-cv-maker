import { useTranslation } from 'react-i18next';
import { useCVStore } from '../../store/useCVStore';
import { FormField } from './shared/FormField';
import { BulletListEditor } from './shared/BulletListEditor';
import type { ProjectEntry } from '../../types/cv';

interface Props {
  entry: ProjectEntry;
}

export function ProjectEntryForm({ entry }: Props) {
  const { t } = useTranslation();
  const updateProject = useCVStore((s) => s.updateProject);

  return (
    <div className="space-y-2">
      <FormField label={t('projectsForm.projectName')} value={entry.name} onChange={(v) => updateProject(entry.id, 'name', v)} />
      <FormField label={t('projectsForm.link')} value={entry.link} onChange={(v) => updateProject(entry.id, 'link', v)} placeholder={t('projectsForm.linkPlaceholder')} />
      <FormField label={t('projectsForm.date')} value={entry.date} onChange={(v) => updateProject(entry.id, 'date', v)} placeholder={t('projectsForm.datePlaceholder')} />
      <BulletListEditor bullets={entry.bullets} onChange={(bullets) => updateProject(entry.id, 'bullets', bullets)} />
    </div>
  );
}
