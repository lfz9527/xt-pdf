import { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import {
  EventBus,
  PDFLinkService,
  PDFViewer,
} from 'pdfjs-dist/web/pdf_viewer.mjs'


import { TextLayerMode, AnnotationMode, LinkTarget } from '@/xt-pdf/const/viewer'

import { isRangeFailure } from '@/xt-pdf/lib/utils'
import { isDev } from '@/xt-pdf/lib/env'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();


export type UseLoadPDFViewerOptions = {
  /** PDF 文件 URL */
  url: string | URL
  /** 是否启用Rang加载， 默认 auto */
  enableRange?: boolean | 'auto'
  // 文本层模式
  textLayerMode?: number
  // 注释层模式
  annotationMode?: number
  // 外部链接目标
  externalLinkTarget?: number
  /** PDF 加载成功回调 */
  onLoadSuccess?: (pdfDocument: pdfjsLib.PDFDocumentProxy) => void
  /** PDF 加载失败回调 */
  onLoadError?: (error: Error) => void
  /** PDF 加载结束（包括成功或失败） */
  onLoadEnd?: () => void
  /** Viewer 初始化回调（暴露 PDFViewer 实例） */
  onViewerInit?: (viewer: PDFViewer) => void
}
const useLoadPDFViewer = (options: UseLoadPDFViewerOptions) => {
  const {
    url,
    enableRange = 'auto',
    textLayerMode = TextLayerMode.ENABLE_PERMISSIONS,
    annotationMode = AnnotationMode.ENABLE,
    externalLinkTarget = LinkTarget.BLANK,
    onLoadSuccess,
    onLoadError,
    onLoadEnd,
    onViewerInit,
  } = options

  const containerRef = useRef<HTMLDivElement>(null)

  const pdfViewerRef = useRef<PDFViewer | null>(null)
  const linkServiceRef = useRef<PDFLinkService | null>(null)
  const eventBusRef = useRef<EventBus | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const loadingTaskRef = useRef<pdfjsLib.PDFDocumentLoadingTask | null>(null)

  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [metadata, setMetadata] = useState<Record<string, any> | null>(null)
  const [loadError, setLoadError] = useState<Error | null>(null)

  const devRenderRef = useRef(false)

  // 创建pdf 视图
  const createViewer = () => {
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
      annotationEditorMode: AnnotationMode.DISABLE,
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
    onViewerInit?.(viewer)
    return { bus, linkService, viewer }
  }

  // 创建转换器
  const createTransport = async (url: string) => {
    const headResp = await fetch(url, { method: 'HEAD' })
    const length = Number(headResp.headers.get('Content-Length'))
    if (isNaN(length))
      throw new Error('Cannot get PDF length for range loading')
    class MyPDFDataRangeTransport extends pdfjsLib.PDFDataRangeTransport {
      async requestDataRange(begin: number, end: number) {
        const resp = await fetch(url, {
          headers: { Range: `bytes=${begin}-${end - 1}` },
        })
        const arrayBuffer = await resp.arrayBuffer()
        this.onDataRange(begin, new Uint8Array(arrayBuffer))
      }
    }

    return new MyPDFDataRangeTransport(length, null)
  }

  // 构建加载任务
  const createLoadingTask = useCallback(
    async (useRange: boolean) => {
      if (useRange) {
        const transport = await createTransport(url as string)
        return pdfjsLib.getDocument({ range: transport })
      }
      return pdfjsLib.getDocument({
        url,
        cMapUrl: '/cmaps/',
        cMapPacked: true,
      })
    },
    [url, createTransport]
  )

  const handleLoad = async () => {
    if (!url) return
    setLoading(true)
    setProgress(0)
    setLoadError(null)
    setPdfDocument(null)

    const { linkService, viewer } = createViewer()
    const shouldTryRange = enableRange === true || enableRange === 'auto'
    let triedRange = false
    try {
      let loadingTask: pdfjsLib.PDFDocumentLoadingTask
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
      onLoadSuccess?.(pdf)
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
          onLoadSuccess?.(pdf)
          return
        } catch (fallbackErr) {
          setLoadError(fallbackErr as Error)
          onLoadError?.(fallbackErr as Error)
          return
        }
      }

      setLoadError(err as Error)
      onLoadError?.(err as Error)
    } finally {
      setLoading(false)
      onLoadEnd?.()
    }
  }

  useEffect(() => {
    // 处理严格模式时渲染了两次
    if (isDev && devRenderRef.current) return
    devRenderRef.current = true

    handleLoad()
    return () => {
      // 处理严格模式时渲染了两次
      if (isDev && devRenderRef.current) return

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

export default useLoadPDFViewer