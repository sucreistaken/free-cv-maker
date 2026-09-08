/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const id = context.params.id;
  if (!id || Array.isArray(id)) {
    return new Response('Invalid id', { status: 400 });
  }

  const row = await context.env.DB
    .prepare('SELECT * FROM cv_snapshots WHERE id = ?')
    .bind(id)
    .first();

  if (!row) {
    return new Response('Not found', { status: 404 });
  }

  return Response.json(row);
};
