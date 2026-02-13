import { useEffect } from 'react';
import { Header } from './components/layout/Header';
import { SplitPane } from './components/layout/SplitPane';
import { MobileTabBar } from './components/layout/MobileTabBar';
import { EditorPanel } from './components/editor/EditorPanel';
import { PreviewPanel } from './components/preview/PreviewPanel';
import { useAppStore } from './store/useAppStore';
import { useCVStore } from './store/useCVStore';
import { useProfileStore } from './store/useProfileStore';
import { usePdfExport } from './hooks/usePdfExport';

function App() {
  const activeTab = useAppStore((s) => s.activeTab);
  const { contentRef, handlePrint } = usePdfExport();

  // Initialize profile system and sync stores
  useEffect(() => {
    useProfileStore.getState().initialize();
    useCVStore.getState()._syncFromProfile();
    useAppStore.getState()._syncFromProfile();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handlePrint]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <Header onPrint={handlePrint} />

      {/* Desktop: split pane */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <SplitPane
          left={<EditorPanel />}
          right={<PreviewPanel contentRef={contentRef} />}
        />
      </div>

      {/* Mobile: tab switching */}
      <div className="flex flex-col flex-1 overflow-hidden md:hidden">
        <MobileTabBar />
        <div className={activeTab === 'editor' ? 'flex-1 overflow-hidden' : 'hidden'}>
          <EditorPanel />
        </div>
        <div className={activeTab === 'preview' ? 'flex-1 overflow-hidden' : 'hidden'}>
          <PreviewPanel contentRef={contentRef} />
        </div>
      </div>
    </div>
  );
}

export default App;
