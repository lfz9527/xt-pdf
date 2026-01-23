import { Loading } from '@/xt-pdf/icons'
import { useState, useEffect, useRef } from 'react'

type Props = {
  loading: boolean
  progress: number
}
export function ViewerLoading({ loading, progress = 0 }: Props) {
  const showLoading = useDelayedLoading(loading, 500)

  if (!showLoading) return null
  return (
    <div className="viewer_loading-layout">
      <Loading size={48} />
      <div className="viewer_loading-message">PDF 加载中... {progress}%</div>
    </div>
  )
}

function useDelayedLoading(loading: boolean, delay: number) {
  const [visible, setVisible] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (loading) {
      timerRef.current = setTimeout(() => {
        setVisible(true)
      }, delay)
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      setVisible(false)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [loading, delay])

  return visible
}
