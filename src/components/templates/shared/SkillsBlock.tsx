import type { SkillCategory } from '../../../types/cv';
import { parseFormattedText } from '../../../utils/formatText';

interface SkillsBlockProps {
  categories: SkillCategory[];
}

export function SkillsBlock({ categories }: SkillsBlockProps) {
  return (
    <div className="space-y-1">
      {categories.map((cat) => (
        <p key={cat.id} className="break-inside-avoid text-[10.5px] text-gray-700">
          {cat.category && <span className="font-bold">{cat.category}: </span>}
          {parseFormattedText(cat.items)}
        </p>
      ))}
    </div>
  );
}
