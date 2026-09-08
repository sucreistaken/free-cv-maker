/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
}

const PAGE_SIZE = 50;

// content_checkpoint is intentionally excluded from the global feed — it's a silent
// background bookkeeping event, not something worth surfacing in a "what's happening"
// view; it's still visible in a profile's own Zaman Çizelgesi tab via timeline.ts.
const FEED_EVENT_TYPES = new Set([
  'profile_created',
  'profile_switched',
  'profile_deleted',
  'pdf_imported',
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

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const eventTypeParam = url.searchParams.get('eventType');
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const eventType = eventTypeParam && FEED_EVENT_TYPES.has(eventTypeParam) ? eventTypeParam : null;

  const whereClause = eventType
    ? `WHERE e.event_type = ?`
    : `WHERE e.event_type != 'content_checkpoint'`;

  const query = `
    SELECT
      e.id, e.device_id, e.profile_id, e.event_type, e.event_data, e.pdf_r2_key, e.created_at,
      s.id AS snapshot_id, s.full_name, s.profile_name
    FROM events e
    LEFT JOIN cv_snapshots s ON s.device_id = e.device_id AND s.profile_id = e.profile_id
    ${whereClause}
    ORDER BY e.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const result = eventType
    ? await env.DB.prepare(query).bind(eventType, PAGE_SIZE, offset).all()
    : await env.DB.prepare(query).bind(PAGE_SIZE, offset).all();

  return Response.json({ rows: result.results, page, pageSize: PAGE_SIZE });
};
