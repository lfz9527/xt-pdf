import { createContext, useContext } from 'react'
import { type PDFDocumentProxy } from 'pdfjs-dist'
import {
  type EventBus,
  type PDFViewer,
} from 'pdfjs-dist/web/pdf_viewer.mjs'


/**
 * 定义通过 Context 提供给所有子组件的值
 */
export interface PdfContextValue {
  /** PDF 文档对象 */
  pdfDocument: PDFDocumentProxy | null
  /** PDFViewer 实例 */
  pdfViewer: PDFViewer | null
  /** EventBus 实例 */
  eventBus: EventBus | null
  /** PDF 核心实例是否都已准备就绪，可以安全地进行交互 */
  isReady: boolean
}

// 创建 Context
export const ViewContext = createContext<PdfContextValue | null>(null)


export const useViewerContext = (): PdfContextValue => {
  const context = useContext(ViewContext)
  if (!context) {
    throw new Error(
      'useViewerContext must be used within a ViewContext'
    )
  }
  return context
}
