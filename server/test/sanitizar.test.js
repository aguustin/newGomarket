import { test, before, after, beforeEach } from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import bcrypt from "bcrypt"
import { loadApp, closeDb, resetDb, uniqueMail, crearSesion } from "./helpers.js"

//Etapa 12: los datos que llegan no pueden traer operadores de MongoDB
let app, userModel
before(async () => {
  app = await loadApp({ mailMode: 'bandeja' })
  userModel = (await import('../models/userModel.js')).default
})
after(closeDb)
beforeEach(resetDb)

test('CRITICO: login con operadores ({$ne}, {$gt}) se rechaza con 400 y no inicia sesion', async () => {
  const mail = uniqueMail('victima')
  await userModel.create({ mail, nombreCompleto: 'V', contrasenia: await bcrypt.hash('Clave12345', 4) })
  for (const cuerpo of [{ mail: { $ne: null }, contrasenia: 'x' }, { mail: { $gt: '' }, contrasenia: { $ne: 'x' } }]) {
    const res = await request(app).post('/login').send(cuerpo)
    assert.equal(res.status, 400)
    assert.equal(res.body.code, 'DATOS_INVALIDOS')
    assert.equal(res.body.token, undefined)
  }
  //Login normal sigue andando
  assert.equal((await request(app).post('/login').send({ mail, contrasenia: 'Clave12345' })).body.estado, 1)
})

test('operadores anidados en cualquier nivel, en query o en formularios con archivos: 400', async () => {
  assert.equal((await request(app).post('/buy').send({ prodId: 'x', quantities: { a: { amount: { $gt: 0 } } } })).status, 400)
  assert.equal((await request(app).get('/getAllEvents').query({ $where: '1' })).status, 400)
  //Express 5 no arma objetos con corchetes en la query: "filtro[$ne]" llega como texto y no es un operador
  assert.equal((await request(app).get('/getAllEvents').query({ 'filtro[$ne]': '1' })).status, 200)
  const yo = await crearSesion()
  const multipart = await request(app).post('/create_seller_profile').set(yo.auth).field('userId[$ne]', 'x')
  assert.equal(multipart.status, 400)
})

test('datos normales y el webhook de Mercado Pago (?data.id=) siguen pasando', async () => {
  const hook = await request(app).post('/webhook/mercadopago?data.id=123&type=payment').send({ action: 'payment.created', data: { id: '123' } })
  assert.notEqual(hook.status, 400)
  assert.equal((await request(app).post('/recover_password').send({ mail: 'precio$100@x.com' })).status, 200, 'un $ dentro de un valor no es un operador')
})
