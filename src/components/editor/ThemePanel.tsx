import { Palette } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        <span className="text-sm font-semibold text-gray-800">{t('theme.title')}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-100 space-y-3">
          <ColorPicker
            label={t('theme.primaryColor')}
            value={theme.primaryColor}
            onChange={(color) => setTheme({ primaryColor: color })}
          />
          <ColorPicker
            label={t('theme.accentColor')}
            value={theme.accentColor}
            onChange={(color) => setTheme({ accentColor: color })}
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-600">{t('theme.fontFamily')}</label>
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
            label={t('theme.fontSize')}
            options={[
              { value: 'small', label: t('theme.small') },
              { value: 'medium', label: t('theme.medium') },
              { value: 'large', label: t('theme.large') },
            ]}
            value={theme.fontSize}
            onChange={(v) => setTheme({ fontSize: v })}
          />

          <OptionGroup
            label={t('theme.lineSpacing')}
            options={[
              { value: 'compact', label: t('theme.compact') },
              { value: 'normal', label: t('theme.normal') },
              { value: 'relaxed', label: t('theme.relaxed') },
            ]}
            value={theme.lineSpacing}
            onChange={(v) => setTheme({ lineSpacing: v })}
          />

          <OptionGroup
            label={t('theme.pageMargins')}
            options={[
              { value: 'narrow', label: t('theme.narrow') },
              { value: 'normal', label: t('theme.normal') },
              { value: 'wide', label: t('theme.wide') },
            ]}
            value={theme.pageMargins}
            onChange={(v) => setTheme({ pageMargins: v })}
          />

          <OptionGroup
            label={t('theme.sectionTitleStyle')}
            options={[
              { value: 'uppercase', label: t('theme.upper') },
              { value: 'capitalize', label: t('theme.capitalize') },
              { value: 'normal', label: t('theme.normal') },
            ]}
            value={theme.sectionTitleStyle}
            onChange={(v) => setTheme({ sectionTitleStyle: v })}
          />

          <OptionGroup
            label={t('theme.sectionSpacing')}
            options={[
              { value: 'tight', label: t('theme.tight') },
              { value: 'normal', label: t('theme.normal') },
              { value: 'loose', label: t('theme.loose') },
            ]}
            value={theme.sectionSpacing}
            onChange={(v) => setTheme({ sectionSpacing: v })}
          />

          {profilePhoto && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <label className="block text-xs font-semibold text-gray-700">{t('theme.photoDisplay')}</label>
              <Toggle
                label={t('theme.showPhoto')}
                checked={theme.photoVisible ?? true}
                onChange={(v) => setTheme({ photoVisible: v })}
              />
              {(theme.photoVisible ?? true) && (
                <>
                  <OptionGroup
                    label={t('theme.size')}
                    options={[
                      { value: 'sm', label: t('theme.small') },
                      { value: 'md', label: t('theme.medium') },
                      { value: 'lg', label: t('theme.large') },
                    ]}
                    value={theme.photoSize ?? 'md'}
                    onChange={(v) => setTheme({ photoSize: v })}
                  />
                  <OptionGroup
                    label={t('theme.shape')}
                    options={[
                      { value: 'circle', label: t('theme.circle') },
                      { value: 'rounded', label: t('theme.rounded') },
                      { value: 'square', label: t('theme.square') },
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
