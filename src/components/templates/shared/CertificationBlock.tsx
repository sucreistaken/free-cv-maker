import type { CertificationEntry } from '../../../types/cv';

interface CertificationBlockProps {
  entries: CertificationEntry[];
}

export function CertificationBlock({ entries }: CertificationBlockProps) {
  return (
    <div className="space-y-2.5">
      {entries.map((entry) => (
        <div key={entry.id} className="break-inside-avoid">
          <div className="flex justify-between items-baseline">
            <h3 className="text-[11.5px] font-bold text-gray-800">{entry.name}</h3>
          </div>
          <p className="text-[10.5px] text-gray-500">
            {entry.issuer}{entry.year ? ` • ${entry.year}` : ''}
          </p>
          {entry.description && (
            <ul className="mt-1">
              <li className="text-[10.5px] text-gray-700 flex">
                <span className="mr-1.5 shrink-0">•</span>
                <span>{entry.description}</span>
              </li>
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
