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

// Optional Europass fields sent by Apply2Campus (all invented data).
const europassRaw = {
  personalInfo: { fullName: 'Mira Testfeld', gender: 'Weiblich' },
  education: [
    { id: 'e1', degree: 'Abitur', institution: 'Testschule', location: 'Ankara, Türkei', website: 'https://schule.example' },
  ],
  languages: [
    { id: 'l1', language: 'Türkisch', proficiency: 'native', isNative: true },
    {
      id: 'l2',
      language: 'Deutsch',
      proficiency: 'beginner',
      cefr: { listening: 'A2', reading: 'b1+', writing: 'A1', spokenProduction: ' A2 ', spokenInteraction: 'C2' },
    },
  ],
};

describe('normalizeCVData with Europass fields', () => {
  it('keeps gender, education location and website', () => {
    const cv = normalizeCVData(europassRaw);
    expect(cv.personalInfo.gender).toBe('Weiblich');
    expect(cv.education[0]).toMatchObject({ location: 'Ankara, Türkei', website: 'https://schule.example' });
  });

  it('keeps the native flag and reads CEFR levels loosely', () => {
    const cv = normalizeCVData(europassRaw);
    expect(cv.languages[0].isNative).toBe(true);
    expect(cv.languages[1].cefr).toEqual({
      listening: 'A2',
      reading: 'B1',
      writing: 'A1',
      spokenProduction: 'A2',
      spokenInteraction: 'C2',
    });
  });

  it('drops a CEFR grid that misses a skill or has an unreadable level', () => {
    const cv = normalizeCVData({
      languages: [
        { language: 'Englisch', cefr: { listening: 'B1', reading: 'B1', writing: 'B1', spokenProduction: 'B1' } },
        { language: 'Spanisch', cefr: { listening: 'B1', reading: 'gut', writing: 'B1', spokenProduction: 'B1', spokenInteraction: 'B1' } },
        { language: 'Italienisch', cefr: 'B1' },
      ],
    });
    expect(cv.languages.map((l) => 'cefr' in l)).toEqual([false, false, false]);
  });

  it('drops a native flag that is not a boolean', () => {
    const cv = normalizeCVData({ languages: [{ language: 'Arabisch', isNative: 'yes' }] });
    expect('isNative' in cv.languages[0]).toBe(false);
  });

  it('does not add the optional keys to data that never had them', () => {
    const cv = normalizeCVData({ personalInfo: {}, education: [{ degree: 'BSc' }], languages: [{ language: 'Englisch' }] });
    expect('gender' in cv.personalInfo).toBe(false);
    expect('location' in cv.education[0]).toBe(false);
    expect('website' in cv.education[0]).toBe(false);
    expect('cefr' in cv.languages[0]).toBe(false);
  });

  it('returns well-formed Europass data deep-equal', () => {
    const once = normalizeCVData(europassRaw);
    expect(normalizeCVData(JSON.parse(JSON.stringify(once)))).toEqual(once);
  });
});
