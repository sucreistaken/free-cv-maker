/// <reference types="@cloudflare/workers-types" />

interface Env {
  UPLOADS: R2Bucket;
}

// A plain `?key=` query param, not a `[key].ts` dynamic path segment — the R2 key
// contains slashes (pdf/{deviceId}/{profileId}/{file}.pdf), which a single Pages
// Functions path segment can't capture. Only ever reachable through the Access-gated
// admin app; there is no public R2 URL for these files.
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const key = new URL(request.url).searchParams.get('key');

  if (!key || !key.startsWith('pdf/')) {
    return new Response('Invalid key', { status: 400 });
  }

  const object = await env.UPLOADS.get(key);
  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType ?? 'application/pdf',
      'Content-Disposition': 'inline',
      'Cache-Control': 'private, max-age=300',
    },
  });
};
