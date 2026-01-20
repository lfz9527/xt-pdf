/**
 * 检查错误是否为 Range 加载失败
 * @param error 错误对象
 * @returns 是否为 Range 加载失败
 */
export function isRangeFailure(error: unknown) {
  if (!(error instanceof Error)) return false

  const msg = error.message.toLowerCase()

  return (
    msg.includes('range') ||
    msg.includes('content-length') ||
    msg.includes('unexpected server response') ||
    msg.includes('cors')
  )
}