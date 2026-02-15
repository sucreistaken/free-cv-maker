import type { EducationEntry } from '../../../types/cv';

interface EducationBlockProps {
  entries: EducationEntry[];
}

function formatDateRange(startDate?: string, year?: string): string {
  if (startDate && year) return `${startDate} – ${year}`;
  return year || startDate || '';
}

export function EducationBlock({ entries }: EducationBlockProps) {
  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const dateStr = formatDateRange(entry.startDate, entry.year);
        return (
          <div key={entry.id} className="break-inside-avoid">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-[11.5px] font-bold text-gray-800">{entry.degree}</h3>
              {dateStr && <span className="text-[10px] text-gray-500 shrink-0">{dateStr}</span>}
            </div>
            <p className="text-[10.5px] text-gray-600">
              {entry.institution}
              {entry.gpa && <span className="text-gray-500"> • GPA: {entry.gpa}</span>}
            </p>
          </div>
        );
      })}
    </div>
  );
}
