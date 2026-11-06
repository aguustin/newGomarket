import { useContext, useEffect, useState } from "react"
import { useParams } from "react-router"
import { getOneProdRequest, staffQrRequest } from "../../../api/eventRequests"
import { EventoNoDisponible, formatDateB } from "../../../globalscomp/globalscomp"
import UserContext from "../../../context/userContext"
import { Icon } from "../../../ui/icons"
import { Badge, Button, Card, EmptyState, Field, Input, Page, PageHeader, Skeleton } from "../../../ui/primitives"
import SmartImage from "../../../ui/SmartImage"
import { toast } from "../../../ui/toast"

//Enviar invitaciones (cortesias) a una persona por email (rediseño).
//Correcciones: los mensajes estaban invertidos (state 2 = "no alcanzan las cortesias" se mostraba como exito
//y el exito real no mostraba nada) y nunca se avisaba si no se elegia ninguna invitacion.
const Staff = () => {
  const { session } = useContext(UserContext)
  const userId = session?.userFinded?.[0]?._id
  const { prodId } = useParams()
  const [evento, setEvento] = useState(null)
  const [quantities, setQuantities] = useState({})
  const [loading, setLoading] = useState(false)
  const [noDisponible, setNoDisponible] = useState(false)

  useEffect(() => {
    if (!userId) return //esperar a que cargue la sesion
    getOneProdRequest(prodId, userId).then((res) => {
      const ev = res.data.tickets?.[0]
      setNoDisponible(!ev) //no existe o no es de este usuario
      setEvento(ev ?? null)
    })
  }, [userId, prodId])

  const cambiar = (ticketId, delta, max) => setQuantities((prev) => {
    const nuevo = Math.max(0, Math.min(max, (prev[ticketId] || 0) + delta))
    const copia = { ...prev, [ticketId]: nuevo }
    if (nuevo === 0) delete copia[ticketId]
    return copia
  })
  const total = Object.values(quantities).reduce((a, n) => a + n, 0)

  const addStaff = async (e) => {
    e.preventDefault()
    if (total === 0) return toast.error('Elegí al menos una invitación.')
    const form = e.target
    setLoading(true)
    try {
      const res = await staffQrRequest({ prodId, quantities, mail: form.elements.emailStaff.value.trim() })
      if (res.data.state === 1) {
        toast.success(`¡Listo! Enviamos ${total} ${total === 1 ? 'invitación' : 'invitaciones'} a ${form.elements.emailStaff.value.trim()}.`)
        setQuantities({})
        form.reset()
      } else if (res.data.state === 2) {
        toast.error('No quedan suficientes cortesías de ese tipo.')
      } else {
        toast.error('No pudimos enviar las invitaciones. Intentá de nuevo.')
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || 'No pudimos enviar las invitaciones. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (noDisponible) return <EventoNoDisponible />
  if (!evento) return <Page size="medium"><Skeleton className="h-10 w-64" /><Skeleton className="mt-8 h-96 rounded-2xl" /></Page>

  const cortesias = evento.cortesiaRRPP ?? []

  return (
    <Page size="medium">
      <Button to={`/editar_evento/${prodId}`} variant="ghost" size="sm" icon={Icon.ArrowLeft} className="-ml-3 mb-4">Volver al evento</Button>
      <PageHeader eyebrow={evento.nombreEvento} title="Enviar invitaciones" description="Elegí las cortesías y el email: le llega una entrada con QR por cada una." />

      <form onSubmit={addStaff} className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden">
          <div className="border-b border-line px-5 py-4"><h2 className="font-semibold text-fg">Cortesías disponibles</h2></div>
          {cortesias.length === 0 ? (
            <EmptyState icon={Icon.Ticket} title="Este evento no tiene cortesías" description="Creá una entrada de tipo Cortesía desde la pestaña Entradas del evento."
              action={<Button to={`/editar_evento/${prodId}`} variant="secondary">Ir a Entradas</Button>} />
          ) : (
            <ul className="divide-y divide-line">
              {cortesias.map((tck) => {
                const disponibles = Number(tck.cantidadDeCortesias) || 0
                const cantidad = quantities[tck._id] || 0
                return (
                  <li key={tck._id} className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap sm:px-5">
                    {tck.imgTicket ? <img src={tck.imgTicket} alt="" className="size-12 rounded-xl object-cover" loading="lazy" /> : <span className="flex size-12 items-center justify-center rounded-xl bg-surface-2 text-brand-300"><Icon.Ticket /></span>}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-fg">{tck.nombreTicket}</p>
                      <p className="text-sm text-muted">{disponibles} disponibles{tck.fechaDeCierre && ` · hasta ${formatDateB(tck.fechaDeCierre)}`}</p>
                    </div>
                    {disponibles >= 1 ? (
                      <div className="flex items-center gap-1 rounded-xl border border-line bg-surface-2 p-1">
                        <button type="button" onClick={() => cambiar(tck._id, -1, disponibles)} disabled={cantidad === 0} aria-label={`Restar ${tck.nombreTicket}`}
                          className="flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface-3 hover:text-fg disabled:opacity-30"><Icon.Minus className="size-4" /></button>
                        <span className="w-7 text-center font-semibold tabular-nums text-fg">{cantidad}</span>
                        <button type="button" onClick={() => cambiar(tck._id, 1, disponibles)} disabled={cantidad >= disponibles} aria-label={`Sumar ${tck.nombreTicket}`}
                          className="flex size-8 items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-400 disabled:bg-surface-3 disabled:text-subtle"><Icon.Plus className="size-4" /></button>
                      </div>
                    ) : <Badge tone="danger">Agotada</Badge>}
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="space-y-4 p-5">
            <SmartImage src={evento.imgEvento} className="aspect-video w-full rounded-xl" />
            <Field label="Email de quien recibe">{({ id }) => <Input id={id} icon={Icon.Mail} type="email" name="emailStaff" placeholder="nombre@email.com" required />}</Field>
            <div className="flex items-center justify-between border-t border-line pt-4 text-sm">
              <span className="text-muted">Invitaciones</span><span className="font-semibold tabular-nums text-fg">{total}</span>
            </div>
            <Button type="submit" block size="lg" loading={loading} icon={Icon.Mail}>Enviar invitaciones</Button>
          </Card>
        </aside>
      </form>
    </Page>
  )
}

export default Staff
