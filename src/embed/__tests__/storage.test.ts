import { describe, it, expect } from 'vitest';
import type { StateStorage } from 'zustand/middleware';
import { pickStorage } from '../../store/storage';

function fakeLocal(): StateStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

describe('pickStorage', () => {
  it('uses the browser storage in the normal app', () => {
    const local = fakeLocal();
    pickStorage(null, local).setItem('k', 'v');
    expect(local.data.get('k')).toBe('v');
  });

  it('never reads or writes the browser storage when embedded', () => {
    for (const mode of ['edit', 'print'] as const) {
      const local = fakeLocal();
      local.data.set('cv-builder-profiles', '{"state":{}}');
      const storage = pickStorage(mode, local);
      storage.setItem('cv-builder-data', 'x');
      expect(storage.getItem('cv-builder-profiles')).toBeNull();
      expect([...local.data.keys()]).toEqual(['cv-builder-profiles']);
    }
  });
});
