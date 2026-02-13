import type { AwardEntry } from '../../../types/cv';

interface AwardsBlockProps {
  entries: AwardEntry[];
}

export function AwardsBlock({ entries }: AwardsBlockProps) {
  return (
    <div className="space-y-2.5">
      {entries.map((entry) => (
        <div key={entry.id} className="break-inside-avoid">
          <div className="flex justify-between items-baseline">
            <h3 className="text-[11.5px] font-bold text-gray-800">{entry.title}</h3>
          </div>
          <p className="text-[10.5px] text-gray-500">
            {entry.issuer}{entry.year ? ` \u2022 ${entry.year}` : ''}
          </p>
          {entry.description && (
            <ul className="mt-1">
              <li className="text-[10.5px] text-gray-700 flex">
                <span className="mr-1.5 shrink-0">&bull;</span>
                <span>{entry.description}</span>
              </li>
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
