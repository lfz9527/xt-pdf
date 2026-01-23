import React from 'react'
import { Error } from '@/xt-pdf/icons'

export interface ErrorDisplayProps {
  error: Error
}

export const ViewerError: React.FC<ErrorDisplayProps> = ({ error }) => {
  return (
    <div className="viewer_error-layout">
      <div className="viewer_error-content">
        <Error size={48} style={{ color: '#e7000b' }} />
        <strong className="viewer_error-tip text-error text-[18px]">
          PDF加载失败
        </strong>
        <p className="viewer_error-message">{error?.message}</p>
      </div>
    </div>
  )
}
