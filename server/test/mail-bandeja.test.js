import { test, before, after } from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import { loadApp, closeDb, uniqueMail, findLink } from "./helpers.js"

let app
before(async () => { app = await loadApp({ mailMode: 'bandeja' }) })
after(closeDb)

const inbox = async (to) => (await request(app).get('/dev/mails.json').query({ to })).body

const register = (mail, contrasenia = 'Prueba123') => request(app).post('/register').send({
  nombreCompleto: 'Test Ipass', mail, dni: 12345678, pais: 'AR', contrasenia, repetirContrasenia: contrasenia
})

test('registro -> mail de verificacion en la bandeja -> verificar -> login', async () => {
  const mail = uniqueMail('registro')

  const reg = await register(mail)
  assert.deepEqual(reg.body, { msj: 1 })

  //Antes de verificar la cuenta no existe
  assert.equal((await request(app).post('/login').send({ mail, contrasenia: 'Prueba123' })).body.estado, 3)

  const [verifMail] = await inbox(mail)
  assert.ok(verifMail, 'no llego el mail de verificacion a la bandeja')
  assert.equal(verifMail.provider, 'resend')
  assert.match(verifMail.subject, /Verifica tu correo/)

  const verifyPath = new URL(findLink(verifMail.html, '/verify_account/')).pathname
  const verify = await request(app).get(verifyPath)
  assert.equal(verify.status, 302)
  assert.equal(verify.headers.location, `${process.env.URL_FRONT_DEV}/login`)

  const login = await request(app).post('/login').send({ mail, contrasenia: 'Prueba123' })
  assert.equal(login.body.estado, 1)
  assert.equal(login.body.userFinded.length, 1)

  //Abrir el link de nuevo no duplica el usuario
  await request(app).get(verifyPath)
  assert.equal((await request(app).post('/login').send({ mail, contrasenia: 'Prueba123' })).body.userFinded.length, 1)

  //Registrarse otra vez con el mismo mail no se permite
  assert.deepEqual((await register(mail)).body, { msj: 'El usuario ya existe' })
})

test('recuperar contraseña: el mail llega a la bandeja con el link al frontend', async () => {
  const mail = uniqueMail('recupero')
  const res = await request(app).post('/recover_password').send({ mail })
  assert.deepEqual(res.body, { ok: true })

  const [recMail] = await inbox(mail)
  assert.ok(recMail, 'no llego el mail de recuperacion')
  assert.ok(findLink(recMail.html, '/recover_password/').startsWith(`${process.env.URL_FRONT_DEV}/recover_password/`))
})

test('contacto (Gmail) tambien pasa por la bandeja', async () => {
  const res = await request(app).post('/contactar').send({
    pais: 'AR', nombreCompleto: 'Test Contacto', correo: uniqueMail('contacto'), dni: 1, nombreEvento: 'Evento X', mensaje: 'Hola'
  })
  assert.deepEqual(res.body, { state: 1 })
  const mails = await inbox()
  const contacto = mails.find((m) => m.subject.includes('Test Contacto - Evento X'))
  assert.ok(contacto, 'no llego el mail de contacto')
  assert.equal(contacto.provider, 'gmail')
})

test('la bandeja rechaza pedidos que llegan por un proxy (ngrok)', async () => {
  const res = await request(app).get('/dev/mails').set('X-Forwarded-For', '203.0.113.7')
  assert.equal(res.status, 403)
})

test('la vista de un mail muestra las imagenes embebidas (cid) como data URI', async () => {
  const { resend } = await import('../lib/resendDomain.js')
  const to = uniqueMail('qr')
  const { data, error } = await resend.emails.send({
    from: 'Ipass <no-reply@ipassi.com>', to: [to], subject: 'QR de prueba',
    html: '<img src="cid:qrcodeimg0">',
    attachments: [{ filename: 'qr.png', content: Buffer.from('png'), contentType: 'image/png', contentId: 'qrcodeimg0' }]
  })
  assert.equal(error, null)
  const page = await request(app).get(`/dev/mails/${data.id}`)
  assert.equal(page.status, 200)
  assert.ok(page.text.includes(`data:image/png;base64,${Buffer.from('png').toString('base64')}`))
  assert.ok(!page.text.includes('cid:qrcodeimg0'))
})
