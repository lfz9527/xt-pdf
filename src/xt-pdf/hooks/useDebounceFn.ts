import { useCallback, useRef, useEffect } from 'react'

type anyFunc = (...args: any[]) => any

type Options = {
  delay?: number
}
const DEFAULT_DELAY = 100

export default function useDebounceFn<T extends anyFunc>(
  fn: T,
  options?: Options,
) {
  const { delay = DEFAULT_DELAY } = options || {}
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * 取消当前待执行的防抖调用
   */
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  /**
   * 防抖执行函数：每次调用都会重置定时器
   */
  const run = useCallback(
    (...args: Parameters<T>) => {
      // 清除上一次的定时器
      cancel()
      // 设置新的定时器，在 wait 毫秒后执行 fn
      timeoutRef.current = setTimeout(() => {
        fn(...args)
      }, delay)
    },
    [fn, delay, cancel],
  )

  // 组件卸载时自动清理定时器
  useEffect(() => {
    return () => {
      cancel()
    }
  }, [cancel])

  return { run, cancel }
}
