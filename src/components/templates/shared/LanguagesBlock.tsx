import type { LanguageEntry } from '../../../types/cv';

interface LanguagesBlockProps {
  entries: LanguageEntry[];
  accentColor?: string;
}

const proficiencyLabels: Record<LanguageEntry['proficiency'], string> = {
  native: 'Native',
  fluent: 'Fluent',
  intermediate: 'Intermediate',
  beginner: 'Beginner',
};

export function LanguagesBlock({ entries, accentColor }: LanguagesBlockProps) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {entries.map((entry) => (
        <div key={entry.id} className="break-inside-avoid flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-gray-800">{entry.language}</span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: accentColor ? accentColor + '15' : '#f3f4f6',
              color: accentColor || '#6b7280',
            }}
          >
            {proficiencyLabels[entry.proficiency]}
          </span>
        </div>
      ))}
    </div>
  );
}
