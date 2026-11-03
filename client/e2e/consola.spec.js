import { test, expect } from '@playwright/test'
import { uniqueMail, registerAndVerify, login, createEventViaApi, sesionDelNavegador } from './helpers.js'

//Las pantallas principales no deben dejar advertencias de React en la consola
//(listas sin key, atributos SVG invalidos, inputs que pasan de no controlados a controlados)
const ADVERTENCIAS = /unique "key" prop|Invalid DOM property|changing an uncontrolled input|changing a controlled input/

test('pantallas privadas y publicas sin advertencias de React', async ({ page, request }) => {
  const avisos = []
  page.on('console', (msg) => { if (ADVERTENCIAS.test(msg.text())) avisos.push(`${page.url()} -> ${msg.text().slice(0, 160)}`) })

  const mail = uniqueMail('consola')
  await registerAndVerify(page, request, { nombre: 'Consola E2E', mail })
  await login(page, { mail })
  await expect(page).toHaveURL(/\/$/)
  const { userId, auth } = await sesionDelNavegador(page)
  const eventId = await createEventViaApi(request, { auth, userId, prodMail: mail, nombreEvento: `Consola E2E ${Date.now()}` })

  const pantallas = [
    ['/', 'Consola E2E'],
    ['/productions', 'Consola E2E'],
    [`/editar_evento/${eventId}`, 'Consola E2E'],
    [`/see_profile/${userId}`, 'Consola E2E'],
    ['/user_info', null],
    [`/buy_tickets/${eventId}`, 'COMPRAR TICKETS']
  ]
  for (const [ruta, texto] of pantallas) {
    await page.goto(ruta)
    if (texto) await expect(page.getByText(texto).first()).toBeVisible()
    await page.waitForLoadState('networkidle')
  }

  //Escribir en el perfil y en los campos de editar evento (dispara el cambio de no controlado a controlado)
  await page.goto('/user_info')
  const input = page.locator('input[name="nombreCompleto"]')
  if (await input.count()) await input.first().fill('Nombre nuevo')
  await page.goto(`/editar_evento/${eventId}`)
  await page.waitForLoadState('networkidle')
  const fecha = page.locator('input[type="datetime-local"]')
  if (await fecha.count()) await fecha.first().fill('2030-01-01T20:00')

  expect(avisos).toEqual([])
})
