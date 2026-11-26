import { useTranslation } from 'react-i18next';
import { useCVStore } from '../../store/useCVStore';
import { useAppStore } from '../../store/useAppStore';
import { Textarea } from '../ui/Textarea';

export function HobbiesForm() {
  const { t } = useTranslation();
  const { hobbies, updateHobbies } = useCVStore();
  // Europass prints hobbies as grouped lists: one item per line, "# " starts a group.
  const isEuropass = useAppStore((s) => s.template === 'europass');

  return (
    <div className="space-y-1">
      <Textarea
        label={t('hobbiesForm.label')}
        value={hobbies}
        onChange={(e) => updateHobbies(e.target.value)}
        onValueChange={updateHobbies}
        rows={isEuropass ? 6 : 4}
        placeholder={isEuropass ? t('hobbiesForm.europassPlaceholder') : t('hobbiesForm.placeholder')}
      />
      {isEuropass && <p className="text-xs text-gray-500">{t('hobbiesForm.europassHint')}</p>}
    </div>
  );
}
