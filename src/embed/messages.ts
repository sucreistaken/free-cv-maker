import type { CVData } from '../types/cv';
import { normalizeCVData } from '../utils/normalizeCV';
import type { EmbedMode } from './mode';

/** Message types of the A2C <-> NextCV protocol (see the shared contract). */
export const MSG_READY = 'nextcv:ready';
export const MSG_LOADED = 'nextcv:loaded';
export const MSG_SAVE = 'nextcv:save';
export const MSG_LOAD = 'a2c:load';

export const DEFAULT_A2C_ORIGINS = [
  'https://apply2campus.com',
  'http://localhost:3007',
  'http://localhost:3008',
  'http://localhost:3009',
  'http://localhost:3010',
  'http://localhost:3011',
];

/** Comma-separated origins from VITE_A2C_ORIGINS; the contract defaults when unset or empty. */
export function parseAllowedOrigins(raw: string | undefined): string[] {
  const list = (raw ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  return list.length ? list : [...DEFAULT_A2C_ORIGINS];
}

export interface LoadContext {
  mode: EmbedMode;
  allowedOrigins: string[];
  /** This page's own origin; trusted only in print mode, where the headless browser posts from the page itself. */
  selfOrigin: string;
}

/** Returns the CV of a valid `a2c:load` message, normalized for the editor; null for anything else. */
export function readLoadMessage(msg: { origin: string; data: unknown }, ctx: LoadContext): CVData | null {
  const trusted =
    ctx.allowedOrigins.includes(msg.origin) || (ctx.mode === 'print' && msg.origin === ctx.selfOrigin);
  if (!trusted) return null;

  const data = msg.data;
  if (typeof data !== 'object' || data === null) return null;
  const { type, cv } = data as { type?: unknown; cv?: unknown };
  if (type !== MSG_LOAD) return null;
  if (typeof cv !== 'object' || cv === null || Array.isArray(cv)) return null;
  return normalizeCVData(cv);
}

const CV_KEYS: (keyof CVData)[] = [
  'personalInfo', 'summary', 'experience', 'projects', 'education', 'involvement',
  'skills', 'certifications', 'languages', 'awards', 'hobbies', 'references', 'sections',
];

/** `nextcv:save` payload: just the CV fields of the editor state (the store also holds functions). */
export function buildSaveMessage(state: CVData): { type: typeof MSG_SAVE; cv: CVData } {
  const cv = {} as Record<keyof CVData, unknown>;
  for (const key of CV_KEYS) cv[key] = state[key];
  return { type: MSG_SAVE, cv: cv as CVData };
}
