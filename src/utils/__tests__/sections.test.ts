import { describe, it, expect } from 'vitest';
import { defaultCV } from '../../data/defaultCV';
import type { CVData, CVSection } from '../../types/cv';
import en from '../../i18n/en.json';
import tr from '../../i18n/tr.json';
import { normalizeCVData } from '../normalizeCV';
import { buildPreviewFields, matchPreviewFields } from '../previewFields';
import {
  SECTION_TITLE_MAX,
  capitalizeWords,
  cleanSectionTitle,
  createCustomSection,
  customItemsAsInvolvement,
  isDefaultSectionTitle,
  localizeSectionTitles,
} from '../sections';

const toTurkish = (type: string) => (tr.sections as Record<string, string>)[type];

describe('isDefaultSectionTitle', () => {
  it('treats stock names in either UI language, any case, as default', () => {
    expect(isDefaultSectionTitle('summary', 'Summary')).toBe(true);
    expect(isDefaultSectionTitle('summary', 'ÖZET')).toBe(true);
    expect(isDefaultSectionTitle('involvement', 'INVOLVEMENT')).toBe(true);
    expect(isDefaultSectionTitle('custom', 'Yeni Bölüm')).toBe(true);
    expect(isDefaultSectionTitle('summary', '  ')).toBe(true);
  });

  it('treats a name the user typed as custom', () => {
    expect(isDefaultSectionTitle('summary', 'Hakkımda')).toBe(false);
    expect(isDefaultSectionTitle('custom', 'Gönüllülük')).toBe(false);
  });
});

describe('localizeSectionTitles', () => {
  it('translates stock names and keeps renamed ones on a language switch', () => {
    const sections: CVSection[] = [
      { id: 'a', type: 'summary', title: 'Summary', visible: true },
      { id: 'b', type: 'experience', title: 'Work I am proud of', visible: true },
      { id: 'c', type: 'custom', title: 'New Section', visible: true, items: [] },
      { id: 'd', type: 'custom', title: 'Volunteering', visible: true, items: [] },
    ];
    const out = localizeSectionTitles(sections, toTurkish as never);
    expect(out.map((s) => s.title)).toEqual(['Özet', 'Work I am proud of', 'Yeni Bölüm', 'Volunteering']);
  });
});

describe('cleanSectionTitle', () => {
  it('collapses whitespace, caps the length and falls back to the stock name when empty', () => {
    expect(cleanSectionTitle('  My   Story ', 'Summary')).toBe('My Story');
    expect(cleanSectionTitle('   ', 'Summary')).toBe('Summary');
    expect(cleanSectionTitle('x'.repeat(80), 'Summary')).toHaveLength(SECTION_TITLE_MAX);
  });
});

describe('capitalizeWords', () => {
  it('capitalizes Turkish words without breaking them at non-ASCII letters', () => {
    expect(capitalizeWords('gönüllülük çalışmaları', 'tr')).toBe('Gönüllülük Çalışmaları');
    expect(capitalizeWords('şirket içi eğitimler', 'tr')).toBe('Şirket İçi Eğitimler');
    expect(capitalizeWords('work experience', 'en')).toBe('Work Experience');
  });
});

describe('customItemsAsInvolvement', () => {
  it('maps entries to the involvement shape templates print and drops blank ones', () => {
    const section = createCustomSection('Volunteering');
    const filled = { id: 'e1', title: 'Mentor', subtitle: 'Code Club', startDate: '2024', endDate: '', bullets: ['Taught kids'] };
    section.items = [...(section.items ?? []), filled];
    expect(customItemsAsInvolvement(section.items)).toEqual([
      { id: 'e1', role: 'Mentor', institution: 'Code Club', organization: '', startDate: '2024', endDate: '', bullets: ['Taught kids'] },
    ]);
  });

  it('keeps a new, untouched section off the CV', () => {
    expect(customItemsAsInvolvement(createCustomSection('New Section').items)).toEqual([]);
  });
});

describe('custom sections in stored data', () => {
  const withCustom = (): CVData => {
    const cv = JSON.parse(JSON.stringify(defaultCV)) as CVData;
    cv.sections = [
      ...cv.sections.map((s) => (s.type === 'summary' ? { ...s, title: 'About me' } : s)),
      {
        id: 'sec-vol',
        type: 'custom',
        title: 'Volunteering',
        visible: true,
        items: [{ id: 'e1', title: 'Mentor', subtitle: 'Code Club', startDate: '2024', endDate: '2025', bullets: ['Taught kids'] }],
      },
    ];
    return cv;
  };

  it('survive normalization unchanged, renamed titles included', () => {
    const cv = withCustom();
    expect(normalizeCVData(cv)).toEqual(cv);
  });

  it('get every field the editor reads when written by hand', () => {
    const cv = withCustom() as unknown as Record<string, unknown>;
    cv.sections = [{ id: 'x', type: 'custom', title: 'Talks', items: [{ name: 'JSConf', date: '2023' }] }];
    const [section] = normalizeCVData(cv).sections;
    expect(section).toMatchObject({ type: 'custom', title: 'Talks', visible: true });
    expect(section.items?.[0]).toMatchObject({ title: 'JSConf', subtitle: '', startDate: '2023', endDate: '', bullets: [] });
  });

  it('are editable from the preview, addressed by section and entry', () => {
    const fields = buildPreviewFields(withCustom());
    expect(matchPreviewFields(fields, 'Taught kids')[0]).toMatchObject({
      key: 'custom',
      sectionId: 'sec-vol',
      entryId: 'e1',
      field: 'bullets',
      bulletIndex: 0,
    });
  });
});

describe('translations', () => {
  it('name the custom section in both languages', () => {
    expect(en.sections.custom).toBeTruthy();
    expect(tr.sections.custom).toBeTruthy();
  });
});
