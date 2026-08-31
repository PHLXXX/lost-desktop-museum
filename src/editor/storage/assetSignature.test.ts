import { validateAssetFile } from './assetSignature'

function file(name: string, type: string, bytes: number[]) {
  return new File([new Uint8Array(bytes)], name, { type })
}

describe('validateAssetFile', () => {
  it('accepts an allowed type when extension, MIME and signature agree', async () => {
    const png = file('evidence.png', 'image/png', [137, 80, 78, 71, 13, 10, 26, 10, 0])
    await expect(validateAssetFile(png)).resolves.toMatchObject({ valid: true })
  })

  it('rejects disguised executable data and unsupported media', async () => {
    const disguised = file('evidence.png', 'image/png', [77, 90, 0, 0])
    const gif = file('animation.gif', 'image/gif', [71, 73, 70, 56, 57, 97])
    await expect(validateAssetFile(disguised)).resolves.toMatchObject({ valid: false, message: expect.stringContaining('文件签名') })
    await expect(validateAssetFile(gif)).resolves.toMatchObject({ valid: false, message: expect.stringContaining('扩展名') })
  })

  it('accepts UTF-8 Markdown and rejects binary text', async () => {
    const markdown = new File(['# 档案'], 'note.md', { type: 'text/markdown' })
    const binary = file('note.txt', 'text/plain', [65, 0, 66])
    await expect(validateAssetFile(markdown)).resolves.toMatchObject({ valid: true })
    await expect(validateAssetFile(binary)).resolves.toMatchObject({ valid: false })
  })
})
