import { useTranslation } from 'react-i18next';
import { useCVStore } from '../../store/useCVStore';
import { Textarea } from '../ui/Textarea';

export function HobbiesForm() {
  const { t } = useTranslation();
  const { hobbies, updateHobbies } = useCVStore();

  return (
    <Textarea
      label={t('hobbiesForm.label')}
      value={hobbies}
      onChange={(e) => updateHobbies(e.target.value)}
      onValueChange={updateHobbies}
      rows={4}
      placeholder={t('hobbiesForm.placeholder')}
    />
  );
}
