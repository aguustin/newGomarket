import alertModel from "../models/alertModel.js";
import { resend } from "./resendDomain.js";

//Avisos al administrador por mail (etapa 12): casos que necesitan que una persona los revise.
//  - Se manda UNA vez por caso (clave unica en la base), aunque el cron lo vuelva a ver.
//  - Nunca lanza: si el mail falla queda registrado en la base y en el log, y el proceso que avisa sigue.
//  - ADMIN_MAIL: destinatario. Sin definir, el aviso solo queda en el log y en la base.
export const TIPOS_ALERTA = {
  monto: 'Monto cobrado distinto al esperado',
  eventoInexistente: 'Pago de un evento que no existe',
  errorVenta: 'Pago cobrado sin venta registrada',
  entregaAgotada: 'Entradas sin entregar',
  sobreventa: 'Sobreventa',
  reembolsoRevision: 'Reembolso para revisar a mano',
  reembolsoAgotado: 'Reembolso fallido',
  invitacionesAgotadas: 'Invitaciones sin enviar'
}

const escapar = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export const alertarAdmin = async (tipo, clave, detalle) => {
  const asunto = `[Ipass] ${TIPOS_ALERTA[tipo] ?? tipo}`
  try {
    //Solo el primero que lo inserta manda el mail
    try {
      await alertModel.create({ clave: `${tipo}:${clave}`, tipo, asunto, detalle })
    } catch (err) {
      if (err?.code === 11000) return 'repetida'
      throw err
    }
    const destino = process.env.ADMIN_MAIL
    if (!destino) {
      console.error(`ALERTA (sin ADMIN_MAIL, no se manda mail): ${asunto}: ${detalle}`)
      return 'sin-destino'
    }
    const { error } = await resend.emails.send({
      from: 'Ipass <no-reply@ipassi.com>',
      to: [destino],
      subject: asunto,
      html: `<p><b>${escapar(asunto)}</b></p><p>${escapar(detalle)}</p><p>Este aviso se manda una sola vez por caso.</p>`
    })
    if (error) throw new Error(error.message ?? String(error))
    await alertModel.updateOne({ clave: `${tipo}:${clave}` }, { $set: { enviado: true } })
    return 'enviada'
  } catch (err) {
    const msg = String(err?.message ?? err).slice(0, 300)
    console.error(`ALERTA (no se pudo avisar por mail: ${msg}): ${asunto}: ${detalle}`)
    await alertModel.updateOne({ clave: `${tipo}:${clave}` }, { $set: { error: msg } }).catch(() => {})
    return 'error'
  }
}
