import { useEffect } from 'react';

import { useViewerContext } from "@/xt-pdf/context/viewContext"
import { type PDFDocumentAction } from '@/xt-pdf/types'

function DocumentLoad({ onDocumentLoaded, onEventBusReady }: PDFDocumentAction) {
  const { isReady, pdfViewer, eventBus } = useViewerContext()

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

  return <></>
}
export default DocumentLoad