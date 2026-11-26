import { createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import { currentEmbedMode } from '../embed/mode';
import type { EmbedMode } from '../embed/mode';

/** Reads nothing and keeps nothing: an embedded editor must not see or leave the visitor's own CVs. */
const discardStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export function pickStorage(mode: EmbedMode | null, local: StateStorage): StateStorage {
  return mode ? discardStorage : local;
}

/** Storage for every persisted store: localStorage in the normal app, nothing when embedded in A2C. */
export const persistStorage = createJSONStorage(() => pickStorage(currentEmbedMode, localStorage));
