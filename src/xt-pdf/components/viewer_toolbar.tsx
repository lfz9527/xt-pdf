import { useEffect, forwardRef, useImperativeHandle } from 'react'
import { PDFViewer } from 'pdfjs-dist/web/pdf_viewer.mjs'

import { useViewerContext } from '@/xt-pdf/context/viewContext'

import ZoomTool from '@/xt-pdf/tool/zoom'

import './viewer_toolbar.css'

type ToolbarAction = {
  /**
   * 页面切换事件
   * @param option
   * @returns
   */
  onPageChange?: (option: {
    pageNumber: number
    previous: number
    pdfViewer: PDFViewer
  }) => void
}

export type ViewerToolbarProps = ToolbarAction & {
  asSlot?: boolean
  children?: React.ReactNode | React.ReactNode[]
}

type ToolbarRef = {}

type ToolbarProps = Omit<ViewerToolbarProps, 'asSlot' | 'children'> &
  ToolbarAction

const toolbarHeight = 40
const Toolbar = ({ onPageChange }: ToolbarProps) => {
  const { pdfViewer } = useViewerContext()

  const initStyle = () => {
    if (!pdfViewer) return
    const container = pdfViewer.container
    container.style.top = `${toolbarHeight + 1}px`
  }

  const handlePageChange: ToolbarAction['onPageChange'] = (options) => {
    onPageChange?.(options)
  }

  useEffect(() => {
    initStyle()
    pdfViewer?.eventBus?.on('pagechanging', handlePageChange)
    return () => {
      pdfViewer?.eventBus?.off('pagechanging', handlePageChange)
    }
  }, [pdfViewer])

  return (
    <div
      className="viewer_toolbar-layout"
      style={
        { '--toolbar-height': `${toolbarHeight}px` } as React.CSSProperties
      }
    >
      <div className="viewer_toolbar-content">
        <ZoomTool />
      </div>
    </div>
  )
}

export const ViewerToolbar = forwardRef<ToolbarRef, ViewerToolbarProps>(
  ({ asSlot, children, ...props }, ref) => {
    useImperativeHandle(ref, () => ({
      toolbarHeight,
    }))

    return !asSlot ? <Toolbar {...props} /> : children
  },
)

ViewerToolbar.displayName = 'ViewerToolbar'
