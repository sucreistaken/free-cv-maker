import type { ExperienceEntry } from '../../../types/cv';
import { parseFormattedText } from '../../../utils/formatText';

interface ExperienceBlockProps {
  entries: ExperienceEntry[];
}

export function ExperienceBlock({ entries }: ExperienceBlockProps) {
  return (
    <div className="space-y-2.5">
      {entries.map((entry) => (
        <div key={entry.id} className="break-inside-avoid">
          <div className="flex justify-between items-baseline">
            <h3 className="text-[11.5px] font-bold text-gray-800">{entry.title}</h3>
            <span className="text-[10px] text-gray-600 shrink-0 ml-2">
              {entry.startDate}{entry.endDate ? ` - ${entry.endDate}` : ''}
              {entry.location ? `, ${entry.location}` : ''}
            </span>
          </div>
          <p className="text-[10.5px] text-gray-600">{entry.company}</p>
          {entry.bullets.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {entry.bullets.filter(b => b).map((bullet, i) => (
                <li key={`${bullet}-${i}`} className="text-[10.5px] text-gray-700 flex">
                  <span className="mr-1.5 shrink-0">•</span>
                  <span>{parseFormattedText(bullet)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
