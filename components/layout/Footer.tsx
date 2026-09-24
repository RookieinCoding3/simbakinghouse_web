import Link from 'next/link'
import { CONTACT_MAILTO_URL } from '@/lib/site'
import { fetchShopSettings } from '@/lib/firebase/settings'

export default async function Footer() {
  const currentYear = new Date().getFullYear()
  const { openingHours, whatsappNumber } = await fetchShopSettings()
  const whatsappUrl = `https://wa.me/${whatsappNumber}`

  return (
    <footer id="find-us" className="border-t border-line">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 text-xs text-[#7A736C] leading-relaxed">
          <div>
            <p className="text-ink uppercase tracking-widest font-semibold mb-3">Sim Baking House</p>
            <Link href="/location" className="hover:text-ink transition-colors">
              Bayan Lepas, Penang, Malaysia
            </Link>
            <p className="mt-1">Est. 2017</p>
          </div>

          <div>
            <p className="text-ink uppercase tracking-widest font-semibold mb-3">Operating Hours</p>
            <p>{openingHours}</p>
            <p className="mt-1">Early morning walk-in &amp; pre-order pickup</p>
          </div>

          <div>
            <p className="text-ink uppercase tracking-widest font-semibold mb-3">Direct Contact</p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-ink underline underline-offset-4 hover:text-clay"
            >
              Chat on WhatsApp &rarr;
            </a>
            <a href={CONTACT_MAILTO_URL} className="block mt-2 hover:text-ink transition-colors">
              Email us
            </a>
            <div className="mt-3 flex gap-4">
              <a
                href="https://www.instagram.com/sim_baking_house/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-ink transition-colors"
              >
                Instagram
              </a>
              <a
                href="https://www.facebook.com/p/Sim-Baking-House-100057442848182/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-ink transition-colors"
              >
                Facebook
              </a>
            </div>
          </div>

          <div className="md:text-right">
            <p>&copy; {currentYear} Sim Baking House</p>
            <p className="mt-1">All rights reserved.</p>
            <Link href="/privacy" className="block mt-2 hover:text-ink transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
