import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import { templates } from '../../constants/templates';
import { cn } from '../../utils/cn';
import type { TemplateType } from '../../types/cv';

interface TemplateSelectorProps {
  onClose: () => void;
}

export function TemplateSelector({ onClose }: TemplateSelectorProps) {
  const { t } = useTranslation();
  const { template, setTemplate } = useAppStore();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-gray-900 mb-4">{t('templateSelector.title')}</h2>
        <div className="grid grid-cols-2 gap-3">
          {templates.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => {
                setTemplate(tmpl.id as TemplateType);
                onClose();
              }}
              className={cn(
                'p-4 rounded-lg border-2 text-left transition-all hover:shadow-md',
                template === tmpl.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <h3 className="text-sm font-semibold text-gray-900">{t(`templates.${tmpl.id}`)}</h3>
              <p className="text-xs text-gray-500 mt-1">{t(`templates.${tmpl.id}Desc`)}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
