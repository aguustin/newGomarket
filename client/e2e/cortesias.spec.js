import { test, expect } from '@playwright/test'
import { E2E_BACK } from '../playwright.config.js'
import { uniqueMail, registerAndVerify, login, createEventViaApi, sesionDelNavegador, waitForMail } from './helpers.js'

//Etapa 7b: el dueño asigna cortesias a un RRPP y el RRPP las envia a un cliente desde "Mis colaboraciones"
test('RRPP: Mis colaboraciones -> Enviar cortesías -> el cliente recibe los QR y el cupo baja', async ({ page, request }) => {
  //RRPP registrado (para poder iniciar sesion despues)
  const rrppMail = uniqueMail('rrpp')
  await registerAndVerify(page, request, { nombre: 'RRPP E2E', mail: rrppMail })

  //Dueño: evento + tipo de cortesia + asigna 3 al RRPP
  const duenoMail = uniqueMail('dueno')
  await registerAndVerify(page, request, { nombre: 'Dueño E2E', mail: duenoMail })
  await login(page, { mail: duenoMail })
  await expect(page).toHaveURL(/\/$/)
  const dueno = await sesionDelNavegador(page)
  const nombreEvento = `Cortesias E2E ${Date.now()}`
  const eventId = await createEventViaApi(request, { auth: dueno.auth, userId: dueno.userId, prodMail: duenoMail, nombreEvento })
  const enUnMes = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
  expect((await request.post(`${E2E_BACK}/createEventTickets`, { headers: dueno.auth, multipart: {
    prodId: eventId, nombreTicket: 'Cortesía VIP', descripcionTicket: 'Invitación', precio: '0', cantidad: '5',
    fechaDeCierre: enUnMes, visibilidad: '1', estado: '3', distribution: '0', limit: '10' } })).ok()).toBe(true)
  const prod = await (await request.get(`${E2E_BACK}/get_prod/${eventId}/${dueno.userId}`, { headers: dueno.auth })).json()
  const cortesiaId = prod.tickets[0].cortesiaRRPP[0]._id
  const asignacion = await request.post(`${E2E_BACK}/sendQrStaff`, { headers: dueno.auth, data: { prodId: eventId, quantities: { [cortesiaId]: 3 }, mail: rrppMail } })
  expect((await asignacion.json()).state).toBe(1)

  //RRPP: entra, ve el boton con su cupo y envia 2 a un cliente
  await login(page, { mail: rrppMail })
  await expect(page).toHaveURL(/\/$/)
  await page.goto(`/get_my_rrpp_events/${rrppMail}`)
  await page.getByRole('link', { name: 'Enviar cortesías (3)' }).click()
  await expect(page).toHaveURL(new RegExp(`/rrpp_get_event_free/${eventId}/`))
  await expect(page.getByText('Cortesía VIP')).toBeVisible()
  await expect(page.getByText(/Disponibles:\s*3/)).toBeVisible()

  await page.getByRole('button', { name: 'Sumar una cortesía' }).click()
  await page.getByRole('button', { name: 'Sumar una cortesía' }).click()
  const cliente = uniqueMail('cliente')
  await page.locator('input[name="clientName"]').fill('Cliente E2E')
  await page.locator('input[name="clientMail"]').fill(cliente)
  await page.locator('input[name="repetirMail"]').fill(cliente)
  await page.getByRole('button', { name: 'Enviar cortesías' }).click()

  await expect(page.getByText(`¡Listo! Enviamos 2 cortesías a ${cliente}`)).toBeVisible()
  await expect(page.getByText(/Disponibles:\s*1/)).toBeVisible()
  const mail = await waitForMail(request, cliente, /Tus entradas para/)
  expect(mail.attachments.length).toBe(2)

  //Intentar mandar mas de lo que queda: el boton + no pasa del cupo
  await page.getByRole('button', { name: 'Sumar una cortesía' }).click()
  await expect(page.getByTestId('cantidad')).toHaveText('1')
  await expect(page.getByRole('button', { name: 'Sumar una cortesía' })).toBeDisabled()
})
