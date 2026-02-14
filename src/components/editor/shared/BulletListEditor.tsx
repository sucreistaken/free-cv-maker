import { useTranslation } from 'react-i18next';
import { Plus, X } from 'lucide-react';

interface BulletListEditorProps {
  bullets: string[];
  onChange: (bullets: string[]) => void;
}

export function BulletListEditor({ bullets, onChange }: BulletListEditorProps) {
  const { t } = useTranslation();

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

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-600">{t('experienceForm.bullets')}</label>
      {bullets.map((bullet, index) => (
        <div key={index} className="flex gap-1.5">
          <span className="text-gray-400 mt-2 text-sm">•</span>
          <textarea
            value={bullet}
            onChange={(e) => updateBullet(index, e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y min-h-[36px]"
            rows={2}
          />
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
