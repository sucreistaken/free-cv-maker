import type { EducationEntry } from '../../../types/cv';

interface EducationBlockProps {
  entries: EducationEntry[];
}

export function EducationBlock({ entries }: EducationBlockProps) {
  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div key={entry.id} className="break-inside-avoid">
          <h3 className="text-[11.5px] font-bold text-gray-800">{entry.degree}</h3>
          <p className="text-[10.5px] text-gray-600">
            {entry.institution}{entry.year ? ` • ${entry.year}` : ''}
          </p>
        </div>
      ))}
    </div>
  );
}
