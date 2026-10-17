import { matchesSearch } from '../../lib/storefront/search'
import { groupByCollection, readCollections } from '../../lib/storefront/collections'
import { translate, STRINGS } from '../../lib/i18n/strings'
import { test, eq, ok, done } from './harness'

const rice = { name: 'Rice flour', nameZh: '米粉', code: 'F00011', description: 'Fine rice flour.', category: 'Flour' }
const butter = { name: 'Butter 250g', nameZh: '牛油 250克', code: 'D00009', description: '', category: 'Dairy' }

test('search: English, Chinese, code (any spacing/case), description, category', () => {
  ok(matchesSearch(rice, 'rice'), 'matchesSearch(rice, "rice")')
  ok(matchesSearch(rice, 'RICE  Flour'), 'matchesSearch(rice, "RICE  Flour")')
  ok(matchesSearch(rice, '米粉'), 'matchesSearch(rice, "米粉")')
  ok(matchesSearch(rice, '米'), 'matchesSearch(rice, "米")')
  ok(matchesSearch(rice, 'f00011'), 'matchesSearch(rice, "f00011")')
  ok(matchesSearch(rice, 'F-000 11'), 'matchesSearch(rice, "F-000 11")')
  ok(matchesSearch(rice, '00011'), 'partial code')
  ok(matchesSearch(rice, 'fine'), 'matchesSearch(rice, "fine")')
  ok(matchesSearch(rice, 'flour'), 'matchesSearch(rice, "flour")')
  ok(matchesSearch(butter, '牛油'), 'matchesSearch(butter, "牛油")')
  ok(matchesSearch(rice, ''), 'empty matches all')
  ok(!matchesSearch(rice, 'butter'), '!matchesSearch(rice, "butter")')
  ok(!matchesSearch(rice, 'rice butter'), 'every word must match')
  ok(!matchesSearch(butter, 'f000'), 'another code does not match')
  // Full-width characters typed on a Chinese keyboard still match.
  ok(matchesSearch(rice, 'ＲＩＣＥ'), 'matchesSearch(rice, "ＲＩＣＥ")')
})

test('search: one typo is forgiven in longer words, never in Chinese or short words', () => {
  const choc = { name: 'Chocolate cake premix 500g', nameZh: '巧克力蛋糕预拌粉', code: 'P00002', description: '', category: 'Premix' }
  ok(matchesSearch(rice, 'flor'), 'flor -> flour')
  ok(matchesSearch(rice, 'flour'), 'flour')
  ok(matchesSearch(choc, 'choclate'), 'choclate -> chocolate')
  ok(matchesSearch(choc, 'chocolat'), 'prefix')
  ok(!matchesSearch(rice, 'floor cake'), 'cake is not rice flour')
  ok(!matchesSearch(butter, 'sugar'), 'sugar is not butter')
  ok(!matchesSearch(choc, 'chicken'), 'chicken is not chocolate')
  ok(!matchesSearch({ name: 'Instant yeast', nameZh: '', code: 'Y1', description: 'For bread and pau.', category: 'Baking' }, 'flor'), 'flor is not "for"')
})

test('collections: known ids only, in order; empty collections are hidden', () => {
  eq(readCollections(['bundles', 'x', 'first-time', 'bundles']), ['first-time', 'bundles'])
  eq(readCollections('first-time'), [])
  const groups = groupByCollection([{ collections: ['bundles'] }, { collections: ['bundles', 'first-time'] }, {}])
  eq(groups.map((g) => [g.id, g.products.length]), [['first-time', 1], ['bundles', 2]])
})

test('every storefront string has English and Chinese; placeholders match', () => {
  for (const [key, [en, zh]] of Object.entries(STRINGS)) {
    ok(en.trim() !== '' && zh.trim() !== '', `${key} empty`)
    const ph = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',')
    eq(ph(en), ph(zh), `${key} placeholders`)
  }
  eq(translate('zh', 'howto.3.body', { hours: '6:30 AM - 1:00 PM' }).includes('6:30 AM - 1:00 PM'), true)
  eq(translate('en', 'search.none', { q: 'zzz' }), 'No product matches “zzz”.')
})

done()
