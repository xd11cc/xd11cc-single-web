import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * 文件上传接口契约。
 *
 * 关注两件容易接错的事：
 *  1) 必须用 multipart + 字段名 file（后端 @RequestParam("file")）；
 *  2) 必须走长超时，否则大图会被默认 10s 掐断。
 */

const requestMock = vi.fn(async () => ({ code: 200, msg: 'ok', data: { fileId: 'f1', objectKey: '1/2026-11/uuid.jpg' } }))

vi.mock('@@/utils/request', () => ({
  default: (...args: any[]) => requestMock(...args),
  LONG_REQUEST_TIMEOUT: 60_000,
}))

import { uploadFile } from '@@/apis/file'

describe('uploadFile', () => {
  beforeEach(() => {
    requestMock.mockClear()
  })

  it('以 multipart 形式 POST 到 /file/upload', async () => {
    const file = new File(['abc'], 'a.png', { type: 'image/png' })

    const res = await uploadFile(file)

    expect(res.data.objectKey).toBe('1/2026-11/uuid.jpg')
    const config = requestMock.mock.calls[0][0]
    expect(config.url).toBe('/file/upload')
    expect(config.method).toBe('POST')
    expect(config.data).toBeInstanceOf(FormData)
    expect((config.data as FormData).get('file')).toBeInstanceOf(File)
  })

  it('使用长超时（60s），不沿用默认 10s', async () => {
    await uploadFile(new File(['abc'], 'a.png', { type: 'image/png' }))
    expect(requestMock.mock.calls[0][0].timeout).toBe(60_000)
  })
})
