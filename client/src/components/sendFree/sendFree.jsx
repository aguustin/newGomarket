import { useContext, useEffect, useState } from "react"
import { useParams } from "react-router"
import { getRRPPCortesiasRequest, sendRRPPCortesiasRequest } from "../../api/eventRequests"
import { EventoNoDisponible, formatDateB } from "../../globalscomp/globalscomp"
import UserContext from "../../context/userContext"
import { Icon } from "../../ui/icons"
import { Alert, Badge, Button, Card, EmptyState, Field, Input, Page, PageHeader, Skeleton } from "../../ui/primitives"
import SmartImage from "../../ui/SmartImage"
import { fechaPartes } from "../../ui/EventCard"

//El RRPP envia cortesias de su cupo a sus clientes (rediseño). El cupo y los permisos los controla el backend
//(/rrpp_cortesias y /rrpp_enviar_cortesias): la pantalla solo muestra lo disponible.
const SendFree = () => {
  const { session } = useContext(UserContext)
  const mail = session?.userFinded?.[0]?.mail
  const { prodId } = useParams()
  const [data, setData] = useState(null)
  const [noDisponible, setNoDisponible] = useState(false)
  const [cantidades, setCantidades] = useState({})
  const [enviando, setEnviando] = useState(null)
  const [mensajes, setMensajes] = useState({})

  const cargar = async () => {
    try {
      const res = await getRRPPCortesiasRequest(prodId)
      setData(res.data)
    } catch (err) {
      if ([400, 403, 404].includes(err?.response?.status)) setNoDisponible(true)
    }
  }
  useEffect(() => { if (session?.userFinded?.[0]?._id) cargar() }, [session, prodId])  // eslint-disable-line react-hooks/exhaustive-deps

  const cambiarCantidad = (cortesia, delta) => setCantidades((prev) => {
    const maximo = Math.min(cortesia.disponibles, cortesia.limit ?? cortesia.disponibles)
    return { ...prev, [cortesia.ticketId]: Math.max(0, Math.min(maximo, (prev[cortesia.ticketId] || 0) + delta)) }
  })

  const enviar = async (e, cortesia) => {
    e.preventDefault()
    const form = e.target.elements
    const cantidad = cantidades[cortesia.ticketId] || 0
    const aviso = (texto, ok = false) => setMensajes((prev) => ({ ...prev, [cortesia.ticketId]: { texto, ok } }))
    if (cantidad < 1) return aviso('Elegí cuántas cortesías enviar')
    if (form.clientMail.value.trim() !== form.repetirMail.value.trim()) return aviso('Los emails no coinciden')

    setEnviando(cortesia.ticketId)
    try {
      await sendRRPPCortesiasRequest({ prodId, ticketId: cortesia.ticketId, cantidad, mail: form.clientMail.value.trim(), nombreCompleto: form.clientName.value.trim() })
      aviso(`¡Listo! Enviamos ${cantidad} ${cantidad === 1 ? 'cortesía' : 'cortesías'} a ${form.clientMail.value.trim()}`, true)
      setCantidades((prev) => ({ ...prev, [cortesia.ticketId]: 0 }))
      e.target.reset()
      await cargar()
    } catch (err) {
      aviso(err?.response?.data?.error || 'No pudimos enviar las cortesías. Intentá de nuevo')
      await cargar()
    } finally {
      setEnviando(null)
    }
  }

  if (noDisponible) return <EventoNoDisponible />
  if (!data) return <Page size="medium"><Skeleton className="h-28 rounded-2xl" /><Skeleton className="mt-6 h-72 rounded-2xl" /></Page>

  const { evento, cortesias } = data
  const f = fechaPartes(evento.fechaInicio)

  return (
    <Page size="medium">
      <Button to={`/get_my_rrpp_events/${mail}`} variant="ghost" size="sm" icon={Icon.ArrowLeft} className="-ml-3 mb-4">Mis colaboraciones</Button>
      <PageHeader eyebrow="Cortesías" title="Enviar cortesías" description="Cada persona recibe por email una entrada con QR por cortesía." />

      <Card className="mb-6 flex items-center gap-4 p-4">
        <SmartImage src={evento.imgEvento} className="size-16 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-fg">{evento.nombreEvento}</p>
          <p className="text-sm text-muted">{f && <><span className="capitalize">{f.larga}</span> · {f.hora} h · </>}{[evento.localidad, evento.provincia].filter(Boolean).join(', ')}{evento.eventoEdad ? ` · +${evento.eventoEdad}` : ''}</p>
        </div>
      </Card>

      {cortesias.length === 0 ? (
        <Card><EmptyState icon={Icon.Ticket} title="No tenés cortesías asignadas" description="Cuando el productor te asigne cortesías para este evento, las vas a ver acá." /></Card>
      ) : (
        <div className="space-y-4">
          {cortesias.map((cortesia) => {
            const cantidad = cantidades[cortesia.ticketId] || 0
            const mensaje = mensajes[cortesia.ticketId]
            const sinCupo = cortesia.disponibles < 1
            const maximo = Math.min(cortesia.disponibles, cortesia.limit ?? cortesia.disponibles)
            return (
              <Card key={cortesia.ticketId} as="form" onSubmit={(e) => enviar(e, cortesia)} className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-4">
                  {cortesia.imgTicket ? <img className="size-12 rounded-xl object-cover" src={cortesia.imgTicket} alt="" loading="lazy" /> : <span className="flex size-12 items-center justify-center rounded-xl bg-brand-500/12 text-brand-300"><Icon.Ticket /></span>}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-fg">{cortesia.nombreTicket}</p>
                    {cortesia.fechaDeCierre && <p className="text-sm text-muted">Válida hasta {formatDateB(cortesia.fechaDeCierre)}</p>}
                  </div>
                  <Badge tone={sinCupo ? 'neutral' : 'brand'}>Disponibles: {cortesia.disponibles}</Badge>
                </div>

                {cortesia.cerrada ? (
                  <p className="mt-4 text-sm text-muted">Esta cortesía ya no se puede enviar.</p>
                ) : sinCupo ? (
                  <p className="mt-4 text-sm text-muted">No te quedan cortesías de este tipo.</p>
                ) : (
                  <div className="mt-5 grid gap-4 border-t border-line pt-5">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-medium text-muted">Cantidad</span>
                      <div className="flex items-center gap-1 rounded-xl border border-line bg-surface-2 p-1">
                        <button type="button" onClick={() => cambiarCantidad(cortesia, -1)} disabled={cantidad === 0} aria-label="Restar una cortesía"
                          className="flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface-3 hover:text-fg disabled:opacity-30"><Icon.Minus className="size-4" /></button>
                        <span data-testid="cantidad" className="w-8 text-center font-semibold tabular-nums text-fg">{cantidad}</span>
                        <button type="button" onClick={() => cambiarCantidad(cortesia, 1)} disabled={cantidad >= maximo} aria-label="Sumar una cortesía"
                          className="flex size-9 items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-400 disabled:bg-surface-3 disabled:text-subtle"><Icon.Plus className="size-4" /></button>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field label="Nombre">{({ id }) => <Input id={id} name="clientName" placeholder="Quién la recibe" required />}</Field>
                      <Field label="Email">{({ id }) => <Input id={id} type="email" name="clientMail" inputMode="email" placeholder="nombre@email.com" required />}</Field>
                      <Field label="Repetir email">{({ id }) => <Input id={id} type="email" name="repetirMail" inputMode="email" required />}</Field>
                    </div>
                    <Button type="submit" loading={enviando === cortesia.ticketId} icon={Icon.Mail} className="sm:justify-self-end">Enviar cortesías</Button>
                  </div>
                )}
                {mensaje && <Alert tone={mensaje.ok ? 'ok' : 'warn'} className="mt-4">{mensaje.texto}</Alert>}
              </Card>
            )
          })}
        </div>
      )}
    </Page>
  )
}

export default SendFree
