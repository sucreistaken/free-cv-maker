/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
}

const SORT_COLUMNS: Record<string, string> = {
  last_synced_at: 'last_synced_at',
  template: 'template',
  sync_count: 'sync_count',
  full_name: 'full_name',
};

const PAGE_SIZE = 25;

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  const q = url.searchParams.get('q')?.trim() ?? '';
  const sortColumn = SORT_COLUMNS[url.searchParams.get('sort') ?? ''] ?? 'last_synced_at';
  const dir = url.searchParams.get('dir') === 'asc' ? 'ASC' : 'DESC';
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const likeParam = `%${q}%`;

  const listQuery = `
    SELECT id, device_id, profile_id, profile_name, full_name, template, language,
           first_seen_at, last_synced_at, sync_count
    FROM cv_snapshots
    WHERE full_name LIKE ? OR profile_name LIKE ?
    ORDER BY ${sortColumn} ${dir}
    LIMIT ? OFFSET ?
  `;
  const countQuery = `SELECT COUNT(*) as total FROM cv_snapshots WHERE full_name LIKE ? OR profile_name LIKE ?`;

  const [listResult, countResult] = await Promise.all([
    env.DB.prepare(listQuery).bind(likeParam, likeParam, PAGE_SIZE, offset).all(),
    env.DB.prepare(countQuery).bind(likeParam, likeParam).first<{ total: number }>(),
  ]);

  return Response.json({
    rows: listResult.results,
    total: countResult?.total ?? 0,
    page,
    pageSize: PAGE_SIZE,
  });
};
