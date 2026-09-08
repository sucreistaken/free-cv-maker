import { useEffect, useState } from 'react';
import { fetchCvDetail } from '../api';
import type { CvSnapshot, CVData } from '../types/cv';
import { Timeline } from './Timeline';
import { renderSection } from '../lib/renderCv';

type Tab = 'content' | 'timeline' | 'raw';

interface DetailProps {
  id: string;
  initialTab?: Tab;
  onBack: () => void;
}

export function Detail({ id, initialTab = 'content', onBack }: DetailProps) {
  const [row, setRow] = useState<CvSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>(initialTab);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard data-fetching effect: clear stale row/error before the new id loads
    setRow(null);
    setError(null);
    fetchCvDetail(id)
      .then(setRow)
      .catch((err) => setError(err instanceof Error ? err.message : 'Bilinmeyen hata'));
  }, [id]);

  if (error) {
    return (
      <div>
        <button onClick={onBack} className="text-sm text-primary mb-4">
          ← Listeye dön
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>
      </div>
    );
  }

  if (!row) {
    return (
      <div>
        <button onClick={onBack} className="text-sm text-primary mb-4">
          ← Listeye dön
        </button>
        <div className="text-gray-400 text-sm">Yükleniyor...</div>
      </div>
    );
  }

  let cv: CVData | null = null;
  try {
    cv = JSON.parse(row.cv_data) as CVData;
  } catch {
    cv = null;
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'content', label: 'İçerik' },
    { key: 'timeline', label: 'Zaman Çizelgesi' },
    { key: 'raw', label: 'Ham JSON' },
  ];

  return (
    <div>
      <button onClick={onBack} className="text-sm text-primary mb-4">
        ← Listeye dön
      </button>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">
            {row.full_name || row.profile_name || '(isimsiz)'}
          </h1>
          <span className="text-xs text-gray-400 uppercase">{row.template} · {row.language}</span>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          İlk görülme: {new Date(row.first_seen_at).toLocaleString('tr-TR')} · Son senkron:{' '}
          {new Date(row.last_synced_at).toLocaleString('tr-TR')} · {row.sync_count} kez senkronlandı
        </div>

        <div className="flex gap-1 mt-4 border-b border-gray-200">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors ${
                tab === t.key ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="pt-4">
          {tab === 'content' &&
            (cv ? (
              cv.sections.map((section) => renderSection(section, cv!))
            ) : (
              <p className="text-sm text-red-600">CV verisi ayrıştırılamadı.</p>
            ))}

          {tab === 'timeline' && <Timeline deviceId={row.device_id} profileId={row.profile_id} />}

          {tab === 'raw' && (
            <pre className="bg-gray-900 text-blue-100 rounded-lg p-3 text-xs overflow-x-auto max-h-96 overflow-y-auto">
              {JSON.stringify(cv, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
