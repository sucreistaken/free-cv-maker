import { useCVStore } from '../../store/useCVStore';
import { Textarea } from '../ui/Textarea';

export function SummaryForm() {
  const { summary, updateSummary } = useCVStore();

  return (
    <Textarea
      label="Professional Summary"
      value={summary}
      onChange={(e) => updateSummary(e.target.value)}
      rows={5}
      placeholder="Write a brief professional summary..."
    />
  );
}
