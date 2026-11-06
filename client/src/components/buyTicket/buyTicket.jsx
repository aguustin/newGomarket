import { useContext, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { buyTicketsRequest, findDiscountCodeRequest, getEventToBuyRequest, getRelateEventsRequest } from "../../api/eventRequests"
import { formatDateB, MapComponent } from "../../globalscomp/globalscomp"
import UserContext from "../../context/userContext"
import { Icon } from "../../ui/icons"
import { Badge, Button, Card, Field, Input, Select, Skeleton, cx } from "../../ui/primitives"
import SmartImage from "../../ui/SmartImage"
import { fechaPartes, lugarDe } from "../../ui/EventCard"
import { toast } from "../../ui/toast"

//La venta de un ticket cierra al pasar su fecha de cierre, al terminar el evento o si el evento esta inactivo.
//Se calcula en el momento (no depende del cron, que corre una vez por semana)
const ventaCerrada = (event, ticket, now = new Date()) =>
    event?.active === false ||
    (event?.fechaFin && new Date(event.fechaFin) < now) ||
    (ticket?.fechaDeCierre && new Date(ticket.fechaDeCierre) < now)

const currencyFormatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })
const TIEMPO_COMPRA_MS = 12 * 60 * 1000

const MENSAJES = {
    1: 'Elegí al menos una entrada para continuar.',
    2: 'Completá todos tus datos para recibir las entradas.',
    3: 'Los emails no coinciden. Revisalos antes de seguir.',
    4: 'La venta de alguna de las entradas que elegiste ya cerró. La quitamos de tu compra.'
}

//Cuenta regresiva del tiempo para completar la compra. Al terminar vuelve a la portada
const useCuentaRegresiva = (ms, alTerminar) => {
    const [restante, setRestante] = useState(ms)
    useEffect(() => {
        const fin = Date.now() + ms
        const id = setInterval(() => {
            const r = Math.max(0, fin - Date.now())
            setRestante(r)
            if (r === 0) { clearInterval(id); alTerminar() }
        }, 1000)
        return () => clearInterval(id)
    }, [])
    const s = Math.ceil(restante / 1000)
    return { texto: `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`, poco: s <= 120 }
}

const Aviso = ({ tono = 'warn', children }) => (
    <div role="alert" className={cx('flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm',
        tono === 'ok' ? 'border-ok/25 bg-ok/10 text-ok' : tono === 'danger' ? 'border-danger/25 bg-danger/10 text-danger' : 'border-warn/25 bg-warn/10 text-warn')}>
        {tono === 'ok' ? <Icon.CheckCircle className="mt-0.5 size-[18px] shrink-0" /> : <Icon.AlertCircle className="mt-0.5 size-[18px] shrink-0" />}
        <p className="leading-relaxed">{children}</p>
    </div>
)

const Stepper = ({ cantidad, onRestar, onSumar, nombre, maximoAlcanzado }) => (
    <div className="flex items-center gap-1 rounded-xl border border-line bg-surface-2 p-1">
        <button type="button" onClick={onRestar} disabled={cantidad === 0} aria-label={`Restar una entrada ${nombre}`}
            className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-3 hover:text-fg disabled:opacity-30">
            <Icon.Minus className="size-4" />
        </button>
        <span className="w-7 text-center text-[15px] font-semibold tabular-nums text-fg" aria-live="polite">{cantidad}</span>
        <button type="button" onClick={onSumar} disabled={maximoAlcanzado} aria-label={`Sumar una entrada ${nombre}`}
            className="flex size-8 items-center justify-center rounded-lg bg-brand-500 text-white transition-colors hover:bg-brand-400 disabled:bg-surface-3 disabled:text-subtle">
            <Icon.Plus className="size-4" />
        </button>
    </div>
)

const BuyTicket = () => {
    const { session } = useContext(UserContext)
    const { prodId, emailHash } = useParams()
    const [prod, setProd] = useState([])
    const [cargando, setCargando] = useState(true)
    const [quantities, setQuantities] = useState({})
    const [discountCode, setDiscountValueCode] = useState('')
    const [appliedDiscount, setAppliedDiscount] = useState(null)  //{ code, pct } validado contra el evento
    const [verificandoCodigo, setVerificandoCodigo] = useState(false)
    const [codigoMsg, setCodigoMsg] = useState('')
    const [serverMsg, setServerMsg] = useState('')
    const [reloadKey, setReloadKey] = useState(0)
    const [showMsg, setShowMsg] = useState(0)
    const [loading, setLoading] = useState(false)
    const [showMap, setShowMap] = useState(false)
    const [relates, setRelates] = useState([])
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [showBanner, setShowBanner] = useState(false)
    const navigate = useNavigate()

    const tiempo = useCuentaRegresiva(TIEMPO_COMPRA_MS, () => {
        toast.info('Se terminó el tiempo para completar la compra. Podés empezar de nuevo cuando quieras.')
        navigate('/')
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resEvent = await getEventToBuyRequest(prodId)
                setProd(resEvent.data)
                if (!resEvent.data[0]?.active) navigate('/')
                const resRelated = await getRelateEventsRequest(prodId)
                setRelates(resRelated.data.relacionados)
            } catch (error) {
                console.error('Error al obtener eventos:', error)
            } finally {
                setCargando(false)
            }
        }
        fetchData()
    }, [session, prodId, navigate, reloadKey])

    useEffect(() => {
        if (!showBanner) return
        const onKey = (e) => e.key === 'Escape' && setShowBanner(false)
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [showBanner])

    const restQuantity = (ticketId) => {
        setQuantities((prev) => {
            const current = prev[ticketId]
            if (!current) return prev
            const newAmount = current.amount - 1
            if (newAmount <= 0) {
                const updated = { ...prev }
                delete updated[ticketId]
                return updated
            }
            return { ...prev, [ticketId]: { ...current, amount: newAmount } }
        })
        setShowMsg(0)
    }

    const addQuantity = (ticketId, limit, cantidad, free) => {
        setQuantities((prev) => {
            const currentObj = prev[ticketId] || { amount: 0, free: false }
            const maxLimit = limit !== undefined ? limit : 30
            if (currentObj.amount < maxLimit && currentObj.amount < cantidad) {
                return { ...prev, [ticketId]: { amount: currentObj.amount + 1, free: free || currentObj.free } }
            }
            return prev
        })
        setShowMsg(0)
    }

    //Mismo calculo que el servidor (server/lib/pricing.js) sobre el evento que se esta viendo.
    //Es solo para mostrar: el servidor recalcula y, si no coincide, rechaza la compra y devuelve el total correcto
    const redondear = (n) => Math.round(n * 100) / 100
    const eventToRender = selectedEvent || prod[0]
    const comision = eventToRender?.comisionServicio ?? 15 // 15% si no existe (igual que el backend)
    const subtotal = (eventToRender?.tickets ?? []).reduce((acc, tck) => acc + (quantities[tck._id]?.amount || 0) * tck.precio, 0)
    const descuentoPct = appliedDiscount?.pct ?? 0
    const total = redondear(subtotal * (1 + comision / 100) * (1 - descuentoPct / 100))
    const cargoServicio = redondear(subtotal * comision / 100)
    const montoDescuento = redondear((subtotal + cargoServicio) * descuentoPct / 100)
    const cantidadElegida = Object.values(quantities).reduce((a, q) => a + (q?.amount || 0), 0)

    const activeDiscountCode = async () => {
        setCodigoMsg('')
        const code = String(discountCode || '').trim()
        if (code.length === 0) return
        setVerificandoCodigo(true)
        try {
            const res = await findDiscountCodeRequest({ discountCode: code, prodId: eventToRender?._id })
            if (res.data.discount) {
                setAppliedDiscount({ code, pct: Number(res.data.discount.numeroDescuento) || 0 })
                return
            }
            setAppliedDiscount(null)
            setCodigoMsg('El código de descuento no es válido para este evento o ya no tiene usos')
        } catch {
            setCodigoMsg('No pudimos verificar el código de descuento. Intentá de nuevo')
        } finally {
            setVerificandoCodigo(false)
        }
    }

    const buyTickets = async (e) => {
        e.preventDefault()
        setServerMsg('')
        const f = e.target.elements
        const mail = f.mail.value.trim()
        const repetirMail = f.repetirMail.value.trim()
        const nombreCompleto = f.nombreCompleto.value.trim()
        const dni = f.dni.value.trim()
        const telefono = f.telefono.value.trim()

        if (!Object.values(quantities).some((v) => parseInt(v?.amount) > 0)) return setShowMsg(1)
        if (!mail || !repetirMail || !nombreCompleto || !dni || !telefono) return setShowMsg(2)
        if (mail !== repetirMail) return setShowMsg(3)

        //Por si la venta cerro mientras la pagina estaba abierta: se quitan esos tickets y se avisa
        const cerrados = Object.keys(quantities).filter((ticketId) => {
            const ticket = eventToRender?.tickets.find((t) => t._id === ticketId)
            return !ticket || ventaCerrada(eventToRender, ticket)
        })
        if (cerrados.length > 0) {
            setQuantities((prev) => Object.fromEntries(Object.entries(prev).filter(([id]) => !cerrados.includes(id))))
            return setShowMsg(4)
        }
        setShowMsg(0)

        try {
            setLoading(true)
            //Se compra el evento que se esta viendo (puede ser otra fecha relacionada). El total es el que se muestra
            const data = await buyTicketsRequest(eventToRender._id, eventToRender.nombreEvento, quantities, mail, 1, total, emailHash, nombreCompleto, dni, telefono, appliedDiscount?.code ?? null)
            setLoading(false)
            if (data === 3) {  //entradas gratis: el servidor las emitio sin pasar por Mercado Pago
                setQuantities({})
                setShowMsg(5)
                toast.success('¡Listo! Te enviamos las entradas por email.')
                return
            }
            if (!data?.init_point) return setServerMsg('No pudimos iniciar el pago. Intentá de nuevo')
            window.location.href = data.init_point
        } catch (error) {
            setLoading(false)
            const body = error?.response?.data
            setServerMsg(body?.error || 'No pudimos iniciar el pago. Intentá de nuevo')
            //Cambiaron precios, disponibilidad o el descuento: se recargan los datos del evento
            if (['TOTAL_DISTINTO', 'SIN_STOCK', 'AGOTADO', 'VENTA_CERRADA', 'TICKET_NO_DISPONIBLE'].includes(body?.code)) setReloadKey((k) => k + 1)
            if (body?.code === 'DESCUENTO_INVALIDO') setAppliedDiscount(null)
        }
    }

    const handleEventChange = (eventId) => {
        //Al cambiar de fecha se empieza de cero: las entradas y el descuento son de cada evento
        setQuantities({})
        setAppliedDiscount(null)
        setServerMsg('')
        setSelectedEvent(eventId === '' ? null : relates.find((rel) => rel._id === eventId))
    }

    const copiarEnlace = async () => {
        try {
            if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
                await navigator.share({ title: p?.nombreEvento, url: window.location.href })
                return
            }
            await navigator.clipboard.writeText(window.location.href)
            toast.success('Enlace copiado. ¡Compartilo con quien quieras!')
        } catch { /* el usuario cancelo el menu de compartir */ }
    }

    const p = prod[0]

    if (cargando) {
        return (
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
                <Skeleton className="aspect-[21/9] w-full rounded-3xl" />
                <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px]">
                    <div className="space-y-4"><Skeleton className="h-9 w-2/3" /><Skeleton className="h-5 w-1/2" /><Skeleton className="h-24 w-full" /></div>
                    <Skeleton className="h-96 w-full rounded-2xl" />
                </div>
            </main>
        )
    }
    if (!p) {
        return (
            <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
                <h1 className="text-xl font-semibold text-fg">No encontramos este evento</h1>
                <p className="mt-2 text-muted">Puede que ya no esté a la venta.</p>
                <Button to="/" variant="secondary" className="mt-6" icon={Icon.ArrowLeft}>Ver otros eventos</Button>
            </main>
        )
    }

    const f = fechaPartes(p.fechaInicio)
    const fFin = fechaPartes(p.fechaFin)
    const portada = p.bannerEvento || p.imgEvento
    const tickets = (eventToRender?.tickets ?? []).filter((tck) => tck.estado !== 2)
    const mensaje = showMsg ? MENSAJES[showMsg] : null

    return (
        <main className="flex-1 pb-28 lg:pb-20">
            {/* Portada */}
            <div className="mx-auto max-w-7xl px-0 sm:px-6 sm:pt-6 lg:px-8">
                <button type="button" onClick={() => setShowBanner(true)} aria-label="Ver imagen completa"
                    className="group relative block w-full overflow-hidden sm:rounded-3xl">
                    <SmartImage src={portada} eager className="aspect-[16/10] w-full sm:aspect-[21/8]" imgClassName="transition-transform duration-700 group-hover:scale-[1.02]" />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-canvas via-canvas/20 to-transparent" />
                </button>
            </div>

            <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-12 lg:px-8">
                {/* Informacion del evento */}
                <section className="relative -mt-16 min-w-0 sm:-mt-20">
                    <div className="flex flex-wrap gap-2">
                        {p.categoriasEventos?.slice(0, 3).map((c) => <Badge key={c} tone="brand" className="capitalize">{c.toLowerCase()}</Badge>)}
                        {Number(p.eventoEdad) >= 18 && <Badge tone="neutral">+18</Badge>}
                    </div>
                    <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-fg sm:text-4xl lg:text-[2.75rem]">{p.nombreEvento}</h1>

                    <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                        {f && (
                            <div className="flex gap-3">
                                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-brand-300"><Icon.Calendar /></span>
                                <div>
                                    <dt className="text-sm font-semibold capitalize text-fg">{f.larga}</dt>
                                    <dd className="text-sm text-muted">{f.hora} h{fFin && fFin.larga !== f.larga ? ` · hasta el ${fFin.larga}` : fFin && fFin.hora !== f.hora ? ` a ${fFin.hora} h` : ''}</dd>
                                </div>
                            </div>
                        )}
                        <div className="flex gap-3">
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-brand-300"><Icon.MapPin /></span>
                            <div className="min-w-0">
                                <dt className="truncate text-sm font-semibold text-fg">{p.lugarEvento || p.localidad || p.provincia}</dt>
                                <dd className="truncate text-sm text-muted">{[p.direccion, p.localidad, p.provincia].filter(Boolean).join(', ')}</dd>
                            </div>
                        </div>
                    </dl>

                    <div className="mt-6 flex flex-wrap gap-2">
                        <Button variant="secondary" size="sm" icon={Icon.MapPin} onClick={() => setShowMap((v) => !v)} aria-expanded={showMap}>{showMap ? 'Ocultar mapa' : 'Ver mapa'}</Button>
                        <Button variant="secondary" size="sm" icon={Icon.Share} onClick={copiarEnlace}>Copiar enlace</Button>
                    </div>
                    {showMap && <Card className="mt-4 overflow-hidden p-0 animate-fade-in"><MapComponent provincia={p.provincia} direccion={p.direccion} /></Card>}

                    {p?.aviso?.length > 0 && <div className="mt-8"><Aviso tono="warn">{p.aviso}</Aviso></div>}

                    {(p.descripcionEvento || p.artistas) && (
                        <div className="mt-10">
                            <h2 className="text-lg font-semibold text-fg">Sobre el evento</h2>
                            {p.descripcionEvento && <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-muted">{p.descripcionEvento}</p>}
                            {p.artistas && (
                                <p className="mt-4 text-[15px] text-muted"><span className="font-medium text-fg">Artistas: </span>{p.artistas}</p>
                            )}
                        </div>
                    )}

                    {p.imagenDescriptiva && p.imagenDescriptiva !== p.imgEvento && (
                        <SmartImage src={p.imagenDescriptiva} className="mt-8 aspect-[4/3] w-full max-w-xl rounded-2xl border border-line" />
                    )}

                    <p className="mt-10 flex items-start gap-2.5 text-sm leading-relaxed text-subtle">
                        <Icon.Shield className="mt-0.5 size-[18px] shrink-0" />
                        Si el evento no se realiza o no cumple con algún aspecto fundamental, Ipass te devuelve el valor de las entradas. El cargo por servicio no es reembolsable.
                    </p>
                </section>

                {/* Checkout */}
                <aside className="lg:sticky lg:top-24 lg:self-start">
                    <Card className="p-5 sm:p-6">
                        <form id="checkout" onSubmit={buyTickets} noValidate>
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-lg font-semibold text-fg">Entradas</h2>
                                <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums', tiempo.poco ? 'bg-warn/12 text-warn' : 'bg-surface-2 text-muted')} title="Tiempo para completar la compra">
                                    <Icon.Clock className="size-3.5" />{tiempo.texto}
                                </span>
                            </div>

                            {relates.length > 0 && (
                                <div className="mt-4 flex items-center gap-2">
                                    <Select name="otrasFechas" aria-label="Elegir otra fecha" className="flex-1" value={selectedEvent?._id ?? ''} onChange={(e) => handleEventChange(e.target.value)}>
                                        <option value="">{formatDateB(p.fechaInicio)} (esta fecha)</option>
                                        {relates.map((rel) => <option key={rel._id} value={rel._id}>{formatDateB(rel.fechaInicio)} · {rel.nombreEvento}</option>)}
                                    </Select>
                                    {selectedEvent && <Button to={`/buy_tickets/${selectedEvent._id}`} variant="ghost" size="sm">Ver</Button>}
                                </div>
                            )}

                            <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
                                {tickets.length === 0 && <li className="p-4 text-sm text-muted">Todavía no hay entradas a la venta.</li>}
                                {tickets.map((tck) => {
                                    const cerrada = ventaCerrada(eventToRender, tck)
                                    const disponible = tck.cantidad > 0 && tck.estado !== 4 && !eventToRender?.soldOut
                                    const cantidad = quantities[tck._id]?.amount || 0
                                    const max = Math.min(tck.limit !== undefined ? tck.limit : 30, tck.cantidad)
                                    return (
                                        <li key={tck._id} className={cx('flex items-center gap-3 p-4 transition-colors', cantidad > 0 && 'bg-brand-500/[0.06]')}>
                                            {tck.imgTicket && <img src={tck.imgTicket} alt="" className="size-11 shrink-0 rounded-lg object-cover" loading="lazy" />}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-medium text-fg">{tck.nombreTicket}</p>
                                                <p className="text-sm font-semibold text-fg/90">{Number(tck.precio) === 0 ? 'Gratis' : currencyFormatter.format(tck.precio)}</p>
                                                {tck.descripcionTicket && <p className="mt-0.5 line-clamp-2 text-xs text-subtle">{tck.descripcionTicket}</p>}
                                                {!cerrada && disponible && tck.fechaDeCierre && <p className="mt-0.5 text-xs text-subtle">Venta hasta {formatDateB(tck.fechaDeCierre)}</p>}
                                            </div>
                                            {cerrada ? <Badge tone="neutral">Venta cerrada</Badge>
                                                : disponible ? <Stepper nombre={tck.nombreTicket} cantidad={cantidad} maximoAlcanzado={cantidad >= max}
                                                    onRestar={() => restQuantity(tck._id)} onSumar={() => addQuantity(tck._id, tck.limit, tck.cantidad)} />
                                                    : <Badge tone="danger">Agotado</Badge>}
                                        </li>
                                    )
                                })}
                            </ul>

                            <h2 className="mt-7 text-lg font-semibold text-fg">Tus datos</h2>
                            <p className="mt-1 text-sm text-muted">Te enviamos las entradas a este email.</p>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                                <Field label="Nombre completo" className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                                    {({ id }) => <Input id={id} name="nombreCompleto" autoComplete="name" placeholder="Como figura en tu DNI" />}
                                </Field>
                                <Field label="Email">{({ id }) => <Input id={id} type="email" name="mail" autoComplete="email" inputMode="email" placeholder="tu@email.com" />}</Field>
                                <Field label="Repetir email">{({ id }) => <Input id={id} type="email" name="repetirMail" autoComplete="email" inputMode="email" placeholder="tu@email.com" />}</Field>
                                <Field label="DNI">{({ id }) => <Input id={id} type="text" name="dni" inputMode="numeric" pattern="[0-9]*" placeholder="Sin puntos" />}</Field>
                                <Field label="Teléfono">{({ id }) => <Input id={id} type="tel" name="telefono" autoComplete="tel" inputMode="tel" placeholder="11 1234 5678" />}</Field>
                            </div>

                            {/* Codigo de descuento */}
                            <div className="mt-6">
                                {appliedDiscount ? (
                                    <div className="flex items-center justify-between gap-3 rounded-xl border border-ok/25 bg-ok/10 px-3.5 py-2.5">
                                        <p className="flex items-center gap-2 text-sm font-medium text-ok"><Icon.Tag className="size-4" />Descuento aplicado: {appliedDiscount.pct}%</p>
                                        <button type="button" className="text-xs font-medium text-muted underline-offset-2 hover:text-fg hover:underline"
                                            onClick={() => { setAppliedDiscount(null); setDiscountValueCode('') }}>Quitar</button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <Input icon={Icon.Tag} name="codigoDescuento" aria-label="Código de descuento" placeholder="Código de descuento" className="flex-1"
                                            value={discountCode} onChange={(e) => { setDiscountValueCode(e.target.value); setAppliedDiscount(null); setCodigoMsg('') }}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); activeDiscountCode() } }} />
                                        <Button variant="secondary" onClick={activeDiscountCode} loading={verificandoCodigo} disabled={!String(discountCode).trim()} aria-label="Aplicar descuento">Aplicar</Button>
                                    </div>
                                )}
                                {codigoMsg && <p className="mt-2 text-sm text-danger">{codigoMsg}</p>}
                            </div>

                            {/* Resumen */}
                            <dl className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
                                <div className="flex justify-between text-muted"><dt>Subtotal{cantidadElegida > 0 && ` · ${cantidadElegida} ${cantidadElegida === 1 ? 'entrada' : 'entradas'}`}</dt><dd className="tabular-nums">{currencyFormatter.format(subtotal)}</dd></div>
                                <div className="flex justify-between text-muted"><dt>Cargo por servicio ({comision}%)</dt><dd className="tabular-nums">{currencyFormatter.format(cargoServicio)}</dd></div>
                                {descuentoPct > 0 && <div className="flex justify-between text-ok"><dt>Descuento ({descuentoPct}%)</dt><dd className="tabular-nums">−{currencyFormatter.format(montoDescuento)}</dd></div>}
                                <div className="flex items-baseline justify-between pt-2">
                                    <dt className="text-base font-semibold text-fg">Total</dt>
                                    <dd data-testid="total" className="text-2xl font-bold tabular-nums tracking-tight text-fg">{currencyFormatter.format(total)}</dd>
                                </div>
                            </dl>

                            <div className="mt-5 space-y-3">
                                {mensaje && <Aviso>{mensaje}</Aviso>}
                                {serverMsg && <Aviso tono="danger">{serverMsg}</Aviso>}
                                {showMsg === 5 && <Aviso tono="ok">¡Listo! Te enviamos las entradas por email</Aviso>}
                            </div>

                            <div className="mt-5 hidden lg:block">
                                <Button type="submit" size="lg" block loading={loading} iconRight={total > 0 ? Icon.ArrowRight : undefined}>
                                    {total > 0 ? 'Continuar al pago' : 'Obtener entradas'}
                                </Button>
                                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-subtle"><Icon.Lock className="size-3.5" />Pago seguro con Mercado Pago</p>
                            </div>
                        </form>
                    </Card>
                </aside>
            </div>

            {/* Barra de pago fija en celular */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/90 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur-xl lg:hidden">
                <div className="mx-auto flex max-w-xl items-center gap-4">
                    <div className="min-w-0">
                        <p className="text-xs text-muted">{cantidadElegida > 0 ? `${cantidadElegida} ${cantidadElegida === 1 ? 'entrada' : 'entradas'}` : 'Total'}</p>
                        <p className="text-lg font-bold tabular-nums text-fg">{currencyFormatter.format(total)}</p>
                    </div>
                    <Button type="submit" form="checkout" size="lg" className="flex-1" loading={loading}>
                        {total > 0 ? 'Continuar al pago' : 'Obtener entradas'}
                    </Button>
                </div>
            </div>

            {/* Imagen completa */}
            {showBanner && (
                <div role="dialog" aria-modal="true" aria-label="Imagen del evento" onClick={() => setShowBanner(false)}
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-fade-in">
                    <img src={portada} alt={p.nombreEvento} className="max-h-[88vh] max-w-full rounded-2xl object-contain" />
                    <button type="button" aria-label="Cerrar" className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
                        <Icon.X className="size-5" />
                    </button>
                </div>
            )}
        </main>
    )
}

export default BuyTicket
