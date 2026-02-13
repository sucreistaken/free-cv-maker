import { cn } from '../../utils/cn';
import { colorPresets } from '../../constants/theme';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-medium text-gray-600">{label}</label>}
      <div className="flex items-center gap-2 flex-wrap">
        {colorPresets.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={cn(
              'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
              value === color ? 'border-gray-800 scale-110' : 'border-transparent'
            )}
            style={{ backgroundColor: color }}
          />
        ))}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-6 h-6 rounded cursor-pointer border-0 p-0"
        />
      </div>
    </div>
  );
}
