import { expect } from '@playwright/test'
import { E2E_BACK, E2E_FAKE_PUBLIC_BACK } from '../playwright.config.js'

export const uniqueMail = (tag) => `${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@ipass-e2e.local`

//Espera el mail en la bandeja de desarrollo del backend E2E (llamada directa desde el test, no desde el navegador)
export const waitForMail = async (request, to, subjectRe) => {
  let found
  await expect.poll(async () => {
    const res = await request.get(`${E2E_BACK}/dev/mails.json?to=${encodeURIComponent(to)}`)
    const mails = await res.json()
    found = mails.find((m) => subjectRe.test(m.subject))
    return Boolean(found)
  }, { message: `mail "${subjectRe}" para ${to}`, timeout: 15_000 }).toBe(true)
  return found
}

//Primer link del mail que contenga `fragment`. Los links al backend usan un host publico ficticio
//(Mercado Pago exige https): se reemplaza por el backend E2E conservando ruta y token
export const linkFromMail = (mail, fragment) => {
  const href = [...mail.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]).find((h) => h.includes(fragment))
  if (!href) throw new Error(`No hay link con "${fragment}" en "${mail.subject}"`)
  return href.replace(E2E_FAKE_PUBLIC_BACK, E2E_BACK)
}

export const registerAndVerify = async (page, request, { nombre = 'Usuario E2E', mail, pass = 'Clave12345' }) => {
  await page.goto('/register')
  await page.locator('input[name="nombreCompleto"]').fill(nombre)
  await page.locator('input[name="mail"]').fill(mail)
  await page.locator('input[name="dni"]').fill('30111222')
  await page.locator('input[name="pais"]').fill('Argentina')
  await page.locator('input[name="contrasenia"]').fill(pass)
  await page.locator('input[name="repetirContrasenia"]').fill(pass)
  await page.getByRole('button', { name: 'Registrarme' }).click()

  const verif = await waitForMail(request, mail, /Verifica tu correo/)
  //El link del mail lleva al backend, que crea la cuenta y redirige al login del frontend
  await page.goto(linkFromMail(verif, '/verify_account/'))
  await expect(page).toHaveURL(/\/login$/)
}

export const login = async (page, { mail, pass = 'Clave12345' }) => {
  await page.goto('/login')
  await page.locator('input[name="mail"]').fill(mail)
  await page.locator('input[name="contrasenia"]').fill(pass)
  await page.getByRole('button', { name: 'Ingresar' }).click()
}

//Crea un evento publico con un ticket pago usando la API real (multipart, sin imagenes)
export const createEventViaApi = async (request, { userId, prodMail, nombreEvento, precio = 20000, cantidad = 50, fechaDeCierre }) => {
  const enUnMes = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
  const ev = await request.post(`${E2E_BACK}/createEvent`, {
    multipart: {
      userId, prodMail, nombreEvento, codigoPais: 'AR', codigoCiudad: 'C', paisDestino: 'AR', tipoEvento: '1',
      eventoEdad: '18', descripcionEvento: 'Evento creado por E2E', aviso: '', categoriasEventos: '["Musica"]',
      artistas: 'Banda E2E', montoVentas: '0', porcentajeRRPP: '10', fechaInicio: enUnMes, fechaFin: enUnMes,
      provincia: 'Buenos Aires', localidad: 'CABA', tipoMoneda: 'ARS', direccion: 'Calle Falsa 123',
      lugarEvento: 'Club', linkVideo: '', comisionServicio: '15'
    }
  })
  expect(ev.ok()).toBe(true)
  const { eventId } = await ev.json()
  const tk = await request.post(`${E2E_BACK}/createEventTickets`, {
    multipart: { prodId: eventId, nombreTicket: 'General', descripcionTicket: 'Entrada general', precio: String(precio),
      cantidad: String(cantidad), fechaDeCierre: fechaDeCierre ?? enUnMes, visibilidad: '1', estado: '1', distribution: '0', limit: '10' }
  })
  expect(tk.ok()).toBe(true)
  return eventId
}
