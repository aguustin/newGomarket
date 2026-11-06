import { useContext, useEffect, useState } from "react"
import { generateMyRRPPLinkRequest, getRRPPInfoRequest } from "../../api/eventRequests"
import UserContext from "../../context/userContext"
import { Icon } from "../../ui/icons"
import { Button, Card, EmptyState, Page, PageHeader, Skeleton } from "../../ui/primitives"
import SmartImage from "../../ui/SmartImage"
import { fechaPartes } from "../../ui/EventCard"
import { toast } from "../../ui/toast"

//Mis colaboraciones (RRPP) (rediseño): un evento por tarjeta con ventas, link de venta y cortesias.
//Generar el link ya no recarga toda la pagina.
const pesos = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(n) || 0)

const RRPPEvents = () => {
  const { session } = useContext(UserContext)
  const mail = session?.userFinded?.[0]?.mail
  const [eventos, setEventos] = useState(null)
  const [generando, setGenerando] = useState(null)

  const cargar = async () => {
    try {
      const res = await getRRPPInfoRequest(mail)
      setEventos(res.data ?? [])
    } catch {
      setEventos([])
      toast.error('No pudimos cargar tus colaboraciones.')
    }
  }
  useEffect(() => { if (mail) cargar() }, [mail])  // eslint-disable-line react-hooks/exhaustive-deps

  const generarLink = async (prodId) => {
    setGenerando(prodId)
    try {
      await generateMyRRPPLinkRequest({ prodId, rrppMail: mail })
      await cargar()
      toast.success('Tu link de venta está listo')
    } catch {
      toast.error('No pudimos generar el link. Intentá de nuevo.')
    } finally {
      setGenerando(null)
    }
  }

  const copiar = async (link) => {
    try {
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) return await navigator.share({ url: link })
      await navigator.clipboard.writeText(link)
      toast.success('Link copiado. ¡A vender!')
    } catch { /* menu de compartir cancelado */ }
  }

  const mios = (eventos ?? []).map((ev) => ({ ev, yo: ev.rrpp?.find((r) => r.mail === mail) })).filter((x) => x.yo)

  return (
    <Page>
      <PageHeader eyebrow="RRPP" title="Mis colaboraciones" description="Los eventos donde sos RRPP: compartí tu link de venta y mandá tus cortesías." />

      {eventos === null ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96 rounded-2xl" />)}</div>
      ) : mios.length === 0 ? (
        <Card><EmptyState icon={Icon.Users} title="Todavía no sos RRPP de ningún evento" description="Cuando un productor te sume a su evento, lo vas a ver acá. Revisá también tu email." /></Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {mios.map(({ ev, yo }) => {
            const f = fechaPartes(ev.fechaInicio)
            const vendidas = (yo.ventasRRPP ?? []).reduce((a, v) => a + (Number(v.vendidos) || 0), 0)
            const cortesias = (yo.ticketsCortesias ?? []).reduce((a, t) => a + (Number(t.cantidadDeCortesias) || 0), 0)
            return (
              <Card key={ev._id} className="flex flex-col overflow-hidden">
                <div className="relative">
                  <SmartImage src={ev.imgEvento} className="aspect-[16/9] w-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute inset-x-4 bottom-3">
                    <h2 className="truncate text-lg font-semibold text-white">{ev.nombreEvento}</h2>
                    {f && <p className="text-sm text-white/80"><span className="capitalize">{f.larga}</span> · {f.hora} h</p>}
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-4 p-5">
                  <dl className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-surface-2 p-3"><dt className="text-xs text-subtle">Vendidas</dt><dd className="mt-0.5 text-lg font-semibold tabular-nums text-fg">{vendidas}</dd></div>
                    <div className="rounded-xl bg-surface-2 p-3"><dt className="text-xs text-subtle">Recaudado</dt><dd className="mt-0.5 text-lg font-semibold tabular-nums text-fg">{pesos(yo.montoTotalVendidoRRPP)}</dd></div>
                  </dl>

                  {yo.linkDePago ? (
                    <div>
                      <p className="mb-1.5 text-[13px] font-medium text-muted">Tu link de venta</p>
                      <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2 p-1.5 pl-3">
                        <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted">{yo.linkDePago}</span>
                        <Button size="sm" icon={Icon.Copy} onClick={() => copiar(yo.linkDePago)}>Copiar</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted">Generá tu link para que las ventas se registren a tu nombre.</p>
                  )}

                  <div className="mt-auto flex flex-col gap-2 pt-1">
                    <Button variant={yo.linkDePago ? 'ghost' : 'primary'} size={yo.linkDePago ? 'sm' : 'md'} block loading={generando === ev._id} onClick={() => generarLink(ev._id)} icon={Icon.Link}>
                      {yo.linkDePago ? 'Generar un link nuevo' : 'Generar mi link de venta'}
                    </Button>
                    {cortesias > 0 && (
                      <Button to={`/rrpp_get_event_free/${ev._id}/${mail}`} variant="secondary" block icon={Icon.Ticket}>Enviar cortesías ({cortesias})</Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </Page>
  )
}

export default RRPPEvents
