import { useEffect, useState } from 'react';
import { List } from './pages/List';
import { Detail } from './pages/Detail';
import { Stats } from './pages/Stats';
import { Activity } from './pages/Activity';

type View = 'list' | 'stats' | 'activity';

interface Route {
  view: View;
  id: string | null;
  tab: string | null;
}

function readRoute(): Route {
  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get('view');
  const view: View = viewParam === 'stats' || viewParam === 'activity' ? viewParam : 'list';
  return { view, id: params.get('id'), tab: params.get('tab') };
}

function pushRoute(route: Route) {
  const params = new URLSearchParams();
  if (route.view !== 'list') params.set('view', route.view);
  if (route.id) params.set('id', route.id);
  if (route.tab) params.set('tab', route.tab);
  const qs = params.toString();
  window.history.pushState({}, '', qs ? `?${qs}` : window.location.pathname);
}

export default function App() {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const onPop = () => setRoute(readRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (next: Route) => {
    pushRoute(next);
    setRoute(next);
  };

  const navItems: { view: View; label: string }[] = [
    { view: 'list', label: "CV'ler" },
    { view: 'activity', label: 'Aktivite' },
    { view: 'stats', label: 'İstatistikler' },
  ];

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-gray-900">NextCV Admin</span>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.view}
                  onClick={() => navigate({ view: item.view, id: null, tab: null })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    route.view === item.view ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {route.view === 'stats' && <Stats />}

        {route.view === 'activity' &&
          (route.id ? (
            <Detail
              id={route.id}
              initialTab={route.tab === 'timeline' ? 'timeline' : 'content'}
              onBack={() => navigate({ view: 'activity', id: null, tab: null })}
            />
          ) : (
            <Activity onOpenProfile={(id) => navigate({ view: 'activity', id, tab: 'timeline' })} />
          ))}

        {route.view === 'list' &&
          (route.id ? (
            <Detail id={route.id} initialTab="content" onBack={() => navigate({ view: 'list', id: null, tab: null })} />
          ) : (
            <List onOpen={(id) => navigate({ view: 'list', id, tab: null })} />
          ))}
      </main>
    </div>
  );
}
