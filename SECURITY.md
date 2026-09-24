# Sim Baking House — manual security setup

Everything in this file is a step that has to happen outside this codebase —
in the Firebase Console, the Google Cloud Console, or wherever the site is
hosted. None of it happens automatically just because the code is in the
repo. Nothing here has been run or verified by Claude Code; it's written
from the platform docs, not tested against your actual project.

## 1. Deploy the rules and index files

Editing `firestore.rules`, `storage.rules`, or `firestore.indexes.json` in
this repo does nothing to production on its own.

- **Console**: paste `firestore.rules` into Firebase Console → Firestore
  Database → Rules, and `storage.rules` into Storage → Rules.
- **CLI** (if `firebase-tools` is set up): `firebase deploy --only
  firestore:rules,firestore:indexes,storage`

The composite index in `firestore.indexes.json` (orders by `status` +
`createdAt`, both directions) is required for the admin order queue's
status tabs (`/admin`) — without it, every tab except "All" fails with a
"the query requires an index" error. Firestore normally hands you a direct
console link to create it the first time the query runs, which is often the
easiest path if the CLI isn't set up.

## 2. Create the admin account

`/admins/{uid}` has no client-writable path at all (by design — see the
comment in `firestore.rules`), so this can only be done from the Console:

1. Firebase Console → Authentication → add a user (email + password) for
   the shop owner. **If an admin account already exists for the iOS admin
   app**, the same email/password should work here unchanged — same
   Firebase project, same `isAdmin()` rule. Check before creating a new one.
2. Firebase Console → Firestore → `admins` collection → create a document
   whose **document ID is that user's UID** (from the Authentication tab).
   The document's contents don't matter — only its existence and ID.

## 3. Firebase App Check (Phase 5.3)

Defends `/api/orders` (order creation) and every direct client Firestore/
Storage read or write against scripted abuse. Optional until set up — the
site works identically without it, just without this extra layer.

1. Firebase Console → App Check → register this web app → provider:
   **reCAPTCHA v3** → create/paste a reCAPTCHA v3 site key (from
   [Google's reCAPTCHA admin console](https://www.google.com/recaptcha/admin)).
2. Set `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` in the deployment's environment
   variables to that site key. This alone makes the client start attaching
   tokens (`lib/firebase/appCheck.ts`) and makes `/api/orders` start
   requiring a valid one (`app/api/orders/route.ts`).
3. Firebase Console → App Check → Firestore, and → Storage → **Enforce**.
   Do this only after step 2 is live and working, or legitimate requests
   from a not-yet-updated deployment will start failing.

## 4. Order retention cleanup (Phase 5.5)

`/privacy` promises orders are deleted 12 months after they're placed.
`app/api/cron/cleanup-orders` implements the deletion; something still has
to call it on a schedule.

1. Set a `CRON_SECRET` environment variable (any long random string) in
   the deployment.
2. **On Vercel**: `vercel.json` already schedules this route daily at
   03:00. Vercel automatically sends `Authorization: Bearer $CRON_SECRET`
   for cron invocations once that env var is set — nothing else to do.
3. **Anywhere else**: point any external scheduler (a GitHub Actions cron
   workflow, cron-job.org, a server crontab running `curl`) at
   `https://<your-domain>/api/cron/cleanup-orders` with header
   `Authorization: Bearer <CRON_SECRET>`, on whatever schedule you like
   (daily is plenty). Running it by hand occasionally also satisfies the
   spec's "or a documented manual step" alternative — it doesn't have to
   be automated to start with.

Without step 1 the route always returns 500 and deletes nothing — the
retention promise in `/privacy` is not actually being kept until this is
wired up.

## 5. Scheduled Firestore backup (Phase 5.6)

Not implementable from this codebase — it's a Google Cloud project setting,
not application code. Two options, either satisfies "scheduled export":

**Simpler — Firestore's built-in scheduled backups** (recommended):

```
gcloud firestore backups schedules create \
  --database='(default)' \
  --recurrence=daily \
  --retention=90d
```

Or Firebase Console → Firestore Database → Backups → create a schedule.
Managed by Firestore directly; no Storage bucket or Cloud Function needed.

**Original spec wording — export to a Storage bucket**: Cloud Scheduler can
call the Firestore export REST API directly (an HTTP target with a service
account, no Cloud Function required):

```
gcloud scheduler jobs create http firestore-export-daily \
  --schedule="0 3 * * *" \
  --uri="https://firestore.googleapis.com/v1/projects/<PROJECT_ID>/databases/(default):exportDocuments" \
  --http-method=POST \
  --oauth-service-account-email=<a service account with Cloud Datastore Import Export Admin role> \
  --message-body='{"outputUriPrefix":"gs://<BUCKET_NAME>/firestore-backups"}'
```

Replace `<PROJECT_ID>`, `<BUCKET_NAME>`, and the service account email.
The bucket needs to exist first and the service account needs write access
to it plus Firestore export permission.

## 6. What was already checked (no action needed)

- No `.env*` file or service account JSON has ever been committed to this
  repo (checked full git history), and `.env.local`/`*.pem` are gitignored.
- `FIREBASE_PRIVATE_KEY`/`FIREBASE_CLIENT_EMAIL` are only read in
  `lib/firebase/admin.ts`, which is never imported from a Client Component
  — confirmed nothing under `'use client'` imports it, so these secrets
  never reach the browser bundle.
