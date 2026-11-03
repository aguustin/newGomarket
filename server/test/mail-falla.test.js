import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import { loadApp, closeDb, uniqueMail, crearSesion } from "./helpers.js"

//MAIL_MODE=falla: el proveedor rechaza todos los envios
let app
before(async () => { app = await loadApp({ mailMode: 'falla' }) })
after(closeDb)

test('registro: si el mail de verificacion falla, se avisa y no se responde exito', async () => {
  const res = await request(app).post('/register').send({
    nombreCompleto: 'Test', mail: uniqueMail('falla'), dni: 1, pais: 'AR', contrasenia: 'a', repetirContrasenia: 'a'
  })
  assert.notEqual(res.body.msj, 1)
  assert.match(res.body.msj, /No pudimos enviar el correo/)
})

test('recuperar contraseña: si el mail falla responde ok:false', async () => {
  const res = await request(app).post('/recover_password').send({ mail: uniqueMail('falla') })
  assert.deepEqual(res.body, { ok: false })
})

test('contacto (Gmail): la falla del proveedor llega como error del servidor, no como exito', async () => {
  const res = await request(app).post('/contactar').send({
    pais: 'AR', nombreCompleto: 'T', correo: uniqueMail('falla'), dni: 1, nombreEvento: 'E', mensaje: 'm'
  })
  assert.equal(res.status, 500)
  assert.notDeepEqual(res.body, { state: 1 })
})

test('en modo falla no se guarda nada en la bandeja', async () => {
  const res = await request(app).get('/dev/mails.json')
  assert.deepEqual(res.body, [])
})

test('cortesias del RRPP: si el mail con los QR falla, el cupo vuelve al RRPP', async () => {
  const ticketModel = (await import('../models/ticketsModel.js')).default
  const rrpp = await crearSesion()
  const enUnMes = new Date(Date.now() + 30 * 24 * 3600 * 1000)
  const ev = await ticketModel.create({
    userId: 'dueno', nombreEvento: 'Falla cortesias', active: true, fechaFin: enUnMes, fechaInicio: enUnMes,
    cortesiaRRPP: [{ nombreTicket: 'VIP', cantidadDeCortesias: 0, fechaDeCierre: enUnMes }],
    rrpp: [{ mail: rrpp.user.mail, ticketsCortesias: [], freeEntregados: 0 }]
  })
  const vip = ev.cortesiaRRPP[0]._id.toString()
  await ticketModel.updateOne({ _id: ev._id }, { $push: { 'rrpp.0.ticketsCortesias': { ticketIdCortesia: vip, cantidadDeCortesias: 3 } } })

  const res = await request(app).post('/rrpp_enviar_cortesias').set(rrpp.auth)
    .send({ prodId: ev._id.toString(), ticketId: vip, cantidad: 2, mail: uniqueMail('cliente'), nombreCompleto: 'Cliente' })
  assert.equal(res.status, 502)
  assert.match(res.body.error, /no se descontó/)

  const [r] = (await ticketModel.findById(ev._id).lean()).rrpp
  assert.equal(r.ticketsCortesias[0].cantidadDeCortesias, 3, 'el cupo volvio')
  assert.equal(r.freeEntregados, 0)
})
