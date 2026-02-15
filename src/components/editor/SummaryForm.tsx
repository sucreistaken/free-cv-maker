import { useTranslation } from 'react-i18next';
import { useCVStore } from '../../store/useCVStore';
import { Textarea } from '../ui/Textarea';

const RECOMMENDED_MAX = 400;

export function SummaryForm() {
  const { t } = useTranslation();
  const { summary, updateSummary } = useCVStore();
  const len = summary.length;
  const over = len > RECOMMENDED_MAX;

  return (
    <div>
      <Textarea
        label={t('summaryForm.label')}
        value={summary}
        onChange={(e) => updateSummary(e.target.value)}
        rows={5}
        placeholder={t('summaryForm.placeholder')}
      />
      <p className={`text-[11px] mt-1 text-right ${over ? 'text-amber-500' : 'text-gray-400'}`}>
        {len} / {RECOMMENDED_MAX}
      </p>
    </div>
  );
}
