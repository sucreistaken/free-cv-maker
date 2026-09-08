import type { CvSnapshot } from './types/cv';

export interface CvListResponse {
  rows: CvSnapshot[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StatsResponse {
  totalSnapshots: number;
  totalDevices: number;
  byTemplate: { template: string; count: number }[];
  byLanguage: { language: string; count: number }[];
  newDevicesByDay: { day: string; count: number }[];
  funnels: {
    ai: { opened: number; copied: number; applied: number };
    pdf: { imported: number; exportedAfter: number };
  };
}

export type EventType =
  | 'profile_created'
  | 'profile_switched'
  | 'profile_deleted'
  | 'content_checkpoint'
  | 'pdf_imported'
  | 'pdf_export_clicked'
  | 'json_exported'
  | 'json_imported'
  | 'ai_opened'
  | 'ai_prompt_copied'
  | 'ai_applied'
  | 'template_changed'
  | 'language_changed'
  | 'reset_to_default';

export interface EventRow {
  id: number;
  device_id: string;
  profile_id: string;
  event_type: EventType;
  event_data: string | null;
  cv_snapshot?: string | null;
  pdf_r2_key: string | null;
  user_agent?: string | null;
  created_at: string;
  snapshot_id?: number | null;
  full_name?: string | null;
  profile_name?: string | null;
}

export interface TimelineResponse {
  rows: EventRow[];
}

export interface ActivityResponse {
  rows: EventRow[];
  page: number;
  pageSize: number;
}

export type SortKey = 'last_synced_at' | 'template' | 'sync_count' | 'full_name';

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Request to ${url} failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export function fetchCvs(params: {
  q?: string;
  sort?: SortKey;
  dir?: 'asc' | 'desc';
  page?: number;
}): Promise<CvListResponse> {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.sort) search.set('sort', params.sort);
  if (params.dir) search.set('dir', params.dir);
  if (params.page) search.set('page', String(params.page));
  return getJson(`/api/admin/cvs?${search.toString()}`);
}

export function fetchCvDetail(id: string): Promise<CvSnapshot> {
  return getJson(`/api/admin/cvs/${encodeURIComponent(id)}`);
}

export function fetchStats(): Promise<StatsResponse> {
  return getJson('/api/admin/stats');
}

export function fetchTimeline(deviceId: string, profileId: string): Promise<TimelineResponse> {
  const search = new URLSearchParams({ deviceId, profileId });
  return getJson(`/api/admin/timeline?${search.toString()}`);
}

export function fetchActivity(params: { eventType?: EventType; page?: number }): Promise<ActivityResponse> {
  const search = new URLSearchParams();
  if (params.eventType) search.set('eventType', params.eventType);
  if (params.page) search.set('page', String(params.page));
  return getJson(`/api/admin/activity?${search.toString()}`);
}

export function pdfDownloadUrl(key: string): string {
  return `/api/admin/pdf?key=${encodeURIComponent(key)}`;
}
