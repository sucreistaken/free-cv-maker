import type { TemplateType } from '../types/cv';

export interface TemplateMeta {
  id: TemplateType;
  name: string;
  description: string;
}

export const templates: TemplateMeta[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Clean single-column layout with bold headings and horizontal lines',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Sidebar layout with dark panel for contact and skills',
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Serif fonts, generous whitespace, minimal decoration',
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Colorful banner header with accent bars and timeline layout',
  },
  {
    id: 'academic',
    name: 'Academic',
    description: 'Two-column sidebar layout with serif fonts and academic styling',
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Dense single-column layout to fit maximum content on one page',
  },
  {
    id: 'twoColumn',
    name: 'Two-Column',
    description: 'Main content area with colored sidebar for skills and education',
  },
];
