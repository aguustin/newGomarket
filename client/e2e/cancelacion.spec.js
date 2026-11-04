import { test, expect } from '@playwright/test'
import { E2E_BACK } from '../playwright.config.js'
import { uniqueMail, registerAndVerify, login, createEventViaApi, sesionDelNavegador, ultimoTokenQR } from './helpers.js'

//Etapa 10 (critico): el dueño cancela el evento desde "Editar evento" y las entradas emitidas quedan anuladas
test('cancelar el evento desde la pantalla anula el QR de una compra; reactivar pide confirmacion', async ({ page, request }) => {
  const duenoMail = uniqueMail('dueno-cancela')
  await registerAndVerify(page, request, { mail: duenoMail })
  await login(page, { mail: duenoMail })
  await expect(page).toHaveURL(/\/$/)
  const dueno = await sesionDelNavegador(page)
  const eventId = await createEventViaApi(request, { auth: dueno.auth, userId: dueno.userId, prodMail: duenoMail, nombreEvento: `Cancelar E2E ${Date.now()}`, precio: 0 })

  //Compra real (entrada gratis, sin Mercado Pago) para tener un QR emitido
  const evento = (await (await request.get(`${E2E_BACK}/buy_tickets/${eventId}`)).json())[0]
  expect(await (await request.post(`${E2E_BACK}/buy`, { data: {
    prodId: eventId, quantities: { [evento.tickets[0]._id]: { amount: 1, free: false } }, total: 0,
    mail: uniqueMail('comprador'), nombreCompleto: 'Comprador Cancelado', dni: '1', telefono: '1'
  } })).json()).toBe(3)
  const token = await ultimoTokenQR()
  await page.goto(`/ticket/validate/${token}`)
  await expect(page.getByText('Entrada válida')).toBeVisible()

  //Cancelar desde "Editar evento": "Bajar evento" abre el aviso de la pantalla, que explica las consecuencias
  const dialogos = []
  page.on('dialog', async (d) => { dialogos.push(d.message()); await d.accept() })
  await page.goto(`/editar_evento/${eventId}`)
  await page.getByRole('button', { name: 'Bajar evento' }).click()
  await expect(page.getByText(/Se anulan todas las entradas \(QR\)/)).toBeVisible()
  await page.getByRole('button', { name: 'Dar de baja' }).click()
  await expect.poll(() => dialogos.length).toBe(1)
  expect(dialogos[0]).toMatch(/Se anularon 1 entradas/)

  //El QR ya no vale
  await page.goto(`/ticket/validate/${token}`)
  await expect(page.getByText('Entrada anulada: el evento fue cancelado')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Validar ingreso' })).toHaveCount(0)

  //Reactivar desde la API sin confirmar: lo rechaza y avisa
  const reactivar = await request.post(`${E2E_BACK}/reactivar_evento`, { headers: dueno.auth, data: { prodId: eventId } })
  expect(reactivar.status()).toBe(409)
  expect((await reactivar.json()).code).toBe('CONFIRMAR_REACTIVACION')
})
