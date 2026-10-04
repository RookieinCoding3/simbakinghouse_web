import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import LegalPage, { type LegalDoc } from '@/components/legal/LegalPage'

export const metadata: Metadata = pageMetadata({
  path: '/privacy',
  title: 'Privacy Notice | Sim Baking House',
  description: 'What Sim Baking House collects, why, and your rights over your data.',
})

const LAST_UPDATED = '4 October 2026'

const en: LegalDoc = {
  title: 'Privacy Notice',
  sections: [
    {
      heading: 'Who we are',
      body: 'Sim Baking House, Tingkat Sungai Ara 1, 11900 Bayan Lepas, Pulau Pinang. Contact: simbakinghouse25@gmail.com',
    },
    {
      heading: 'What we collect',
      body: 'Order details (name, phone number, items, collection/delivery choice, notes). Account details, only if you create an account: email, name, saved cart and order history. If you sign in with Google, we receive your name and email from Google. We never see your Google password. Basic site usage data (pages visited, device type) through analytics.',
    },
    {
      heading: 'Why we collect it',
      body: 'To prepare and confirm your order, contact you on WhatsApp, let you check order status, run your account, keep records required by law, and keep the site working and secure. We do not sell your data or use it for third-party advertising.',
    },
    {
      heading: 'Who handles your data',
      body: 'Google (Firebase) stores accounts and orders. Vercel hosts the website and analytics. WhatsApp (Meta) is used when we message you. These providers may store data outside Malaysia. By placing an order or creating an account, you agree to this transfer.',
    },
    {
      heading: 'How long we keep it',
      body: 'Order records are deleted 12 months after the order. Accounts are kept until you ask us to delete them. Some records may be kept longer if the law requires it.',
    },
    {
      heading: 'Your rights',
      body: 'You may ask to see, correct or delete your personal data or account, or withdraw consent, by emailing simbakinghouse25@gmail.com. There is currently no self-service delete option on the site itself. If you do not give us the data we need to process an order, we may not be able to fulfil it.',
    },
    {
      heading: 'Security',
      body: 'We use reasonable measures to protect your data, but no online system is 100% secure.',
    },
    {
      heading: 'Children',
      body: 'Our site is not meant for children under 13.',
    },
    {
      heading: 'Changes',
      body: 'We may update this notice. The date below shows the latest version.',
    },
  ],
}

const bm: LegalDoc = {
  title: 'Notis Privasi',
  sections: [
    {
      heading: 'Siapa kami',
      body: 'Sim Baking House, Tingkat Sungai Ara 1, 11900 Bayan Lepas, Pulau Pinang. Hubungi: simbakinghouse25@gmail.com',
    },
    {
      heading: 'Apa yang kami kumpul',
      body: 'Butiran pesanan (nama, nombor telefon, barangan, pilihan ambil/hantar, nota). Butiran akaun, hanya jika anda membuat akaun: e-mel, nama, troli tersimpan dan sejarah pesanan. Jika anda log masuk dengan Google, kami menerima nama dan e-mel anda daripada Google. Kami tidak akan nampak kata laluan Google anda. Data penggunaan laman asas (halaman dilawati, jenis peranti) melalui analitik.',
    },
    {
      heading: 'Kenapa kami mengumpulnya',
      body: 'Untuk menyediakan dan mengesahkan pesanan anda, menghubungi anda melalui WhatsApp, membolehkan anda menyemak status pesanan, menguruskan akaun anda, menyimpan rekod yang dikehendaki oleh undang-undang, dan memastikan laman web berfungsi dengan baik dan selamat. Kami tidak menjual data anda atau menggunakannya untuk pengiklanan pihak ketiga.',
    },
    {
      heading: 'Siapa yang mengendalikan data anda',
      body: 'Google (Firebase) menyimpan akaun dan pesanan. Vercel menjadi hos laman web dan analitik. WhatsApp (Meta) digunakan apabila kami menghantar mesej kepada anda. Penyedia ini mungkin menyimpan data di luar Malaysia. Dengan membuat pesanan atau membuat akaun, anda bersetuju dengan pemindahan ini.',
    },
    {
      heading: 'Berapa lama kami menyimpannya',
      body: 'Rekod pesanan dipadam 12 bulan selepas pesanan dibuat. Akaun disimpan sehingga anda meminta kami memadamkannya. Sesetengah rekod mungkin disimpan lebih lama jika dikehendaki oleh undang-undang.',
    },
    {
      heading: 'Hak anda',
      body: 'Anda boleh meminta untuk melihat, membetulkan atau memadam data peribadi atau akaun anda, atau menarik balik persetujuan, dengan menghantar e-mel kepada simbakinghouse25@gmail.com. Tiada pilihan padam-sendiri di laman web pada masa ini. Jika anda tidak memberikan data yang kami perlukan untuk memproses pesanan, kami mungkin tidak dapat memenuhi pesanan tersebut.',
    },
    {
      heading: 'Keselamatan',
      body: 'Kami menggunakan langkah-langkah yang munasabah untuk melindungi data anda, tetapi tiada sistem dalam talian yang 100% selamat.',
    },
    {
      heading: 'Kanak-kanak',
      body: 'Laman web kami tidak ditujukan untuk kanak-kanak bawah umur 13 tahun.',
    },
    {
      heading: 'Perubahan',
      body: 'Kami mungkin mengemas kini notis ini. Tarikh di bawah menunjukkan versi terkini.',
    },
  ],
}

export default function PrivacyPage() {
  return <LegalPage lastUpdated={LAST_UPDATED} en={en} bm={bm} />
}
