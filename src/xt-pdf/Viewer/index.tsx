import { useEffect } from 'react'

import { usePdfViewerContext } from '@/xt-pdf/context/PdfViewProvider'
import PdfViewProvider from './PdfViewProvider'

import { type UseViewerOptions, type UseViewerAction } from '@/xt-pdf/hooks/usePdfViewer'
import { type PdfBaseProps, type PDFDocumentAction } from '@/xt-pdf/types'

type ViewerProps = PdfBaseProps & PDFDocumentAction & UseViewerOptions & UseViewerAction & {
  children?: React.ReactNode | React.ReactNode[]
}
const Viewer = (props: ViewerProps) => {
  const {
    children,
    layoutClassName,
    layoutStyle,
    url,
    enableRange,

    onDocumentLoaded,
    onEventBusReady,

    ...rest
  } = props

  return (
    <PdfViewProvider
      className={layoutClassName}
      style={layoutStyle}
      url={url}
      enableRange={enableRange}
      {...rest}
    >
      <Index onDocumentLoaded={onDocumentLoaded} onEventBusReady={onEventBusReady} />
      {children}
    </PdfViewProvider>
  )
}

export default Viewer


function Index({ onDocumentLoaded, onEventBusReady }: PDFDocumentAction) {
  const { isReady, pdfViewer, eventBus } = usePdfViewerContext()

  useEffect(() => {
    if (!isReady || !pdfViewer || !eventBus) return
    onEventBusReady?.(eventBus)

    const handleDocumentLoaded = async () => {
      onDocumentLoaded?.(pdfViewer)
    }

    if (pdfViewer.pdfDocument) {
      handleDocumentLoaded()
    } else {
      eventBus.on('documentloaded', handleDocumentLoaded)
    }

    return () => {
      eventBus.off('documentloaded', handleDocumentLoaded)
    }
  }, [isReady, pdfViewer, eventBus])

  useEffect(() => { }, [])
  return <></>
}