import { useState } from "react"
import { Link } from "react-router"
import { addRRPPRequest } from "../../api/eventRequests"
import { Icon } from "../../ui/icons"
import { Button, Card, Field, Input } from "../../ui/primitives"
import { toast } from "../../ui/toast"

//Pestaña "Equipo y cortesias" de Editar evento: RRPP + accesos a invitaciones y listas de cortesias.
const Acceso = ({ to, icon: Ico, titulo, texto }) => (
  <Link to={to} className="group flex items-start gap-4 rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-brand-500/50 hover:bg-surface-2">
    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/12 text-brand-300"><Ico /></span>
    <div className="min-w-0 flex-1">
      <p className="font-semibold text-fg">{titulo}</p>
      <p className="mt-0.5 text-sm text-muted">{texto}</p>
    </div>
    <Icon.ChevronRight className="mt-1 size-5 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5" />
  </Link>
)

const TeamTab = ({ evento, onChanged }) => {
  const [loading, setLoading] = useState(false)
  const rrpp = evento.rrpp ?? []

  const addRRPP = async (e) => {
    e.preventDefault()
    const form = e.target
    const rrppMail = form.elements.rrppMail.value.trim()
    setLoading(true)
    try {
      const res = await addRRPPRequest({ prodId: evento._id, rrppMail, nombreEvento: evento.nombreEvento, eventImg: evento.imgEvento })
      if (res.data.msg === 1) {
        toast.success(`Sumamos a ${rrppMail} como RRPP del evento`)
        form.reset()
        await onChanged()
      } else if (res.data.msg === 3) {
        toast.error('No hay ninguna cuenta de Ipass con ese email. Pedile que se registre primero.')
      } else {
        toast.info('Esa persona ya es RRPP de este evento.')
      }
    } catch {
      toast.error('No pudimos sumar al RRPP. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <section>
        <h2 className="text-lg font-semibold text-fg">RRPP del evento</h2>
        <p className="text-sm text-muted">Cada RRPP vende con su propio link y cobra la comisión que definiste.</p>
        <Card className="mt-5 p-5">
          <form onSubmit={addRRPP} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <Field label="Email del RRPP" hint="Tiene que tener una cuenta en Ipass." className="flex-1">
              {({ id }) => <Input id={id} icon={Icon.Mail} type="email" name="rrppMail" placeholder="rrpp@email.com" required />}
            </Field>
            <Button type="submit" loading={loading} icon={Icon.Plus} className="sm:mb-[22px]">Sumar RRPP</Button>
          </form>
          {rrpp.length > 0 && (
            <ul className="mt-5 divide-y divide-line border-t border-line">
              {rrpp.map((rp) => (
                <li key={rp._id ?? rp.mail} className="flex items-center gap-3 py-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-sm font-semibold text-brand-200">{rp.mail?.charAt(0).toUpperCase()}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-fg">{rp.mail}</span>
                  <span className="text-sm tabular-nums text-muted">{(rp.ventasRRPP ?? []).reduce((a, v) => a + (Number(v.vendidos) || 0), 0)} vendidas</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-fg">Invitaciones</h2>
        <Acceso to={`/editar_evento/staff/${evento._id}`} icon={Icon.QrCode} titulo="Enviar invitaciones" texto="Mandá entradas sin cargo a una persona, con su QR." />
        <Acceso to={`/cortesies/${evento._id}`} icon={Icon.Users} titulo="Listas de invitados" texto="Cargá un Excel con muchos invitados y enviales el QR a todos." />
      </section>
    </div>
  )
}

export default TeamTab
