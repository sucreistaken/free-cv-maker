import { Palette } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useCVStore } from '../../store/useCVStore';
import { ColorPicker } from '../ui/ColorPicker';
import { Toggle } from '../ui/Toggle';
import { fontFamilies } from '../../constants/theme';
import { cn } from '../../utils/cn';

function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              value === opt.value
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ThemePanel() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useAppStore();
  const profilePhoto = useCVStore((s) => s.personalInfo.profilePhoto);

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2.5 text-left"
      >
        <Palette size={16} className="text-gray-400" />
        <span className="text-sm font-semibold text-gray-800">Theme & Settings</span>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-100 space-y-3">
          <ColorPicker
            label="Primary Color"
            value={theme.primaryColor}
            onChange={(color) => setTheme({ primaryColor: color })}
          />
          <ColorPicker
            label="Accent Color"
            value={theme.accentColor}
            onChange={(color) => setTheme({ accentColor: color })}
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-600">Font Family</label>
            <select
              value={theme.fontFamily}
              onChange={(e) => setTheme({ fontFamily: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {fontFamilies.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
              ))}
            </select>
          </div>

          <OptionGroup
            label="Font Size"
            options={[
              { value: 'small', label: 'Small' },
              { value: 'medium', label: 'Medium' },
              { value: 'large', label: 'Large' },
            ]}
            value={theme.fontSize}
            onChange={(v) => setTheme({ fontSize: v })}
          />

          <OptionGroup
            label="Line Spacing"
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'normal', label: 'Normal' },
              { value: 'relaxed', label: 'Relaxed' },
            ]}
            value={theme.lineSpacing}
            onChange={(v) => setTheme({ lineSpacing: v })}
          />

          <OptionGroup
            label="Page Margins"
            options={[
              { value: 'narrow', label: 'Narrow' },
              { value: 'normal', label: 'Normal' },
              { value: 'wide', label: 'Wide' },
            ]}
            value={theme.pageMargins}
            onChange={(v) => setTheme({ pageMargins: v })}
          />

          <OptionGroup
            label="Section Title Style"
            options={[
              { value: 'uppercase', label: 'UPPER' },
              { value: 'capitalize', label: 'Capitalize' },
              { value: 'normal', label: 'Normal' },
            ]}
            value={theme.sectionTitleStyle}
            onChange={(v) => setTheme({ sectionTitleStyle: v })}
          />

          <OptionGroup
            label="Section Spacing"
            options={[
              { value: 'tight', label: 'Tight' },
              { value: 'normal', label: 'Normal' },
              { value: 'loose', label: 'Loose' },
            ]}
            value={theme.sectionSpacing}
            onChange={(v) => setTheme({ sectionSpacing: v })}
          />

          {profilePhoto && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <label className="block text-xs font-semibold text-gray-700">Photo Display</label>
              <Toggle
                label="Show photo"
                checked={theme.photoVisible ?? true}
                onChange={(v) => setTheme({ photoVisible: v })}
              />
              {(theme.photoVisible ?? true) && (
                <>
                  <OptionGroup
                    label="Size"
                    options={[
                      { value: 'sm', label: 'Small' },
                      { value: 'md', label: 'Medium' },
                      { value: 'lg', label: 'Large' },
                    ]}
                    value={theme.photoSize ?? 'md'}
                    onChange={(v) => setTheme({ photoSize: v })}
                  />
                  <OptionGroup
                    label="Shape"
                    options={[
                      { value: 'circle', label: 'Circle' },
                      { value: 'rounded', label: 'Rounded' },
                      { value: 'square', label: 'Square' },
                    ]}
                    value={theme.photoShape ?? 'circle'}
                    onChange={(v) => setTheme({ photoShape: v })}
                  />
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
