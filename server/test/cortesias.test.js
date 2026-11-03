import { test, before, after, beforeEach } from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import { loadApp, closeDb, resetDb, crearSesion, uniqueMail } from "./helpers.js"

//Etapa 7b: el dueño asigna cortesias a sus RRPP y cada RRPP las envia a sus clientes
let app, ticketModel, tokenModel

before(async () => {
  app = await loadApp({ mailMode: 'bandeja' })
  ticketModel = (await import('../models/ticketsModel.js')).default
  tokenModel = (await import('../models/tokenModel.js')).default
})
after(closeDb)
beforeEach(resetDb)

const enUnMes = () => new Date(Date.now() + 30 * 24 * 3600 * 1000)
const ayer = () => new Date(Date.now() - 24 * 3600 * 1000)

const escenario = async ({ cupoVip = 5, cierreVip = enUnMes() } = {}) => {
  const dueno = await crearSesion({ nombreCompleto: 'Dueño' })
  const rrpp = await crearSesion({ nombreCompleto: 'RRPP', mail: `RRPP.Mayus-${Date.now()}@ipass-test.local` })
  const otroRRPP = await crearSesion({ nombreCompleto: 'Otro RRPP' })
  const evento = await ticketModel.create({
    userId: dueno.id, nombreEvento: 'Evento Cortesías', active: true, fechaInicio: enUnMes(), fechaFin: enUnMes(),
    direccion: 'Calle 1', imgEvento: 'https://example.com/i.png',
    cortesiaRRPP: [
      { nombreTicket: 'VIP cortesía', cantidadDeCortesias: cupoVip, entregados: 0, fechaDeCierre: cierreVip, estado: 3, limit: 10 },
      { nombreTicket: 'General cortesía', cantidadDeCortesias: 10, entregados: 0, fechaDeCierre: enUnMes(), estado: 3 }
    ],
    //el RRPP se guardo en minusculas (como lo cargo el dueño); su sesion tiene mayusculas
    rrpp: [{ mail: rrpp.user.mail.toLowerCase(), ticketsCortesias: [], ventasRRPP: [], freeEntregados: 0 },
           { mail: otroRRPP.user.mail, ticketsCortesias: [], ventasRRPP: [], freeEntregados: 0 }]
  })
  const vip = evento.cortesiaRRPP[0]._id.toString()
  const general = evento.cortesiaRRPP[1]._id.toString()
  return { dueno, rrpp, otroRRPP, evento, prodId: evento._id.toString(), vip, general }
}

const asignar = (e, mail, quantities, auth = e.dueno.auth) =>
  request(app).post('/sendQrStaff').set(auth).send({ prodId: e.prodId, quantities, mail })
const enviar = (e, auth, body) =>
  request(app).post('/rrpp_enviar_cortesias').set(auth).send({ prodId: e.prodId, mail: uniqueMail('cliente'), nombreCompleto: 'Cliente', ...body })
const leer = async (e) => ticketModel.findById(e.prodId).lean()
const cupoDe = (ev, mail, id) => ev.rrpp.find((r) => r.mail.toLowerCase() === mail.toLowerCase())?.ticketsCortesias.find((t) => t.ticketIdCortesia === id)?.cantidadDeCortesias ?? 0

test('el dueño asigna cortesias: baja el cupo total y sube el del RRPP (aunque el mail tenga otras mayusculas)', async () => {
  const e = await escenario()
  const res = await asignar(e, e.rrpp.user.mail, { [e.vip]: 3, [e.general]: 2 })
  assert.equal(res.body.state, 1)

  const ev = await leer(e)
  assert.equal(ev.cortesiaRRPP[0].cantidadDeCortesias, 2)
  assert.equal(ev.cortesiaRRPP[0].entregados, 3)
  assert.equal(ev.cortesiaRRPP[1].cantidadDeCortesias, 8)
  assert.equal(ev.rrpp.length, 2, 'no se duplico el RRPP por las mayusculas')
  assert.equal(cupoDe(ev, e.rrpp.user.mail, e.vip), 3)
  assert.equal(cupoDe(ev, e.rrpp.user.mail, e.general), 2)

  //Una segunda asignacion suma al cupo existente
  assert.equal((await asignar(e, e.rrpp.user.mail, { [e.vip]: 1 })).body.state, 1)
  assert.equal(cupoDe(await leer(e), e.rrpp.user.mail, e.vip), 4)
})

test('asignar mas de lo que hay: state 2 y no cambia nada (todo o nada)', async () => {
  const e = await escenario({ cupoVip: 2 })
  const res = await asignar(e, e.rrpp.user.mail, { [e.vip]: 3, [e.general]: 1 })
  assert.equal(res.body.state, 2)
  const ev = await leer(e)
  assert.equal(ev.cortesiaRRPP[0].cantidadDeCortesias, 2)
  assert.equal(ev.cortesiaRRPP[1].cantidadDeCortesias, 10)
  assert.equal(cupoDe(ev, e.rrpp.user.mail, e.general), 0)
})

test('CRITICO: asignaciones simultaneas no superan el cupo total', async () => {
  const e = await escenario({ cupoVip: 5 })
  const res = await Promise.all(Array.from({ length: 4 }, () => asignar(e, e.rrpp.user.mail, { [e.vip]: 2 })))
  assert.equal(res.filter((r) => r.body.state === 1).length, 2)
  assert.equal(res.filter((r) => r.body.state === 2).length, 2)
  const ev = await leer(e)
  assert.equal(ev.cortesiaRRPP[0].cantidadDeCortesias, 1)
  assert.equal(cupoDe(ev, e.rrpp.user.mail, e.vip), 4)
  const registros = ev.rrpp.find((r) => r.mail.toLowerCase() === e.rrpp.user.mail.toLowerCase()).ticketsCortesias.filter((t) => t.ticketIdCortesia === e.vip)
  assert.equal(registros.length, 1, 'un solo registro por tipo de cortesia (sin duplicados por la concurrencia)')
})

test('asignar a alguien que todavia no era RRPP lo agrega al evento', async () => {
  const e = await escenario()
  const nuevo = uniqueMail('nuevo-rrpp')
  assert.equal((await asignar(e, nuevo, { [e.general]: 2 })).body.state, 1)
  assert.equal(cupoDe(await leer(e), nuevo, e.general), 2)
})

test('asignacion con datos invalidos: 400', async () => {
  const e = await escenario()
  assert.equal((await asignar(e, 'no-es-mail', { [e.vip]: 1 })).status, 400)
  assert.equal((await asignar(e, e.rrpp.user.mail, { [e.vip]: -1 })).status, 400)
  assert.equal((await asignar(e, e.rrpp.user.mail, { [e.vip]: 1.5 })).status, 400)
  assert.equal((await asignar(e, e.rrpp.user.mail, { '000000000000000000000000': 1 })).status, 400)
  assert.equal((await asignar(e, e.rrpp.user.mail, {})).status, 400)
})

test('el RRPP ve sus cortesias disponibles; quien no es RRPP del evento recibe 403', async () => {
  const e = await escenario()
  await asignar(e, e.rrpp.user.mail, { [e.vip]: 3 })
  const res = await request(app).get(`/rrpp_cortesias/${e.prodId}`).set(e.rrpp.auth)
  assert.equal(res.status, 200)
  assert.equal(res.body.evento.nombreEvento, 'Evento Cortesías')
  assert.equal(res.body.evento.rrpp, undefined, 'no expone a los demas RRPP')
  assert.deepEqual(res.body.cortesias.map((c) => [c.nombreTicket, c.disponibles, c.cerrada]), [['VIP cortesía', 3, false]])

  const tercero = await crearSesion()
  assert.equal((await request(app).get(`/rrpp_cortesias/${e.prodId}`).set(tercero.auth)).status, 403)
  assert.equal((await request(app).get(`/rrpp_cortesias/${e.prodId}`)).status, 401)
})

test('el RRPP envia cortesias: QR por mail al cliente, su cupo baja y el QR es valido en la puerta', async () => {
  const e = await escenario()
  await asignar(e, e.rrpp.user.mail, { [e.vip]: 3 })
  const cliente = uniqueMail('cliente')
  const res = await enviar(e, e.rrpp.auth, { ticketId: e.vip, cantidad: 2, mail: cliente, nombreCompleto: 'Cliente Feliz' })
  assert.equal(res.status, 200)
  assert.equal(res.body.enviadas, 2)

  const ev = await leer(e)
  assert.equal(cupoDe(ev, e.rrpp.user.mail, e.vip), 1)
  assert.equal(ev.rrpp.find((r) => r.mail.toLowerCase() === e.rrpp.user.mail.toLowerCase()).freeEntregados, 2)

  const [mail] = (await request(app).get('/dev/mails.json').query({ to: cliente })).body
  assert.match(mail.subject, /Tus entradas para Evento Cortesías/)
  assert.equal(mail.attachments.length, 2)

  const tokens = await tokenModel.find().lean()
  assert.equal(tokens.length, 2)
  const validacion = await request(app).get(`/ticket/validate/${tokens[0].token}`)
  assert.equal(validacion.status, 200)
  assert.equal(validacion.body.tipo, 'Cortesia')
  assert.equal(validacion.body.nombreTicket, 'VIP cortesía')
})

test('enviar mas que el cupo: 409 y no sale nada', async () => {
  const e = await escenario()
  await asignar(e, e.rrpp.user.mail, { [e.vip]: 2 })
  const res = await enviar(e, e.rrpp.auth, { ticketId: e.vip, cantidad: 3 })
  assert.equal(res.status, 409)
  assert.equal(res.body.code, 'SIN_CUPO')
  assert.equal(await tokenModel.countDocuments(), 0)
  assert.equal(cupoDe(await leer(e), e.rrpp.user.mail, e.vip), 2)
})

test('CRITICO: envios simultaneos del RRPP no superan su cupo', async () => {
  const e = await escenario()
  await asignar(e, e.rrpp.user.mail, { [e.vip]: 3 })
  const res = await Promise.all(Array.from({ length: 5 }, () => enviar(e, e.rrpp.auth, { ticketId: e.vip, cantidad: 1 })))
  assert.equal(res.filter((r) => r.status === 200).length, 3)
  assert.equal(res.filter((r) => r.status === 409).length, 2)
  assert.equal(cupoDe(await leer(e), e.rrpp.user.mail, e.vip), 0)
  assert.equal(await tokenModel.countDocuments(), 3)
})

test('un RRPP no puede usar el cupo de otro RRPP del mismo evento', async () => {
  const e = await escenario()
  await asignar(e, e.rrpp.user.mail, { [e.vip]: 3 })
  const res = await enviar(e, e.otroRRPP.auth, { ticketId: e.vip, cantidad: 1 })
  assert.equal(res.status, 409)
  assert.equal(cupoDe(await leer(e), e.rrpp.user.mail, e.vip), 3)
})

test('cortesia vencida o evento terminado: 409; quien no es RRPP: 403', async () => {
  const e = await escenario({ cierreVip: ayer() })
  await asignar(e, e.rrpp.user.mail, { [e.vip]: 3 })
  const vencida = await enviar(e, e.rrpp.auth, { ticketId: e.vip, cantidad: 1 })
  assert.equal(vencida.status, 409)
  assert.equal(vencida.body.code, 'CORTESIA_CERRADA')
  assert.equal(cupoDe(await leer(e), e.rrpp.user.mail, e.vip), 3, 'no se desconto')

  const tercero = await crearSesion()
  assert.equal((await enviar(e, tercero.auth, { ticketId: e.vip, cantidad: 1 })).status, 403)
})

test('envio con datos invalidos: 400', async () => {
  const e = await escenario()
  await asignar(e, e.rrpp.user.mail, { [e.vip]: 3 })
  assert.equal((await enviar(e, e.rrpp.auth, { ticketId: e.vip, cantidad: 1, mail: 'x' })).status, 400)
  assert.equal((await enviar(e, e.rrpp.auth, { ticketId: e.vip, cantidad: 1, nombreCompleto: '' })).status, 400)
  assert.equal((await enviar(e, e.rrpp.auth, { ticketId: e.vip, cantidad: 0 })).status, 400)
  assert.equal((await enviar(e, e.rrpp.auth, { ticketId: e.vip, cantidad: 11 })).status, 400, 'supera el limite de 10 por envio')
  assert.equal((await enviar(e, e.rrpp.auth, { ticketId: '000000000000000000000000', cantidad: 1 })).status, 400)
  assert.equal(cupoDe(await leer(e), e.rrpp.user.mail, e.vip), 3)
})
