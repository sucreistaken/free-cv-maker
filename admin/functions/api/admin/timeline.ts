/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const deviceId = url.searchParams.get('deviceId');
  const profileId = url.searchParams.get('profileId');

  if (!deviceId || !profileId) {
    return new Response('Missing deviceId/profileId', { status: 400 });
  }

  const result = await env.DB.prepare(
    `SELECT id, event_type, event_data, cv_snapshot, pdf_r2_key, user_agent, created_at
     FROM events
     WHERE device_id = ? AND profile_id = ?
     ORDER BY created_at DESC
     LIMIT 200`,
  ).bind(deviceId, profileId).all();

  return Response.json({ rows: result.results });
};
