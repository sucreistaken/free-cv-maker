/**
 * Apply2Campus opens NextCV in two special modes:
 *   /?embed=a2c          the editor inside an A2C iframe ("edit")
 *   /?embed=a2c&print=1  only the CV pages, for headless PDF rendering ("print")
 * In both, nothing the user types may be persisted or sent anywhere.
 */
export type EmbedMode = 'edit' | 'print';

export function getEmbedMode(search: string): EmbedMode | null {
  const params = new URLSearchParams(search);
  if (params.get('embed') !== 'a2c') return null;
  return params.get('print') === '1' ? 'print' : 'edit';
}

/** Mode of the current page, fixed at load. Null outside a browser (tests) and in the normal app. */
export const currentEmbedMode: EmbedMode | null =
  typeof window !== 'undefined' ? getEmbedMode(window.location.search) : null;
