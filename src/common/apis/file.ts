import request, { LONG_REQUEST_TIMEOUT } from '@@/utils/request'
import type { ResponseVO } from 'types/api'

/**
 * 文件服务接口。
 *
 * 上传结果里的 objectKey 才是可以长期保存的引用（如用户头像）；
 * previewUrl 是带签名的预签名地址，120 分钟后失效，不应写库。
 */
export interface FileResultVO {
  fileId: string
  /** 相对存储桶的路径，如 1/2026-11/uuid.jpg */
  objectKey: string
  /** 预签名地址，仅用于即时预览 */
  previewUrl?: string
  originalName?: string
  sizeBytes?: number
  contentType?: string
}

export function uploadFile(
  file: File | Blob,
  filename = 'file',
): Promise<ResponseVO<FileResultVO>> {
  const form = new FormData()
  form.append('file', file, filename)
  // 不显式设置 Content-Type：交给浏览器补 multipart boundary
  return request({
    url: '/file/upload',
    method: 'POST',
    data: form,
    // 上传走长超时，避免大图在默认 10s 被掐断
    timeout: LONG_REQUEST_TIMEOUT,
  })
}
