import { test, expect } from '@playwright/test'
import { uniqueMail, registerAndVerify, login, createEventViaApi } from './helpers.js'

//Compra hasta el checkout de Mercado Pago. La preferencia se crea DE VERDAD en el sandbox de MP
//(token de prueba); el navegador no llega a abrir MP: se intercepta la redireccion.
//El pago en si (tarjeta de prueba + webhook) lo cubren los tests de integracion del server y la prueba manual.
test('evento publico en Home -> pagina de compra -> total con 15% -> redireccion al checkout de MP', async ({ page, request }) => {
  const mail = uniqueMail('productor')
  await registerAndVerify(page, request, { mail })
  await login(page, { mail })
  await expect(page).toHaveURL(/\/$/)
  const userId = await page.evaluate(() => JSON.parse(localStorage.getItem('session')).userFinded[0]._id)

  const nombreEvento = `Festival E2E ${Date.now()}`
  const eventId = await createEventViaApi(request, { userId, prodMail: mail, nombreEvento, precio: 20000 })

  //Home lista el evento publico y lleva a la pagina de compra
  await page.goto('/')
  await page.getByText(nombreEvento).first().click()
  await expect(page).toHaveURL(new RegExp(`/buy_tickets/${eventId}`))

  //2 entradas de 20.000 + 15% = 46.000
  await page.getByRole('button', { name: '+' }).first().click()
  await page.getByRole('button', { name: '+' }).first().click()
  await expect(page.getByText(/Total:\s*\$\s*46\.000/)).toBeVisible()

  await page.locator('input[name="nombreCompleto"]').fill('Comprador E2E')
  await page.locator('input[name="mail"]').fill('comprador@ipass-e2e.local')
  await page.locator('input[name="repetirMail"]').fill('comprador@ipass-e2e.local')
  await page.locator('input[name="dni"]').fill('30111222')
  await page.locator('input[name="telefono"]').fill('1155550000')

  //No salir a MP: se registra a donde iba la redireccion y se corta
  let checkoutUrl
  await page.route(/mercadopago\.com/, (route) => { checkoutUrl = route.request().url(); route.abort() })

  //El pedido /buy va al backend real; solo se copia su respuesta antes de que el navegador salga a MP
  let sent, buyStatus, buyBody
  await page.route(/\/buy$/, async (route) => {
    sent = route.request().postDataJSON()
    const response = await route.fetch()
    buyStatus = response.status()
    buyBody = await response.json()
    await route.fulfill({ response })
  })
  await page.getByRole('button', { name: 'Comprar' }).click()
  await expect.poll(() => buyStatus).toBe(200)

  expect(sent.total).toBe(46000)
  expect(Object.values(sent.quantities)).toEqual([{ amount: 2, free: false }])
  expect(buyBody.init_point).toMatch(/mercadopago\.com/)
  await expect.poll(() => checkoutUrl).toMatch(/mercadopago\.com.*pref_id=/)
})

test('pagina de resultado: volver de MP sin pagar muestra "Pago cancelado"', async ({ page }) => {
  await page.goto('/payment_result?payment_id=null&status=null')
  await expect(page.getByText('Pago cancelado')).toBeVisible()
})

test('pagina de resultado: un pago inexistente no se da por aprobado aunque la URL diga approved', async ({ page }) => {
  //El backend E2E consulta a MP sandbox de verdad: el id no existe
  await page.goto('/payment_result?payment_id=1&status=approved')
  await expect(page.getByText('No pudimos confirmar el estado del pago')).toBeVisible()
  await expect(page.getByText('¡Pago aprobado!')).toHaveCount(0)
})

//Solo interfaz: se simula la respuesta del backend para ver cada estado (la logica real la cubren los tests del server)
for (const [status, titulo, reintento] of [['approved', '¡Pago aprobado!', false], ['rejected', 'Pago rechazado', true], ['pending', 'Pago pendiente', false]]) {
  test(`pagina de resultado (UI): estado ${status}`, async ({ page }) => {
    await page.route(/\/payment_confirm\//, (route) => route.fulfill({ json: { status, nombreEvento: 'Evento X', prodId: 'abc123', procesado: false } }))
    await page.goto(`/payment_result?payment_id=999&status=${status}`)
    await expect(page.getByText(titulo)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Volver al inicio' })).toBeVisible()
    if (reintento) await expect(page.getByRole('link', { name: /Intentar de nuevo/ })).toHaveAttribute('href', '/buy_tickets/abc123')
  })
}

test('ticket con la fecha de cierre vencida: "Venta cerrada" y no se puede elegir', async ({ page, request }) => {
  const mail = uniqueMail('cerrado')
  await registerAndVerify(page, request, { mail })
  await login(page, { mail })
  await expect(page).toHaveURL(/\/$/)
  const userId = await page.evaluate(() => JSON.parse(localStorage.getItem('session')).userFinded[0]._id)

  const ayer = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const eventId = await createEventViaApi(request, { userId, prodMail: mail, nombreEvento: `Cerrado E2E ${Date.now()}`, fechaDeCierre: ayer })

  await page.goto(`/buy_tickets/${eventId}`)
  await expect(page.getByText('Venta cerrada')).toBeVisible()
  await expect(page.getByRole('button', { name: '+' })).toHaveCount(0)
  await expect(page.getByText(/Total:\s*\$\s*0,00/)).toBeVisible()
})
