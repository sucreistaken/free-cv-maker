import { useAppStore } from '../store/useAppStore';
import type React from 'react';

export const fontSizeScale = { small: 0.92, medium: 1, large: 1.08 } as const;
export const A4_HEIGHT_DEFAULT = 1121;
const lineHeightMap = { compact: 1.3, normal: 1.5, relaxed: 1.7 } as const;
const marginMap = { narrow: '30px', normal: '50px', wide: '70px' } as const;
const sectionSpacingMap = { tight: '8px', normal: '12px', loose: '20px' } as const;
const photoSizeMap = { sm: '40px', md: '56px', lg: '80px' } as const;
const photoShapeMap = { circle: '9999px', rounded: '8px', square: '0px' } as const;
const serifFonts = new Set(['Georgia', 'Merriweather', 'Playfair Display']);
const fontAliases: Record<string, string> = { 'Source Sans Pro': 'Source Sans 3' };

export function useTemplateTheme() {
  const rawTheme = useAppStore((s) => s.theme);

  const theme = {
    ...rawTheme,
    photoSize: rawTheme.photoSize ?? 'md',
    photoShape: rawTheme.photoShape ?? 'circle',
    photoVisible: rawTheme.photoVisible ?? true,
  };

  const pageBreakHeights = useAppStore((s) => s.pageBreakHeights);
  const zoom = fontSizeScale[theme.fontSize];
  const pageBreakHeight = pageBreakHeights?.[theme.fontSize] || A4_HEIGHT_DEFAULT;
  const effectiveA4Height = pageBreakHeight / zoom;
  const lineHeight = lineHeightMap[theme.lineSpacing];
  const margin = marginMap[theme.pageMargins];
  const sectionGap = sectionSpacingMap[theme.sectionSpacing];

  const titleTransform: React.CSSProperties['textTransform'] =
    theme.sectionTitleStyle === 'uppercase'
      ? 'uppercase'
      : theme.sectionTitleStyle === 'capitalize'
        ? 'capitalize'
        : 'none';

  const photoSize = photoSizeMap[theme.photoSize];
  const photoShape = photoShapeMap[theme.photoShape];
  const photoVisible = theme.photoVisible;

  return {
    theme,
    zoom,
    pageBreakHeight,
    effectiveA4Height,
    lineHeight,
    margin,
    sectionGap,
    titleTransform,
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
