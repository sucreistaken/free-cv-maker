import type { ReactNode } from 'react';
import { useTemplateTheme } from '../../hooks/useTemplateTheme';

interface TemplateWrapperProps {
  children: ReactNode;
}

export function TemplateWrapper({ children }: TemplateWrapperProps) {
  const { fontFamily, zoom, effectiveA4Height, lineHeight, margin, sectionGap, titleTransform, primaryColor, accentColor } = useTemplateTheme();

  return (
    <div
      className="a4-page"
      style={{
        fontFamily,
        zoom,
        lineHeight,
        minHeight: `${effectiveA4Height}px`,
        paddingLeft: margin,
        paddingRight: margin,
        paddingTop: '40px',
        paddingBottom: '40px',
        ['--a4-break-height' as string]: `${effectiveA4Height}px`,
        ['--cv-primary' as string]: primaryColor,
        ['--cv-accent' as string]: accentColor,
        ['--cv-section-gap' as string]: sectionGap,
        ['--cv-title-transform' as string]: titleTransform,
      }}
    >
      {children}
    </div>
  );
}
