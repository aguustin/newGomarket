import { test } from "node:test"
import assert from "node:assert/strict"
import { calcularCompra } from "../lib/pricing.js"

//Unitarios del calculo de una compra (sin base ni red)
const ahora = new Date('2026-11-01T12:00:00Z')
const futuro = new Date('2026-12-01T00:00:00Z')
const pasado = new Date('2026-10-01T00:00:00Z')

const evento = (extra = {}) => ({
  active: true, soldOut: false, fechaFin: futuro, comisionServicio: 15,
  tickets: [
    { _id: 'general', nombreTicket: 'General', precio: 20000, cantidad: 10, estado: 1, limit: 5, fechaDeCierre: futuro },
    { _id: 'vip', nombreTicket: 'VIP', precio: 35000, cantidad: 2, estado: 1, fechaDeCierre: futuro },
    { _id: 'oculto', nombreTicket: 'Oculto', precio: 1, cantidad: 10, estado: 2, fechaDeCierre: futuro },
    { _id: 'agotado', nombreTicket: 'Agotado', precio: 1, cantidad: 10, estado: 4, fechaDeCierre: futuro },
    { _id: 'vencido', nombreTicket: 'Vencido', precio: 1, cantidad: 10, estado: 1, fechaDeCierre: pasado },
    { _id: 'gratis', nombreTicket: 'Gratis', precio: 0, cantidad: 10, estado: 1, fechaDeCierre: futuro }
  ],
  cortesiaRRPP: [{ _id: 'cortesia', nombreTicket: 'Cortesía', cantidadDeCortesias: 10 }],
  ...extra
})
const q = (obj) => Object.fromEntries(Object.entries(obj).map(([id, amount]) => [id, { amount, free: false }]))
const calc = (ev, cantidades, opts = {}) => calcularCompra(ev, q(cantidades), { now: ahora, ...opts })

test('total = subtotal + 15% de comision; reembolsable = subtotal', () => {
  const r = calc(evento(), { general: 2, vip: 1 })
  assert.equal(r.ok, true)
  assert.equal(r.subtotal, 75000)
  assert.equal(r.total, 86250)
  assert.equal(r.montoEntradas, 75000)
  assert.deepEqual(r.quantities, { general: { amount: 2, free: false }, vip: { amount: 1, free: false } })
})

test('usa la comision del evento y 15% si no la tiene', () => {
  assert.equal(calc(evento({ comisionServicio: 10 }), { general: 1 }).total, 22000)
  assert.equal(calc(evento({ comisionServicio: undefined }), { general: 1 }).total, 23000)
})

test('descuento: se aplica sobre el total (como lo muestra la pagina) y sobre el reembolsable', () => {
  const r = calc(evento(), { general: 2 }, { descuento: { numeroDescuento: 10 } })
  assert.equal(r.total, 41400)        // 46.000 - 10%
  assert.equal(r.montoEntradas, 36000) // 40.000 - 10%
  assert.equal(r.descuentoPct, 10)
})

test('descuento fuera de rango se limita a 0..100', () => {
  assert.equal(calc(evento(), { general: 1 }, { descuento: { numeroDescuento: 150 } }).total, 0)
  assert.equal(calc(evento(), { general: 1 }, { descuento: { numeroDescuento: -20 } }).total, 23000)
})

test('redondea a centavos', () => {
  const ev = evento({ tickets: [{ _id: 'x', nombreTicket: 'X', precio: 333.33, cantidad: 10, estado: 1, fechaDeCierre: futuro }] })
  assert.equal(calc(ev, { x: 1 }).total, 383.33)
})

test('entradas de precio 0: total 0 calculado por el servidor', () => {
  assert.equal(calc(evento(), { gratis: 2 }).total, 0)
})

test('cantidades en 0 se ignoran; sin ninguna entrada se rechaza', () => {
  assert.deepEqual(Object.keys(calc(evento(), { general: 1, vip: 0 }).quantities), ['general'])
  assert.equal(calc(evento(), { general: 0 }).code, 'SIN_ENTRADAS')
  assert.equal(calcularCompra(evento(), {}, { now: ahora }).code, 'SIN_ENTRADAS')
})

const rechazos = [
  ['ticket no visible', evento(), { oculto: 1 }, 'TICKET_NO_DISPONIBLE'],
  ['ticket agotado (estado 4)', evento(), { agotado: 1 }, 'AGOTADO'],
  ['ticket vencido', evento(), { vencido: 1 }, 'VENTA_CERRADA'],
  ['evento terminado', evento({ fechaFin: pasado }), { general: 1 }, 'VENTA_CERRADA'],
  ['evento inactivo', evento({ active: false }), { general: 1 }, 'VENTA_CERRADA'],
  ['evento agotado', evento({ soldOut: true }), { general: 1 }, 'AGOTADO'],
  ['supera el limite por compra', evento(), { general: 6 }, 'LIMITE_SUPERADO'],
  ['limite por defecto 30', evento({ tickets: [{ _id: 'g', nombreTicket: 'G', precio: 1, cantidad: 100, estado: 1, fechaDeCierre: futuro }] }), { g: 31 }, 'LIMITE_SUPERADO'],
  ['supera el stock', evento(), { vip: 3 }, 'SIN_STOCK'],
  ['cortesia', evento(), { cortesia: 1 }, 'TICKET_CORTESIA'],
  ['ticket de otro evento', evento(), { otro: 1 }, 'TICKET_INEXISTENTE']
]
for (const [nombre, ev, cantidades, code] of rechazos) {
  test(`rechaza: ${nombre}`, () => {
    const r = calc(ev, cantidades)
    assert.equal(r.ok, false)
    assert.equal(r.code, code)
  })
}

test('rechaza cantidades invalidas', () => {
  for (const amount of [-1, 1.5, '2', null, undefined, NaN]) {
    assert.equal(calcularCompra(evento(), { general: { amount } }, { now: ahora }).code, 'CANTIDADES_INVALIDAS', `amount=${amount}`)
  }
  for (const quantities of [null, 'x', [1, 2]]) {
    assert.equal(calcularCompra(evento(), quantities, { now: ahora }).code, 'CANTIDADES_INVALIDAS')
  }
})

test('evento inexistente', () => {
  assert.equal(calcularCompra(null, q({ general: 1 })).code, 'EVENTO_INEXISTENTE')
})

test('ignora el flag "free" del navegador: siempre cobra el precio de la base', () => {
  const r = calcularCompra(evento(), { general: { amount: 1, free: true } }, { now: ahora })
  assert.equal(r.total, 23000)
  assert.deepEqual(r.quantities.general, { amount: 1, free: false })
})
