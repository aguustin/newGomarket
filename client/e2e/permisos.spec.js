import { test, expect } from '@playwright/test'
import { uniqueMail, registerAndVerify, login, createEventViaApi, sesionDelNavegador } from './helpers.js'

//Pantallas de gestion abiertas por un usuario que no es el dueño del evento: aviso en vez de pantalla vacia
test('un usuario que no es el dueño ve "Este evento no está disponible" en las pantallas de gestion', async ({ page, request }) => {
  const duenoMail = uniqueMail('dueno')
  await registerAndVerify(page, request, { nombre: 'Dueño E2E', mail: duenoMail })
  await login(page, { mail: duenoMail })
  await expect(page).toHaveURL(/\/$/)
  const dueno = await sesionDelNavegador(page)
  const eventId = await createEventViaApi(request, { auth: dueno.auth, userId: dueno.userId, prodMail: duenoMail, nombreEvento: `Ajeno E2E ${Date.now()}` })

  //El dueño ve su evento
  await page.goto(`/editar_evento/${eventId}`)
  await expect(page.getByText('Este evento no está disponible')).toHaveCount(0)

  const otroMail = uniqueMail('otro')
  await registerAndVerify(page, request, { nombre: 'Otro E2E', mail: otroMail })
  await login(page, { mail: otroMail })
  await expect(page).toHaveURL(/\/$/)
  const otro = await sesionDelNavegador(page)

  for (const ruta of [`/editar_evento/${eventId}`, `/editar_evento/staff/${eventId}`, `/statistics/${eventId}/${otro.userId}`,
    `/get_buyers/${eventId}`, `/cortesies/${eventId}`, `/new_excel/${eventId}`]) {
    await page.goto(ruta)
    await expect(page.getByText('Este evento no está disponible'), ruta).toBeVisible()
  }
  //Estadisticas con el id del dueño en la URL: el backend responde 403
  await page.goto(`/statistics/${eventId}/${dueno.userId}`)
  await expect(page.getByText('Este evento no está disponible')).toBeVisible()
})
