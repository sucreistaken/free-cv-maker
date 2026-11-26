import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Check, Loader2, Save } from 'lucide-react';
import { SplitPane } from '../components/layout/SplitPane';
import { MobileTabBar } from '../components/layout/MobileTabBar';
import { EditorPanel } from '../components/editor/EditorPanel';
import { PreviewPanel } from '../components/preview/PreviewPanel';
import { ToastContainer } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { useAppStore } from '../store/useAppStore';
import { useCVStore } from '../store/useCVStore';
import { MSG_LOADED, MSG_READY, buildSaveMessage, readLoadMessage } from './messages';
import { allowedOrigins, applyEmbeddedCV, useEmbedStore } from './embedStore';

const SENT_FEEDBACK_MS = 2000;
/** Without an accepted `a2c:load` by then, say so: usually the A2C origin is not on the allow-list. */
const LOAD_TIMEOUT_MS = 10_000;

/**
 * `/?embed=a2c`: the normal editor and preview inside an Apply2Campus iframe,
 * Europass template forced, one action ("A2C'ye kaydet"). No profiles, import,
 * export, AI, sync or consent banner: the CV only travels back to the parent.
 */
export function EmbedApp() {
  const loaded = useEmbedStore((s) => s.loaded);
  const version = useEmbedStore((s) => s.version);
  const parentOrigin = useEmbedStore((s) => s.parentOrigin);
  const activeTab = useAppStore((s) => s.activeTab);
  const contentRef = useRef<HTMLDivElement>(null);
  const [sent, setSent] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const allowed = allowedOrigins();
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return;
      const cv = readLoadMessage(
        { origin: event.origin, data: event.data },
        { mode: 'edit', allowedOrigins: allowed, selfOrigin: window.location.origin },
      );
      if (cv) applyEmbeddedCV(cv, event.origin);
    };
    window.addEventListener('message', onMessage);
    // Carries no data, so any parent may hear it; the reply's origin is checked above.
    if (window.parent !== window) window.parent.postMessage({ type: MSG_READY }, '*');
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (loaded && parentOrigin) window.parent.postMessage({ type: MSG_LOADED }, parentOrigin);
  }, [loaded, version, parentOrigin]);

  useEffect(() => {
    if (loaded) return;
    const timer = setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loaded]);

  useEffect(() => {
    if (!sent) return;
    const timer = setTimeout(() => setSent(false), SENT_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [sent]);

  const handleSave = () => {
    if (!parentOrigin) return;
    window.parent.postMessage(buildSaveMessage(useCVStore.getState()), parentOrigin);
    setSent(true);
  };

  if (!loaded) {
    // The listener stays on: a late load still replaces this message with the editor.
    return (
      <div className="h-full flex items-center justify-center gap-2 px-4 bg-gray-50 text-sm text-gray-500 text-center">
        {timedOut ? (
          <>
            <AlertCircle size={16} className="shrink-0 text-amber-500" />
            CV verisi alınamadı. Sayfayı yenileyin.
          </>
        ) : (
          <>
            <Loader2 size={16} className="animate-spin" />
            CV yükleniyor…
          </>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <header className="h-12 shrink-0 flex items-center justify-between gap-3 px-3 sm:px-4 bg-white border-b border-gray-200">
        <span className="text-sm font-semibold text-gray-900 truncate">Europass CV (Almanca)</span>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={sent}>
          {sent ? <Check size={15} /> : <Save size={15} />}
          {sent ? 'Gönderildi' : "A2C'ye kaydet"}
        </Button>
      </header>
      <ToastContainer />

      <main className="flex flex-col flex-1 overflow-hidden">
        <div className="hidden md:flex flex-1 overflow-hidden">
          <SplitPane left={<EditorPanel showTheme={false} />} right={<PreviewPanel contentRef={contentRef} />} />
        </div>
        <div className="flex flex-col flex-1 overflow-hidden md:hidden">
          <MobileTabBar />
          <div className={activeTab === 'editor' ? 'flex-1 overflow-hidden' : 'hidden'}>
            <EditorPanel showTheme={false} />
          </div>
          <div className={activeTab === 'preview' ? 'flex-1 overflow-hidden' : 'hidden'}>
            <PreviewPanel contentRef={contentRef} />
          </div>
        </div>
      </main>
    </div>
  );
}
