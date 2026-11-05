import { test, before, after, beforeEach } from "node:test"
import assert from "node:assert/strict"
import request from "supertest"
import { loadApp, closeDb, resetDb, crearSesion, uniqueMail } from "./helpers.js"
import ExcelJS from "exceljs"

//Excel .xlsx real con filas nombre/email (la primera fila es el encabezado)
const xlsxCon = async (filas) => {
  const libro = new ExcelJS.Workbook()
  libro.addWorksheet('Hoja1').addRows([['nombre', 'email'], ...filas])
  return Buffer.from(await libro.xlsx.writeBuffer())
}

//Etapa 7: permisos por evento (dueño y RRPP)
let app, ticketModel, cortesieModel, rrppExcelModel, purchaseModel, discountModel

before(async () => {
  app = await loadApp({ mailMode: 'bandeja' })
  ticketModel = (await import('../models/ticketsModel.js')).default
  cortesieModel = (await import('../models/cortesiesModel.js')).default
  rrppExcelModel = (await import('../models/rrppExcelModel.js')).default
  purchaseModel = (await import('../models/purchaseModel.js')).default
  discountModel = (await import('../models/discountModel.js')).default
})
after(closeDb)
beforeEach(resetDb)

const enUnMes = () => new Date(Date.now() + 30 * 24 * 3600 * 1000)

//Un dueño, un RRPP de su evento y un tercero sin relacion
const escenario = async () => {
  const dueno = await crearSesion({ nombreCompleto: 'Dueño' })
  const rrpp = await crearSesion({ nombreCompleto: 'RRPP' })
  const otroRRPP = uniqueMail('otro-rrpp')
  const tercero = await crearSesion({ nombreCompleto: 'Tercero' })
  const evento = await ticketModel.create({
    userId: dueno.id, nombreEvento: 'Evento del dueño', active: true, soldOut: false, fechaInicio: enUnMes(), fechaFin: enUnMes(),
    prodMail: 'cifrado-del-productor',
    tickets: [{ nombreTicket: 'General', precio: 100, cantidad: 10, estado: 1, fechaDeCierre: enUnMes() }],
    rrpp: [
      { mail: rrpp.user.mail, cbu: 111, alias: 'alias.rrpp', ventasRRPP: [], ticketsCortesias: [] },
      { mail: otroRRPP, cbu: 999, alias: 'alias.secreto', ventasRRPP: [], ticketsCortesias: [] }
    ]
  })
  const otroEvento = await ticketModel.create({ userId: tercero.id, nombreEvento: 'Evento del tercero', active: true })
  return { dueno, rrpp, tercero, evento, eventoId: evento._id.toString(), otroEvento, otroEventoId: otroEvento._id.toString(), otroRRPP }
}

//Rutas de gestion que solo puede usar el dueño. [metodo, ruta, body]
const rutasDelDueno = (e) => [
  ['post', '/createEventTickets', { prodId: e.eventoId, nombreTicket: 'Nuevo', precio: 1, cantidad: 1, estado: 1 }],
  ['post', '/updateEvent', { eventId: e.eventoId, nombreEvento: 'Cambiado' }],
  ['post', '/updateTickets', { ticketId: e.evento.tickets[0]._id.toString(), nombreTicket: 'X', estado: 1, cantidad: 5 }],
  ['post', '/addRRPP', { prodId: e.eventoId, rrppMail: uniqueMail('nuevo'), nombreEvento: 'x', eventImg: 'x' }],
  ['post', '/sendQrStaff', { prodId: e.eventoId, quantities: {}, mail: uniqueMail('staff') }],
  ['post', '/descargar_compradores', { prodId: e.eventoId }],
  ['post', '/cancelar_evento', { prodId: e.eventoId }],
  ['post', '/reactivar_evento', { prodId: e.eventoId }],
  ['post', '/sold_out', { prodId: e.eventoId, isSoldOut: true }],
  ['get', `/get_buyers/${e.eventoId}`, null],
  ['post', '/create_discount', { prodId: e.eventoId, idDiscount: 'X', cantidadDescuentos: 1, numeroDescuento: 10 }],
  ['post', '/relacionar_eventos', { prodId: e.eventoId, otherId: e.eventoId }]
]
const pedir = (metodo, ruta, body, auth) => {
  const r = request(app)[metodo](ruta).set(auth)
  return body ? r.send(body) : r
}

test('un tercero con sesion no puede gestionar el evento de otro: 403 en todas las rutas, sin cambios', async () => {
  const e = await escenario()
  for (const [metodo, ruta, body] of rutasDelDueno(e)) {
    const res = await pedir(metodo, ruta, body, e.tercero.auth)
    assert.equal(res.status, 403, `${metodo.toUpperCase()} ${ruta}`)
    assert.equal(res.body.code, 'NO_ES_DUENO', `${metodo.toUpperCase()} ${ruta}`)
  }
  const ev = await ticketModel.findById(e.eventoId).lean()
  assert.equal(ev.nombreEvento, 'Evento del dueño')
  assert.equal(ev.active, true, 'no se cancelo')
  assert.equal(ev.soldOut, false)
  assert.equal(ev.tickets.length, 1)
  assert.equal(ev.tickets[0].nombreTicket, 'General')
  assert.equal(ev.rrpp.length, 2)
  assert.equal(await discountModel.countDocuments(), 0)
})

test('el RRPP del evento tampoco puede gestionarlo (solo el dueño)', async () => {
  const e = await escenario()
  for (const [metodo, ruta, body] of rutasDelDueno(e)) {
    assert.equal((await pedir(metodo, ruta, body, e.rrpp.auth)).status, 403, `${metodo.toUpperCase()} ${ruta}`)
  }
})

test('el dueño si puede usar todas las rutas de gestion de su evento', async () => {
  const e = await escenario()
  for (const [metodo, ruta, body] of rutasDelDueno(e)) {
    const res = await pedir(metodo, ruta, body, e.dueno.auth)
    //Ni rechazado por permisos ni error del servidor (descargar_compradores da 404 porque no hay ventas)
    assert.ok(![401, 403].includes(res.status) && res.status < 500, `${metodo.toUpperCase()} ${ruta} -> ${res.status}`)
  }
  const ev = await ticketModel.findById(e.eventoId).lean()
  assert.equal(ev.nombreEvento, 'Cambiado')
  assert.equal(ev.soldOut, true)
  assert.equal(ev.tickets.length, 2)
  assert.equal(await discountModel.countDocuments(), 1)
})

test('evento inexistente: 404; id invalido: 400', async () => {
  const e = await escenario()
  assert.equal((await pedir('post', '/sold_out', { prodId: '000000000000000000000000', isSoldOut: true }, e.dueno.auth)).status, 404)
  assert.equal((await pedir('post', '/sold_out', { prodId: 'no-es-un-id', isSoldOut: true }, e.dueno.auth)).status, 400)
  assert.equal((await pedir('get', '/get_buyers/no-es-un-id', null, e.dueno.auth)).status, 400)
  assert.equal((await pedir('post', '/updateTickets', { ticketId: '000000000000000000000000' }, e.dueno.auth)).status, 404)
})

test('relacionar fechas: hay que ser dueño de los DOS eventos', async () => {
  const e = await escenario()
  const res = await pedir('post', '/relacionar_eventos', { prodId: e.eventoId, otherId: e.otroEventoId }, e.dueno.auth)
  assert.equal(res.status, 403)
  assert.equal((await ticketModel.findById(e.otroEventoId).lean()).eventosRelacionados.length, 0, 'no se toco el evento ajeno')

  const mio2 = await ticketModel.create({ userId: e.dueno.id, nombreEvento: 'Otra fecha mia' })
  assert.equal((await pedir('post', '/relacionar_eventos', { prodId: e.eventoId, otherId: mio2._id.toString() }, e.dueno.auth)).status, 200)
})

test('lista de compradores: solo el dueño (ni el RRPP del evento)', async () => {
  const e = await escenario()
  await purchaseModel.create({ prodId: e.eventoId, nombreCompleto: 'Comprador', email: 'c@ipass-test.local', dni: 30111222, telefono: 1155 })
  const propia = await pedir('get', `/get_buyers/${e.eventoId}`, null, e.dueno.auth)
  assert.equal(propia.status, 200)
  assert.equal(propia.body.length, 1)
  assert.equal((await pedir('get', `/get_buyers/${e.eventoId}`, null, e.rrpp.auth)).status, 403)
})

test('link de pago del RRPP: solo un RRPP del evento puede generarlo', async () => {
  const e = await escenario()
  const ok = await pedir('post', '/generate_rrpp_url', { prodId: e.eventoId, rrppMail: e.rrpp.user.mail }, e.rrpp.auth)
  assert.equal(ok.status, 200)
  assert.match(ok.body.message, /\/buy_tickets\//)

  const ajeno = await pedir('post', '/generate_rrpp_url', { prodId: e.eventoId, rrppMail: e.tercero.user.mail }, e.tercero.auth)
  assert.equal(ajeno.status, 403)
  assert.equal(ajeno.body.code, 'NO_ES_RRPP')
})

test('Mis colaboraciones: el RRPP ve solo su registro, no los datos de los demas RRPP ni del productor', async () => {
  const e = await escenario()
  const res = await pedir('get', `/get_my_rrpp_events/${e.rrpp.user.mail}`, null, e.rrpp.auth)
  assert.equal(res.status, 200)
  assert.equal(res.body.length, 1)
  const [ev] = res.body
  assert.equal(ev.nombreEvento, 'Evento del dueño')
  assert.deepEqual(ev.rrpp.map((r) => r.mail), [e.rrpp.user.mail])
  assert.equal(ev.prodMail, undefined)
  assert.doesNotMatch(JSON.stringify(res.body), /alias\.secreto|otro-rrpp/)
})

test('Excels de cortesias y de RRPP: solo los propios y del mismo evento', async () => {
  const e = await escenario()
  const excelDueno = await cortesieModel.create({ prodId: e.eventoId, userId: e.dueno.id, excelName: 'a.xlsx', people: [] })
  const excelTercero = await cortesieModel.create({ prodId: e.otroEventoId, userId: e.tercero.id, excelName: 'b.xlsx', people: [] })
  const listaTercero = await rrppExcelModel.create({ prodId: e.otroEventoId, userId: e.tercero.id, excelName: 'c.xlsx', rrppList: [] })

  assert.equal((await pedir('get', `/get_cortesie/${excelDueno._id}`, null, e.dueno.auth)).status, 200)
  assert.equal((await pedir('get', `/get_cortesie/${excelDueno._id}`, null, e.tercero.auth)).status, 403)

  //El dueño no puede usar en su evento un Excel ajeno (ni de otro evento)
  const ajeno = await pedir('post', '/send_cortesies', { prodId: e.eventoId, cortesieId: excelTercero._id.toString() }, e.dueno.auth)
  assert.equal(ajeno.status, 403)
  assert.equal(ajeno.body.code, 'EXCEL_AJENO')
  assert.equal((await pedir('post', '/send_rrpp_cortesies', { prodId: e.eventoId, rrppListId: listaTercero._id.toString() }, e.dueno.auth)).status, 403)

  //Y un tercero no puede enviar las cortesias del evento del dueño
  assert.equal((await pedir('post', '/send_cortesies', { prodId: e.eventoId, cortesieId: excelDueno._id.toString() }, e.tercero.auth)).status, 403)
})

test('cargar un Excel en el evento de otro: 403', async () => {
  const e = await escenario()
  const res = await request(app).post('/charge_excel').set(e.tercero.auth)
    .field('userId', e.tercero.id).field('prodId', e.eventoId).field('excelName', 'x.xlsx')
    .attach('excelFile', await xlsxCon([['Ana', 'ana@x.com']]), 'x.xlsx')
  assert.equal(res.status, 403)
  assert.equal(await cortesieModel.countDocuments(), 0)
})

test('get_prod no devuelve el evento ni sus codigos de descuento a quien no es el dueño', async () => {
  const e = await escenario()
  await discountModel.create({ prodId: e.eventoId, idDescuento: 'SECRETO50', cantidadDescuentos: 5, numeroDescuento: 50 })

  const ajeno = await request(app).get(`/get_prod/${e.eventoId}/${e.tercero.id}`).set(e.tercero.auth)
  assert.equal(ajeno.status, 200)
  assert.deepEqual(ajeno.body, { tickets: [], prodDiscount: [] })

  const propio = await request(app).get(`/get_prod/${e.eventoId}/${e.dueno.id}`).set(e.dueno.auth)
  assert.equal(propio.body.tickets.length, 1)
  assert.deepEqual(propio.body.prodDiscount.map((d) => d.idDescuento), ['SECRETO50'])
})

test('subidas: se rechazan archivos que no son del tipo pedido o son demasiado grandes (400)', async () => {
  const e = await escenario()
  const excel = (buffer, nombre) => request(app).post('/charge_excel').set(e.dueno.auth)
    .field('userId', e.dueno.id).field('prodId', e.eventoId).field('excelName', 'x.xlsx').attach('excelFile', buffer, nombre)
  assert.equal((await excel(Buffer.from('nombre,email\nAna,ana@x.com\n'), 'x.csv')).body.code, 'ARCHIVO_INVALIDO')
  assert.equal((await excel(Buffer.from('no soy un zip'), 'x.xlsx')).body.code, 'ARCHIVO_INVALIDO', 'extension correcta, contenido falso')
  const muchas = Array.from({ length: 2001 }, (_, i) => ['P' + i, `p${i}@x.com`])
  assert.equal((await excel(await xlsxCon(muchas), 'x.xlsx')).body.code, 'EXCEL_DEMASIADO_GRANDE')
  assert.equal(await cortesieModel.countDocuments(), 0)

  const img = (buffer, nombre, tipo) => request(app).post('/create_seller_profile').set(e.dueno.auth)
    .field('userId', e.dueno.id).attach('productoraImg', buffer, { filename: nombre, contentType: tipo })
  assert.equal((await img(Buffer.from('<svg onload=alert(1)>'), 'a.png', 'image/png')).status, 400, 'dice PNG pero no lo es')
  assert.equal((await img(Buffer.from('GIF89a....'), 'a.gif', 'image/gif')).status, 400)
  const pngGrande = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.alloc(5 * 1024 * 1024 + 1)])
  const grande = await img(pngGrande, 'a.png', 'image/png')
  assert.equal(grande.status, 400)
  assert.match(grande.body.message, /hasta 5 MB/)
})

test('cargar un Excel valido: lee nombres y mails (tambien si el mail es un hipervinculo) y saltea filas vacias', async () => {
  const e = await escenario()
  const libro = new ExcelJS.Workbook()
  const hoja = libro.addWorksheet('Hoja1')
  hoja.addRows([['nombre', 'email'], ['Ana', 'ana@x.com'], [], ['Beto', { text: 'beto@x.com', hyperlink: 'mailto:beto@x.com' }]])
  const res = await request(app).post('/charge_excel').set(e.dueno.auth)
    .field('userId', e.dueno.id).field('prodId', e.eventoId).field('excelName', 'lista.xlsx')
    .attach('excelFile', Buffer.from(await libro.xlsx.writeBuffer()), 'lista.xlsx')
  assert.equal(res.status, 200)
  const doc = await cortesieModel.findOne().lean()
  assert.deepEqual(doc.people.map((p) => [p.clientName, p.email]), [['Ana', 'ana@x.com'], ['Beto', 'beto@x.com']])
})
