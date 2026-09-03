import { Palette, SlidersHorizontal, Sparkles, Type } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/useAppStore';
import { useCVStore } from '../../store/useCVStore';
import { ColorPicker } from '../ui/ColorPicker';
import { Toggle } from '../ui/Toggle';
import { fontFamilies } from '../../constants/theme';
import { fineTuneRanges } from '../../types/cv';
import { fontSizeScale, lineHeightMap, marginMap, sectionSpacingMap } from '../../hooks/useTemplateTheme';
import { cn } from '../../utils/cn';

/**
 * Optional fine tuning attached to a preset group. The presets stay the default
 * path; the slider only appears when the user asks for it, and clearing it hands
 * control back to the presets.
 */
interface FineTune {
  /** Current numeric value, undefined while the preset is in charge. */
  override?: number;
  /** What the active preset resolves to, shown as the slider's starting point. */
  presetValue: number;
  min: number;
  max: number;
  step: number;
  /** Renders the number next to the label, e.g. "104%" or "34px". */
  format: (v: number) => string;
  onChange: (v: number | undefined) => void;
}

function OptionGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  fineTune,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  fineTune?: FineTune;
}) {
  const { t } = useTranslation();
  const [tuning, setTuning] = useState(fineTune?.override !== undefined);
  const current = fineTune ? fineTune.override ?? fineTune.presetValue : 0;
  const isOverridden = fineTune?.override !== undefined;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-medium text-gray-600">
          {label}
          {fineTune && isOverridden && (
            <span className="ml-1.5 text-primary tabular-nums">{fineTune.format(current)}</span>
          )}
        </label>
        {fineTune && (
          <button
            type="button"
            onClick={() => setTuning((prev) => !prev)}
            aria-expanded={tuning}
            className={cn(
              'flex items-center gap-1 text-[11px] font-medium rounded px-1.5 py-0.5 transition-colors',
              tuning || isOverridden
                ? 'text-primary hover:bg-primary/5'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            )}
          >
            <SlidersHorizontal size={11} />
            {t('theme.fineTune')}
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              onChange(opt.value);
              // Picking a preset means the preset is back in charge.
              fineTune?.onChange(undefined);
            }}
            className={cn(
              'flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              value === opt.value && !isOverridden
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {fineTune && tuning && (
        <div className="flex items-center gap-2 pt-0.5">
          <input
            type="range"
            min={fineTune.min}
            max={fineTune.max}
            step={fineTune.step}
            value={current}
            onChange={(e) => fineTune.onChange(Number(e.target.value))}
            className="flex-1 h-1 accent-primary cursor-pointer"
            aria-label={label}
          />
          <span className="text-[11px] text-gray-500 tabular-nums w-10 text-right">
            {fineTune.format(current)}
          </span>
          {isOverridden && (
            <button
              type="button"
              onClick={() => fineTune.onChange(undefined)}
              className="text-[11px] text-gray-400 hover:text-gray-600"
            >
              {t('theme.reset')}
            </button>
          )}
        </div>
      )}
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
            fineTune={{
              override: theme.fontScaleOverride,
              presetValue: fontSizeScale[theme.fontSize],
              ...fineTuneRanges.fontScale,
              format: (v) => `${Math.round(v * 100)}%`,
              onChange: (v) => setTheme({ fontScaleOverride: v }),
            }}
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
            fineTune={{
              override: theme.lineHeightOverride,
              presetValue: lineHeightMap[theme.lineSpacing],
              ...fineTuneRanges.lineHeight,
              format: (v) => v.toFixed(2),
              onChange: (v) => setTheme({ lineHeightOverride: v }),
            }}
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
            fineTune={{
              override: theme.pageMarginsOverride,
              presetValue: parseInt(marginMap[theme.pageMargins], 10),
              ...fineTuneRanges.pageMargins,
              format: (v) => `${Math.round(v)}px`,
              onChange: (v) => setTheme({ pageMarginsOverride: v }),
            }}
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
            fineTune={{
              override: theme.sectionSpacingOverride,
              presetValue: parseInt(sectionSpacingMap[theme.sectionSpacing], 10),
              ...fineTuneRanges.sectionSpacing,
              format: (v) => `${Math.round(v)}px`,
              onChange: (v) => setTheme({ sectionSpacingOverride: v }),
            }}
          />

          <div className="space-y-1.5 pt-1">
            <button
              type="button"
              onClick={() => setTheme({ showIcons: !(theme.showIcons ?? true) })}
              className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {(theme.showIcons ?? true) ? <Type size={14} /> : <Sparkles size={14} />}
              {(theme.showIcons ?? true) ? t('theme.hideIcons') : t('theme.showIconsAction')}
            </button>
            <p className="text-[11px] text-gray-400 leading-snug">{t('theme.iconsHint')}</p>
          </div>

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
