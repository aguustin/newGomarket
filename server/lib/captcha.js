//reCAPTCHA verificado en el servidor (etapa 13). Antes solo se mostraba en el navegador y un bot lo salteaba.
//Con RECAPTCHA_SECRET definida, /register y /login exigen el token de la casilla ("captcha" en el body)
//y lo validan con Google. Sin la variable (local y tests) no se verifica; en produccion config.js avisa.
//Responde 200 con estado 4 (misma forma que el resto de las respuestas de login/registro)
const URL_VERIFICACION = 'https://www.google.com/recaptcha/api/siteverify'
const RECHAZO = { estado: 4, code: 'CAPTCHA_INVALIDO', msj: 'Marcá de nuevo la casilla "No soy un robot"' }

export const verificarCaptcha = async (req, res, next) => {
  const secret = process.env.RECAPTCHA_SECRET
  if (!secret) return next()
  const token = req.body?.captcha
  if (typeof token !== 'string' || !token || token.length > 4000) return res.status(200).json(RECHAZO)
  try {
    const r = await fetch(URL_VERIFICACION, {
      method: 'POST',
      body: new URLSearchParams({ secret, response: token, remoteip: req.ip ?? '' }),
      signal: AbortSignal.timeout(8000)
    })
    const datos = await r.json()
    if (datos?.success === true) return next()
  } catch (err) {
    console.error('reCAPTCHA: no se pudo verificar el token', err?.message ?? err)
  }
  return res.status(200).json(RECHAZO)
}
