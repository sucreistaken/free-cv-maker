import { useTranslation } from 'react-i18next';
import { useCVStore } from '../../store/useCVStore';
import { Textarea } from '../ui/Textarea';

export function SummaryForm() {
  const { t } = useTranslation();
  const { summary, updateSummary } = useCVStore();

  return (
    <Textarea
      label={t('summaryForm.label')}
      value={summary}
      onChange={(e) => updateSummary(e.target.value)}
      onValueChange={updateSummary}
      rows={5}
      placeholder={t('summaryForm.placeholder')}
    />
  );
}
