import { ViewContext } from '@/xt-pdf/context/viewContext'
import useLoadPDFViewer, {
  type UseLoadPDFViewerOptions,
} from '@/xt-pdf/hooks/useLoadPDFViewer'

import { type PdfScale, type PDFDocumentAction } from '@/xt-pdf/types'

import DocumentLoad from './DocumentLoad'
import { ViewerError, ViewerLoading, ViewerProgress } from '@/xt-pdf/components'

import { cn } from '@/xt-pdf/lib/utils'
import useDebounceFn from '@/xt-pdf/hooks/useDebounceFn'

import 'pdfjs-dist/web/pdf_viewer.css'
import { useEffect } from 'react'

export type ViewerProps = UseLoadPDFViewerOptions &
  PDFDocumentAction & {
    viewerCls?: string
    viewerStyle?: React.CSSProperties
    rootStyle?: React.CSSProperties
    rootCls?: string
    children?: React.ReactNode | React.ReactNode[]
    scale?: PdfScale

    toolbar?: React.ReactNode

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
  scale = 'auto',

  toolbar,

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

  // 自动resize时适配缩放比例
  const { run: autoFit } = useDebounceFn(
    () => {
      if (!pdfViewer || !eventBus) {
        return
      }
      const curScaleVal = pdfViewer.currentScaleValue
      const resizeScaleVals = ['page-fit', 'page-width']
      const isResizeScaleVal = resizeScaleVals.includes(curScaleVal)
      if (isResizeScaleVal) {
        pdfViewer.currentScaleValue = curScaleVal
      }
      pdfViewer.update()
    },
    { delay: 100 },
  )

  // 初始化缩放比例
  useEffect(() => {
    if (!pdfViewer || !eventBus) return

    // 监听容器变化，自动适配缩放比例
    const container = pdfViewer.container
    const observer = new ResizeObserver(autoFit)
    observer.observe(container)

    // 监听文档加载完成事件，设置初始缩放比例
    const handlePagesLoaded = () => {
      pdfViewer.currentScaleValue = scale
    }

    eventBus.on('pagesloaded', handlePagesLoaded)
    return () => {
      observer.disconnect()
      eventBus.off('pagesloaded', handlePagesLoaded)
    }
  }, [pdfViewer, eventBus, scale])

  // 错误组件
  const errorComponent = () => {
    if (!loadError) return
    if (renderError) return renderError(loadError)
    return <ViewerError error={loadError} />
  }
  // 加载组件
  const loadingComponent = () => {
    if (!loading) return
    if (renderLoading) return renderLoading(progress)
    return <ViewerLoading loading={loading} progress={progress} />
  }
  return (
    <ViewContext.Provider value={{ pdfDocument, pdfViewer, eventBus, isReady }}>
      <div className="xt-pdf_wrapper">
        <div style={rootStyle} className={rootCls} id="xt-pdf">
          {toolbar}

          {/* 加载状态 */}
          {loadingComponent()}

          {/* 错误状态 */}
          {errorComponent()}
          {/* 进度条 */}
          {renderProgress?.(progress) || <ViewerProgress progress={progress} />}
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
        </div>
      </div>
    </ViewContext.Provider>
  )
}

export default Viewer
