import { test, before, after, beforeEach } from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { loadApp, closeDb, resetDb, uniqueMail, crearSesion } from "./helpers.js"

//Etapa 6: sesion real en el backend
let app, userModel, ticketModel
const JWT_SECRET = () => process.env.JWT_SECRET || 'kidjaskdhajsdbjadlfgkjmlkjbnsdlfgnsñlknamnczmjcf'

before(async () => {
  app = await loadApp({ mailMode: 'bandeja' })
  userModel = (await import('../models/userModel.js')).default
  ticketModel = (await import('../models/ticketsModel.js')).default
})
after(closeDb)
beforeEach(resetDb)

const crearUsuario = async (pass = 'Clave12345', extra = {}) => {
  const mail = uniqueMail('auth')
  const user = await userModel.create({ mail, nombreCompleto: 'Auth Test', contrasenia: await bcrypt.hash(pass, 4), comisionServicio: 12, ...extra })
  return { user, mail, pass }
}

test('login: devuelve token de sesion, la misma forma de antes y nunca el hash de la contraseña', async () => {
  const { user, mail, pass } = await crearUsuario()
  const res = await request(app).post('/login').send({ mail, contrasenia: pass })

  assert.equal(res.body.estado, 1)
  assert.equal(res.body.userFinded[0]._id, user._id.toString())
  assert.equal(res.body.userFinded[0].contrasenia, undefined)
  assert.doesNotMatch(JSON.stringify(res.body), /\$2[aby]\$/, 'ningun hash bcrypt en la respuesta')

  const payload = jwt.verify(res.body.token, JWT_SECRET())
  assert.equal(payload.sub, user._id.toString())
  assert.equal(payload.typ, 'sesion')
  assert.ok(payload.exp - payload.iat === 7 * 24 * 3600, 'dura 7 dias')
})

test('login fallido no entrega token', async () => {
  const { mail } = await crearUsuario()
  const mal = await request(app).post('/login').send({ mail, contrasenia: 'otra' })
  assert.equal(mal.body.estado, 2)
  assert.equal(mal.body.token, undefined)
  assert.equal((await request(app).post('/login').send({ mail: uniqueMail('nadie'), contrasenia: 'x' })).body.estado, 3)
})

test('el token del login sirve para las rutas privadas', async () => {
  const { mail, pass, user } = await crearUsuario()
  const { body } = await request(app).post('/login').send({ mail, contrasenia: pass })
  const res = await request(app).get(`/my_productions/${user._id}`).set('Authorization', `Bearer ${body.token}`)
  assert.equal(res.status, 200)
})

//Rutas privadas: sin sesion responden 401 y no ejecutan nada
const privadas = [
  ['post', '/createEvent'], ['post', '/createEventTickets'], ['post', '/updateEvent'], ['post', '/updateTickets'],
  ['get', '/my_productions/000000000000000000000000'], ['get', '/get_prod/000000000000000000000000/000000000000000000000000'],
  ['post', '/addRRPP'], ['post', '/sendQrStaff'], ['get', '/get_my_rrpp_events/a@b.c'], ['get', '/rrpp_get_event_free/x/a@b.c'],
  ['post', '/generate_rrpp_url'], ['post', '/descargar_compradores'], ['post', '/relacionar_eventos'], ['post', '/cancelar_evento'],
  ['post', '/reactivar_evento'], ['post', '/sold_out'], ['get', '/get_buyers/x'], ['post', '/create_discount'],
  ['post', '/save_event'], ['post', '/obtain_saved_event'], ['post', '/create_seller_profile'], ['post', '/get_favorites'],
  ['get', '/get_event_cortesies/x/y'], ['get', '/get_rrpp_event_excels/x/y'], ['get', '/get_cortesie/x'],
  ['post', '/charge_excel'], ['post', '/charge_rrpp_excel'], ['post', '/send_cortesies'], ['post', '/send_rrpp_cortesies'],
  ['delete', '/delete_cortesie/x/y'], ['delete', '/delete_rrpp_excel/x/y']
]

test(`las ${privadas.length} rutas privadas responden 401 sin sesion`, async () => {
  for (const [metodo, ruta] of privadas) {
    const res = await request(app)[metodo](ruta).send({})
    assert.equal(res.status, 401, `${metodo.toUpperCase()} ${ruta}`)
    assert.equal(res.body.code, 'NO_AUTENTICADO', `${metodo.toUpperCase()} ${ruta}`)
  }
})

test('CRITICO: cancelar un evento sin sesion ya no reembolsa ni desactiva nada', async () => {
  const ev = await ticketModel.create({ userId: 'u', nombreEvento: 'No tocar', active: true })
  assert.equal((await request(app).post('/cancelar_evento').send({ prodId: ev._id.toString() })).status, 401)
  assert.equal((await ticketModel.findById(ev._id).lean()).active, true)
})

test('tokens que no son de sesion (QR, recuperacion, verificacion) no sirven como sesion aunque esten bien firmados', async () => {
  const { user } = await crearUsuario()
  const otros = [
    jwt.sign({ nombreCompleto: 'X', dni: 1, eventId: 'e', ticketId: 't', jti: 'j' }, JWT_SECRET()),              // QR de una entrada
    jwt.sign({ mail: user.mail }, JWT_SECRET(), { expiresIn: '20m' }),                                            // recuperar contraseña
    jwt.sign({ nombreCompleto: 'X', mail: user.mail, encriptContrasenia: 'h' }, JWT_SECRET(), { expiresIn: '20m' }), // verificar cuenta
    jwt.sign({ sub: user._id.toString() }, JWT_SECRET())                                                          // sin typ
  ]
  for (const token of otros) {
    const res = await request(app).get(`/my_productions/${user._id}`).set('Authorization', `Bearer ${token}`)
    assert.equal(res.status, 401)
  }
})

test('token invalido, de otra clave, vencido o de un usuario borrado: 401', async () => {
  const { user } = await crearUsuario()
  const ruta = `/my_productions/${user._id}`
  const casos = {
    basura: 'no-es-un-jwt',
    otraClave: jwt.sign({ sub: user._id.toString(), typ: 'sesion' }, 'otra-clave'),
    vencido: jwt.sign({ sub: user._id.toString(), typ: 'sesion', exp: Math.floor(Date.now() / 1000) - 60 }, JWT_SECRET())
  }
  for (const [nombre, token] of Object.entries(casos)) {
    const res = await request(app).get(ruta).set('Authorization', `Bearer ${token}`)
    assert.equal(res.status, 401, nombre)
  }
  const vencido = await request(app).get(ruta).set('Authorization', `Bearer ${casos.vencido}`)
  assert.equal(vencido.body.code, 'SESION_VENCIDA')

  assert.equal((await request(app).get(ruta).set('Authorization', casos.otraClave)).status, 401, 'sin "Bearer"')

  const borrado = await crearSesion()
  await userModel.deleteOne({ _id: borrado.id })
  assert.equal((await request(app).get(`/my_productions/${borrado.id}`).set(borrado.auth)).status, 401)
})

test('no se puede operar en nombre de otro usuario (userId o mail ajenos): 403', async () => {
  const yo = await crearSesion()
  const otro = await crearSesion()
  const casos = [
    request(app).get(`/my_productions/${otro.id}`),
    request(app).get(`/get_prod/000000000000000000000000/${otro.id}`),
    request(app).get(`/get_my_rrpp_events/${otro.user.mail}`),
    request(app).post('/generate_rrpp_url').send({ prodId: 'x', rrppMail: otro.user.mail }),
    request(app).post('/save_event').send({ userId: otro.id, eventId: 'e' }),
    request(app).post('/get_favorites').send({ userId: otro.id }),
    request(app).get(`/get_event_cortesies/${otro.id}/p`)
  ]
  for (const pedido of casos) {
    const res = await pedido.set(yo.auth)
    assert.equal(res.status, 403)
    assert.equal(res.body.code, 'OTRO_USUARIO')
  }
  //El mismo usuario si puede (el mail se compara sin mayusculas)
  assert.equal((await request(app).get(`/my_productions/${yo.id}`).set(yo.auth)).status, 200)
  assert.equal((await request(app).get(`/get_my_rrpp_events/${yo.user.mail.toUpperCase()}`).set(yo.auth)).status, 200)
})

test('crear evento: el dueño, su mail y la comision salen de la sesion, no del formulario', async () => {
  const yo = await crearSesion({ comisionServicio: 12 })
  const otro = await crearSesion()
  const res = await request(app).post('/createEvent').set(yo.auth)
    .field('userId', otro.id).field('prodMail', 'falso@ipass-test.local').field('comisionServicio', '0')
    .field('nombreEvento', 'Evento sesion').field('categoriasEventos', '[]').field('tipoEvento', '1')
  assert.equal(res.status, 200)

  const ev = await ticketModel.findById(res.body.eventId).lean()
  assert.equal(ev.userId, yo.id)
  assert.equal(ev.comisionServicio, 12, 'la comision del usuario, no el 0 del formulario')
  const { decrypt } = await import('../controllers/eventController.js')
  assert.equal(decrypt(ev.prodMail), yo.user.mail)
})

test('crear evento con categorias mal formadas: 400 sin romper el servidor', async () => {
  const yo = await crearSesion()
  const res = await request(app).post('/createEvent').set(yo.auth).field('nombreEvento', 'X').field('categoriasEventos', '{no-json')
  assert.equal(res.status, 400)
})

test('perfil publico y /getAllUsers no exponen contraseñas; /tokens queda cerrado', async () => {
  const { user } = await crearUsuario()
  const perfil = await request(app).post('/get_profile').send({ userId: user._id.toString() })
  assert.equal(perfil.status, 200)
  assert.equal(perfil.body[0].mail, user.mail)
  assert.equal(perfil.body[0].contrasenia, undefined)

  assert.equal((await request(app).get('/getAllUsers')).status, 410)
  assert.equal((await request(app).get('/tokens')).status, 410)
})

test('create_seller_profile responde el usuario sin contraseña', async () => {
  const pass = 'Clave12345'
  const { user, mail } = await crearUsuario(pass)
  const { body: login } = await request(app).post('/login').send({ mail, contrasenia: pass })
  const res = await request(app).post('/create_seller_profile').set('Authorization', `Bearer ${login.token}`)
    .field('userId', user._id.toString()).field('tipo', '1').field('dataA', 'Nombre Completo')
  assert.equal(res.status, 200)
  assert.equal(res.body.estado, 1)
  assert.equal(res.body.userFinded[0].contrasenia, undefined)
})

test('siguen publicas: Home, compra, webhook, resultado de pago, registro, login y recuperacion', async () => {
  assert.equal((await request(app).get('/getAllEvents')).status, 200)
  assert.notEqual((await request(app).post('/buy').send({})).status, 401)
  assert.equal((await request(app).post('/webhook/mercadopago')).status, 200)
  assert.notEqual((await request(app).get('/payment_status/abc')).status, 401)
  assert.notEqual((await request(app).post('/register').send({})).status, 401)
  assert.notEqual((await request(app).post('/recover_password').send({ mail: uniqueMail('r') })).status, 401)
})
