import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import type { LanguageEntry } from '../types/cv';

export const fontSizeScale = { small: 0.92, medium: 1, large: 1.08 } as const;
export const A4_HEIGHT_DEFAULT = 1121;
export const lineHeightMap = { compact: 1.3, normal: 1.5, relaxed: 1.7 } as const;
export const marginMap = { narrow: '30px', normal: '50px', wide: '70px' } as const;
export const sectionSpacingMap = { tight: '8px', normal: '12px', loose: '20px' } as const;
const photoSizeMap = { sm: '40px', md: '56px', lg: '80px' } as const;
const photoShapeMap = { circle: '9999px', rounded: '8px', square: '0px' } as const;
const serifFonts = new Set(['Georgia', 'Merriweather', 'Playfair Display']);
const fontAliases: Record<string, string> = { 'Source Sans Pro': 'Source Sans 3' };

type PageBreakHeights = { small: number; medium: number; large: number };

/**
 * Page break heights were measured at the three preset zoom levels. The font
 * size slider lands between them, so interpolate along zoom and clamp outside
 * the measured range, otherwise the page break line drifts from the real one.
 */
export function resolvePageBreakHeight(zoom: number, heights?: PageBreakHeights): number {
  if (!heights) return A4_HEIGHT_DEFAULT;

  const points = [
    { zoom: fontSizeScale.small, height: heights.small },
    { zoom: fontSizeScale.medium, height: heights.medium },
    { zoom: fontSizeScale.large, height: heights.large },
  ]
    .filter((p) => Number.isFinite(p.height) && p.height > 0)
    .sort((a, b) => a.zoom - b.zoom);

  if (points.length === 0) return A4_HEIGHT_DEFAULT;
  if (zoom <= points[0].zoom) return points[0].height;
  if (zoom >= points[points.length - 1].zoom) return points[points.length - 1].height;

  for (let i = 0; i < points.length - 1; i++) {
    const lo = points[i];
    const hi = points[i + 1];
    if (zoom >= lo.zoom && zoom <= hi.zoom) {
      const span = hi.zoom - lo.zoom;
      if (span === 0) return lo.height;
      const ratio = (zoom - lo.zoom) / span;
      return lo.height + ratio * (hi.height - lo.height);
    }
  }
  return A4_HEIGHT_DEFAULT;
}

export function useTemplateTheme() {
  const rawTheme = useAppStore((s) => s.theme);

  const { t } = useTranslation();

  const theme = {
    ...rawTheme,
    photoSize: rawTheme.photoSize ?? 'md',
    photoShape: rawTheme.photoShape ?? 'circle',
    photoVisible: rawTheme.photoVisible ?? true,
    showIcons: rawTheme.showIcons ?? true,
  };

  const pageBreakHeights = useAppStore((s) => s.pageBreakHeights);
  const zoom = theme.fontScaleOverride ?? fontSizeScale[theme.fontSize];
  const pageBreakHeight = resolvePageBreakHeight(zoom, pageBreakHeights);
  const effectiveA4Height = pageBreakHeight / zoom;
  const lineHeight = theme.lineHeightOverride ?? lineHeightMap[theme.lineSpacing];
  const margin = theme.pageMarginsOverride !== undefined
    ? `${theme.pageMarginsOverride}px`
    : marginMap[theme.pageMargins];
  const sectionGap = theme.sectionSpacingOverride !== undefined
    ? `${theme.sectionSpacingOverride}px`
    : sectionSpacingMap[theme.sectionSpacing];

  const language = useAppStore((s) => s.language);

  const transformTitle = (title: string): string => {
    if (theme.sectionTitleStyle === 'uppercase') return title.toLocaleUpperCase(language);
    if (theme.sectionTitleStyle === 'capitalize') return title.replace(/\b\w/g, (c) => c.toLocaleUpperCase(language));
    return title;
  };

  const photoSize = photoSizeMap[theme.photoSize];
  const photoShape = photoShapeMap[theme.photoShape];
  const photoVisible = theme.photoVisible;

  // Templates used to each hardcode these in English, so switching the UI to
  // Turkish left the CV reading "Fluent"/"Native". Resolve them centrally.
  const proficiencyLabels: Record<LanguageEntry['proficiency'], string> = {
    native: t('languagesForm.native'),
    fluent: t('languagesForm.fluent'),
    intermediate: t('languagesForm.intermediate'),
    beginner: t('languagesForm.beginner'),
  };

  return {
    theme,
    showIcons: theme.showIcons,
    proficiencyLabels,
    zoom,
    pageBreakHeight,
    effectiveA4Height,
    lineHeight,
    margin,
    sectionGap,
    transformTitle,
    primaryColor: theme.primaryColor,
    accentColor: theme.accentColor,
    photoSize,
    photoShape,
    photoVisible,
    fontFamily: (() => {
      const font = fontAliases[theme.fontFamily] || theme.fontFamily;
      const fallback = serifFonts.has(font) ? 'serif' : 'sans-serif';
      return `'${font}', ${fallback}`;
    })(),
  };
}
