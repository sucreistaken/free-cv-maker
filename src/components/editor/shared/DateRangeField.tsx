import { Input } from '../../ui/Input';

interface DateRangeFieldProps {
  startDate: string;
  endDate: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}

export function DateRangeField({ startDate, endDate, onStartChange, onEndChange }: DateRangeFieldProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Input
        label="Start Date"
        value={startDate}
        onChange={(e) => onStartChange(e.target.value)}
        placeholder="e.g. Jan 2024"
      />
      <Input
        label="End Date"
        value={endDate}
        onChange={(e) => onEndChange(e.target.value)}
        placeholder="e.g. Present"
      />
    </div>
  );
}
