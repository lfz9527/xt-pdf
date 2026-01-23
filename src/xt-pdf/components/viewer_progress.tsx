import { useState, useEffect, useRef } from 'react'

type Props = {
  progress: number
}
export function ViewerProgress({ progress = 100 }: Props) {
  const { visible, value } = useTransientProgress(progress, 1500)
  const x = 100 - value

  if (!visible) return null

  return (
    <div className="viewer_progress-layout">
      <div className="viewer_progress-rail">
        <div
          className="viewer_progress-track"
          style={{ transform: `translateX(${-x}%)` }}
        />
      </div>
    </div>
  )
}

function useTransientProgress(progress: number, hideDelay: number) {
  const [visible, setVisible] = useState(false)
  const [displayValue, setDisplayValue] = useState(progress)

  const hideTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastProgressRef = useRef(progress)

  useEffect(() => {
    if (progress === lastProgressRef.current) return
    lastProgressRef.current = progress

    setDisplayValue(progress)

    if (!visible) {
      setVisible(true)
    }

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
    }

    hideTimerRef.current = setTimeout(() => {
      setVisible(false)
      hideTimerRef.current = null
    }, hideDelay)
  }, [progress, hideDelay, visible])

  return {
    visible,
    value: displayValue,
  }
}
