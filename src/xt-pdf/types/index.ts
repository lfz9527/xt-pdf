import {
  type EventBus,
  type PDFViewer,
} from 'pdfjs-dist/web/pdf_viewer.mjs'
export type PdfBaseProps = {
  /**
   * pdf链接
   */
  url: string | URL
  /**
 * 是否开启流式加载模式, auto 为自动判断
 * @default auto
 */
  enableRange?: boolean | 'auto'
  /**
   * 布局样式
   */
  layoutStyle?: React.CSSProperties
  /**
   * 布局类名
   */
  layoutClassName?: string
}

export type PDFViewerProps = {
  // 文本层模式
  textLayerMode?: number
  // 注释层模式
  annotationMode?: number
  // 外部链接目标
  externalLinkTarget?: number
}

export type PDFDocumentAction = {
  /**
 * 文档加载完成回调
 * @param pdfViewer
 * @returns
 */
  onDocumentLoaded?: (pdfViewer: PDFViewer | null) => void

  /**
   * PDFjs EventBus 完成回调
   * @param eventBus
   * @returns
   */
  onEventBusReady?: (eventBus: EventBus | null) => void
}