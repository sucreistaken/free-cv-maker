import type { ReferenceEntry } from '../../../types/cv';

interface ReferencesBlockProps {
  entries: ReferenceEntry[];
}

export function ReferencesBlock({ entries }: ReferencesBlockProps) {
  return (
    <div className="space-y-2.5">
      {entries.map((entry) => (
        <div key={entry.id} className="break-inside-avoid">
          <h3 className="text-[11.5px] font-bold text-gray-800">{entry.name}</h3>
          <p className="text-[10.5px] text-gray-500">
            {entry.title}{entry.company ? `, ${entry.company}` : ''}
          </p>
          <div className="flex gap-3 mt-0.5 text-[9.5px] text-gray-500">
            {entry.email && <span>{entry.email}</span>}
            {entry.phone && <span>{entry.phone}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
