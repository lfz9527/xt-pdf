import { ViewContext } from '@/xt-pdf/context/viewContext'
import useLoadPDFViewer, {
  type UseLoadPDFViewerOptions,
} from '@/xt-pdf/hooks/useLoadPDFViewer'

import { type PDFDocumentAction } from '@/xt-pdf/types'

import DocumentLoad from './DocumentLoad'
import ViewerError from '@/xt-pdf/components/viewer_error'
import ViewerLoading from '@/xt-pdf/components/viewer_loading'
import ViewerProgress from '@/xt-pdf/components/viewer_progress'

import { cn } from '@/xt-pdf/lib/utils'

import 'pdfjs-dist/web/pdf_viewer.css'

export type ViewerProps = UseLoadPDFViewerOptions &
  PDFDocumentAction & {
    viewerCls?: string
    viewerStyle?: React.CSSProperties
    rootStyle?: React.CSSProperties
    rootCls?: string
    children?: React.ReactNode | React.ReactNode[]

    renderLoading?: (progress: number) => React.ReactNode
    renderError?: (error: Error | null) => React.ReactNode
    renderProgress?: (progress: number) => React.ReactNode
  }
function Viewer({
  viewerCls = '',
  rootCls = '',
  viewerStyle,
  rootStyle,
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
    loadError,
  } = useLoadPDFViewer({
    ...props,
  })

  const isReady = !!(pdfViewer && eventBus && containerRef.current && !loading)

  const errorComponent = () => {
    if (!loadError) return
    if (renderError) return renderError(loadError)
    return <ViewerError error={loadError} />
  }
  const loadingComponent = () => {
    if (!loading) return
    if (renderLoading) return renderLoading(progress)
    return <ViewerLoading loading={loading} progress={progress} />
  }

  return (
    <ViewContext.Provider value={{ pdfDocument, pdfViewer, eventBus, isReady }}>
      <div style={rootStyle} className={rootCls} id="xt-pdf">
        {/* 进度条 */}
        {renderProgress?.(progress) || <ViewerProgress progress={progress} />}
        {/* 加载状态 */}
        {loadingComponent()}
        {/* 错误状态 */}
        {errorComponent()}

        <div
          ref={containerRef}
          className={cn('xt-pdf_viewer', viewerCls)}
          style={viewerStyle}
        >
          <div className="pdfViewer"></div>
        </div>
        <DocumentLoad
          onDocumentLoaded={onDocumentLoaded}
          onEventBusReady={onEventBusReady}
        />
        {children}
      </div>
    </ViewContext.Provider>
  )
}

export default Viewer
