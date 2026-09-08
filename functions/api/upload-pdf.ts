/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
  UPLOADS: R2Bucket;
}

const MAX_PDF_BYTES = 10 * 1024 * 1024;
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // "%PDF"

function isNonEmptyString(v: unknown, maxLen: number): v is string {
  return typeof v === 'string' && v.length > 0 && v.length <= maxLen;
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const deviceId = url.searchParams.get('deviceId');
  const profileId = url.searchParams.get('profileId');
  const fileName = url.searchParams.get('fileName') ?? 'upload.pdf';

  if (!isNonEmptyString(deviceId, 64) || !isNonEmptyString(profileId, 64)) {
    return new Response('Missing deviceId/profileId', { status: 400 });
  }

  const contentLength = Number(request.headers.get('Content-Length') ?? '0');
  if (contentLength <= 0 || contentLength > MAX_PDF_BYTES) {
    return new Response('Invalid or too large payload', { status: 413 });
  }

  const bytes = new Uint8Array(await request.arrayBuffer());
  const isPdf = bytes.length >= 4 && PDF_MAGIC.every((b, i) => bytes[i] === b);
  if (!isPdf) {
    return new Response('Not a valid PDF', { status: 400 });
  }

  const key = `pdf/${deviceId}/${profileId}/${Date.now()}-${randomSuffix()}.pdf`;
  await env.UPLOADS.put(key, bytes, { httpMetadata: { contentType: 'application/pdf' } });

  const now = new Date().toISOString();
  const userAgent = request.headers.get('User-Agent')?.slice(0, 500) ?? null;
  const eventData = JSON.stringify({ fileName: fileName.slice(0, 200), fileSizeBytes: bytes.length });

  context.waitUntil(
    env.DB.prepare(
      `INSERT INTO events (device_id, profile_id, event_type, event_data, cv_snapshot, pdf_r2_key, user_agent, created_at)
       VALUES (?, ?, 'pdf_imported', ?, NULL, ?, ?, ?)`,
    ).bind(deviceId, profileId, eventData, key, userAgent, now).run(),
  );

  return new Response(null, { status: 202 });
};
