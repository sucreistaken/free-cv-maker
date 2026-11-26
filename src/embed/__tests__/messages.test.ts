import { describe, it, expect } from 'vitest';
import { getEmbedMode } from '../mode';
import { DEFAULT_A2C_ORIGINS, buildSaveMessage, parseAllowedOrigins, readLoadMessage } from '../messages';
import { defaultCV } from '../../data/defaultCV';

const cv = { personalInfo: { fullName: 'Deniz Probe' }, summary: 'Test' };
const editCtx = { mode: 'edit' as const, allowedOrigins: ['https://apply2campus.com', 'http://localhost:3007'], selfOrigin: 'https://nextcv.test' };
const printCtx = { ...editCtx, mode: 'print' as const };

describe('getEmbedMode', () => {
  it('reads the A2C editor and print modes from the query string', () => {
    expect(getEmbedMode('?embed=a2c')).toBe('edit');
    expect(getEmbedMode('?embed=a2c&print=1')).toBe('print');
    expect(getEmbedMode('?print=1&embed=a2c')).toBe('print');
  });

  it('stays off for the normal app and unknown values', () => {
    expect(getEmbedMode('')).toBeNull();
    expect(getEmbedMode('?embed=other')).toBeNull();
    expect(getEmbedMode('?print=1')).toBeNull();
  });
});

describe('parseAllowedOrigins', () => {
  it('falls back to the contract defaults', () => {
    expect(parseAllowedOrigins(undefined)).toEqual(DEFAULT_A2C_ORIGINS);
    expect(parseAllowedOrigins('  ')).toEqual(DEFAULT_A2C_ORIGINS);
    expect(DEFAULT_A2C_ORIGINS).toEqual([
      'https://apply2campus.com',
      'http://localhost:3007',
      'http://localhost:3008',
      'http://localhost:3009',
      'http://localhost:3010',
      'http://localhost:3011',
    ]);
  });

  it('trims entries, drops empties and trailing slashes', () => {
    expect(parseAllowedOrigins(' https://a.test/ ,, http://b.test:9000 ')).toEqual(['https://a.test', 'http://b.test:9000']);
  });
});

describe('readLoadMessage', () => {
  it('returns normalized CV data from an allowed origin', () => {
    const out = readLoadMessage({ origin: 'http://localhost:3007', data: { type: 'a2c:load', cv } }, editCtx);
    expect(out?.personalInfo.fullName).toBe('Deniz Probe');
    expect(out?.experience).toEqual([]);
    expect(out?.sections.length).toBeGreaterThan(0);
  });

  it('ignores other origins', () => {
    expect(readLoadMessage({ origin: 'https://evil.test', data: { type: 'a2c:load', cv } }, editCtx)).toBeNull();
  });

  it('ignores unknown message types and malformed payloads', () => {
    const origin = 'https://apply2campus.com';
    expect(readLoadMessage({ origin, data: { type: 'a2c:other', cv } }, editCtx)).toBeNull();
    expect(readLoadMessage({ origin, data: { type: 'a2c:load' } }, editCtx)).toBeNull();
    expect(readLoadMessage({ origin, data: { type: 'a2c:load', cv: 'text' } }, editCtx)).toBeNull();
    expect(readLoadMessage({ origin, data: { type: 'a2c:load', cv: [] } }, editCtx)).toBeNull();
    expect(readLoadMessage({ origin, data: 'a2c:load' }, editCtx)).toBeNull();
    expect(readLoadMessage({ origin, data: null }, editCtx)).toBeNull();
  });

  it('accepts its own origin only in print mode', () => {
    const msg = { origin: 'https://nextcv.test', data: { type: 'a2c:load', cv } };
    expect(readLoadMessage(msg, editCtx)).toBeNull();
    expect(readLoadMessage(msg, printCtx)?.personalInfo.fullName).toBe('Deniz Probe');
  });
});

describe('buildSaveMessage', () => {
  it('sends only CV data, so postMessage can clone it', () => {
    const state = {
      ...JSON.parse(JSON.stringify(defaultCV)),
      coverLetterData: { body: 'not part of the CV' },
      updateSummary: () => {},
    };
    const msg = buildSaveMessage(state);
    expect(msg.type).toBe('nextcv:save');
    expect(Object.keys(msg.cv).sort()).toEqual(Object.keys(defaultCV).sort());
    expect(msg.cv.summary).toBe(defaultCV.summary);
    expect(() => structuredClone(msg)).not.toThrow();
  });
});
