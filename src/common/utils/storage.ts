// 1、存储数据
export const setItem = <T>(key: string, value: T) => {
  if (typeof value === 'string') {
    // 字符串：直接存入 localStorage
    window.localStorage.setItem(key, value)
  } else {
    // 非字符串：JSON 序列化后存储（支持对象、数组、数字、布尔等）
    window.localStorage.setItem(key, JSON.stringify(value))
  }
}
// 2、获取数据
export const getItem = <T = any>(key: string): T | string | null => {
  const data = window.localStorage.getItem(key)
  if (!data) return null
  try {
    return JSON.parse(data) as T // 解析为指定类型
  } catch (error) {
    return data // 解析失败时返回原始字符串
  }
}
// 3、删除指定数据
export const removeItem = (key: string) => {
  window.localStorage.removeItem(key)
}
// 4、删除所有数据
export const removeAllItem = () => {
  window.localStorage.clear()
}
