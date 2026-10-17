import { receiveOp, wastageOp, recountOp, confirmOrderOp, collectOrderOp, releaseOrderOp, readHold, type InvBatch } from '../../lib/server/invStock'
import { test, eq, ok, done } from './harness'

const b = (id: string, qtyMilli: number, expiryDate: string | null, receivedDate = '2026-10-01'): InvBatch => ({
  id, productId: 'butter', locationId: 'storeroom', qtyMilli, expiryDate, receivedDate, supplierName: null,
})

test('receive: a new batch with expiry, supplier and cost; one receive entry; latest cost', () => {
  const op = receiveOp({ productId: 'butter', qtyMilli: 24000, unitCostSen: 1120, supplierName: 'Anchor Malaysia', expiryDate: '2027-01-20', receivedDate: '2026-10-17' })
  eq(op.parentCollection, 'receipts')
  eq(op.lines.length, 1)
  const l = op.lines[0]
  eq([l.type, l.qtyDeltaMilli, l.reservedDeltaMilli, l.locationId], ['receive', 24000, 0, 'storeroom'])
  ok(l.newBatch !== undefined && l.batchId === l.newBatch.id, 'ledger books into its new batch')
  eq([l.newBatch!.expiryDate, l.newBatch!.supplierName, l.newBatch!.unitCostSen], ['2027-01-20', 'Anchor Malaysia', 1120])
  eq(op.productCosts, { butter: 1120 })
  let threw = false
  try { receiveOp({ productId: 'x', qtyMilli: 0, unitCostSen: null, supplierName: null, expiryDate: null, receivedDate: '2026-10-17' }) } catch { threw = true }
  ok(threw, 'zero quantity refused')
})

test('wastage: taken off the chosen batch only', () => {
  const op = wastageOp(b('b2', 10000, '2027-01-20'), 2000, 'damaged')
  eq(op.lines.map((l) => [l.type, l.batchId, l.qtyDeltaMilli, l.reason]), [['wastage', 'b2', -2000, 'damaged']])
})

test('recount down: FEFO across batches (soonest expiry first); up: newest batch; marks counted', () => {
  const batches = [b('late', 11000, '2027-01-20'), b('soon', 3000, '2026-11-05')]
  const down = recountOp({ productId: 'butter', locationId: 'storeroom', expectedMilli: 14000, countedMilli: 10000, batches, today: '2026-10-17' })
  eq(down.lines.map((l) => [l.batchId, l.qtyDeltaMilli]), [['soon', -3000], ['late', -1000]])
  ok(down.isCount && (down.productUpdates.butter as { openingCount: { done: boolean } }).openingCount.done, 'counted')
  const up = recountOp({ productId: 'butter', locationId: 'storeroom', expectedMilli: 14000, countedMilli: 15000, batches: [b('old', 3000, null, '2026-09-01'), b('new', 11000, null, '2026-10-10')], today: '2026-10-17' })
  eq(up.lines.map((l) => [l.batchId, l.qtyDeltaMilli]), [['new', 1000]])
  const fresh = recountOp({ productId: 'butter', locationId: 'storeroom', expectedMilli: 0, countedMilli: 5000, batches: [], today: '2026-10-17' })
  ok(fresh.lines[0].newBatch?.receivedDate === '2026-10-17' && fresh.lines[0].qtyDeltaMilli === 5000, 'no batch yet: a new one')
  eq(recountOp({ productId: 'butter', locationId: 'storeroom', expectedMilli: 5000, countedMilli: 5000, batches: [], today: '2026-10-17' }).lines, [])
})

test('order confirm holds (reserved only); collect deducts FEFO and releases; cancel releases', () => {
  const { op: c, hold } = confirmOrderOp([{ productId: 'butter', qtyMilli: 2000 }, { productId: 'butter', qtyMilli: 3000 }, { productId: 'flour', qtyMilli: 1000 }])
  eq(c.lines.map((l) => [l.type, l.productId, l.qtyDeltaMilli, l.reservedDeltaMilli]), [['online_reserve', 'butter', 0, 5000], ['online_reserve', 'flour', 0, 1000]])
  eq(hold, { state: 'reserved', locationId: 'storeroom', lines: [{ productId: 'butter', qtyMilli: 5000 }, { productId: 'flour', qtyMilli: 1000 }] })

  const batches = new Map([['butter', [b('late', 11000, '2027-01-20'), b('soon', 3000, '2026-11-05')]]])
  const { op: col, hold: after } = collectOrderOp(hold, [], batches)
  eq(col.lines.map((l) => [l.type, l.productId, l.batchId, l.qtyDeltaMilli, l.reservedDeltaMilli]), [
    ['online_sale', 'butter', 'soon', -3000, -3000],
    ['online_sale', 'butter', 'late', -2000, -2000],
    ['online_sale', 'flour', null, -1000, -1000], // no batch counted yet: still taken off, hold released
  ])
  eq(after.state, 'collected')

  const { op: rel, hold: released } = releaseOrderOp(hold)
  eq(rel.lines.map((l) => [l.type, l.reservedDeltaMilli]), [['online_release', -5000], ['online_release', -1000]])
  eq(released.state, 'released')
  eq(releaseOrderOp(released).op.lines, [], 'releasing twice does nothing')
})

test('collect without a hold (order never confirmed on the stock system): deducts, no release', () => {
  const { op } = collectOrderOp(null, [{ productId: 'butter', qtyMilli: 1000 }], new Map([['butter', [b('x', 5000, null)]]]))
  eq(op.lines.map((l) => [l.batchId, l.qtyDeltaMilli, l.reservedDeltaMilli]), [['x', -1000, 0]])
})

test('readHold: tolerant of old/odd shapes', () => {
  eq(readHold(null), null)
  eq(readHold({ state: 'reserved', locationId: 'storeroom', lines: [{ productId: 'a', qtyMilli: 1000 }, { productId: '', qtyMilli: 5 }, 'x'] }), {
    state: 'reserved', locationId: 'storeroom', lines: [{ productId: 'a', qtyMilli: 1000 }],
  })
})

done()
