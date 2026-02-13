import type { InvolvementEntry } from '../../../types/cv';

interface InvolvementBlockProps {
  entries: InvolvementEntry[];
}

export function InvolvementBlock({ entries }: InvolvementBlockProps) {
  return (
    <div className="space-y-2.5">
      {entries.map((entry) => (
        <div key={entry.id} className="break-inside-avoid">
          <div className="flex justify-between items-baseline">
            <h3 className="text-[11.5px] font-bold text-gray-800">{entry.role}</h3>
            <span className="text-[10px] text-gray-600 shrink-0 ml-2">
              {entry.startDate}{entry.endDate ? ` - ${entry.endDate}` : ''}
            </span>
          </div>
          <p className="text-[10.5px] text-gray-600">
            {entry.institution}{entry.organization ? ` • ${entry.organization}` : ''}
          </p>
          {entry.bullets.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {entry.bullets.filter(b => b).map((bullet, i) => (
                <li key={i} className="text-[10.5px] text-gray-700 flex">
                  <span className="mr-1.5 shrink-0">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
