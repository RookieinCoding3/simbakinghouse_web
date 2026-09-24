import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import app from './config'

const storage = getStorage(app)

/** Uploads a product photo (public path, admin-write per storage.rules) and
 *  returns its public download URL. */
export async function uploadProductPhoto(file: File, productId: string): Promise<string> {
  const path = `product/${productId}-${Date.now()}-${file.name}`
  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, file)
  return getDownloadURL(fileRef)
}

// Fixed name (not timestamped like product photos) so re-uploading a new
// QR overwrites the old one instead of leaving orphaned files in storage.
export const DUITNOW_QR_PATH = 'private/duitnow-qr'

/** Uploads the DuitNow QR to a path that stays admin-only in storage.rules
 *  (never public read) — customers only ever see it via a short-lived
 *  signed URL minted server-side, see app/api/orders/[orderId]/route.ts. */
export async function uploadDuitNowQr(file: File): Promise<string> {
  const fileRef = ref(storage, DUITNOW_QR_PATH)
  await uploadBytes(fileRef, file)
  return DUITNOW_QR_PATH
}
