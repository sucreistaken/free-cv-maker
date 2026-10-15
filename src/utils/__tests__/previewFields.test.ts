import { describe, it, expect } from 'vitest';
import { defaultCV } from '../../data/defaultCV';
import type { CVData } from '../../types/cv';
import { buildPreviewFields, matchPreviewFields, normalizeForMatch } from '../previewFields';

const cv = JSON.parse(JSON.stringify(defaultCV)) as CVData;

describe('normalizeForMatch', () => {
  it('drops bullet glyphs, markdown markers and extra whitespace', () => {
    expect(normalizeForMatch('• Built **fast**  APIs')).toBe('Built fast APIs');
  });
});

describe('buildPreviewFields', () => {
  it('exposes the full name as a flat personalInfo field', () => {
    const hit = matchPreviewFields(buildPreviewFields(cv), cv.personalInfo.fullName)[0];
    expect(hit).toMatchObject({ key: 'personalInfo', field: 'fullName' });
  });

  it('addresses experience bullets by entry id and index', () => {
    const entry = cv.experience[0];
    const bullet = entry.bullets.find((b) => b)!;
    const hit = matchPreviewFields(buildPreviewFields(cv), bullet)[0];
    expect(hit).toMatchObject({ key: 'experience', entryId: entry.id, field: 'bullets', bulletIndex: entry.bullets.indexOf(bullet) });
  });

  it('skips hidden sections', () => {
    const hidden = { ...cv, sections: cv.sections.map((s) => (s.type === 'summary' ? { ...s, visible: false } : s)) };
    expect(matchPreviewFields(buildPreviewFields(hidden), cv.summary)).toEqual([]);
  });

  it('returns nothing for text that is not a field', () => {
    expect(matchPreviewFields(buildPreviewFields(cv), 'not in the cv at all')).toEqual([]);
  });
});
