/* eslint-disable @typescript-eslint/no-explicit-any */

declare namespace Global {
  // 每个类型里面的字段都变成非必填，但是可以排除某些字段
  type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>

  type anyObj<V = any> = Record<string, V>

  // 深度部分可选类型
  type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object
    ? T[K] extends (...args: any[]) => any
    ? T[K]
    : DeepPartial<T[K]>
    : T[K]
  }
}
