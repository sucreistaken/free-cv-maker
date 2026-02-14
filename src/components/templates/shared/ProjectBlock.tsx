import type { ProjectEntry } from '../../../types/cv';

interface ProjectBlockProps {
  entries: ProjectEntry[];
}

export function ProjectBlock({ entries }: ProjectBlockProps) {
  return (
    <div className="space-y-2.5">
      {entries.map((entry) => (
        <div key={entry.id} className="break-inside-avoid">
          <div className="flex justify-between items-baseline">
            <h3 className="text-[11.5px] font-bold text-gray-800">{entry.name}</h3>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            {entry.link && <a href={entry.link.startsWith('http') ? entry.link : `https://${entry.link}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{entry.link}</a>}
            {entry.date && <span>• {entry.date}</span>}
          </div>
          {entry.bullets.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {entry.bullets.filter(b => b).map((bullet, i) => (
                <li key={`${bullet}-${i}`} className="text-[10.5px] text-gray-700 flex">
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
