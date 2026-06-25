// TRN-22: client-side image compression for pasted answer-option images.
//
// Question creators (guru / admin-soal) can paste a screenshot directly into an
// answer option. Raw clipboard images are often several megabytes, which would
// bloat the question payload, so we resize + re-encode them to a small JPEG/PNG
// data URL (ideally < ~100 KB) before storing in component state.

export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']

export interface CompressOptions {
  maxDimension?: number // longest side in px (default 800)
  maxBytes?: number     // target encoded size in bytes (default 100 KB)
  mimeType?: string     // output type (default 'image/jpeg')
}

/** Pull the first image File out of a clipboard paste event, or null. */
export function getImageFromClipboard(e: ClipboardEvent | React.ClipboardEvent): File | null {
  const items = (e as ClipboardEvent).clipboardData?.items
  if (!items) return null
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) return file
    }
  }
  return null
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Gambar tidak dapat dibaca.'))
    img.src = src
  })
}

function readFileAsDataURL(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'))
    reader.readAsDataURL(file)
  })
}

/**
 * Compress an image File/Blob to a data URL.
 * Resizes so the longest side ≤ maxDimension, then steps quality down until the
 * encoded result fits maxBytes (or quality bottoms out).
 */
export async function compressImageFile(file: File | Blob, opts: CompressOptions = {}): Promise<string> {
  const maxDimension = opts.maxDimension ?? 800
  const maxBytes = opts.maxBytes ?? 100 * 1024
  const mimeType = opts.mimeType ?? 'image/jpeg'

  if (file.type && !file.type.startsWith('image/')) {
    throw new Error('Format berkas tidak didukung (bukan gambar).')
  }

  const dataUrl = await readFileAsDataURL(file)
  const img = await loadImage(dataUrl)

  let { width, height } = img
  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Browser tidak mendukung kompresi gambar.')
  // White matte so transparent PNGs don't turn black when encoded as JPEG.
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)

  // Step quality down until the encoded payload is small enough.
  let quality = 0.85
  let out = canvas.toDataURL(mimeType, quality)
  while (estimateDataUrlBytes(out) > maxBytes && quality > 0.3) {
    quality -= 0.15
    out = canvas.toDataURL(mimeType, quality)
  }
  return out
}

/** Approximate decoded byte size of a base64 data URL. */
export function estimateDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? ''
  return Math.floor((base64.length * 3) / 4)
}
