import { create } from 'zustand';
import type { CVData } from '../types/cv';
import { useCVStore } from '../store/useCVStore';
import { useAppStore } from '../store/useAppStore';
import { parseAllowedOrigins } from './messages';

interface EmbedState {
  /** True once the first `a2c:load` has been applied. */
  loaded: boolean;
  /** Bumped on every load, so effects can react to a reload with new data. */
  version: number;
  /** Origin that sent the data; `nextcv:loaded` and `nextcv:save` go only there. */
  parentOrigin: string | null;
}

export const useEmbedStore = create<EmbedState>(() => ({ loaded: false, version: 0, parentOrigin: null }));

export function allowedOrigins(): string[] {
  return parseAllowedOrigins(import.meta.env.VITE_A2C_ORIGINS);
}

/** Puts A2C's CV into the editor with the Europass template forced. Nothing is persisted in embed modes. */
export function applyEmbeddedCV(cv: CVData, origin: string): void {
  useCVStore.getState().loadFromImport(cv);
  useAppStore.setState({ template: 'europass', activeDocument: 'cv' });
  useEmbedStore.setState((s) => ({ loaded: true, version: s.version + 1, parentOrigin: origin }));
}
