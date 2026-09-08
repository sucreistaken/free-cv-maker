import { useEffect, useState } from 'react';
import { fetchTimeline, pdfDownloadUrl } from '../api';
import type { EventRow, EventType } from '../api';
import type { CVData } from '../types/cv';
import { renderSection } from '../lib/renderCv';

interface TimelineProps {
  deviceId: string;
  profileId: string;
}

const EVENT_LABELS: Record<EventType, string> = {
  profile_created: 'Profil oluşturuldu',
  profile_switched: 'Profil değiştirildi',
  profile_deleted: 'Profil silindi',
  content_checkpoint: 'İçerik güncellendi (kontrol noktası)',
  pdf_imported: 'PDF içe aktardı',
  pdf_export_clicked: 'PDF olarak dışa aktardı',
  json_exported: 'JSON olarak dışa aktardı',
  json_imported: 'JSON içe aktardı',
  ai_opened: "AI Asistanı'nı açtı",
  ai_prompt_copied: "AI prompt'unu kopyaladı",
  ai_applied: 'AI ile CV dolduruldu',
  template_changed: 'Şablon değiştirdi',
  language_changed: 'Dil değiştirdi',
  reset_to_default: 'Varsayılana sıfırladı',
};

const CATEGORY_CLASSES: Record<string, string> = {
  blue: 'bg-primary/10 text-primary',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-700',
  slate: 'bg-gray-100 text-gray-500',
};

const EVENT_CATEGORY: Record<EventType, keyof typeof CATEGORY_CLASSES> = {
  ai_opened: 'blue',
  ai_prompt_copied: 'blue',
  ai_applied: 'blue',
  pdf_imported: 'emerald',
  pdf_export_clicked: 'emerald',
  json_exported: 'emerald',
  json_imported: 'emerald',
  template_changed: 'amber',
  language_changed: 'amber',
  reset_to_default: 'amber',
  profile_created: 'slate',
  profile_switched: 'slate',
  profile_deleted: 'slate',
  content_checkpoint: 'slate',
};

function formatDetail(row: EventRow): string | null {
  if (!row.event_data) return null;
  try {
    const data = JSON.parse(row.event_data) as Record<string, unknown>;
    if ('from' in data && 'to' in data) return `${data.from} → ${data.to}`;
    if ('fileName' in data) return String(data.fileName);
    if ('outputLanguage' in data) return `Çıktı dili: ${data.outputLanguage === 'en' ? 'İngilizce' : 'Türkçe'}`;
    return null;
  } catch {
    return null;
  }
}

function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function EventEntry({ row }: { row: EventRow }) {
  const [expanded, setExpanded] = useState(false);
  const label = EVENT_LABELS[row.event_type] ?? row.event_type;
  const category = EVENT_CATEGORY[row.event_type] ?? 'slate';
  const detail = formatDetail(row);
  const time = new Date(row.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  let cv: CVData | null = null;
  if (row.cv_snapshot) {
    try {
      cv = JSON.parse(row.cv_snapshot) as CVData;
    } catch {
      cv = null;
    }
  }

  return (
    <div className="flex gap-3 pb-4">
      <div className={`flex-none w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${CATEGORY_CLASSES[category]}`}>
        •
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-gray-900">{label}</span>
          <span className="font-mono text-[11px] text-gray-400 flex-none">{time}</span>
        </div>
        {detail && <div className="text-xs text-gray-400 mt-0.5">{detail}</div>}
        {row.event_type === 'pdf_imported' && row.pdf_r2_key && (
          <a
            href={pdfDownloadUrl(row.pdf_r2_key)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-primary mt-1 inline-block"
          >
            Dosyayı görüntüle →
          </a>
        )}
        {cv && (
          <>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs font-semibold text-primary mt-1 block"
            >
              {expanded ? 'İçeriği gizle ▲' : 'O andaki içeriği gör ▼'}
            </button>
            {expanded && (
              <div className="mt-2 bg-gray-50 border border-gray-100 rounded-lg p-3">
                {cv.sections.map((section) => renderSection(section, cv!))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function Timeline({ deviceId, profileId }: TimelineProps) {
  const [rows, setRows] = useState<EventRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard data-fetching effect
    setRows(null);
    setError(null);
    fetchTimeline(deviceId, profileId)
      .then((res) => setRows(res.rows))
      .catch((err) => setError(err instanceof Error ? err.message : 'Bilinmeyen hata'));
  }, [deviceId, profileId]);

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>;
  }
  if (!rows) {
    return <div className="text-gray-400 text-sm">Yükleniyor...</div>;
  }
  if (rows.length === 0) {
    return <div className="text-gray-400 text-sm">Henüz kaydedilmiş bir olay yok.</div>;
  }

  const groups: { day: string; items: EventRow[] }[] = [];
  for (const row of rows) {
    const key = dayKey(row.created_at);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.day === key) {
      lastGroup.items.push(row);
    } else {
      groups.push({ day: key, items: [row] });
    }
  }

  return (
    <div>
      {groups.map((group) => (
        <div key={group.day}>
          <div className="font-mono text-[10.5px] font-semibold uppercase tracking-wide text-gray-400 mb-2 mt-4 first:mt-0">
            {group.day}
          </div>
          {group.items.map((row) => (
            <EventEntry key={row.id} row={row} />
          ))}
        </div>
      ))}
    </div>
  );
}
