import { PdfViewProvider } from '@/xt-pdf/context/PdfViewProvider'

import usePdfViewer, { type UseViewerOptions } from '@/xt-pdf/hooks/usePdfViewer'

import './PdfViewProvider.css'

export type PdfViewerProviderProps = UseViewerOptions & {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}


export default function PdfProvider(props: PdfViewerProviderProps) {
  const {
    children,
    style,
    url,
    ...rest
  } = props

  const {
    containerRef,
    loading,
    // @TODO: 处理progress
    // progress,
    pdfDocument,
    pdfViewer,
    eventBus,
    // @TODO: 处理loadError
    // loadError
  } = usePdfViewer({
    url,
    ...rest
  })

  const isReady = !!(pdfViewer && eventBus && containerRef.current && !loading)


  return (
    <PdfViewProvider.Provider value={{ pdfDocument, pdfViewer, eventBus, isReady }}>
      <div
        style={style}
        id='xt-pdf'
      >
        {/* @TODO: 处理进度条 */}
        {/* @TODO: 处理loading */}
        {/* @TODO: 处理loadError */}
        <div ref={containerRef} className='xt-pdf_viewer'>
          <div className='pdfViewer'></div>
        </div>
        {children}
      </div>
    </PdfViewProvider.Provider>
  )
}