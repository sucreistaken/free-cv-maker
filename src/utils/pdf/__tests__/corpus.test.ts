import { describe, expect, it } from 'vitest';
import { STYLES, data, diffCv, parseCorpus } from './corpusDiff';

describe('third-party CV layouts', () => {
  it.each(STYLES)('$file parses into the right fields', async ({ file, lang, skip }) => {
    expect(diffCv(await parseCorpus(file), data[lang], skip)).toEqual([]);
  });
});
