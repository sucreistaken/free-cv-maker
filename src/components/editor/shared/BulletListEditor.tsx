import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react';
import { applyFormatting } from '../../../utils/formatText';

interface BulletListEditorProps {
  bullets: string[];
  onChange: (bullets: string[]) => void;
}

export function BulletListEditor({ bullets, onChange }: BulletListEditorProps) {
  const { t } = useTranslation();
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  const updateBullet = (index: number, value: string) => {
    const updated = [...bullets];
    updated[index] = value;
    onChange(updated);
  };

  const addBullet = () => onChange([...bullets, '']);

  const removeBullet = (index: number) => {
    if (bullets.length <= 1) return;
    onChange(bullets.filter((_, i) => i !== index));
  };

  const handleFormat = (index: number, marker: string) => {
    const textarea = textareaRefs.current[index];
    if (!textarea) return;

    const result = applyFormatting(
      bullets[index],
      textarea.selectionStart,
      textarea.selectionEnd,
      marker,
    );

    updateBullet(index, result.newValue);

    requestAnimationFrame(() => {
      textarea.selectionStart = result.newStart;
      textarea.selectionEnd = result.newEnd;
      textarea.focus();
    });
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-600">{t('experienceForm.bullets')}</label>
      {bullets.map((bullet, index) => (
        <div key={index} className="flex gap-1.5">
          <span className="text-gray-400 mt-2 text-sm">&bull;</span>
          <div className="flex-1">
            <div className="flex gap-0.5 mb-0.5">
              <button
                type="button"
                title={t('formatting.bold')}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleFormat(index, '**')}
                className="px-1.5 py-0.5 text-[11px] font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              >
                B
              </button>
              <button
                type="button"
                title={t('formatting.italic')}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleFormat(index, '*')}
                className="px-1.5 py-0.5 text-[11px] italic text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              >
                I
              </button>
            </div>
            <textarea
              ref={(el) => { textareaRefs.current[index] = el; }}
              value={bullet}
              onChange={(e) => updateBullet(index, e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y min-h-[36px]"
              rows={2}
            />
          </div>
          <button
            type="button"
            onClick={() => removeBullet(index)}
            className="text-gray-400 hover:text-red-500 mt-1 p-0.5"
            disabled={bullets.length <= 1}
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addBullet}
        className="flex items-center gap-1 text-xs text-primary hover:text-primary-dark font-medium mt-1"
      >
        <Plus size={14} />
        {t('experienceForm.addBullet')}
      </button>
    </div>
  );
}
