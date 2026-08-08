import { NextRequest, NextResponse } from 'next/server'

// Receives Content-Security-Policy-Report-Only violation reports from real
// visitors' browsers (report-uri directive in next.config.js) and logs them
// server-side, where they show up in Vercel's runtime logs. This is how
// CSP gaps get caught from real traffic, not just a developer's own
// browser console.
export async function POST(request: NextRequest) {
  try {
    const report = await request.json()
    console.warn('[CSP Violation]', JSON.stringify(report))
  } catch {
    // Malformed or empty report body — nothing useful to log.
  }

  return new NextResponse(null, { status: 204 })
}
