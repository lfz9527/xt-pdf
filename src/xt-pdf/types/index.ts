import { EventBus, PDFViewer } from 'pdfjs-dist/web/pdf_viewer.mjs'

export type PdfScale =
  | 'auto'
  | 'page-actual'
  | 'page-fit'
  | 'page-width'
  | string

export type ViewerProps = {
  url: string // PDF 文件路径，如 '/sample.pdf'
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
