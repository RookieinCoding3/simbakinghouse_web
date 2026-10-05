// One-off: moves public/landing_page.mp4 to Firebase Storage so hero video
// bytes are served by Firebase's CDN instead of Vercel's — every byte of
// public/ is served through Vercel today, and this is a 2MB file that
// several visitors a day easily turns into real CDN-request volume.
// Uses the same "download token" convention the existing product photos
// already rely on (see storage.rules's own comment) rather than adding a
// new public Storage rule.
//
// NOT YET RUN — this environment has no production FIREBASE_CLIENT_EMAIL/
// FIREBASE_PRIVATE_KEY (.env.local only has the NEXT_PUBLIC_* client
// keys), so this needs to be run by someone with those credentials:
//
//   vercel env pull .env.local      # if you don't already have the Admin keys locally
//   npx tsx --env-file=.env.local scripts/upload-hero-video.mjs
//
// Then paste the printed URL into components/sections/HeroVideo.tsx's
// HERO_VIDEO_URL constant, redeploy, and (optional but recommended) delete
// public/landing_page.mp4 from the repo so Vercel never serves it again.
import { randomUUID } from 'crypto'
import { getAdminStorage } from '../lib/firebase/admin.ts'

const LOCAL_PATH = 'public/landing_page.mp4'
const STORAGE_PATH = 'video/landing_page.mp4'

const bucket = getAdminStorage().bucket()
const token = randomUUID()

await bucket.upload(LOCAL_PATH, {
  destination: STORAGE_PATH,
  metadata: {
    contentType: 'video/mp4',
    cacheControl: 'public, max-age=31536000, immutable',
    metadata: { firebaseStorageDownloadTokens: token },
  },
})

const encodedPath = encodeURIComponent(STORAGE_PATH)
const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`

console.log('Uploaded. Public URL:')
console.log(url)
