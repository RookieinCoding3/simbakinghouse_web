import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'
import LegalPage, { type LegalDoc } from '@/components/legal/LegalPage'

export const metadata: Metadata = pageMetadata({
  path: '/terms',
  title: 'Terms of Sale | Sim Baking House',
  description: 'Ordering, payment, collection, and returns at Sim Baking House.',
})

const LAST_UPDATED = '4 October 2026'

const en: LegalDoc = {
  title: 'Terms of Sale',
  sections: [
    {
      heading: 'Orders',
      body: 'An order is a request. It is only accepted when we confirm it on WhatsApp. We may refuse or cancel an order if stock is short, a price is wrong, or we cannot reach you.',
    },
    {
      heading: 'Prices and stock',
      body: 'Prices are in MYR and may change without notice. Online stock and prices are a guide. We confirm the final amount before you pay.',
    },
    {
      heading: 'Payment',
      body: 'Pay by the QR code we send you, before collection. We prepare your order only after payment is received.',
    },
    {
      heading: 'Collection and delivery',
      body: "Collect on the date and time confirmed, during opening hours (6:30 AM to 1:00 PM). Orders not collected within 2 days of the agreed date may be cancelled, with no refund for prepaid perishable or made-to-order items. Delivery, if offered, is quoted separately, and risk passes to you on handover.",
    },
    {
      heading: 'No returns or refunds for change of mind',
      body: 'All sales are final. We do not accept returns, exchanges or refunds because you changed your mind, ordered the wrong item, or no longer need it. Opened, used or food items cannot be returned for hygiene and safety reasons.',
    },
    {
      heading: 'Faulty or wrong items',
      body: 'Your legal rights are not affected. If an item is damaged, expired, defective, or not what you ordered, tell us within 24 hours of collection or delivery with your order number and a photo. We will replace it or refund it.',
    },
    {
      heading: 'Food and allergens',
      body: 'Our products may contain or be made near allergens (e.g. wheat, milk, eggs, nuts). Check the label. You are responsible for checking suitability for your needs. Follow storage instructions and expiry dates.',
    },
    {
      heading: 'Our liability',
      body: 'To the extent the law allows, our liability is limited to the price you paid for the item concerned. We are not liable for indirect loss.',
    },
    {
      heading: 'Law',
      body: 'These terms follow the laws of Malaysia.',
    },
  ],
}

const bm: LegalDoc = {
  title: 'Terma Jualan',
  sections: [
    {
      heading: 'Pesanan',
      body: 'Pesanan adalah permintaan. Ia hanya diterima apabila kami mengesahkannya di WhatsApp. Kami boleh menolak atau membatalkan pesanan jika stok tidak mencukupi, harga tersilap, atau kami tidak dapat menghubungi anda.',
    },
    {
      heading: 'Harga dan stok',
      body: 'Harga dalam MYR dan boleh berubah tanpa notis. Stok dan harga dalam talian adalah panduan sahaja. Kami akan mengesahkan jumlah akhir sebelum anda membayar.',
    },
    {
      heading: 'Pembayaran',
      body: 'Bayar melalui kod QR yang kami hantar, sebelum pengambilan. Kami hanya menyediakan pesanan anda selepas pembayaran diterima.',
    },
    {
      heading: 'Pengambilan dan penghantaran',
      body: 'Ambil pada tarikh dan masa yang disahkan, semasa waktu operasi (6:30 pagi hingga 1:00 tengah hari). Pesanan yang tidak diambil dalam masa 2 hari daripada tarikh yang dipersetujui boleh dibatalkan, tanpa bayaran balik untuk barangan mudah rosak atau barangan buatan khas yang telah dibayar. Penghantaran, jika ditawarkan, disebut harga secara berasingan, dan risiko berpindah kepada anda semasa serahan.',
    },
    {
      heading: 'Tiada pemulangan atau bayaran balik kerana menukar fikiran',
      body: 'Semua jualan adalah muktamad. Kami tidak menerima pemulangan, pertukaran atau bayaran balik kerana anda menukar fikiran, memesan barang yang salah, atau tidak lagi memerlukannya. Barangan yang telah dibuka, digunakan atau barangan makanan tidak boleh dipulangkan atas sebab kebersihan dan keselamatan.',
    },
    {
      heading: 'Barangan rosak atau salah',
      body: 'Hak undang-undang anda tidak terjejas. Jika sesuatu barang rosak, luput, cacat, atau bukan apa yang anda pesan, maklumkan kepada kami dalam masa 24 jam selepas pengambilan atau penghantaran berserta nombor pesanan dan gambar. Kami akan menggantikannya atau memberi bayaran balik.',
    },
    {
      heading: 'Makanan dan alergen',
      body: 'Produk kami mungkin mengandungi atau dihasilkan berhampiran alergen (contohnya gandum, susu, telur, kacang). Sila semak label. Anda bertanggungjawab untuk memastikan kesesuaian untuk keperluan anda. Ikut arahan penyimpanan dan tarikh luput.',
    },
    {
      heading: 'Liabiliti kami',
      body: 'Setakat yang dibenarkan oleh undang-undang, liabiliti kami terhad kepada harga yang anda bayar untuk barang berkenaan. Kami tidak bertanggungjawab atas kerugian tidak langsung.',
    },
    {
      heading: 'Undang-undang',
      body: 'Terma ini tertakluk kepada undang-undang Malaysia.',
    },
  ],
}

export default function TermsPage() {
  return <LegalPage lastUpdated={LAST_UPDATED} en={en} bm={bm} />
}
