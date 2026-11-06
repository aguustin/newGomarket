import { test, expect } from '@playwright/test'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { E2E_BACK, E2E_FRONT } from '../playwright.config.js'
import { uniqueMail, registerAndVerify, login, sesionDelNavegador, createEventViaApi } from '../e2e/helpers.js'

//Siembra eventos de muestra con imagenes locales (servidas por Vite, sin subir nada a Cloudinary)
//y saca capturas de cada pantalla en escritorio y celular.
const DIR = fileURLToPath(new URL('./capturas/', import.meta.url))
const VISTAS = { escritorio: { width: 1440, height: 900 }, celular: { width: 390, height: 844 } }
const IMG = (archivo) => `${E2E_FRONT}/src/assets/${archivo}`

const EVENTOS = [
  { nombreEvento: 'Noche Electrónica', precio: 18000, img: 'dj-party-meaning.png' },
  { nombreEvento: 'Festival de Verano', precio: 25000, img: 'imgpruebaEventos.jpg' },
  { nombreEvento: 'Space Session', precio: 12000, img: 'space.png' },
  { nombreEvento: 'Rock en el Club', precio: 15000, img: 'banner.png' }
]

const conBaseE2E = async (fn) => {
  const serverDir = fileURLToPath(new URL('../../server/', import.meta.url))
  const require = createRequire(serverDir + 'package.json')
  const env = require('dotenv').parse(require('fs').readFileSync(serverDir + '.env'))
  const mongoose = require('mongoose')
  const conn = await mongoose.createConnection(env.MONGO_URI, { dbName: 'ipass_e2e' }).asPromise()
  try { return await fn(conn.db, mongoose) } finally { await conn.close() }
}

const capturar = async (page, nombre, ruta, { antes } = {}) => {
  for (const [vista, size] of Object.entries(VISTAS)) {
    await page.setViewportSize(size)
    await page.goto(ruta)
    if (antes) await antes(page)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(600) //animaciones de entrada
    await page.screenshot({ path: `${DIR}${nombre}-${vista}.png`, fullPage: true })
  }
}

test('recorrido del comprador', async ({ page, request }) => {
  const mail = uniqueMail('ux')
  await registerAndVerify(page, request, { nombre: 'Camila Productora', mail })
  await login(page, { mail })
  await expect(page).toHaveURL(/\/$/)
  const { userId, auth } = await sesionDelNavegador(page)

  const ids = []
  for (const ev of EVENTOS) ids.push(await createEventViaApi(request, { auth, userId, prodMail: mail, nombreEvento: ev.nombreEvento, precio: ev.precio }))
  await conBaseE2E(async (db, mongoose) => {
    for (const [i, ev] of EVENTOS.entries()) {
      await db.collection('ticketsmodels').updateOne({ _id: new mongoose.Types.ObjectId(ids[i]) },
        { $set: { imgEvento: IMG(ev.img), bannerEvento: IMG(ev.img), imagenDescriptiva: IMG(ev.img) } })
    }
  })
  await request.post(`${E2E_BACK}/save_event`, { headers: auth, data: { userId, eventId: ids[0] } })
  await request.post(`${E2E_BACK}/save_event`, { headers: auth, data: { userId, eventId: ids[2] } })

  await capturar(page, '01-home', '/')
  await capturar(page, '02-compra', `/buy_tickets/${ids[0]}`, {
    antes: async (p) => { await p.getByRole('button', { name: /Sumar una entrada/ }).first().click() }
  })
  for (const status of ['approved', 'rejected']) {
    await page.route(/\/payment_confirm\//, (route) => route.fulfill({ json: { status, nombreEvento: 'Noche Electrónica', prodId: ids[0], procesado: true } }))
    await capturar(page, `03-resultado-${status}`, `/payment_result?status=${status}&payment_id=123`)
    await page.unroute(/\/payment_confirm\//)
  }
  await capturar(page, '04-favoritos', '/my_favorites_events')

  //Celular: menu abierto y filtros desplegados
  await page.setViewportSize(VISTAS.celular)
  for (const ruta of ['/', `/buy_tickets/${ids[0]}`, '/my_favorites_events']) {
    await page.goto(ruta)
    await page.waitForLoadState('networkidle')
    //Diagnostico: elementos que se salen del ancho de la pantalla (provocan scroll horizontal en celular)
    const desbordes = await page.evaluate(() => {
      const ancho = document.documentElement.clientWidth
      return [...document.querySelectorAll('body *')].map((el) => ({ el, r: el.getBoundingClientRect() }))
        .filter(({ el, r }) => r.right > ancho + 1 && r.width > 0 && !el.closest('[class*="overflow-x-auto"]') && !el.closest('[class*="overflow-hidden"]'))
        .slice(0, 6).map(({ el, r }) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 70)} right=${Math.round(r.right)}`)
    })
    console.log(`DESBORDE ${ruta}: ${desbordes.length ? desbordes.join(' | ') : 'ninguno'} (scrollWidth=${await page.evaluate(() => document.documentElement.scrollWidth)})`)
  }
  await page.goto('/')
  await page.getByRole('button', { name: 'Filtros' }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${DIR}07-filtros-celular.png` })
  await page.getByRole('button', { name: 'Abrir menú' }).click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${DIR}08-menu-celular.png` })

  await page.evaluate(() => localStorage.removeItem('session'))
  await capturar(page, '05-login', '/login')
  await capturar(page, '06-registro', '/register')
})

test('pantallas de cuenta', async ({ page }) => {
  await capturar(page, '10-login', '/login?sesion=requerida')
  await capturar(page, '11-login-error', '/login', {
    antes: async (p) => {
      await p.locator('input[name="mail"]').fill('nadie@ipass-e2e.local')
      await p.locator('input[name="contrasenia"]').fill('Clave12345')
      await p.getByRole('button', { name: 'Ingresar' }).click()
      await p.getByText('El email es incorrecto').waitFor()
    }
  })
  await capturar(page, '12-recuperar', '/login', { antes: async (p) => { await p.getByRole('button', { name: '¿Olvidaste tu contraseña?' }).click() } })
  await capturar(page, '13-registro', '/register', {
    antes: async (p) => {
      await p.locator('input[name="contrasenia"]').fill('abcdef')
      await p.locator('input[name="repetirContrasenia"]').fill('abcdeg')
      await p.locator('input[name="nombreCompleto"]').fill('Ana Gómez')
      await p.locator('input[name="mail"]').fill('ana@mail.com')
      await p.locator('input[name="dni"]').fill('30111222')
      await p.getByRole('button', { name: 'Registrarme' }).click()
    }
  })
  await capturar(page, '14-nueva-contrasenia', '/recover_password/token-de-prueba')
})
