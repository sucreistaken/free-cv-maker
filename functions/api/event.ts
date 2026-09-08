/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
}

interface EventPayload {
  deviceId?: unknown;
  profileId?: unknown;
  eventType?: unknown;
  eventData?: unknown;
  cvSnapshot?: unknown;
}

const MAX_BODY_BYTES = 900_000;
const MAX_SNAPSHOT_BYTES = 800_000;

// content_checkpoint and pdf_imported are deliberately excluded — those are only ever
// inserted server-side (sync.ts / upload-pdf.ts), never accepted as client-supplied here.
const EVENT_TYPES = new Set([
  'profile_created',
  'profile_switched',
  'profile_deleted',
  'pdf_export_clicked',
  'json_exported',
  'json_imported',
  'ai_opened',
  'ai_prompt_copied',
  'ai_applied',
  'template_changed',
  'language_changed',
  'reset_to_default',
]);

function isNonEmptyString(v: unknown, maxLen: number): v is string {
  return typeof v === 'string' && v.length > 0 && v.length <= maxLen;
}

function stripProfilePhoto(cvData: Record<string, unknown>): Record<string, unknown> {
  if (!cvData.personalInfo || typeof cvData.personalInfo !== 'object') return cvData;
  return {
    ...cvData,
    personalInfo: { ...(cvData.personalInfo as Record<string, unknown>), profilePhoto: '' },
  };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const contentLength = Number(request.headers.get('Content-Length') ?? '0');
  if (contentLength > MAX_BODY_BYTES) {
    return new Response('Payload too large', { status: 413 });
  }

  let body: EventPayload;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (!isNonEmptyString(body.deviceId, 64) || !isNonEmptyString(body.profileId, 64)) {
    return new Response('Missing deviceId/profileId', { status: 400 });
  }
  if (!isNonEmptyString(body.eventType, 64) || !EVENT_TYPES.has(body.eventType)) {
    return new Response('Unknown event type', { status: 400 });
  }

  const eventDataStr = body.eventData && typeof body.eventData === 'object'
    ? JSON.stringify(body.eventData).slice(0, 2000)
    : null;

  let cvSnapshotStr: string | null = null;
  if (body.cvSnapshot && typeof body.cvSnapshot === 'object') {
    const snap = body.cvSnapshot as Record<string, unknown>;
    let str = JSON.stringify(snap);
    if (str.length > MAX_SNAPSHOT_BYTES) {
      str = JSON.stringify(stripProfilePhoto(snap));
    }
    cvSnapshotStr = str;
  }

  const userAgent = request.headers.get('User-Agent')?.slice(0, 500) ?? null;
  const now = new Date().toISOString();

  context.waitUntil(
    env.DB.prepare(
      `INSERT INTO events (device_id, profile_id, event_type, event_data, cv_snapshot, pdf_r2_key, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`,
    ).bind(body.deviceId, body.profileId, body.eventType, eventDataStr, cvSnapshotStr, userAgent, now).run(),
  );

  return new Response(null, { status: 202 });
};
