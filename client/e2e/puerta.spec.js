import { test, expect } from '@playwright/test'
import { E2E_BACK } from '../playwright.config.js'
import { uniqueMail, registerAndVerify, login, createEventViaApi, sesionDelNavegador, ultimoTokenQR } from './helpers.js'

//Etapa 8 (critico): el comprador abre su QR sin gastarlo; el organizador lo valida en la puerta una sola vez
test('puerta: el QR se muestra sin gastarse y solo el organizador valida el ingreso, una vez', async ({ page, request }) => {
  const duenoMail = uniqueMail('dueno-puerta')
  await registerAndVerify(page, request, { mail: duenoMail })
  await login(page, { mail: duenoMail })
  await expect(page).toHaveURL(/\/$/)
  const dueno = await sesionDelNavegador(page)
  const eventId = await createEventViaApi(request, { auth: dueno.auth, userId: dueno.userId, prodMail: duenoMail, nombreEvento: `Puerta E2E ${Date.now()}`, precio: 0 })

  //Compra real de una entrada gratis (se emite el QR sin pasar por Mercado Pago)
  const evento = (await (await request.get(`${E2E_BACK}/buy_tickets/${eventId}`)).json())[0]
  const compra = await request.post(`${E2E_BACK}/buy`, { data: {
    prodId: eventId, quantities: { [evento.tickets[0]._id]: { amount: 1, free: false } }, total: 0,
    mail: uniqueMail('comprador'), nombreCompleto: 'Comprador Puerta', dni: '30111222', telefono: '1155550000'
  } })
  expect(await compra.json()).toBe(3)
  const token = await ultimoTokenQR()

  //Comprador (sin sesion): ve su entrada valida, sin boton, y abrirla no la gasta
  await page.evaluate(() => localStorage.removeItem('session'))
  for (let i = 0; i < 2; i++) {
    await page.goto(`/ticket/validate/${token}`)
    await expect(page.getByText('Entrada válida')).toBeVisible()
    await expect(page.getByText('Comprador Puerta')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Validar ingreso' })).toHaveCount(0)
  }

  //Organizador sin sesion en el celular: escanea, toca "Iniciá sesión" y vuelve al mismo QR para validarlo
  await page.getByRole('link', { name: 'Iniciá sesión' }).click()
  await expect(page).toHaveURL(/\/login\?next=/)
  await page.locator('input[name="mail"]').fill(duenoMail)
  await page.locator('input[name="contrasenia"]').fill('Clave12345')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page).toHaveURL(new RegExp(`/ticket/validate/${token}$`))
  await page.getByRole('button', { name: 'Validar ingreso' }).click()
  await expect(page.getByText('Ingreso validado')).toBeVisible()

  //Segundo escaneo: ya usada, sin boton
  await page.reload()
  await expect(page.getByText('Entrada ya usada')).toBeVisible()
  await expect(page.getByText(/Validada el/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Validar ingreso' })).toHaveCount(0)
})

//Etapa 12: las paginas privadas sin sesion llevan al login y, al ingresar, vuelven a la pagina pedida
test('pagina privada sin sesion -> login -> vuelve a la pagina', async ({ page, request }) => {
  const mail = uniqueMail('privada')
  await registerAndVerify(page, request, { mail })
  await page.goto('/productions')
  await expect(page).toHaveURL(/\/login\?sesion=requerida&next=%2Fproductions$/)
  await expect(page.getByText('Iniciá sesión para continuar')).toBeVisible()
  await page.locator('input[name="mail"]').fill(mail)
  await page.locator('input[name="contrasenia"]').fill('Clave12345')
  await page.getByRole('button', { name: 'Ingresar' }).click()
  await expect(page).toHaveURL(/\/productions$/)
})
