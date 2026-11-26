import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useCVStore } from '../../store/useCVStore';
import { useAppStore } from '../../store/useAppStore';
import { Input } from '../ui/Input';
import { CEFR_SKILLS } from '../../types/cv';
import type { CefrLevel, CefrSkill, LanguageEntry } from '../../types/cv';
import { isNativeLanguage, setCefrLevel } from '../../utils/europass';

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

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const cefrSkillKeys: Record<CefrSkill, string> = {
  listening: 'languagesForm.cefrListening',
  reading: 'languagesForm.cefrReading',
  writing: 'languagesForm.cefrWriting',
  spokenProduction: 'languagesForm.cefrSpokenProduction',
  spokenInteraction: 'languagesForm.cefrSpokenInteraction',
};

export function LanguageEntryForm({ entry }: Props) {
  const { t } = useTranslation();
  const updateLanguage = useCVStore((s) => s.updateLanguage);
  const isEuropass = useAppStore((s) => s.template === 'europass');
  const listId = useId();
  const labelId = useId();
  const cefrLabelId = useId();
  const names = t('languagesForm.suggestions', { returnObjects: true }) as string[];

  // Europass decides "mother tongue" with isNative first (data from A2C); keep the chips in step with it.
  const native = isNativeLanguage(entry);
  const selected = isEuropass ? (native ? 'native' : entry.proficiency === 'native' ? null : entry.proficiency) : entry.proficiency;

  const selectProficiency = (level: LanguageEntry['proficiency']) => {
    updateLanguage(entry.id, 'proficiency', level);
    if (isEuropass && entry.isNative !== undefined) updateLanguage(entry.id, 'isNative', level === 'native');
  };

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
              aria-checked={selected === level}
              onClick={() => selectProficiency(level)}
              className={`px-2 py-1.5 text-xs rounded-md border transition-colors ${
                selected === level
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-primary/50'
              }`}
            >
              {t(proficiencyKeys[level])}
            </button>
          ))}
        </div>
      </div>
      {isEuropass && !native && (
        <div className="space-y-1" role="group" aria-labelledby={cefrLabelId}>
          <span id={cefrLabelId} className="block text-xs font-medium text-gray-600">{t('languagesForm.cefr')}</span>
          <div className="space-y-1">
            {CEFR_SKILLS.map((skill) => (
              <label key={skill} className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-600">{t(cefrSkillKeys[skill])}</span>
                <select
                  value={entry.cefr?.[skill] ?? ''}
                  onChange={(e) =>
                    updateLanguage(entry.id, 'cefr', setCefrLevel(entry.cefr, skill, e.target.value as CefrLevel | ''))
                  }
                  className="w-20 shrink-0 rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-900 bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">–</option>
                  {CEFR_LEVELS.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          {!entry.cefr && <p className="text-xs text-gray-500">{t('languagesForm.cefrHint')}</p>}
        </div>
      )}
    </div>
  );
}
