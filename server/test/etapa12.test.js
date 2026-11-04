import { test, before, after, beforeEach } from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import jwt from "jsonwebtoken"
import { loadApp, closeDb, resetDb, crearSesion } from "./helpers.js"

//Etapa 12 (riesgo bajo): rutas publicas sin datos privados, links vencidos, CORS, arranque sin Redis
let app, ticketModel
before(async () => {
  delete process.env.REDIS_URL  //el servidor tiene que arrancar sin Redis (el worker esta fuera de uso)
  app = await loadApp({ mailMode: 'bandeja' })
  ticketModel = (await import('../models/ticketsModel.js')).default
})
after(closeDb)
beforeEach(resetDb)

const enUnMes = () => new Date(Date.now() + 30 * 24 * 3600 * 1000)
const PRIVADOS = ['rrpp', 'prodMail', 'categorias', 'totalVentas', 'totalMontoVendido', 'montoTotal']

const eventoConStaff = async () => {
  const dueno = await crearSesion()
  const ev = await ticketModel.create({
    userId: dueno.id, nombreEvento: 'Publico', active: true, prodMail: 'iv:cifrado', fechaFin: enUnMes(),
    totalVentas: 5, totalMontoVendido: 1000, montoTotal: 1000,
    tickets: [{ nombreTicket: 'General', precio: 100, cantidad: 10, estado: 1, fechaDeCierre: enUnMes() }],
    rrpp: [{ nombre: 'R', mail: 'rrpp@x.com', cbu: 123, alias: 'alias.rrpp', telefono: 1155, mailHash: 'h' }]
  })
  const rel = await ticketModel.create({ userId: dueno.id, nombreEvento: 'Otra fecha', active: true, fechaFin: enUnMes(), rrpp: [{ mail: 'b@x.com' }], prodMail: 'x',
    eventosRelacionados: [{ idEvento: String(ev._id) }] })
  return { ev, rel }
}
const sinPrivados = (doc, donde) => {
  for (const k of PRIVADOS) assert.equal(doc[k], undefined, `${donde} expone ${k}`)
  assert.ok(!JSON.stringify(doc).includes('rrpp@x.com'), `${donde} expone el mail del RRPP`)
}

test('CRITICO: inicio, compra y eventos relacionados no exponen datos del staff ni de ventas', async () => {
  const { ev, rel } = await eventoConStaff()
  const home = (await request(app).get('/getAllEvents')).body
  assert.equal(home.length, 2)
  home.forEach((d) => sinPrivados(d, '/getAllEvents'))

  const [compra] = (await request(app).get(`/buy_tickets/${ev._id}`)).body
  sinPrivados(compra, '/buy_tickets')
  assert.equal(compra.nombreEvento, 'Publico')
  assert.equal(compra.tickets[0].precio, 100, 'lo que necesita la pantalla de compra sigue estando')

  const { relacionados } = (await request(app).get(`/obtener_eventos_relacionados/${rel._id}`)).body
  assert.equal(relacionados.length, 1)
  sinPrivados(relacionados[0], '/obtener_eventos_relacionados')

  assert.deepEqual((await request(app).get('/buy_tickets/no-es-un-id')).body, [])
})

test('link de verificacion vencido o invalido: lleva al login con aviso, no da error', async () => {
  const vencido = jwt.sign({ nombreCompleto: 'X', mail: 'x@x.com', encriptContrasenia: 'h', exp: Math.floor(Date.now() / 1000) - 60 }, process.env.JWT_SECRET)
  for (const token of [vencido, 'basura']) {
    const res = await request(app).get(`/verify_account/${token}`)
    assert.equal(res.status, 302)
    assert.equal(res.headers.location, `${process.env.URL_FRONT_DEV}/login?verificacion=vencida`)
  }
})

test('link de recuperacion vencido o invalido: avisa LINK_VENCIDO y no cambia nada', async () => {
  const vencido = jwt.sign({ mail: 'x@x.com', exp: Math.floor(Date.now() / 1000) - 60 }, process.env.JWT_SECRET)
  for (const token of [vencido, 'basura']) {
    const res = await request(app).post('/new_password').send({ token, nuevaContrasenia: 'Nueva12345' })
    assert.equal(res.status, 200)
    assert.deepEqual(res.body, { code: 'LINK_VENCIDO' })
  }
})

test('CRITICO: el link de recuperacion sirve una sola vez; otros tokens no cambian contraseñas; mail inexistente no revela nada', async () => {
  const bcrypt = (await import('bcrypt')).default
  const userModel = (await import('../models/userModel.js')).default
  const mail = `reset-${Date.now()}@ipass-test.local`
  await userModel.create({ mail, nombreCompleto: 'R', contrasenia: await bcrypt.hash('Vieja12345', 4) })

  assert.deepEqual((await request(app).post('/recover_password').send({ mail })).body, { ok: true })
  const [m] = (await request(app).get('/dev/mails.json').query({ to: mail })).body
  const token = decodeURIComponent(m.html.match(/recover_password\/([^"]+)"/)[1])

  assert.equal((await request(app).post('/new_password').send({ token, nuevaContrasenia: 'Nueva12345' })).body, 1)
  assert.equal((await request(app).post('/login').send({ mail, contrasenia: 'Nueva12345' })).body.estado, 1)
  //Segunda vez con el mismo link: no
  assert.deepEqual((await request(app).post('/new_password').send({ token, nuevaContrasenia: 'Otra123456' })).body, { code: 'LINK_VENCIDO' })
  assert.equal((await request(app).post('/login').send({ mail, contrasenia: 'Nueva12345' })).body.estado, 1)

  //Un token con el mail pero de otro tipo (verificacion de cuenta, o el formato viejo) no cambia la contraseña
  for (const otro of [jwt.sign({ mail }, process.env.JWT_SECRET, { expiresIn: '20m' }),
    jwt.sign({ nombreCompleto: 'R', mail, encriptContrasenia: 'h' }, process.env.JWT_SECRET, { expiresIn: '20m' })]) {
    assert.deepEqual((await request(app).post('/new_password').send({ token: otro, nuevaContrasenia: 'Hack123456' })).body, { code: 'LINK_VENCIDO' })
  }

  //Mail sin cuenta: misma respuesta y no se manda nada
  const nadie = `nadie-${Date.now()}@ipass-test.local`
  assert.deepEqual((await request(app).post('/recover_password').send({ mail: nadie })).body, { ok: true })
  assert.equal((await request(app).get('/dev/mails.json').query({ to: nadie })).body.length, 0)
})

test('CORS: el frontend si, otros sitios no; pedidos sin Origin (webhooks) si', async () => {
  const front = process.env.URL_FRONT_DEV.replace(/\/+$/, '')
  const ok = await request(app).get('/getAllEvents').set('Origin', front)
  assert.equal(ok.headers['access-control-allow-origin'], front)
  const local = await request(app).get('/getAllEvents').set('Origin', 'http://localhost:5174')
  assert.equal(local.headers['access-control-allow-origin'], 'http://localhost:5174', 'en dev cualquier localhost (E2E)')
  const ajeno = await request(app).get('/getAllEvents').set('Origin', 'https://sitio-malo.com')
  assert.equal(ajeno.headers['access-control-allow-origin'], undefined)
  assert.equal((await request(app).post('/webhook/mercadopago').send({})).status, 200)
})
