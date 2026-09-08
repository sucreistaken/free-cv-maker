import { useEffect, useState } from 'react';
import { fetchActivity } from '../api';
import type { EventRow, EventType } from '../api';

interface ActivityProps {
  onOpenProfile: (snapshotId: string) => void;
}

const FILTERS: { key: EventType | 'all'; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'ai_opened', label: 'AI Asistanı' },
  { key: 'pdf_imported', label: 'PDF İçe Aktarma' },
  { key: 'template_changed', label: 'Şablon' },
  { key: 'profile_created', label: 'Yeni Profil' },
];

const EVENT_LABELS: Record<EventType, string> = {
  profile_created: 'yeni profil oluşturdu',
  profile_switched: 'profil değiştirdi',
  profile_deleted: 'profili sildi',
  content_checkpoint: 'içeriğini güncelledi',
  pdf_imported: 'PDF içe aktardı',
  pdf_export_clicked: 'PDF olarak dışa aktardı',
  json_exported: 'JSON olarak dışa aktardı',
  json_imported: 'JSON içe aktardı',
  ai_opened: "AI Asistanı'nı açtı",
  ai_prompt_copied: "AI prompt'unu kopyaladı",
  ai_applied: 'AI ile CV doldurdu',
  template_changed: 'şablon değiştirdi',
  language_changed: 'dil değiştirdi',
  reset_to_default: 'CV\'yi sıfırladı',
};

export function Activity({ onOpenProfile }: ActivityProps) {
  const [filter, setFilter] = useState<EventType | 'all'>('all');
  const [rows, setRows] = useState<EventRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard data-fetching effect
    setError(null);
    fetchActivity({ eventType: filter === 'all' ? undefined : filter })
      .then((res) => {
        if (!cancelled) setRows(res.rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
      });
    return () => {
      cancelled = true;
    };
  }, [filter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Canlı Aktivite
        </h1>
      </div>
      <p className="text-xs text-gray-400 mb-4">Tüm ziyaretçilerin en son eylemleri — son 50 kayıt.</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              filter === f.key
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-50">
        {!rows && !error && <div className="px-4 py-8 text-center text-gray-400 text-sm">Yükleniyor...</div>}
        {rows && rows.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">Kayıt bulunamadı.</div>
        )}
        {rows?.map((row) => (
          <div key={row.id} className="flex items-center gap-3 px-4 py-2.5">
            {row.snapshot_id != null ? (
              <button
                onClick={() => onOpenProfile(String(row.snapshot_id))}
                className="text-sm font-semibold text-gray-900 hover:text-primary"
              >
                {row.full_name || row.profile_name || '(isimsiz ziyaretçi)'}
              </button>
            ) : (
              <span className="text-sm font-semibold text-gray-400">
                {row.full_name || row.profile_name || '(isimsiz ziyaretçi)'}
              </span>
            )}
            <span className="text-sm text-gray-500 flex-1 min-w-0 truncate">
              {EVENT_LABELS[row.event_type] ?? row.event_type}
            </span>
            <span className="font-mono text-[11px] text-gray-300 flex-none">
              {new Date(row.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
