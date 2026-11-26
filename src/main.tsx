import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { initCloudSync } from './utils/cloudSync'
import { currentEmbedMode } from './embed/mode'
import { startPrintListener } from './embed/printListener'
import { EmbedApp } from './embed/EmbedApp'
import { PrintApp } from './embed/PrintApp'
import './i18n'
import './index.css'
import App from './App.tsx'

// Embedded in Apply2Campus (/?embed=a2c, optionally &print=1): no sync, nothing leaves the browser.
if (!currentEmbedMode) initCloudSync()

if (currentEmbedMode === 'print') {
  document.documentElement.classList.add('nextcv-print')
  startPrintListener()
}

const Root = currentEmbedMode === 'print' ? PrintApp : currentEmbedMode === 'edit' ? EmbedApp : App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </StrictMode>,
)
