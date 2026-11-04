import { test, expect } from '@playwright/test'
import { E2E_BACK } from '../playwright.config.js'
import { uniqueMail, waitForMail, linkFromMail, registerAndVerify, login } from './helpers.js'

test('registro -> verificacion desde la bandeja -> login -> sesion persiste al recargar', async ({ page, request }) => {
  const mail = uniqueMail('registro')
  await registerAndVerify(page, request, { nombre: 'Ana E2E', mail })

  //Antes de verificar no habia usuario; despues si: el login funciona
  await login(page, { mail })
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByText('Ana E2E').first()).toBeVisible()

  //Persistencia: la sesion vive en localStorage y sobrevive a la recarga
  await page.reload()
  await expect(page.getByText('Ana E2E').first()).toBeVisible()
  const session = await page.evaluate(() => JSON.parse(localStorage.getItem('session')))
  expect(session.userFinded[0].mail).toBe(mail)
})

test('verificar dos veces el mismo link no duplica la cuenta', async ({ page, request }) => {
  const mail = uniqueMail('doble')
  await registerAndVerify(page, request, { mail })
  const verif = await waitForMail(request, mail, /Verifica tu correo/)
  await page.goto(linkFromMail(verif, '/verify_account/'))
  await expect(page).toHaveURL(/\/login\?verificacion=ok$/)

  //Registrarse otra vez con el mismo mail: el backend responde que ya existe
  const res = await request.post(`${E2E_BACK}/register`, { data: { nombreCompleto: 'X', mail, dni: 1, pais: 'AR', contrasenia: 'a', repetirContrasenia: 'a' } })
  expect((await res.json()).msj).toBe('El usuario ya existe')
})

test('login: contraseña incorrecta y email inexistente muestran su mensaje', async ({ page, request }) => {
  const mail = uniqueMail('login')
  await registerAndVerify(page, request, { mail })

  await login(page, { mail, pass: 'otra-clave' })
  await expect(page.getByText('La contraseña es incorrecta')).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)

  await login(page, { mail: uniqueMail('nadie') })
  await expect(page.getByText('El email es incorrecto')).toBeVisible()
})

test('recuperar contraseña: mail en la bandeja -> nueva contraseña -> login con la nueva', async ({ page, request }) => {
  const mail = uniqueMail('recupero')
  await registerAndVerify(page, request, { mail })

  await page.goto('/login')
  await page.getByRole('button', { name: 'Haz click aquí' }).click()
  await page.locator('input[name="mail"]').fill(mail)
  await page.locator('form button[type="submit"]').click()
  await expect(page.getByText('Se envió un correo electronico')).toBeVisible()

  const recupero = await waitForMail(request, mail, /Recuperar contraseña/)
  await page.goto(linkFromMail(recupero, '/recover_password/'))
  await page.locator('input[name="nuevaContrasenia"]').fill('NuevaClave999')
  await page.locator('input[name="repetirNuevaContrasenia"]').fill('NuevaClave999')
  await page.locator('form button[type="submit"]').click()
  await expect(page.getByText('Tu contraseña fue actualizada con exito!')).toBeVisible()

  await login(page, { mail, pass: 'Clave12345' })
  await expect(page.getByText('La contraseña es incorrecta')).toBeVisible()
  await login(page, { mail, pass: 'NuevaClave999' })
  await expect(page).toHaveURL(/\/$/)
})

test('reCAPTCHA desactivado en desarrollo: no se carga el widget en login ni registro', async ({ page }) => {
  //Solo pedidos a Google (el modulo react-google-recaptcha que sirve Vite no cuenta)
  const recaptcha = []
  page.on('request', (r) => { if (/google\.com\/recaptcha|gstatic\.com\/recaptcha|recaptcha\.net/.test(r.url())) recaptcha.push(r.url()) })
  await page.goto('/login')
  await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible()
  await page.goto('/register')
  await expect(page.getByRole('button', { name: 'Registrarme' })).toBeVisible()
  await expect(page.locator('iframe[src*="recaptcha"]')).toHaveCount(0)
  expect(recaptcha).toEqual([])
})

test('sesion guardada antes del token: se descarta y el usuario queda sin sesion', async ({ page }) => {
  await page.goto('/')
  //Sesion como la guardaba el frontend antes de esta etapa (sin token)
  await page.evaluate(() => localStorage.setItem('session', JSON.stringify({ userFinded: [{ _id: '000000000000000000000000', mail: 'viejo@ipass-e2e.local', nombreCompleto: 'Viejo' }], estado: 1 })))
  await page.reload()
  await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible()
  await expect(page.getByText('Viejo')).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('session'))).toBeNull()
})

test('sesion con token invalido o vencido: la pagina privada lleva al login con aviso', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('session', JSON.stringify({ userFinded: [{ _id: '000000000000000000000000', mail: 'vencida@ipass-e2e.local', nombreCompleto: 'Vencida' }], estado: 1, token: 'token-vencido-o-invalido' })))
  await page.goto('/productions')
  await expect(page).toHaveURL(/\/login\?sesion=requerida/)
  await expect(page.getByText('Iniciá sesión para continuar')).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('session'))).toBeNull()
})

test('con sesion: la pagina privada carga y el backend recibe el token', async ({ page, request }) => {
  const mail = uniqueMail('privada')
  await registerAndVerify(page, request, { mail })
  await login(page, { mail })
  await expect(page).toHaveURL(/\/$/)

  const pedido = page.waitForRequest((r) => r.url().includes('/my_productions/'))
  await page.goto('/productions')
  const req = await pedido
  expect(req.headers()['authorization']).toMatch(/^Bearer /)
  await expect(page).toHaveURL(/\/productions$/)
})
