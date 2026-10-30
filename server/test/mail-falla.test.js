import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import { loadApp, closeDb, uniqueMail } from "./helpers.js"

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
