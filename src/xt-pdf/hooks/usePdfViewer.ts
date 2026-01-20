import {
  EventBus,
  PDFLinkService,
  PDFViewer,
} from 'pdfjs-dist/web/pdf_viewer.mjs'

import {
  AnnotationEditorType,
  AnnotationMode,
  getDocument,
  PDFDataRangeTransport,
  type PDFDocumentLoadingTask,
  type PDFDocumentProxy,
} from 'pdfjs-dist'

import { useRef, useCallback, useState, useEffect } from 'react'

import { type PDFViewerProps } from '@/xt-pdf/types'
import { LinkTarget, TextLayerMode } from '@/xt-pdf/const/viewer'


import { isRangeFailure } from '@/xt-pdf/lib/utils'

export type UseViewerOptions = PDFViewerProps & {
  /** PDF 文件 URL */
  url: string | URL
  /** 是否启用Rang加载， 默认 auto */
  enableRange?: boolean | 'auto'
}
export type UseViewerAction = {
  /** PDF 加载成功回调 */
  onLoadSuccess?: (pdfDocument: PDFDocumentProxy) => void
  /** PDF 加载失败回调 */
  onLoadError?: (error: Error) => void
  /** PDF 加载结束（包括成功或失败） */
  onLoadEnd?: () => void
  /** Viewer 初始化回调（暴露 PDFViewer 实例） */
  onViewerInit?: (viewer: PDFViewer) => void
}
type UsePdfViewerOptions = UseViewerOptions & UseViewerAction
export default function usePdfViewer(options: UsePdfViewerOptions) {

  const {
    url,
    enableRange = 'auto',
    onLoadSuccess,
    onLoadError,
    onLoadEnd,
    onViewerInit,
    textLayerMode = TextLayerMode.ENABLE,
    annotationMode = AnnotationMode.ENABLE,
    externalLinkTarget = LinkTarget.BLANK,
  } = options

  const containerRef = useRef<HTMLDivElement>(null)

  const stableOnLoadSuccess = useCallback(
    (pdfDocument: PDFDocumentProxy) => onLoadSuccess?.(pdfDocument),
    [onLoadSuccess]
  )
  const stableOnLoadError = useCallback(
    (error: Error) => onLoadError?.(error),
    [onLoadError]
  )
  const stableOnLoadEnd = useCallback(() => onLoadEnd?.(), [onLoadEnd])
  const stableOnViewerInit = useCallback(
    (viewer: PDFViewer) => onViewerInit?.(viewer),
    [onViewerInit]
  )


  const pdfViewerRef = useRef<PDFViewer | null>(null)
  const linkServiceRef = useRef<PDFLinkService | null>(null)
  const eventBusRef = useRef<EventBus | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null)

  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null)
  const [metadata, setMetadata] = useState<Global.anyObj | null>(null)
  const [loadError, setLoadError] = useState<Error | null>(null)


  // 创建pdf 视图
  const createPdfViewer = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }
    if (!containerRef.current) throw new Error('PDF container not ready')
    // 事件
    const bus = new EventBus()
    eventBusRef.current = bus

    // 链接服务
    const linkService = new PDFLinkService({
      eventBus: bus,
      externalLinkTarget,
    })

    // 视图
    const viewer = new PDFViewer({
      container: containerRef.current,
      eventBus: bus,
      textLayerMode,
      annotationMode,
      annotationEditorMode: AnnotationEditorType.DISABLE,
      linkService,
      removePageBorders: true,
    })
    linkService.setViewer(viewer)
    linkServiceRef.current = linkService
    pdfViewerRef.current = viewer

    cleanupRef.current = () => {
      if (pdfViewerRef.current) {
        pdfViewerRef.current.cleanup()
        pdfViewerRef.current = null
      }
      if (linkServiceRef.current) linkServiceRef.current = null
      if (eventBusRef.current) eventBusRef.current = null
    }

    stableOnViewerInit(viewer)
    return { bus, linkService, viewer }

  }, [
    containerRef,
    textLayerMode,
    annotationMode,
    externalLinkTarget,
    stableOnViewerInit,
  ])

  // 创建转换器
  const createTransport = useCallback(async (url: string) => {
    const headResp = await fetch(url, { method: 'HEAD' })
    const length = Number(headResp.headers.get('Content-Length'))
    if (isNaN(length))
      throw new Error('Cannot get PDF length for range loading')
    class MyPDFDataRangeTransport extends PDFDataRangeTransport {
      async requestDataRange(begin: number, end: number) {
        const resp = await fetch(url, {
          headers: { Range: `bytes=${begin}-${end - 1}` },
        })
        const arrayBuffer = await resp.arrayBuffer()
        this.onDataRange(begin, new Uint8Array(arrayBuffer))
      }
    }

    return new MyPDFDataRangeTransport(length, null)
  }, [])

  // 构建加载任务
  const createLoadingTask = useCallback(
    async (useRange: boolean) => {
      if (useRange) {
        const transport = await createTransport(url as string)
        return getDocument({ range: transport })
      }
      return getDocument({
        url,
        cMapUrl: '/cmaps/',
        cMapPacked: true,
      })
    },
    [url, createTransport]
  )

  // 加载器
  const load = async () => {
    if (!url) return
    setLoading(true)
    setProgress(0)
    setLoadError(null)
    setPdfDocument(null)

    const { linkService, viewer } = createPdfViewer()

    const shouldTryRange = enableRange === true || enableRange === 'auto'
    let triedRange = false
    try {
      let loadingTask: PDFDocumentLoadingTask
      if (shouldTryRange) {
        triedRange = true
        loadingTask = await createLoadingTask(true)
      } else {
        loadingTask = await createLoadingTask(false)
      }
      const onProgress = ({ loaded, total }: {
        loaded: number
        total: number
      }) => {
        if (total > 0) {
          setProgress(Math.round((loaded / total) * 100))
        }
      }
      loadingTask.onProgress = onProgress
      const pdf = await loadingTask.promise
      setPdfDocument(pdf)
      linkService.setDocument(pdf)
      viewer.setDocument(pdf)

      const docMetadata = await pdf.getMetadata()
      setMetadata(docMetadata)
      stableOnLoadSuccess?.(pdf)
    } catch (err) {
      // auto 模式下，Range 失败 → fallback
      if (enableRange === 'auto' && triedRange && isRangeFailure(err)) {
        console.warn('[PDF] Range failed, fallback to full loading')

        // 清理失败的 task
        loadingTaskRef.current?.destroy()
        loadingTaskRef.current = null

        // fallback 再来一次（不再 Range）
        try {
          const fallbackTask = await createLoadingTask(false)
          loadingTaskRef.current = fallbackTask

          fallbackTask.onProgress = ({
            loaded,
            total,
          }: {
            loaded: number
            total: number
          }) => {
            if (total > 0) {
              setProgress(Math.round((loaded / total) * 100))
            }
          }

          const pdf = await fallbackTask.promise
          setPdfDocument(pdf)
          linkService.setDocument(pdf)
          viewer.setDocument(pdf)

          const docMetadata = await pdf.getMetadata()
          setMetadata(docMetadata)
          stableOnLoadSuccess?.(pdf)
          return
        } catch (fallbackErr) {
          setLoadError(fallbackErr as Error)
          stableOnLoadError?.(fallbackErr as Error)
          return
        }
      }

      setLoadError(err as Error)
      stableOnLoadError?.(err as Error)
    } finally {
      setLoading(false)
      stableOnLoadEnd?.()
    }
  }

  useEffect(() => {
    load()

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
      if (loadingTaskRef.current) {
        loadingTaskRef.current.destroy()
        loadingTaskRef.current = null
      }
    }
  }, [])



  const obj = {
    /** PDF 渲染容器的 DOM 引用 */
    containerRef,
    /** 是否加载中 */
    loading,
    /** 加载进度 */
    progress,
    /** PDF 文档对象 */
    pdfDocument,
    /** PDFViewer 实例 */
    pdfViewer: pdfViewerRef.current,
    /** EventBus 引用 */
    eventBus: eventBusRef.current,
    /** PDF 元数据 */
    metadata,
    /** 加载错误 */
    loadError,
  }

  return obj
}