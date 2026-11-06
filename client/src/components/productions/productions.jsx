import { useContext, useEffect, useState } from "react"
import UserContext from "../../context/userContext"
import { getProdsRequest } from "../../api/eventRequests"
import { Icon } from "../../ui/icons"
import { Badge, Button, Card, EmptyState, Page, PageHeader, Skeleton, cx } from "../../ui/primitives"
import SmartImage from "../../ui/SmartImage"
import { estadoEvento, fechaPartes } from "../../ui/EventCard"
import { toast } from "../../ui/toast"

//Mis producciones (rediseño): resumen + una tarjeta por evento con sus metricas y acciones.
const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
const monto = (n) => pesos.format(Number(n) || 0)

const Metrica = ({ label, valor, icon: Ico }) => (
  <Card className="p-5">
    <div className="flex items-center gap-2 text-sm text-muted"><Ico className="size-4 text-brand-300" />{label}</div>
    <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-fg">{valor}</p>
  </Card>
)

const DatoRRPP = ({ label, children }) => (
  <div><dt className="text-xs text-subtle">{label}</dt><dd className="mt-0.5 text-sm text-fg">{children}</dd></div>
)

const copiar = async (texto, aviso) => {
  try { await navigator.clipboard.writeText(texto); toast.success(aviso) } catch { toast.error('No pudimos copiar. Copialo a mano: ' + texto) }
}

const Productions = () => {
  const { session, productions, setProductions } = useContext(UserContext)
  const userId = session?.userFinded?.[0]?._id
  const [cargando, setCargando] = useState(true)
  const [rrppAbierto, setRrppAbierto] = useState(null)

  useEffect(() => {
    if (!userId) return
    getProdsRequest(userId)
      .then((res) => setProductions(res.data))
      .catch(() => toast.error('No pudimos cargar tus producciones.'))
      .finally(() => setCargando(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const lista = Array.isArray(productions) ? [...productions].sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio)) : []
  const vendidas = lista.reduce((a, p) => a + (Number(p.totalVentas) || 0), 0)
  const recaudado = lista.reduce((a, p) => a + (Number(p.totalMontoVendido) || 0), 0)

  return (
    <Page>
      <PageHeader eyebrow="Panel del productor" title="Mis producciones" description="Gestioná tus eventos, mirá cómo se venden y compartí el link de compra."
        actions={<Button to="/create_event" icon={Icon.Plus}>Crear evento</Button>} />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Metrica label="Eventos" valor={cargando ? '—' : lista.length} icon={Icon.Calendar} />
        <Metrica label="Entradas vendidas" valor={cargando ? '—' : vendidas.toLocaleString('es-AR')} icon={Icon.Ticket} />
        <Metrica label="Recaudado" valor={cargando ? '—' : monto(recaudado)} icon={Icon.Sparkles} />
      </div>

      {cargando ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}</div>
      ) : lista.length === 0 ? (
        <Card><EmptyState icon={Icon.Ticket} title="Todavía no creaste eventos" description="Creá tu primer evento, cargá las entradas y empezá a vender en minutos."
          action={<Button to="/create_event" icon={Icon.Plus}>Crear mi primer evento</Button>} /></Card>
      ) : (
        <ul className="space-y-4">
          {lista.map((prod) => {
            const f = fechaPartes(prod.fechaInicio)
            const est = estadoEvento(prod)
            const abierto = rrppAbierto === prod._id
            const rrpp = prod.rrpp ?? []
            return (
              <li key={prod._id}>
                <Card className="overflow-hidden">
                  <div className="flex flex-col gap-5 p-4 sm:p-5 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 gap-4">
                      <SmartImage src={prod.imgEvento} className="size-20 shrink-0 rounded-xl sm:size-24" />
                      <div className="min-w-0">
                        <Badge tone={est.tone}>{est.label}</Badge>
                        <h2 className="mt-2 truncate text-lg font-semibold text-fg">{prod.nombreEvento}</h2>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                          {f && <span className="inline-flex items-center gap-1.5"><Icon.Calendar className="size-4 text-subtle" /><span className="capitalize">{f.larga}</span> · {f.hora} h</span>}
                          <span className="inline-flex items-center gap-1.5"><Icon.MapPin className="size-4 text-subtle" />{[prod.localidad, prod.provincia].filter(Boolean).join(', ')}</span>
                        </p>
                      </div>
                    </div>

                    <dl className="grid grid-cols-2 gap-4 sm:max-w-xs lg:w-64 lg:shrink-0">
                      <div><dt className="text-xs text-subtle">Vendidas</dt><dd className="text-lg font-semibold tabular-nums text-fg">{(prod.totalVentas || 0).toLocaleString('es-AR')}</dd></div>
                      <div><dt className="text-xs text-subtle">Recaudado</dt><dd className="text-lg font-semibold tabular-nums text-fg">{monto(prod.totalMontoVendido)}</dd></div>
                    </dl>

                    <div className="flex flex-wrap gap-2 lg:shrink-0 lg:justify-end">
                      <Button to={`/editar_evento/${prod._id}`} size="sm" icon={Icon.Edit}>Gestionar</Button>
                      <Button to={`/statistics/${prod._id}/${userId}`} size="sm" variant="secondary" icon={Icon.Chart}>Estadísticas</Button>
                      <Button to={`/get_buyers/${prod._id}`} size="sm" variant="secondary" icon={Icon.Users}>Compradores</Button>
                      <Button size="sm" variant="ghost" icon={Icon.Link} onClick={() => copiar(`${import.meta.env.VITE_URL_FRONT}/buy_tickets/${prod._id}`, 'Link de compra copiado')}>Copiar link</Button>
                    </div>
                  </div>

                  <button type="button" onClick={() => setRrppAbierto(abierto ? null : prod._id)} aria-expanded={abierto}
                    className="flex w-full items-center justify-between border-t border-line px-5 py-3 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg">
                    <span className="inline-flex items-center gap-2"><Icon.Users className="size-4" />RRPP <span className="text-subtle">({rrpp.length})</span></span>
                    <Icon.ChevronDown className={cx('size-4 transition-transform', abierto && 'rotate-180')} />
                  </button>

                  {abierto && (
                    <div className="border-t border-line bg-surface-2/40 p-4 sm:p-5 animate-fade-in">
                      {rrpp.length === 0 ? (
                        <p className="text-sm text-muted">Este evento todavía no tiene RRPP. Sumalos desde <span className="text-fg">Gestionar</span>.</p>
                      ) : (
                        <ul className="grid gap-3 md:grid-cols-2">
                          {rrpp.map((rp) => (
                            <li key={rp._id} className="rounded-xl border border-line bg-surface p-4">
                              <div className="flex items-center gap-3">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-sm font-semibold text-brand-200">{rp.mail?.charAt(0).toUpperCase()}</span>
                                <p className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{rp.mail}</p>
                                <span className="text-sm font-semibold tabular-nums text-fg">{monto(rp.montoTotalVendidoRRPP)}</span>
                              </div>
                              <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                <DatoRRPP label="Cortesías entregadas">{rp.freeEntregados || 0}</DatoRRPP>
                                <DatoRRPP label="Contacto">{rp.telefono || <span className="text-subtle">Sin cargar</span>}</DatoRRPP>
                                <DatoRRPP label="Alias / CBU">
                                  {rp.alias || rp.cbu
                                    ? <button type="button" onClick={() => copiar(rp.alias ?? rp.cbu, 'Alias/CBU copiado')} className="inline-flex items-center gap-1 font-medium text-brand-300 hover:text-brand-200"><Icon.Copy className="size-3.5" />Copiar</button>
                                    : <span className="text-subtle">Sin cargar</span>}
                                </DatoRRPP>
                              </dl>
                              {rp.ventasRRPP?.length > 0 && (
                                <table className="mt-4 w-full text-sm">
                                  <thead><tr className="text-left text-xs text-subtle"><th className="pb-1.5 font-medium">Entrada</th><th className="pb-1.5 text-right font-medium">Vendidas</th><th className="pb-1.5 text-right font-medium">Total</th></tr></thead>
                                  <tbody className="divide-y divide-line">
                                    {rp.ventasRRPP.map((v) => (
                                      <tr key={v.ticketId}><td className="py-1.5 text-muted">{v.nombreCategoria}</td><td className="py-1.5 text-right tabular-nums text-fg">{v.vendidos || 0}</td><td className="py-1.5 text-right tabular-nums text-fg">{monto(v.total)}</td></tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </Page>
  )
}

export default Productions
