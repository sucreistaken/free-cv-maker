/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
}

interface SyncPayload {
  deviceId?: unknown;
  profileId?: unknown;
  profileName?: unknown;
  cvData?: unknown;
  coverLetterData?: unknown;
  template?: unknown;
  theme?: unknown;
  language?: unknown;
}

const MAX_BODY_BYTES = 900_000;
const MAX_STORED_BYTES = 800_000;

const KNOWN_TEMPLATES = new Set([
  'classic', 'modern', 'minimalist', 'creative', 'academic', 'compact', 'twoColumn',
]);

function isNonEmptyString(v: unknown, maxLen: number): v is string {
  return typeof v === 'string' && v.length > 0 && v.length <= maxLen;
}

function extractFullName(cvData: Record<string, unknown>): string {
  const personalInfo = cvData.personalInfo;
  if (personalInfo && typeof personalInfo === 'object' && 'fullName' in personalInfo) {
    const fullName = (personalInfo as Record<string, unknown>).fullName;
    if (typeof fullName === 'string') return fullName.slice(0, 200);
  }
  return '';
}

function stripProfilePhoto(cvData: Record<string, unknown>): Record<string, unknown> {
  if (!cvData.personalInfo || typeof cvData.personalInfo !== 'object') return cvData;
  return {
    ...cvData,
    personalInfo: { ...(cvData.personalInfo as Record<string, unknown>), profilePhoto: '' },
  };
}

const CHECKPOINT_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Records a `content_checkpoint` event at most once per CHECKPOINT_INTERVAL_MS per
 * profile, so continuous debounced syncs don't flood the activity timeline. Decided
 * server-side (not client-side) since it's the one authoritative source across tabs/reloads.
 * Wrapped defensively: a missing `events` table (e.g. migration 0002 not yet applied)
 * must never break the primary cv_snapshots upsert this runs alongside.
 */
async function maybeInsertCheckpoint(
  env: Env,
  deviceId: string,
  profileId: string,
  cvDataStr: string,
  userAgent: string | null,
  now: string,
): Promise<void> {
  try {
    const last = await env.DB.prepare(
      `SELECT created_at FROM events WHERE device_id = ? AND profile_id = ? AND event_type = 'content_checkpoint' ORDER BY created_at DESC LIMIT 1`,
    ).bind(deviceId, profileId).first<{ created_at: string }>();

    if (last && Date.now() - new Date(last.created_at).getTime() < CHECKPOINT_INTERVAL_MS) {
      return;
    }

    await env.DB.prepare(
      `INSERT INTO events (device_id, profile_id, event_type, event_data, cv_snapshot, pdf_r2_key, user_agent, created_at)
       VALUES (?, ?, 'content_checkpoint', NULL, ?, NULL, ?, ?)`,
    ).bind(deviceId, profileId, cvDataStr, userAgent, now).run();
  } catch {
    // events table may not exist yet (migration pending) — never break the sync response
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const contentLength = Number(request.headers.get('Content-Length') ?? '0');
  if (contentLength > MAX_BODY_BYTES) {
    return new Response('Payload too large', { status: 413 });
  }

  let body: SyncPayload;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (!isNonEmptyString(body.deviceId, 64) || !isNonEmptyString(body.profileId, 64)) {
    return new Response('Missing deviceId/profileId', { status: 400 });
  }

  const template = isNonEmptyString(body.template, 32) && KNOWN_TEMPLATES.has(body.template)
    ? body.template
    : 'unknown';

  const language = body.language === 'en' ? 'en' : 'tr';
  const profileName = isNonEmptyString(body.profileName, 200) ? body.profileName : '';

  const cvData = body.cvData && typeof body.cvData === 'object'
    ? (body.cvData as Record<string, unknown>)
    : {};
  const fullName = extractFullName(cvData);

  let cvDataStr = JSON.stringify(cvData);
  if (cvDataStr.length > MAX_STORED_BYTES) {
    cvDataStr = JSON.stringify(stripProfilePhoto(cvData));
  }

  const coverLetterDataStr = body.coverLetterData && typeof body.coverLetterData === 'object'
    ? JSON.stringify(body.coverLetterData)
    : null;
  const themeStr = body.theme && typeof body.theme === 'object'
    ? JSON.stringify(body.theme)
    : null;

  const userAgent = request.headers.get('User-Agent')?.slice(0, 500) ?? null;
  const now = new Date().toISOString();

  context.waitUntil(
    env.DB.prepare(
      `INSERT INTO cv_snapshots (
        device_id, profile_id, profile_name, full_name, cv_data, cover_letter_data,
        template, theme, language, user_agent, first_seen_at, last_synced_at, sync_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(device_id, profile_id) DO UPDATE SET
        profile_name = excluded.profile_name,
        full_name = excluded.full_name,
        cv_data = excluded.cv_data,
        cover_letter_data = excluded.cover_letter_data,
        template = excluded.template,
        theme = excluded.theme,
        language = excluded.language,
        user_agent = excluded.user_agent,
        last_synced_at = excluded.last_synced_at,
        sync_count = cv_snapshots.sync_count + 1`
    ).bind(
      body.deviceId,
      body.profileId,
      profileName,
      fullName,
      cvDataStr,
      coverLetterDataStr,
      template,
      themeStr,
      language,
      userAgent,
      now,
      now,
    ).run(),
  );

  context.waitUntil(
    maybeInsertCheckpoint(env, body.deviceId as string, body.profileId as string, cvDataStr, userAgent, now),
  );

  return new Response(null, { status: 202 });
};
