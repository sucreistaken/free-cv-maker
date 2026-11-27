import { describe, expect, it } from 'vitest';
import { defaultCV } from '../../../data/defaultCV';
import { BULLET_RE, buildLayoutLines, type LayoutLine } from '../layout';
import { looksLikeCv, parseLinesToCV } from '../../pdfImport';
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

describe.each([
  'export-classic.pdf',
  'export-modern.pdf',
  'export-twoColumn.pdf',
  'export-minimalist.pdf',
  'export-creative.pdf',
  'export-academic.pdf',
  'export-compact.pdf',
])('round-trip %s', (fixture) => {
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
    if (fixture === 'export-creative.pdf') {
      // Creative prints skills as bare chips without category names or commas, so only the
      // skill names themselves can be recovered.
      const parsed = cv.skills.map((c) => c.items).join(' ');
      const expected = defaultCV.skills.flatMap((c) => c.items.split(', '));
      for (const skill of expected) expect(parsed).toContain(skill);
    } else {
      // Modern prints category names in caps, so the original casing is not recoverable there.
      const lower = (s: { category: string; items: string }[]) =>
        s.map((c) => ({ category: c.category.toLowerCase(), items: c.items }));
      expect(lower(stripIds(cv.skills))).toEqual(lower(stripIds(defaultCV.skills)));
    }
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

// Synthetic lines for behaviours the app's own exports do not exercise.
function L(text: string, over: Partial<LayoutLine> = {}): LayoutLine {
  const isBullet = BULLET_RE.test(text) && text.replace(BULLET_RE, '').length > 0;
  return {
    text, page: 0, column: 0, x: 40, textX: 40, right: 300, y: 0, fontSize: 10,
    isBullet, hasWideGap: false, fontName: 'f1', ...over,
  };
}

describe('heading detection', () => {
  it('does not take a title that merely contains "project" for a section heading', () => {
    const cv = parseLinesToCV([
      L('Jane Doe', { fontSize: 20 }),
      L('jane@doe.com'),
      L('AWARDS', { fontSize: 12 }),
      L('Best Project, Red Bull Sustain2Solve'),
      L('Red Bull • 2026'),
      L('• Picked as the best project among university teams.'),
    ]);
    expect(cv.projects).toEqual([]);
    expect(cv.awards).toHaveLength(1);
    expect(cv.awards[0]).toMatchObject({ title: 'Best Project, Red Bull Sustain2Solve', issuer: 'Red Bull', year: '2026' });
  });

  it('keeps a "Project Manager" job title inside experience', () => {
    const cv = parseLinesToCV([
      L('Jane Doe', { fontSize: 20 }),
      L('jane@doe.com'),
      L('EXPERIENCE', { fontSize: 12 }),
      L('Project Manager Mar 2023 - Present'),
      L('Acme GmbH, Berlin'),
      L('• Ran the roadmap.'),
    ]);
    expect(cv.projects).toEqual([]);
    expect(cv.experience[0]).toMatchObject({ title: 'Project Manager', company: 'Acme GmbH' });
  });

  it('still recognises decorated, styled headings', () => {
    const cv = parseLinesToCV([
      L('Jane Doe', { fontSize: 20 }),
      L('jane@doe.com'),
      L('WORK EXPERIENCE & INTERNSHIPS', { fontSize: 12 }),
      L('Intern Mar 2023 - Present'),
      L('Acme GmbH'),
    ]);
    expect(cv.experience).toHaveLength(1);
  });

  it('reads Turkish headings and proficiency labels', () => {
    const cv = parseLinesToCV([
      L('Ayşe Yılmaz', { fontSize: 20 }),
      L('ayse@ornek.com'),
      L('DENEYİM', { fontSize: 12 }),
      L('Yazılım Mühendisi Mar 2023 - Günümüz'),
      L('Örnek A.Ş., İstanbul'),
      L('• API geliştirdi.'),
      L('EĞİTİM', { fontSize: 12 }),
      L('Bilgisayar Mühendisliği — İzmir Ekonomi Üniversitesi, 2017 – 2021'),
      L('DİLLER', { fontSize: 12 }),
      L('Türkçe (Ana Dil), İngilizce (Akıcı)'),
    ]);
    expect(cv.experience[0]).toMatchObject({ title: 'Yazılım Mühendisi', startDate: 'Mar 2023', endDate: 'Günümüz' });
    expect(cv.education[0]).toMatchObject({ degree: 'Bilgisayar Mühendisliği', institution: 'İzmir Ekonomi Üniversitesi', startDate: '2017', year: '2021' });
    expect(cv.languages.map((l) => l.proficiency)).toEqual(['native', 'fluent']);
  });
});

describe('personal info', () => {
  it('keeps a parenthetical note with digits in the location', () => {
    const cv = parseLinesToCV([
      L('Jane Doe', { fontSize: 20 }),
      L('Izmir, Turkey (Remote, UTC+3) | jane@doe.com | +90 537 883 06 47'),
      L('SUMMARY', { fontSize: 12 }),
      L('Developer.'),
    ]);
    expect(cv.personalInfo.location).toBe('Izmir, Turkey (Remote, UTC+3)');
    expect(cv.personalInfo.email).toBe('jane@doe.com');
  });

  it('turns an all-caps name into title case', () => {
    const latin = parseLinesToCV([L('ALEX MORGAN', { fontSize: 20 }), L('alex@x.com'), L('SUMMARY', { fontSize: 12 }), L('Hi.')]);
    expect(latin.personalInfo.fullName).toBe('Alex Morgan');
    const turkish = parseLinesToCV([L('KADİR AY', { fontSize: 20 }), L('kadir@x.com'), L('ÖZET', { fontSize: 12 }), L('Merhaba.')]);
    expect(turkish.personalInfo.fullName).toBe('Kadir Ay');
  });
});

describe('single-line entry formats', () => {
  it('splits "Name — Issuer, Year" certifications', () => {
    const cv = parseLinesToCV([
      L('Jane Doe', { fontSize: 20 }),
      L('jane@doe.com'),
      L('CERTIFICATIONS', { fontSize: 12 }),
      L('AWS Certified Cloud Practitioner — Amazon Web Services, 2023'),
    ]);
    expect(cv.certifications[0]).toMatchObject({ name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', year: '2023' });
  });

  it('splits "Company | City, Country" and strips an emptied link from project names', () => {
    const cv = parseLinesToCV([
      L('Jane Doe', { fontSize: 20 }),
      L('jane@doe.com'),
      L('EXPERIENCE', { fontSize: 12 }),
      L('Developer Mar 2023 - Present'),
      L('Acme GmbH | Berlin, Germany'),
      L('PROJECTS', { fontSize: 12 }),
      L('DevBoard (github.com/jane/devboard) Jan 2024 - Present'),
    ]);
    expect(cv.experience[0]).toMatchObject({ company: 'Acme GmbH', location: 'Berlin, Germany' });
    expect(cv.projects[0]).toMatchObject({ name: 'DevBoard', link: 'github.com/jane/devboard' });
  });

  it('reads a date on its own line under an involvement role', () => {
    const cv = parseLinesToCV([
      L('Jane Doe', { fontSize: 20 }),
      L('jane@doe.com'),
      L('INVOLVEMENT', { fontSize: 12 }),
      L('Lead Organizer'),
      L('Oct 2018 - Jul 2020'),
      L('Technical University of Munich · HackMunich'),
      L('• Organized a hackathon.'),
    ]);
    expect(cv.involvement[0]).toMatchObject({
      role: 'Lead Organizer', startDate: 'Oct 2018', endDate: 'Jul 2020',
      institution: 'Technical University of Munich', organization: 'HackMunich',
    });
  });
});

describe('non-CV documents', () => {
  it('flags a PDF without sections or contact details', () => {
    const cv = parseLinesToCV([L('Product Roles', { fontSize: 18 }), L('A description of responsibilities in prose.')]);
    expect(looksLikeCv(cv)).toBe(false);
  });

  it('accepts a PDF that only has contact details', () => {
    expect(looksLikeCv(parseLinesToCV([L('Jane Doe', { fontSize: 20 }), L('jane@doe.com')]))).toBe(true);
  });
});

// A section the user added prints in the house heading style with words the importer does not
// know. It must come back as a custom section instead of being merged into the one above it.
// Fixtures: scripts/make-custom-section-fixture.mjs (default CV + "Conference Talks"), printed
// through the app's own print path. Europass is left out: the importer has no German headings,
// so a NextCV Europass PDF does not import at all yet.
describe.each([
  'export-custom-classic.pdf',
  'export-custom-modern.pdf',
  'export-custom-twoColumn.pdf',
  'export-custom-minimalist.pdf',
  'export-custom-creative.pdf',
  'export-custom-academic.pdf',
  'export-custom-compact.pdf',
])(
  'custom section round-trip %s',
  (fixture) => {
    it('recovers the custom section and its entry', async () => {
      const cv = await parseFixture(fixture);
      const custom = cv.sections.filter((s) => s.type === 'custom');
      expect(custom).toHaveLength(1);
      expect(custom[0].title).toBe('Conference Talks');
      expect(stripIds(custom[0].items ?? [])).toEqual([
        {
          title: 'Keynote Speaker',
          subtitle: 'ReactConf Istanbul',
          startDate: 'Sep 2024',
          endDate: '',
          bullets: ['Spoke about design systems at scale to 400 attendees'],
        },
      ]);
    });

    it('leaves the built-in sections as they were', async () => {
      const cv = await parseFixture(fixture);
      expect(cv.summary).toBe(defaultCV.summary);
      expect(stripIds(cv.experience)).toEqual(expectedExperience);
      expect(stripIds(cv.involvement)).toEqual(stripIds(defaultCV.involvement));
    });
  },
);
