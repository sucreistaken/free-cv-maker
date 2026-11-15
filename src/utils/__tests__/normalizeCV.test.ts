import { describe, it, expect } from 'vitest';
import { defaultCV } from '../../data/defaultCV';
import { validateImportData } from '../export';
import { normalizeCVData } from '../normalizeCV';

// Shapes seen in real synced CVs: hand-written or chatbot-made JSON files that
// use their own key names. Opening the Languages editor on such data crashed
// the whole app ("Something went wrong") on `language.trim()`.
const offSchemaImport = {
  cvData: {
    personalInfo: { fullName: 'Test Person' },
    languages: [
      { name: 'English', level: 'C1' },
      { name: 'German', level: 'Basic' },
      { language: 'Turkish', proficiency: 'native' },
    ],
    awards: [{ name: 'Best Thesis', issuer: 'Uni', year: '2025' }],
    references: [{ name: 'Jane Doe', title: 'Lead', organization: 'Acme', email: 'j@acme.test' }],
    experience: [{ title: 'Dev', company: 'Acme' }],
    skills: [{ category: 'Tools', items: ['Git', 'Docker'] }],
  },
};

describe('normalizeCVData', () => {
  it('gives every imported entry the fields the editor reads, mapping common alias keys', () => {
    const result = validateImportData(JSON.stringify(offSchemaImport));
    expect(result.valid).toBe(true);
    if (!result.valid) return;
    const cv = result.data.cvData;

    expect(cv.languages.map((l) => [l.language, l.proficiency])).toEqual([
      ['English', 'fluent'],
      ['German', 'beginner'],
      ['Turkish', 'native'],
    ]);
    // The exact expression that crashed LanguagesForm.
    expect(() => cv.languages.map((l) => l.language.trim())).not.toThrow();

    expect(cv.awards[0].title).toBe('Best Thesis');
    expect(cv.references[0]).toMatchObject({ company: 'Acme', phone: '' });
    expect(cv.experience[0]).toMatchObject({ location: '', startDate: '', endDate: '', bullets: [] });
    expect(cv.skills[0].items).toBe('Git, Docker');

    const ids = Object.values(cv)
      .filter(Array.isArray)
      .flat()
      .map((e) => (e as { id?: unknown }).id);
    expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
  });

  it('leaves well-formed data untouched, ids included', () => {
    const cv = JSON.parse(JSON.stringify(defaultCV));
    expect(normalizeCVData(cv)).toEqual(cv);
  });

  it('heals broken data already stored in a profile', () => {
    const stored = { ...JSON.parse(JSON.stringify(defaultCV)), languages: [{ id: 'a', name: 'French' }] };
    const cv = normalizeCVData(stored);
    expect(cv.languages).toEqual([{ id: 'a', language: 'French', proficiency: 'intermediate' }]);
    expect(cv.sections).toEqual(defaultCV.sections);
  });
});
