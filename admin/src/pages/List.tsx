import { useEffect, useState } from 'react';
import { fetchCvs, type CvListResponse, type SortKey } from '../api';

interface ListProps {
  onOpen: (id: string) => void;
}

const PAGE_SIZE = 25;

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'full_name', label: 'Ad' },
  { key: 'template', label: 'Şablon' },
  { key: 'sync_count', label: 'Senkron' },
  { key: 'last_synced_at', label: 'Son Senkron' },
];

export function List({ onOpen }: ListProps) {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [sort, setSort] = useState<SortKey>('last_synced_at');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CvListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Reset to page 1 whenever the filters change. Adjusted during render
  // (React's recommended pattern for derived state) rather than in an
  // effect, so it doesn't cost an extra render pass.
  const filterKey = `${debouncedQ}|${sort}|${dir}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard data-fetching effect: mark loading/clear error at fetch start
    setLoading(true);
    setError(null);
    fetchCvs({ q: debouncedQ, sort, dir, page })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, sort, dir, page]);

  const toggleSort = (key: SortKey) => {
    if (sort === key) {
      setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(key);
      setDir('desc');
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-gray-900">Senkronlanan CV'ler</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="İsme göre ara..."
          className="w-64 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className="text-left px-4 py-2.5 font-medium text-gray-600 cursor-pointer select-none hover:text-gray-900"
                >
                  {col.label}
                  {sort === col.key && (dir === 'asc' ? ' ↑' : ' ↓')}
                </th>
              ))}
              <th className="text-left px-4 py-2.5 font-medium text-gray-600">Dil</th>
            </tr>
          </thead>
          <tbody>
            {loading && !data && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Yükleniyor...
                </td>
              </tr>
            )}
            {data && data.rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
            {data?.rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onOpen(String(row.id))}
                className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-4 py-2.5 text-gray-900">{row.full_name || row.profile_name || '(isimsiz)'}</td>
                <td className="px-4 py-2.5 text-gray-600">{row.template}</td>
                <td className="px-4 py-2.5 text-gray-600">{row.sync_count}</td>
                <td className="px-4 py-2.5 text-gray-600">{new Date(row.last_synced_at).toLocaleString('tr-TR')}</td>
                <td className="px-4 py-2.5 text-gray-600 uppercase">{row.language}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.total > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>
            Toplam {data.total} kayıt · Sayfa {page}/{totalPages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40"
            >
              Önceki
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
