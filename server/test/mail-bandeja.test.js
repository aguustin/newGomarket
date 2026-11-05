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
  assert.equal(verify.headers.location, `${process.env.URL_FRONT_DEV}/login?verificacion=ok`)

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
  const userModel = (await import('../models/userModel.js')).default
  await userModel.create({ mail, nombreCompleto: 'R', contrasenia: 'hash-cualquiera' })
  const res = await request(app).post('/recover_password').send({ mail })
  assert.deepEqual(res.body, { ok: true })

  const [recMail] = await inbox(mail)
  assert.ok(recMail, 'no llego el mail de recuperacion')
  assert.ok(findLink(recMail.html, '/recover_password/').startsWith(`${process.env.URL_FRONT_DEV}/recover_password/`))
})

test('contacto: sale por Resend al ADMIN_MAIL, con el mensaje escapado; sin ADMIN_MAIL avisa el error', async () => {
  const antes = process.env.ADMIN_MAIL
  try {
    process.env.ADMIN_MAIL = 'admin-contacto@x.com'
    const res = await request(app).post('/contactar').send({
      pais: 'AR', nombreCompleto: 'Test Contacto', correo: uniqueMail('contacto'), celular: '11', nombreEvento: 'Evento X', mensaje: 'Hola <img src=x onerror=alert(1)>'
    })
    assert.deepEqual(res.body, { state: 1 })
    const [contacto] = await inbox('admin-contacto@x.com')
    assert.ok(contacto?.subject.includes('Test Contacto - Evento X'), 'no llego el mail de contacto')
    assert.equal(contacto.provider, 'resend')
    assert.ok(contacto.html.includes('&lt;img') && !contacto.html.includes('<img src=x'), 'el mensaje debe ir escapado')

    assert.equal((await request(app).post('/contactar').send({ nombreCompleto: 'A', correo: 'no-es-mail', mensaje: 'x' })).status, 400)
    delete process.env.ADMIN_MAIL
    const sinDestino = await request(app).post('/contactar').send({ nombreCompleto: 'A', correo: 'a@x.com', mensaje: 'x' })
    assert.equal(sinDestino.status, 503)
  } finally {
    if (antes === undefined) delete process.env.ADMIN_MAIL; else process.env.ADMIN_MAIL = antes
  }
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
