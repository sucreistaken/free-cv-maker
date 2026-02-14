import { useTranslation } from 'react-i18next';
import { useCVStore } from '../../store/useCVStore';
import { FormField } from './shared/FormField';
import type { LanguageEntry } from '../../types/cv';

interface Props {
  entry: LanguageEntry;
}

const proficiencyLevels: LanguageEntry['proficiency'][] = ['native', 'fluent', 'intermediate', 'beginner'];

const proficiencyKeys: Record<LanguageEntry['proficiency'], string> = {
  native: 'languagesForm.native',
  fluent: 'languagesForm.fluent',
  intermediate: 'languagesForm.intermediate',
  beginner: 'languagesForm.beginner',
};

export function LanguageEntryForm({ entry }: Props) {
  const { t } = useTranslation();
  const updateLanguage = useCVStore((s) => s.updateLanguage);

  return (
    <div className="space-y-2">
      <FormField label={t('languagesForm.language')} value={entry.language} onChange={(v) => updateLanguage(entry.id, 'language', v)} placeholder={t('languagesForm.languagePlaceholder')} />
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600">{t('languagesForm.proficiency')}</label>
        <div className="flex gap-1">
          {proficiencyLevels.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => updateLanguage(entry.id, 'proficiency', level)}
              className={`flex-1 px-2 py-1.5 text-xs rounded-md border transition-colors ${
                entry.proficiency === level
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-primary/50'
              }`}
            >
              {t(proficiencyKeys[level])}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
