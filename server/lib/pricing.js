//Calculo de una compra a partir de los datos de la BASE (nunca de lo que manda el navegador).
//Funcion pura: no lee la base ni la red, para poder testearla sola.
//
//  subtotal      = suma de precio x cantidad
//  total         = subtotal + comision de servicio, menos el descuento (el descuento aplica sobre todo, como muestra la pagina)
//  montoEntradas = lo reembolsable: subtotal menos el descuento (sin el cargo por servicio)
//
//Devuelve { ok: true, ... } o { ok: false, status, code, error }

export const COMISION_POR_DEFECTO = 15
export const LIMITE_POR_DEFECTO = 30

const redondear = (n) => Math.round(n * 100) / 100

const rechazo = (status, code, error) => ({ ok: false, status, code, error })

export const ventaCerrada = (event, ticket, now = new Date()) =>
  event?.active === false ||
  Boolean(event?.fechaFin && new Date(event.fechaFin) < now) ||
  Boolean(ticket?.fechaDeCierre && new Date(ticket.fechaDeCierre) < now)

export const calcularCompra = (event, quantities, { descuento = null, now = new Date() } = {}) => {
  if (!event) return rechazo(404, 'EVENTO_INEXISTENTE', 'El evento no existe')
  if (ventaCerrada(event, null, now)) return rechazo(409, 'VENTA_CERRADA', 'La venta de este evento está cerrada')
  if (event.soldOut) return rechazo(409, 'AGOTADO', 'El evento está agotado')

  if (!quantities || typeof quantities !== 'object' || Array.isArray(quantities)) {
    return rechazo(400, 'CANTIDADES_INVALIDAS', 'No se eligieron entradas')
  }

  const items = []
  for (const [ticketId, q] of Object.entries(quantities)) {
    const amount = q?.amount
    if (!Number.isInteger(amount) || amount < 0) return rechazo(400, 'CANTIDADES_INVALIDAS', 'Cantidad de entradas inválida')
    if (amount === 0) continue

    if (event.cortesiaRRPP?.some((c) => String(c._id) === ticketId)) {
      return rechazo(400, 'TICKET_CORTESIA', 'Las cortesías no se venden')
    }
    const ticket = event.tickets?.find((t) => String(t._id) === ticketId)
    if (!ticket) return rechazo(400, 'TICKET_INEXISTENTE', 'Una de las entradas no pertenece a este evento')

    const nombre = ticket.nombreTicket
    if (ticket.estado === 2 || ticket.estado === 3) return rechazo(409, 'TICKET_NO_DISPONIBLE', `La entrada "${nombre}" no está a la venta`)
    if (ticket.estado === 4) return rechazo(409, 'AGOTADO', `La entrada "${nombre}" está agotada`)
    if (ventaCerrada(event, ticket, now)) return rechazo(409, 'VENTA_CERRADA', `La venta de "${nombre}" ya cerró`)

    const limite = ticket.limit || LIMITE_POR_DEFECTO
    if (amount > limite) return rechazo(400, 'LIMITE_SUPERADO', `Máximo ${limite} entradas "${nombre}" por compra`)
    if (typeof ticket.cantidad === 'number' && amount > ticket.cantidad) {
      return rechazo(409, 'SIN_STOCK', `No quedan suficientes entradas "${nombre}"`)
    }
    const precio = Number(ticket.precio)
    if (!Number.isFinite(precio) || precio < 0) return rechazo(409, 'PRECIO_INVALIDO', `La entrada "${nombre}" no tiene un precio válido`)

    items.push({ ticketId, nombreTicket: nombre, precio, amount })
  }
  if (items.length === 0) return rechazo(400, 'SIN_ENTRADAS', 'Elegí al menos una entrada')

  const comision = Number(event.comisionServicio ?? COMISION_POR_DEFECTO)
  const descuentoPct = descuento ? Math.min(Math.max(Number(descuento.numeroDescuento) || 0, 0), 100) : 0

  const subtotal = items.reduce((acc, i) => acc + i.precio * i.amount, 0)
  const conComision = subtotal * (1 + comision / 100)
  const factor = 1 - descuentoPct / 100

  return {
    ok: true,
    items,
    //Solo las entradas validadas, con el formato que esperan los QR y el registro de ventas
    quantities: Object.fromEntries(items.map((i) => [i.ticketId, { amount: i.amount, free: false }])),
    comision,
    descuentoPct,
    subtotal: redondear(subtotal),
    total: redondear(conComision * factor),
    montoEntradas: redondear(subtotal * factor)
  }
}
