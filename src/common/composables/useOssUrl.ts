import { ref } from 'vue'
import { getItem, setItem } from '@@/utils/storage'
import { CacheKey } from '@@/constants/cache-key'
import { get } from '@@/utils/request'
import type { ResponseVO } from 'types/api'

let ossUrlPromise: Promise<string> | null = null

function fetchOssUrl(): Promise<string> {
  const cached = getItem(CacheKey.OSS_URL) as string | null
  if (cached) return Promise.resolve(cached)

  if (!ossUrlPromise) {
    ossUrlPromise = get<string>('/system/config/getConfig/minio-domain')
      .then((res: ResponseVO<string>) => {
        setItem(CacheKey.OSS_URL, res.data)
        return res.data
      })
      .catch(() => {
        ossUrlPromise = null
        return ''
      })
  }
  return ossUrlPromise
}

export function useOssUrl() {
  const ossUrl = ref('')

  const cached = getItem(CacheKey.OSS_URL) as string | null
  if (cached) {
    ossUrl.value = cached
  } else {
    fetchOssUrl().then((url) => {
      ossUrl.value = url
    })
  }

  return { ossUrl }
}
