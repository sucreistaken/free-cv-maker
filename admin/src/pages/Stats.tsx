import { useEffect, useState } from 'react';
import { fetchStats, type StatsResponse } from '../api';

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="text-2xl font-bold text-gray-900">{value.toLocaleString('tr-TR')}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}

function DistTable({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">{title}</h3>
      <div className="space-y-2">
        {rows.length === 0 && <div className="text-sm text-gray-400">Veri yok</div>}
        {rows.map((r) => (
          <div key={r.label} className="text-sm">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-gray-700">{r.label}</span>
              <span className="text-gray-400">{r.count}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${(r.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FunnelCard({ title, steps }: { title: string; steps: { label: string; count: number }[] }) {
  const first = steps[0]?.count || 1;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">{title}</h3>
      <div className="space-y-3">
        {steps.map((s, i) => {
          const pct = first > 0 ? Math.round((s.count / first) * 100) : 0;
          return (
            <div key={s.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-700">{s.label}</span>
                <span className="font-mono text-gray-400">
                  {s.count}
                  {i > 0 ? ` · %${pct}` : ''}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${i === 0 ? 'bg-primary' : 'bg-primary/40'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Stats() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Bilinmeyen hata'));
  }, []);

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>;
  }

  if (!data) {
    return <div className="text-gray-400 text-sm">Yükleniyor...</div>;
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-900 mb-4">İstatistikler</h1>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <Tile label="Toplam senkronlanan CV" value={data.totalSnapshots} />
        <Tile label="Toplam benzersiz cihaz" value={data.totalDevices} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <DistTable
          title="Şablona göre"
          rows={data.byTemplate.map((t) => ({ label: t.template, count: t.count }))}
        />
        <DistTable
          title="Dile göre"
          rows={data.byLanguage.map((l) => ({ label: l.language.toUpperCase(), count: l.count }))}
        />
      </div>

      <DistTable
        title="Son 30 günde yeni cihaz (güne göre)"
        rows={data.newDevicesByDay.map((d) => ({ label: d.day, count: d.count }))}
      />

      <div className="grid grid-cols-2 gap-4 mt-4">
        <FunnelCard
          title="AI Asistanı huni'si (son 30 gün)"
          steps={[
            { label: "AI Asistanı'nı açan", count: data.funnels.ai.opened },
            { label: "Prompt'u kopyalayan", count: data.funnels.ai.copied },
            { label: "CV'yi dolduran", count: data.funnels.ai.applied },
          ]}
        />
        <FunnelCard
          title="PDF İçe Aktarma huni'si (son 30 gün)"
          steps={[
            { label: 'PDF yükleyen', count: data.funnels.pdf.imported },
            { label: 'Sonrasında dışa aktaran', count: data.funnels.pdf.exportedAfter },
          ]}
        />
      </div>
    </div>
  );
}
