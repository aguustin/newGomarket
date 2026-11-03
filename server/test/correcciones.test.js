import { test, before, after, beforeEach } from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import ExcelJS from "exceljs"
import { loadApp, closeDb, resetDb, crearSesion } from "./helpers.js"

//Correcciones chicas: borrar Excels de cortesias/RRPP, descarga de compradores, favoritos guardados
let app, cortesieModel, rrppExcelModel, ticketModel, transactionModel, userModel

before(async () => {
  app = await loadApp({ mailMode: 'bandeja' })
  cortesieModel = (await import('../models/cortesiesModel.js')).default
  rrppExcelModel = (await import('../models/rrppExcelModel.js')).default
  ticketModel = (await import('../models/ticketsModel.js')).default
  transactionModel = (await import('../models/transactionsModel.js')).default
  userModel = (await import('../models/userModel.js')).default
})
after(closeDb)
beforeEach(resetDb)

const crearEvento = (nombreEvento = 'Fiesta Test') => ticketModel.create({ userId: 'dueno', nombreEvento, tickets: [] })

test('borrar Excel de cortesias: solo el del dueño, y responde cuantos borro', async () => {
  const dueno = await crearSesion()
  const otro = await crearSesion()
  const doc = await cortesieModel.create({ prodId: 'p1', userId: dueno.id, excelName: 'a.xlsx', people: [] })

  //Otro usuario con su propia sesion: el Excel no es suyo, no borra nada
  const ajeno = await request(app).delete(`/delete_cortesie/${otro.id}/${doc._id}`).set(otro.auth)
  assert.equal(ajeno.status, 200)
  assert.equal(ajeno.body.deleted, 0)
  //Otro usuario haciendose pasar por el dueño: rechazado antes de llegar al controlador
  assert.equal((await request(app).delete(`/delete_cortesie/${dueno.id}/${doc._id}`).set(otro.auth)).status, 403)
  //Sin sesion
  assert.equal((await request(app).delete(`/delete_cortesie/${dueno.id}/${doc._id}`)).status, 401)
  assert.equal(await cortesieModel.countDocuments(), 1, 'otro usuario no puede borrarlo')

  const propio = await request(app).delete(`/delete_cortesie/${dueno.id}/${doc._id}`).set(dueno.auth)
  assert.equal(propio.body.deleted, 1)
  assert.equal(await cortesieModel.countDocuments(), 0)
})

test('borrar Excel de RRPP: solo el del dueño', async () => {
  const dueno = await crearSesion()
  const otro = await crearSesion()
  const doc = await rrppExcelModel.create({ prodId: 'p1', userId: dueno.id, excelName: 'r.xlsx', rrppList: [] })
  assert.equal((await request(app).delete(`/delete_rrpp_excel/${otro.id}/${doc._id}`).set(otro.auth)).body.deleted, 0)
  assert.equal((await request(app).delete(`/delete_rrpp_excel/${dueno.id}/${doc._id}`).set(otro.auth)).status, 403)
  assert.equal((await request(app).delete(`/delete_rrpp_excel/${dueno.id}/${doc._id}`).set(dueno.auth)).body.deleted, 1)
  assert.equal(await rrppExcelModel.countDocuments(), 0)
})

test('borrar con id invalido responde 400 sin romper el servidor', async () => {
  const dueno = await crearSesion()
  assert.equal((await request(app).delete(`/delete_cortesie/${dueno.id}/no-es-un-id`).set(dueno.auth)).status, 400)
  assert.equal((await request(app).delete(`/delete_rrpp_excel/${dueno.id}/no-es-un-id`).set(dueno.auth)).status, 400)
})

test('descargar compradores: devuelve un xlsx con todas las transacciones del evento', async () => {
  const ev = await crearEvento()
  await transactionModel.create([
    { prodId: ev._id.toString(), paymentId: 'p-1', transaccionId: 'p-1', nombre: 'Ana', email: 'ana@ipass-test.local', montoPagado: 100 },
    { prodId: ev._id.toString(), paymentId: 'p-2', transaccionId: 'p-2', nombre: 'Beto', email: 'beto@ipass-test.local', montoPagado: 100 },
    { prodId: 'otro-evento', paymentId: 'p-3', transaccionId: 'p-3', nombre: 'Ajeno', email: 'x@ipass-test.local', montoPagado: 100 }
  ])

  const { auth } = await crearSesion()
  const res = await request(app).post('/descargar_compradores').set(auth).send({ prodId: ev._id.toString() })
    .buffer(true).parse((r, cb) => { const c = []; r.on('data', (d) => c.push(d)); r.on('end', () => cb(null, Buffer.concat(c))) })

  assert.equal(res.status, 200)
  assert.match(res.headers['content-type'], /spreadsheetml/)
  assert.match(res.headers['content-disposition'], /compradores_Fiesta_Test\.xlsx/)

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(res.body)
  const filas = wb.getWorksheet('Compradores').getSheetValues().filter(Boolean).map((r) => [r[1], r[2]])
  assert.deepEqual(filas, [['Nombre completo', 'Email'], ['Ana', 'ana@ipass-test.local'], ['Beto', 'beto@ipass-test.local']])
})

test('descargar compradores: evento sin ventas o inexistente responde 404', async () => {
  const ev = await crearEvento()
  const { auth } = await crearSesion()
  assert.equal((await request(app).post('/descargar_compradores').set(auth).send({ prodId: ev._id.toString() })).status, 404)
  assert.equal((await request(app).post('/descargar_compradores').set(auth).send({ prodId: '000000000000000000000000' })).status, 404)
  assert.equal((await request(app).post('/descargar_compradores').send({ prodId: ev._id.toString() })).status, 401, 'sin sesion')
})

test('favoritos guardados (/obtain_saved_event): devuelve un array con los eventos', async () => {
  const ev = await crearEvento()
  const conFavs = await crearSesion({ favorites: [{ eventId: ev._id.toString() }] })
  const sinFavs = await crearSesion({ favorites: [] })

  const conFav = await request(app).post('/obtain_saved_event').set(conFavs.auth).send({ userId: conFavs.id })
  assert.equal(conFav.status, 200)
  assert.deepEqual(conFav.body.map((e) => e.nombreEvento), ['Fiesta Test'])

  const vacio = await request(app).post('/obtain_saved_event').set(sinFavs.auth).send({ userId: sinFavs.id })
  assert.equal(vacio.status, 200)
  assert.deepEqual(vacio.body, [])

  //Pedir los favoritos de otro usuario (o un id inventado) ya no responde: 403
  for (const userId of [conFavs.id, '000000000000000000000000', 'invalido', undefined]) {
    const r = await request(app).post('/obtain_saved_event').set(sinFavs.auth).send({ userId })
    assert.equal(r.status, 403, `userId=${userId}`)
  }
})

test('Home (/getAllEvents) no lista eventos terminados aunque el cron todavia no los desactivo', async () => {
  const ayer = new Date(Date.now() - 24 * 3600 * 1000)
  const enUnMes = new Date(Date.now() + 30 * 24 * 3600 * 1000)
  await ticketModel.create([
    { userId: 'u', nombreEvento: 'Terminado', active: true, fechaFin: ayer },
    { userId: 'u', nombreEvento: 'Proximo', active: true, fechaFin: enUnMes },
    { userId: 'u', nombreEvento: 'Sin fecha', active: true },
    { userId: 'u', nombreEvento: 'Inactivo', active: false, fechaFin: enUnMes }
  ])
  const res = await request(app).get('/getAllEvents')
  assert.equal(res.status, 200)
  assert.deepEqual(res.body.map((e) => e.nombreEvento).sort(), ['Proximo', 'Sin fecha'])
})
