import { useCVStore } from '../../store/useCVStore';
import { Textarea } from '../ui/Textarea';

export function HobbiesForm() {
  const { hobbies, updateHobbies } = useCVStore();

  return (
    <Textarea
      label="Hobbies & Interests"
      value={hobbies}
      onChange={(e) => updateHobbies(e.target.value)}
      rows={4}
      placeholder="e.g. Photography, Hiking, Open-source contribution..."
    />
  );
}
