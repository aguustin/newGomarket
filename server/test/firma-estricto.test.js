import { test, before, after, mock } from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import { loadApp, closeDb } from "./helpers.js"
import { verificarFirmaMP, firmarComoMP } from "../lib/firmaMP.js"

//Firma de los webhooks de Mercado Pago en modo "estricto" (proceso propio: la configuracion se lee al arrancar)
const SECRETO = 'clave-secreta-de-prueba'
let app, mercadopago, consultas = 0

before(async () => {
  process.env.WEBHOOK_FIRMA = 'estricto'
  process.env.WEBHOOK_SECRET_KEY = SECRETO
  app = await loadApp({ mailMode: 'bandeja' })
  mercadopago = (await import('../lib/mercadopago.js')).default
  mock.method(mercadopago.payment, 'findById', async () => { consultas++; return { body: { status: 'rejected' } } })
})
after(closeDb)

test('verificarFirmaMP: acepta la firma correcta y rechaza la alterada, la vencida de otro id y la ausente', () => {
  const ok = { headers: { 'x-signature': firmarComoMP({ dataId: '123', requestId: 'r1', ts: 1700000000 }, SECRETO), 'x-request-id': 'r1' }, query: { 'data.id': '123' } }
  assert.deepEqual(verificarFirmaMP(ok, SECRETO), { valida: true, motivo: 'ok' })
  assert.equal(verificarFirmaMP(ok, 'otra-clave').valida, false)
  assert.equal(verificarFirmaMP({ ...ok, query: { 'data.id': '999' } }, SECRETO).valida, false, 'firma de otro pago')
  assert.equal(verificarFirmaMP({ ...ok, headers: { ...ok.headers, 'x-request-id': 'r2' } }, SECRETO).valida, false)
  assert.equal(verificarFirmaMP({ headers: {}, query: {} }, SECRETO).motivo, 'sin x-signature')
  assert.equal(verificarFirmaMP({ headers: { 'x-signature': 'basura' }, query: {} }, SECRETO).motivo, 'x-signature mal formada')
  assert.equal(verificarFirmaMP(ok, undefined).valida, false)
})

test('modo estricto: el aviso sin firma valida se rechaza (401) y ni siquiera se consulta a MP', async () => {
  consultas = 0
  const sinFirma = await request(app).post('/webhook/mercadopago').query({ type: 'payment', 'data.id': '555' })
  assert.equal(sinFirma.status, 401)
  const alterada = await request(app).post('/webhook/mercadopago').set({ 'x-signature': 'ts=1,v1=abcd', 'x-request-id': 'x' }).query({ type: 'payment', 'data.id': '555' })
  assert.equal(alterada.status, 401)
  await new Promise((r) => setTimeout(r, 300))
  assert.equal(consultas, 0)
})

test('modo estricto: con firma valida se acepta y se consulta el pago a MP', async () => {
  consultas = 0
  const headers = { 'x-signature': firmarComoMP({ dataId: '556', requestId: 'r-556' }, SECRETO), 'x-request-id': 'r-556' }
  const res = await request(app).post('/webhook/mercadopago').set(headers).query({ type: 'payment', 'data.id': '556' })
  assert.equal(res.status, 200)
  await new Promise((r) => setTimeout(r, 300))
  assert.equal(consultas, 1)
})
