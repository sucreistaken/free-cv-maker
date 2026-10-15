import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useCVStore } from '../../store/useCVStore';
import { Input } from '../ui/Input';
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
  const listId = useId();
  const labelId = useId();
  const names = t('languagesForm.suggestions', { returnObjects: true }) as string[];

  return (
    <div className="space-y-2">
      <Input
        label={t('languagesForm.language')}
        value={entry.language}
        onChange={(e) => updateLanguage(entry.id, 'language', e.target.value)}
        placeholder={t('languagesForm.languagePlaceholder')}
        list={listId}
        autoFocus={!entry.language}
      />
      <datalist id={listId}>
        {names.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <div className="space-y-1">
        <span id={labelId} className="block text-xs font-medium text-gray-600">{t('languagesForm.proficiency')}</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1" role="radiogroup" aria-labelledby={labelId}>
          {proficiencyLevels.map((level) => (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={entry.proficiency === level}
              onClick={() => updateLanguage(entry.id, 'proficiency', level)}
              className={`px-2 py-1.5 text-xs rounded-md border transition-colors ${
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
