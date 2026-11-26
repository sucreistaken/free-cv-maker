import { describe, it, expect } from 'vitest';
import { splitListItems, parseHobbies, isNativeLanguage, formatDateRange, setCefrLevel, otherLanguageLevel } from '../europass';

describe('splitListItems', () => {
  it('splits on commas but keeps commas inside parentheses', () => {
    expect(splitListItems('Teamfähigkeit, Reisen (Europa, Asien),  Neugier ')).toEqual([
      'Teamfähigkeit',
      'Reisen (Europa, Asien)',
      'Neugier',
    ]);
  });

  it('drops empty pieces', () => {
    expect(splitListItems(' , ,Lesen,')).toEqual(['Lesen']);
    expect(splitListItems('')).toEqual([]);
  });
});

describe('parseHobbies', () => {
  it('starts a group at every "# " line', () => {
    expect(parseHobbies('# Kunst\nKlavier spielen\nTanzen (Hip-Hop)\n# Sport\nSchwimmen')).toEqual([
      { title: 'Kunst', items: ['Klavier spielen', 'Tanzen (Hip-Hop)'] },
      { title: 'Sport', items: ['Schwimmen'] },
    ]);
  });

  it('puts lines before the first heading into an untitled group', () => {
    expect(parseHobbies('Lesen\n# Sport\nLaufen')).toEqual([
      { title: '', items: ['Lesen'] },
      { title: 'Sport', items: ['Laufen'] },
    ]);
  });

  it('strips list bullets and blank lines', () => {
    expect(parseHobbies('- Lesen\n\n• Kochen\n* Wandern')).toEqual([{ title: '', items: ['Lesen', 'Kochen', 'Wandern'] }]);
  });

  it('splits the old single-line comma format into items', () => {
    expect(parseHobbies('Fotografie, Reisen (Europa, Asien), Schach')).toEqual([
      { title: '', items: ['Fotografie', 'Reisen (Europa, Asien)', 'Schach'] },
    ]);
  });

  it('starts a group only for "# " lines; "#1 ..." stays an item', () => {
    expect(parseHobbies('# Sport\n#1 im Schulturnier\nSchwimmen')).toEqual([
      { title: 'Sport', items: ['#1 im Schulturnier', 'Schwimmen'] },
    ]);
    expect(parseHobbies('#1 Fan, Lesen')).toEqual([{ title: '', items: ['#1 Fan', 'Lesen'] }]);
  });

  it('keeps a heading without items and returns nothing for empty text', () => {
    expect(parseHobbies('# Musik')).toEqual([{ title: 'Musik', items: [] }]);
    expect(parseHobbies('  \n ')).toEqual([]);
  });
});

describe('isNativeLanguage', () => {
  it('follows an explicit flag first, then the proficiency', () => {
    expect(isNativeLanguage({ id: '1', language: 'A', proficiency: 'fluent', isNative: true })).toBe(true);
    expect(isNativeLanguage({ id: '2', language: 'B', proficiency: 'native', isNative: false })).toBe(false);
    expect(isNativeLanguage({ id: '3', language: 'C', proficiency: 'native' })).toBe(true);
    expect(isNativeLanguage({ id: '4', language: 'D', proficiency: 'beginner' })).toBe(false);
  });
});

describe('formatDateRange', () => {
  it('joins both ends with an en dash and falls back to the one that exists', () => {
    expect(formatDateRange('15.09.2022', '26.06.2026')).toBe('15.09.2022 – 26.06.2026');
    expect(formatDateRange('', '2026')).toBe('2026');
    expect(formatDateRange('2022', undefined)).toBe('2022');
    expect(formatDateRange(' ', '')).toBe('');
  });
});

describe('setCefrLevel', () => {
  const grid = { listening: 'B1', reading: 'B1', writing: 'A2', spokenProduction: 'A2', spokenInteraction: 'B1' } as const;

  it('fills all five skills on the first pick', () => {
    expect(setCefrLevel(undefined, 'reading', 'B2')).toEqual({
      listening: 'B2', reading: 'B2', writing: 'B2', spokenProduction: 'B2', spokenInteraction: 'B2',
    });
  });

  it('changes one skill of an existing grid', () => {
    expect(setCefrLevel(grid, 'writing', 'C1')).toEqual({ ...grid, writing: 'C1' });
  });

  it('removes the grid when a level is cleared', () => {
    expect(setCefrLevel(grid, 'listening', '')).toBeUndefined();
    expect(setCefrLevel(undefined, 'listening', '')).toBeUndefined();
  });
});

describe('otherLanguageLevel', () => {
  it('never labels a language listed under "Weitere Sprache(n)" as native', () => {
    expect(otherLanguageLevel({ id: '1', language: 'A', proficiency: 'native', isNative: false })).toBe('fluent');
  });

  it('keeps the other proficiency levels', () => {
    expect(otherLanguageLevel({ id: '2', language: 'B', proficiency: 'beginner' })).toBe('beginner');
    expect(otherLanguageLevel({ id: '3', language: 'C', proficiency: 'fluent' })).toBe('fluent');
  });
});
