/// <reference types="@cloudflare/workers-types" />
import { jwtVerify, createRemoteJWKSet } from 'jose';

interface Env {
  DB: D1Database;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUD?: string;
}

const ALLOWED_EMAIL = 'kadiraycareer@gmail.com';

let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let cachedTeamDomain: string | null = null;

function getJwks(teamDomain: string) {
  if (!cachedJwks || cachedTeamDomain !== teamDomain) {
    cachedJwks = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`));
    cachedTeamDomain = teamDomain;
  }
  return cachedJwks;
}

/**
 * Defense-in-depth only. The primary protection is the Cloudflare Access
 * application configured at the edge for the whole admin.nextcv.net hostname
 * (see docs/ notes) — an unauthenticated request never reaches this code in
 * production. This middleware independently re-checks the Access JWT so a
 * misconfigured/removed Access policy doesn't silently leave the API open.
 *
 * ACCESS_TEAM_DOMAIN / ACCESS_AUD are only known after Access is set up in the
 * Cloudflare dashboard — until they're configured (e.g. local dev), requests
 * pass through unchecked with a loud warning rather than locking out local
 * testing, since Access itself never reaches localhost anyway.
 */
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;

  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) {
    console.warn(
      '[admin] ACCESS_TEAM_DOMAIN/ACCESS_AUD not configured — this middleware is NOT enforcing auth. ' +
        'Make sure Cloudflare Access is configured for this hostname before relying on this in production.',
    );
    return next();
  }

  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const jwks = getJwks(env.ACCESS_TEAM_DOMAIN);
    const { payload } = await jwtVerify(token, jwks, { audience: env.ACCESS_AUD });
    if (payload.email !== ALLOWED_EMAIL) {
      return new Response('Forbidden', { status: 403 });
    }
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }

  return next();
};
