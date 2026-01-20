// src/components/PdfViewer.tsx
import React, { useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { EventBus, PDFViewer } from 'pdfjs-dist/web/pdf_viewer.mjs';
import 'pdfjs-dist/web/pdf_viewer.css'
import './xt-pdf/Viewer/PdfViewProvider.css'
// 设置 worker（必须！）
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

interface PdfViewerProps {
  url: string; // PDF 文件路径，如 '/sample.pdf'
}

const PdfViewer: React.FC<PdfViewerProps> = ({ url }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<PDFViewer | null>(null);
  const eventBusRef = useRef<EventBus | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      console.warn('PDF container not ready');
      return;
    }

    console.log('container', container);


    // 清理之前的实例（避免重复创建）
    if (viewerRef.current) {
      viewerRef.current?.destroy?.();
    }

    // 创建 EventBus 和 PDFViewer
    const eventBus = new EventBus();
    const viewer = new PDFViewer({
      container,
      eventBus,
      textLayerMode: 2, // 启用文本图层（可复制）
      annotationMode: 2, // 启用注解（如链接）
    });

    viewerRef.current = viewer;
    eventBusRef.current = eventBus;

    // 加载 PDF
    const loadingTask = pdfjsLib.getDocument(url);
    loadingTask.promise
      .then((pdfDocument) => {
        viewer.setDocument(pdfDocument);
      })
      .catch((error) => {
        console.error('Failed to load PDF:', error);
        // 可以在这里设置错误状态
      });

    // 清理函数
    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [url]);

  return (
    // <div
    //   ref={containerRef}
    //   style={{
    //     width: '100%',
    //     height: '800px',
    //     overflow: 'auto',
    //     border: '1px solid #ddd',
    //     backgroundColor: '#f0f0f0',
    //   }}
    // />
    <div ref={containerRef} className='xt-pdf_viewer'>
      <div className='pdfViewer'></div>
    </div>
  );
};

export default PdfViewer;