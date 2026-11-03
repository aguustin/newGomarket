import crypto from "crypto";

//Firma de los webhooks de Mercado Pago (header x-signature: "ts=...,v1=...").
//Se firma el texto "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" con HMAC-SHA256 y la clave secreta
//de la aplicacion (WEBHOOK_SECRET_KEY). Las partes que no vienen se omiten, como indica Mercado Pago.
//Devuelve { valida, motivo }
export const verificarFirmaMP = ({ headers = {}, query = {} }, secreto) => {
  if (!secreto) return { valida: false, motivo: 'sin WEBHOOK_SECRET_KEY' }
  const firma = headers['x-signature']
  if (!firma) return { valida: false, motivo: 'sin x-signature' }

  const partes = Object.fromEntries(String(firma).split(',').map((p) => p.split('=').map((x) => x?.trim())))
  const { ts, v1 } = partes
  if (!ts || !v1) return { valida: false, motivo: 'x-signature mal formada' }

  let dataId = query['data.id'] ?? query.id
  if (dataId && /[a-z]/i.test(String(dataId))) dataId = String(dataId).toLowerCase()  //MP firma los id alfanumericos en minuscula
  const requestId = headers['x-request-id']

  const manifiesto = [dataId ? `id:${dataId};` : '', requestId ? `request-id:${requestId};` : '', `ts:${ts};`].join('')
  const esperada = crypto.createHmac('sha256', secreto).update(manifiesto).digest('hex')

  const a = Buffer.from(esperada, 'hex')
  const b = Buffer.from(String(v1), 'hex')
  const valida = a.length === b.length && crypto.timingSafeEqual(a, b)
  return { valida, motivo: valida ? 'ok' : 'firma distinta' }
}

//Para tests: arma un x-signature valido
export const firmarComoMP = ({ dataId, requestId, ts = Math.floor(Date.now() / 1000) }, secreto) => {
  const manifiesto = [dataId ? `id:${dataId};` : '', requestId ? `request-id:${requestId};` : '', `ts:${ts};`].join('')
  return `ts=${ts},v1=${crypto.createHmac('sha256', secreto).update(manifiesto).digest('hex')}`
}
