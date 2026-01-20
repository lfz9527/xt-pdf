import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

import * as pdfjsLib from 'pdfjs-dist'

// 设置 worker（必须！）
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();



createRoot(document.getElementById('root')!).render(
  // <StrictMode>

  // </StrictMode>,
  <App />
)
