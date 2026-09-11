import { describe, expect, it } from 'vitest';
import { defaultCV } from '../../../data/defaultCV';
import { buildLayoutLines } from '../layout';
import { parseLinesToCV } from '../../pdfImport';
import { loadFixturePages } from './nodeLoader';

// Round-trip: the app's own exported PDFs must come back as the data they were rendered from.
// Fixtures are generated from defaultCV via scripts/make-pdf-fixtures.mjs.

type WithId = { id: string };
function stripIds<T extends WithId>(entries: T[]): Omit<T, 'id'>[] {
  return entries.map((entry) => {
    const copy: Partial<T> = { ...entry };
    delete copy.id;
    return copy as Omit<T, 'id'>;
  });
}

async function parseFixture(name: string) {
  const pages = await loadFixturePages(name);
  return parseLinesToCV(buildLayoutLines(pages));
}

const expectedExperience = stripIds(defaultCV.experience);

describe.each(['export-classic.pdf', 'export-modern.pdf', 'export-twoColumn.pdf'])('round-trip %s', (fixture) => {
  it('recovers personal info, summary and hobbies', async () => {
    const cv = await parseFixture(fixture);
    expect(cv.personalInfo).toEqual(defaultCV.personalInfo);
    expect(cv.summary).toBe(defaultCV.summary);
    expect(cv.hobbies).toBe(defaultCV.hobbies);
    expect(cv.awards).toEqual([]);
    expect(cv.references).toEqual([]);
  });

  it('recovers experience with title/company in the right slots', async () => {
    const cv = await parseFixture(fixture);
    expect(stripIds(cv.experience)).toEqual(expectedExperience);
  });

  it('recovers projects, education and involvement', async () => {
    const cv = await parseFixture(fixture);
    expect(stripIds(cv.projects)).toEqual(stripIds(defaultCV.projects));
    expect(stripIds(cv.education)).toEqual(stripIds(defaultCV.education));
    expect(stripIds(cv.involvement)).toEqual(stripIds(defaultCV.involvement));
  });

  it('recovers skills, certifications and languages', async () => {
    const cv = await parseFixture(fixture);
    // Modern prints category names in caps, so the original casing is not recoverable there.
    const lower = (s: { category: string; items: string }[]) =>
      s.map((c) => ({ category: c.category.toLowerCase(), items: c.items }));
    expect(lower(stripIds(cv.skills))).toEqual(lower(stripIds(defaultCV.skills)));
    expect(stripIds(cv.certifications)).toEqual(stripIds(defaultCV.certifications));
    expect(stripIds(cv.languages)).toEqual(stripIds(defaultCV.languages));
  });

  it('marks every populated section visible', async () => {
    const cv = await parseFixture(fixture);
    const visible = cv.sections.filter((s) => s.visible).map((s) => s.type);
    expect(visible).toEqual([
      'personalInfo', 'summary', 'experience', 'projects', 'education', 'involvement',
      'skills', 'certifications', 'languages', 'hobbies',
    ]);
  });
});
