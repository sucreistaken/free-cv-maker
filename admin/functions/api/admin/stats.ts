/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
}

async function countDistinct(env: Env, eventType: string): Promise<number> {
  const row = await env.DB.prepare(
    `SELECT COUNT(DISTINCT device_id || '|' || profile_id) as count FROM events
     WHERE event_type = ? AND created_at >= datetime('now', '-30 days')`,
  ).bind(eventType).first<{ count: number }>();
  return row?.count ?? 0;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;

  const [
    totalRow,
    deviceRow,
    byTemplate,
    byLanguage,
    byDay,
    aiOpened,
    aiCopied,
    aiApplied,
    pdfImported,
    pdfImportedThenExported,
  ] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) as count FROM cv_snapshots').first<{ count: number }>(),
    env.DB.prepare('SELECT COUNT(DISTINCT device_id) as count FROM cv_snapshots').first<{ count: number }>(),
    env.DB.prepare(
      'SELECT template, COUNT(*) as count FROM cv_snapshots GROUP BY template ORDER BY count DESC',
    ).all<{ template: string; count: number }>(),
    env.DB.prepare(
      'SELECT language, COUNT(*) as count FROM cv_snapshots GROUP BY language ORDER BY count DESC',
    ).all<{ language: string; count: number }>(),
    env.DB.prepare(
      `SELECT substr(first_seen_at, 1, 10) as day, COUNT(DISTINCT device_id) as count
       FROM cv_snapshots
       WHERE first_seen_at >= datetime('now', '-30 days')
       GROUP BY day
       ORDER BY day DESC`,
    ).all<{ day: string; count: number }>(),
    countDistinct(env, 'ai_opened').catch(() => 0),
    countDistinct(env, 'ai_prompt_copied').catch(() => 0),
    countDistinct(env, 'ai_applied').catch(() => 0),
    countDistinct(env, 'pdf_imported').catch(() => 0),
    env.DB.prepare(
      `SELECT COUNT(*) as count FROM (
         SELECT device_id, profile_id FROM events
         WHERE event_type = 'pdf_imported' AND created_at >= datetime('now', '-30 days')
         INTERSECT
         SELECT device_id, profile_id FROM events
         WHERE event_type IN ('pdf_export_clicked', 'json_exported') AND created_at >= datetime('now', '-30 days')
       )`,
    ).first<{ count: number }>().catch(() => null),
  ]);

  return Response.json({
    totalSnapshots: totalRow?.count ?? 0,
    totalDevices: deviceRow?.count ?? 0,
    byTemplate: byTemplate.results,
    byLanguage: byLanguage.results,
    newDevicesByDay: byDay.results,
    funnels: {
      ai: { opened: aiOpened, copied: aiCopied, applied: aiApplied },
      pdf: { imported: pdfImported, exportedAfter: pdfImportedThenExported?.count ?? 0 },
    },
  });
};
