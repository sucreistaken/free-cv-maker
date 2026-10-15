import { describe, expect, it } from 'vitest';
import { parseLinesToCV } from '../../pdfImport';
import { BULLET_RE, type LayoutLine } from '../layout';

// Experience headers differ a lot between producers; these are the common shapes besides the
// ones covered by the template round-trips and the third-party corpus.

function L(text: string, over: Partial<LayoutLine> = {}): LayoutLine {
  return { text, page: 0, column: 0, x: 40, textX: 40, right: 300, y: 0, fontSize: 10, isBullet: BULLET_RE.test(text), hasWideGap: false, fontName: 'f', ...over };
}

const head = [L('Jane Doe', { fontSize: 20 }), L('jane@doe.com'), L('EXPERIENCE', { fontSize: 12 })];

function experience(...lines: string[]) {
  const cv = parseLinesToCV([...head, ...lines.map((t) => L(t))]);
  return cv.experience.map((e) => [e.title, e.company, e.location, e.startDate, e.endDate, e.bullets.length]);
}

const two = [
  ['Software Engineer', 'Contoso Systems', 'Seattle, WA', '06/2019', '02/2022', 1],
  ['Junior Developer', 'Fabrikam Inc.', '', '08/2017', '05/2019', 1],
];

describe('experience header shapes', () => {
  it('title, company (place) with numeric dates on one line', () => {
    expect(experience(
      'Software Engineer, Contoso Systems (Seattle, WA) 06/2019 – 02/2022', '• Built services.',
      'Junior Developer, Fabrikam Inc. 08/2017 – 05/2019', '• Wrote dashboards.',
    )).toEqual(two);
  });

  it('"Role – Company" with the dates on the next line', () => {
    expect(experience(
      'Software Engineer – Contoso Systems', 'Jun 2019 – Feb 2022', '• Built services.',
      'Junior Developer – Fabrikam Inc.', 'Aug 2017 – May 2019', '• Wrote dashboards.',
    )).toEqual([
      ['Software Engineer', 'Contoso Systems', '', 'Jun 2019', 'Feb 2022', 1],
      ['Junior Developer', 'Fabrikam Inc.', '', 'Aug 2017', 'May 2019', 1],
    ]);
  });

  it('dates first, fields separated by pipes', () => {
    expect(experience(
      '2019 – 2022 | Software Engineer | Contoso Systems', '• Built services.',
      '2017 – 2019 | Junior Developer | Fabrikam Inc.', '• Wrote dashboards.',
    )).toEqual([
      ['Software Engineer', 'Contoso Systems', '', '2019', '2022', 1],
      ['Junior Developer', 'Fabrikam Inc.', '', '2017', '2019', 1],
    ]);
  });

  it('"Role at Company" with the place and dates below', () => {
    expect(experience(
      'Software Engineer at Contoso Systems', 'Seattle, WA | Jun 2019 – Feb 2022', '• Built services.',
      'Junior Developer at Fabrikam Inc.', 'Remote | Aug 2017 – May 2019', '• Wrote dashboards.',
    )).toEqual([
      ['Software Engineer', 'Contoso Systems', 'Seattle, WA', 'Jun 2019', 'Feb 2022', 1],
      ['Junior Developer', 'Fabrikam Inc.', 'Remote', 'Aug 2017', 'May 2019', 1],
    ]);
  });

  it('upper-case employers listed before the role', () => {
    expect(experience(
      'CONTOSO SYSTEMS', 'Software Engineer', 'June 2019 - February 2022', '• Built services.',
      'FABRIKAM INC.', 'Junior Developer', 'August 2017 - May 2019', '• Wrote dashboards.',
    )).toEqual([
      ['Software Engineer', 'CONTOSO SYSTEMS', '', 'June 2019', 'February 2022', 1],
      ['Junior Developer', 'FABRIKAM INC.', '', 'August 2017', 'May 2019', 1],
    ]);
  });

  it('a prose description without bullets stays with its job', () => {
    expect(experience(
      'Software Engineer | Contoso Systems | Jun 2019 – Feb 2022',
      'Built REST and gRPC services in Go for the logistics team and migrated thirty services to Kubernetes.',
      'Junior Developer | Fabrikam Inc. | Aug 2017 – May 2019',
      'Implemented internal dashboards in React and TypeScript for the sales team.',
    ).map((e) => [e[0], e[1], e[5]])).toEqual([
      ['Software Engineer', 'Contoso Systems', 1],
      ['Junior Developer', 'Fabrikam Inc.', 1],
    ]);
  });
});
