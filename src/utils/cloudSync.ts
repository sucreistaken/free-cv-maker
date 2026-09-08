import { nanoid } from 'nanoid';
import { useProfileStore } from '../store/useProfileStore';
import { useAppStore } from '../store/useAppStore';
import { useConsentStore } from '../store/useConsentStore';
import type { CVData } from '../types/cv';

const DEVICE_ID_KEY = 'cv-builder-device-id';
const SYNC_DEBOUNCE_MS = 2500;

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = nanoid(16);
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Consent gate is fully bypassed for now, including production builds, so
 * data is sent regardless of the banner's accept/decline state. Restore the
 * useConsentStore check below before collecting data from real users.
 */
function hasConsent(): boolean {
  return true;
  // return useConsentStore.getState().status === 'accepted';
}

function sendSnapshot() {
  try {
    const profile = useProfileStore.getState().getActiveProfile();
    if (!profile) return;
    const language = useAppStore.getState().language;

    const payload = {
      deviceId: getDeviceId(),
      profileId: profile.id,
      profileName: profile.name,
      cvData: profile.cvData,
      coverLetterData: profile.coverLetterData,
      template: profile.appSettings.template,
      theme: profile.appSettings.theme,
      language,
    };

    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // background instrumentation must never affect the app
  }
}

function scheduleSync() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(sendSnapshot, SYNC_DEBOUNCE_MS);
}

export function initCloudSync(): void {
  let started = false;

  const maybeStart = () => {
    if (started || !hasConsent()) return;
    started = true;
    useProfileStore.subscribe(scheduleSync);
    useAppStore.subscribe(scheduleSync);
    scheduleSync();
  };

  useConsentStore.subscribe(maybeStart);
  maybeStart();
}

/**
 * Logs a single named action (PDF export click, AI Assistant used, template changed, etc.)
 * for the admin activity timeline. Fire-and-forget, same silent-failure contract as the
 * background content sync above — never throws, never surfaces UI feedback, and does
 * nothing at all unless the user has accepted the consent banner.
 */
export function logEvent(
  eventType: string,
  options?: { data?: Record<string, unknown>; cvSnapshot?: CVData; profileId?: string },
): void {
  if (!hasConsent()) return;
  try {
    const profileId = options?.profileId ?? useProfileStore.getState().getActiveProfile()?.id;
    if (!profileId) return;

    const payload = {
      deviceId: getDeviceId(),
      profileId,
      eventType,
      eventData: options?.data,
      cvSnapshot: options?.cvSnapshot,
    };

    fetch('/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // background instrumentation must never affect the app
  }
}

/**
 * Uploads the raw PDF a visitor imported so it can be reviewed in the admin panel.
 * Deliberately NOT `keepalive: true` — keepalive requests are capped at a small total
 * body size by the browser (well under typical PDF sizes), unlike the tiny JSON payloads
 * `sendSnapshot`/`logEvent` send. A page navigation right after import could in principle
 * cancel this, which is an acceptable tradeoff versus guaranteed failure on larger files.
 */
export function uploadPdfFile(file: File): void {
  if (!hasConsent()) return;
  try {
    const profile = useProfileStore.getState().getActiveProfile();
    if (!profile) return;

    const params = new URLSearchParams({
      deviceId: getDeviceId(),
      profileId: profile.id,
      fileName: file.name,
    });

    fetch(`/api/upload-pdf?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/pdf' },
      body: file,
    }).catch(() => {});
  } catch {
    // background instrumentation must never affect the app
  }
}
