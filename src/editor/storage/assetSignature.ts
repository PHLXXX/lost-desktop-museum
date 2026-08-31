import { validateAssetBytes } from '../../packages/assetContentValidation'

export async function validateAssetFile(file: Pick<File, 'name' | 'type' | 'slice'>) {
  const bytes = new Uint8Array(await file.slice(0, 4096).arrayBuffer())
  return validateAssetBytes(file.name, file.type, bytes)
}
