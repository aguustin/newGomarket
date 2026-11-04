import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import { loadApp, closeDb } from "./helpers.js"

//Etapa 12: limite de intentos por IP. Solo este archivo lo enciende (en el resto de los tests esta apagado)
process.env.RATE_LIMIT_TEST = '1'
let app
before(async () => { app = await loadApp({ mailMode: 'bandeja' }) })
after(closeDb)

//Cada test usa su propia IP (detras del proxy de Render llega en X-Forwarded-For)
const desde = (ip) => ({ 'X-Forwarded-For': ip })

test('CRITICO: login: a los 20 intentos en 15 minutos responde 429 con aviso; otra IP no se ve afectada', async () => {
  const ip = '203.0.113.10'
  for (let i = 0; i < 20; i++) {
    const r = await request(app).post('/login').set(desde(ip)).send({ mail: 'nadie@x.com', contrasenia: 'mal' })
    assert.equal(r.status, 200, `intento ${i + 1}`)
  }
  const bloqueado = await request(app).post('/login').set(desde(ip)).send({ mail: 'nadie@x.com', contrasenia: 'mal' })
  assert.equal(bloqueado.status, 429)
  assert.equal(bloqueado.body.code, 'DEMASIADOS_INTENTOS')
  assert.match(bloqueado.body.error, /Esperá unos minutos/)
  assert.ok(bloqueado.headers['retry-after'], 'indica cuando reintentar')

  assert.equal((await request(app).post('/login').set(desde('203.0.113.11')).send({ mail: 'nadie@x.com', contrasenia: 'mal' })).status, 200)
})

test('recuperar contraseña: a los 5 pedidos corta (cada uno manda un mail)', async () => {
  const ip = '203.0.113.20'
  for (let i = 0; i < 5; i++) assert.equal((await request(app).post('/recover_password').set(desde(ip)).send({ mail: `r${i}@x.com` })).status, 200)
  assert.equal((await request(app).post('/recover_password').set(desde(ip)).send({ mail: 'r@x.com' })).status, 429)
})

test('codigos de descuento: no se pueden probar al azar sin limite', async () => {
  const ip = '203.0.113.30'
  for (let i = 0; i < 30; i++) await request(app).get(`/find_discount/COD${i}`).set(desde(ip))
  assert.equal((await request(app).get('/find_discount/OTRO').set(desde(ip))).status, 429)
})

test('el limite de un endpoint no frena el resto (la puerta y la compra siguen andando)', async () => {
  const ip = '203.0.113.10'  //la IP bloqueada en el login
  assert.equal((await request(app).get('/getAllEvents').set(desde(ip))).status, 200)
})
