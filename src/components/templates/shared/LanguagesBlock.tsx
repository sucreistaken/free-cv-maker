import type { LanguageEntry } from '../../../types/cv';

interface LanguagesBlockProps {
  entries: LanguageEntry[];
  accentColor?: string;
  labels: Record<LanguageEntry['proficiency'], string>;
  /** When false the pill badge becomes plain parenthesised text. */
  showIcons?: boolean;
}

export function LanguagesBlock({ entries, accentColor, labels, showIcons = true }: LanguagesBlockProps) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {entries.map((entry) => (
        <div key={entry.id} className="break-inside-avoid flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-gray-800">{entry.language}</span>
          {showIcons ? (
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: accentColor ? accentColor + '15' : '#f3f4f6',
                color: accentColor || '#6b7280',
              }}
            >
              {labels[entry.proficiency]}
            </span>
          ) : (
            <span className="text-[10px] text-gray-500">({labels[entry.proficiency]})</span>
          )}
        </div>
      ))}
    </div>
  );
}
