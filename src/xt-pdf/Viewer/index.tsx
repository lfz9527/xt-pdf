import { ViewContext } from "@/xt-pdf/context/viewContext"
import useLoadPDFViewer, { type UseLoadPDFViewerOptions } from '@/xt-pdf/hooks/useLoadPDFViewer'

import { type PDFDocumentAction } from '@/xt-pdf/types'

import DocumentLoad from './DocumentLoad'

import 'pdfjs-dist/web/pdf_viewer.css'
import './index.css'

export type ViewerProps = UseLoadPDFViewerOptions & PDFDocumentAction & {
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode | React.ReactNode[],

  renderLoading?: (progress: number) => React.ReactNode
  renderError?: (error: Error | null) => React.ReactNode
  renderProgress?: (progress: number) => React.ReactNode
}
function Viewer({
  className = '',
  style,
  children,

  onDocumentLoaded,
  onEventBusReady,

  renderLoading,
  renderError,
  renderProgress,

  ...props
}: ViewerProps) {

  const {
    containerRef,
    loading,
    progress,
    pdfDocument,
    pdfViewer,
    eventBus,
    loadError
  } = useLoadPDFViewer({
    ...props
  })

  const isReady = !!(pdfViewer && eventBus && containerRef.current && !loading)

  return (
    <ViewContext.Provider value={{ pdfDocument, pdfViewer, eventBus, isReady }} >
      <div
        style={style}
        id='xt-pdf'
      >
        {renderProgress?.(progress)}
        {loading ? renderLoading?.(progress) : ''}
        {renderError?.(loadError)}
        <div ref={containerRef} className={`xt-pdf_viewer ${className}`}>
          <div className='pdfViewer'></div>
        </div>
        <DocumentLoad
          onDocumentLoaded={onDocumentLoaded}
          onEventBusReady={onEventBusReady}
        />
        {children}
      </div>
    </ ViewContext.Provider>
  );
}

export default Viewer;

