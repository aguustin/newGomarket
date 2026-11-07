import { useContext, useMemo, useState } from "react"
import { Link } from "react-router"
import { Country, State, City } from "country-state-city"
import { createEventRequest, createEventTicketsRequest } from "../../api/eventRequests"
import UserContext from "../../context/userContext"
import { Icon } from "../../ui/icons"
import { Alert, Badge, Button, Card, Field, FormSection as Seccion, Input, Page, PageHeader, Select, Textarea, cx } from "../../ui/primitives"
import ImagePicker from "../../ui/ImagePicker"
import { toast } from "../../ui/toast"

//Crear evento (rediseño): asistente en 3 pasos (datos del evento -> entradas -> listo).
//Los datos que se envian al servidor son los mismos de antes.
const CATEGORIAS = [['musica', 'Música'], ['baile', 'Baile'], ['arte', 'Arte'], ['teatro', 'Teatro'], ['deporte', 'Deporte']]
const PASOS = ['Datos del evento', 'Entradas', 'Listo']

const Pasos = ({ actual }) => (
    <ol className="mb-8 flex items-center gap-2 sm:gap-3">
        {PASOS.map((p, i) => (
            <li key={p} className="flex items-center gap-2 sm:gap-3">
                <span className={cx('flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    i < actual ? 'bg-brand-500 text-white' : i === actual ? 'bg-brand-500/15 text-brand-200 ring-1 ring-brand-400/50' : 'bg-surface-2 text-subtle')}>
                    {i < actual ? <Icon.Check className="size-4" /> : i + 1}
                </span>
                <span className={cx('text-sm font-medium', i === actual ? 'text-fg' : 'hidden text-subtle sm:inline')}>{p}</span>
                {i < PASOS.length - 1 && <span className="h-px w-6 bg-line sm:w-10" />}
            </li>
        ))}
    </ol>
)

const CreateEventForm = () => {
    const { session } = useContext(UserContext)
    const usuario = session?.userFinded?.[0]
    const [paso, setPaso] = useState(0)
    const [startDate, setStartDate] = useState()
    const [endDate, setEndDate] = useState()
    const [estado, setEstado] = useState('1')
    const [distribution, setDistribution] = useState('0')
    const [closeDate, setCloseDate] = useState()
    const [saveEventId, setSaveEventId] = useState()
    const [esMayores, setEsMayores] = useState(false)
    const [eventoEdad, setEventoEdad] = useState('18')
    const countries = useMemo(() => Country.getAllCountries(), [])
    const [selectedCountry, setSelectedCountry] = useState(() => Country.getCountryByCode('AR'))
    const [states, setStates] = useState(() => State.getStatesOfCountry('AR'))
    const [cities, setCities] = useState([])
    const [selectedState, setSelectedState] = useState(null)
    const [selectedCity, setSelectedCity] = useState(null)
    const [imagenes, setImagenes] = useState({ portada: null, banner: null, descriptiva: null })
    const [loading, setLoading] = useState(false)
    const [categorias, setCategorias] = useState([])
    const [errores, setErrores] = useState({})
    const [errorGeneral, setErrorGeneral] = useState('')
    const [pubOrPriv, setPubOrPriv] = useState('1')
    const [ticketsCreados, setTicketsCreados] = useState([])
    const [formTicketKey, setFormTicketKey] = useState(0)
    const [previewTicket, setPreviewTicket] = useState(null)

    const elegirImagen = (clave) => (e) => {
        const file = e.target.files?.[0]
        if (file) setImagenes((prev) => ({ ...prev, [clave]: { file, url: URL.createObjectURL(file) } }))
    }

    const createEvent = async (e) => {
        e.preventDefault()
        const f = e.target.elements
        const nuevos = {}
        const ahora = new Date()
        if (!imagenes.portada) nuevos.portada = 'Subí la imagen de portada'
        if (categorias.length === 0) nuevos.categorias = 'Elegí al menos una categoría'
        if (!selectedCity) nuevos.localidad = 'Elegí la provincia y la localidad'
        if (startDate && new Date(startDate) < ahora) nuevos.inicio = 'La fecha de inicio no puede ser anterior a hoy'
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) nuevos.fin = 'La fecha de fin tiene que ser posterior al inicio'
        setErrores(nuevos)
        if (Object.keys(nuevos).length > 0) {
            toast.error('Revisá los campos marcados antes de continuar.')
            return
        }

        setLoading(true)
        setErrorGeneral('')
        const formData = new FormData()
        formData.append('userId', usuario?._id)
        formData.append('prodMail', usuario?.mail)
        formData.append('codigoPais', selectedCity.countryCode)
        formData.append('codigoCiudad', selectedCity.stateCode)
        formData.append('paisDestino', selectedCountry.name)
        formData.append('tipoEvento', f.tipoEvento.value)
        if (esMayores && eventoEdad && !isNaN(Number(eventoEdad))) formData.append('eventoEdad', eventoEdad)
        formData.append('nombreEvento', f.nombreEvento.value)
        formData.append('descripcionEvento', f.descripcionEvento.value)
        formData.append('aviso', f.aviso.value)
        formData.append('categoriasEventos', JSON.stringify(categorias))
        formData.append('artistas', f.artistas.value)
        formData.append('montoVentas', f.montoVentas.value)
        formData.append('porcentajeRRPP', f.porcentajeRRPP.value || 0)
        formData.append('fechaInicio', new Date(startDate).toISOString())
        formData.append('fechaFin', new Date(endDate).toISOString())
        formData.append('provincia', selectedState?.name)
        formData.append('localidad', selectedCity?.name)
        formData.append('tipoMoneda', selectedCountry?.currency)
        formData.append('direccion', f.direccion.value)
        formData.append('lugarEvento', f.lugarEvento.value)
        formData.append('linkVideo', f.linkVideo.value)
        formData.append('imgEvento', imagenes.portada?.file)
        if (imagenes.banner) formData.append('bannerEvento', imagenes.banner.file)
        if (imagenes.descriptiva) formData.append('imagenDescriptiva', imagenes.descriptiva.file)
        formData.append('comisionServicio', usuario?.comisionServicio ?? 15)

        try {
            const res = await createEventRequest(formData)
            if (res.data.estado === 1) {
                setSaveEventId(res.data.eventId)
                setPaso(1)
                window.scrollTo({ top: 0, behavior: 'smooth' })
            } else {
                setErrorGeneral('No pudimos crear el evento. Revisá los datos e intentá de nuevo.')
            }
        } catch (err) {
            if (!err?.avisado) setErrorGeneral(err?.response?.data?.error || 'No pudimos crear el evento. Revisá tu conexión e intentá de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    const createEventTickets = async (e) => {
        e.preventDefault()
        const f = e.target.elements
        const nuevos = {}
        if (new Date(startDate) > new Date(closeDate)) nuevos.cierre = 'El cierre de venta no puede ser anterior al inicio del evento'
        else if (new Date(endDate) < new Date(closeDate)) nuevos.cierre = 'El cierre de venta no puede ser posterior al fin del evento'
        setErrores(nuevos)
        if (nuevos.cierre) return

        setLoading(true)
        const formData = new FormData()
        formData.append('prodId', saveEventId)
        formData.append('nombreTicket', f.nombreTicket.value)
        formData.append('descripcionTicket', f.descripcionTicket.value ?? '')
        formData.append('precio', estado === '5' ? 0 : f.precio.value)  //5 = cortesia para el publico (gratis)
        formData.append('cantidad', f.cantidad.value)
        formData.append('fechaDeCierre', new Date(closeDate).toISOString())
        formData.append('imgTicket', f.imgTicket.files[0])
        formData.append('visibilidad', f.estado.value)
        formData.append('estado', estado)
        formData.append('distribution', distribution)
        formData.append('limit', f?.limit?.value)
        try {
            const res = await createEventTicketsRequest(formData)
            if (res.data.estado === 1) {
                setTicketsCreados((prev) => [...prev, { nombre: f.nombreTicket.value, precio: estado === '5' ? 0 : f.precio.value, cantidad: f.cantidad.value, tipo: estado }])
                toast.success('Entrada creada')
                setFormTicketKey((k) => k + 1)  //formulario limpio para la siguiente
                setEstado('1'); setDistribution('0'); setCloseDate(undefined); setPreviewTicket(null)
            } else {
                toast.error('No pudimos crear la entrada. Intentá de nuevo.')
            }
        } catch (err) {
            if (!err?.avisado) toast.error('No pudimos crear la entrada. Intentá de nuevo.')
        } finally {
            setLoading(false)
        }
    }

    const handleCountryChange = (country) => {
        setSelectedCountry(country)
        setStates(country ? State.getStatesOfCountry(country.isoCode) : [])
        setSelectedState(null); setSelectedCity(null); setCities([])
    }
    const handleStateChange = (state) => {
        setSelectedState(state); setSelectedCity(null)
        setCities(state ? City.getCitiesOfState(selectedCountry.isoCode, state.isoCode) : [])
    }
    const toggleCategoria = (valor) => setCategorias((prev) => prev.includes(valor) ? prev.filter((c) => c !== valor) : [...prev, valor])

    const linkEvento = `${import.meta.env.VITE_URL_FRONT}/buy_tickets/${saveEventId}`

    return (
        <Page size="medium">
            <PageHeader eyebrow="Nuevo evento" title="Crear evento" description="Completá los datos, cargá las entradas y compartí el link para empezar a vender." />
            <Pasos actual={paso} />

            {paso === 0 && (
                <Card className="p-5 sm:p-8">
                    <form onSubmit={createEvent} encType="multipart/form-data" noValidate={false}>
                        <Seccion titulo="Información básica" descripcion="Un título corto y una portada llamativa ayudan a que encuentren tu evento.">
                            <Field label="Nombre del evento">{({ id }) => <Input id={id} name="nombreEvento" placeholder="Ej: Noche Electrónica" required maxLength={80} />}</Field>
                            <div>
                                <p className="mb-1.5 text-[13px] font-medium text-muted">Categorías</p>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORIAS.map(([valor, label]) => {
                                        const activa = categorias.includes(valor)
                                        return (
                                            <button key={valor} type="button" onClick={() => toggleCategoria(valor)} aria-pressed={activa}
                                                className={cx('inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
                                                    activa ? 'border-brand-400/60 bg-brand-500/15 text-brand-200' : 'border-line bg-surface-2 text-muted hover:text-fg')}>
                                                {activa && <Icon.Check className="size-3.5" />}{label}
                                            </button>
                                        )
                                    })}
                                </div>
                                {errores.categorias && <p className="mt-1.5 text-xs text-danger">{errores.categorias}</p>}
                            </div>
                            <Field label="Descripción" optional>{({ id }) => <Textarea id={id} name="descripcionEvento" placeholder="Contá de qué se trata, quiénes tocan, qué incluye la entrada…" />}</Field>
                            <Field label="Artistas" optional>{({ id }) => <Input id={id} name="artistas" placeholder="Separalos con comas" />}</Field>
                        </Seccion>

                        <Seccion titulo="Imágenes" descripcion="La portada se ve en el listado de eventos. JPG, PNG o WebP de hasta 5 MB.">
                            <div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr]">
                                <ImagePicker label="Portada" name="imgEvento" required aspect="aspect-[11/12]" hint="550 × 600 px" preview={imagenes.portada?.url} onChange={elegirImagen('portada')} invalid={Boolean(errores.portada)} />
                                <div className="grid content-start gap-4">
                                    <ImagePicker label="Banner (opcional)" name="bannerEvento" aspect="aspect-[21/8]" hint="Se muestra arriba en la página de compra" preview={imagenes.banner?.url} onChange={elegirImagen('banner')} />
                                    <ImagePicker label="Imagen descriptiva (opcional)" name="imagenDescriptiva" aspect="aspect-[21/8]" hint="Flyer, lineup o mapa del lugar" preview={imagenes.descriptiva?.url} onChange={elegirImagen('descriptiva')} />
                                </div>
                            </div>
                            {errores.portada && <p className="text-xs text-danger">{errores.portada}</p>}
                        </Seccion>

                        <Seccion titulo="Fecha y lugar" descripcion="Dónde y cuándo es. La dirección se usa para el mapa.">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Inicio" error={errores.inicio}>{({ id, invalid }) => <Input id={id} invalid={invalid} type="datetime-local" onChange={(e) => setStartDate(e.target.value)} required />}</Field>
                                <Field label="Fin" error={errores.fin}>{({ id, invalid }) => <Input id={id} invalid={invalid} type="datetime-local" onChange={(e) => setEndDate(e.target.value)} required />}</Field>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <Field label="País">{({ id }) => (
                                    <Select id={id} name="paisDestino" value={selectedCountry?.isoCode ?? ''} required onChange={(e) => handleCountryChange(countries.find((c) => c.isoCode === e.target.value))}>
                                        <option value="">Elegir país</option>
                                        {countries.map((c) => <option key={c.isoCode} value={c.isoCode}>{c.name}</option>)}
                                    </Select>
                                )}</Field>
                                <Field label="Provincia">{({ id }) => (
                                    <Select id={id} name="provincia" value={selectedState?.isoCode ?? ''} disabled={!selectedCountry} required onChange={(e) => handleStateChange(states.find((s) => s.isoCode === e.target.value))}>
                                        <option value="">Elegir</option>
                                        {states.map((s) => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                                    </Select>
                                )}</Field>
                                <Field label="Localidad" error={errores.localidad}>{({ id, invalid }) => (
                                    <Select id={id} invalid={invalid} name="localidad" value={selectedCity?.name ?? ''} disabled={!selectedState} required onChange={(e) => setSelectedCity(cities.find((c) => c.name === e.target.value))}>
                                        <option value="">Elegir</option>
                                        {cities.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                                    </Select>
                                )}</Field>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Lugar">{({ id }) => <Input id={id} name="lugarEvento" placeholder="Ej: Club Niceto" required />}</Field>
                                <Field label="Dirección">{({ id }) => <Input id={id} name="direccion" placeholder="Calle y número" required />}</Field>
                            </div>
                        </Seccion>

                        <Seccion titulo="Venta y visibilidad" descripcion="Quién puede ver el evento y cuánto gana cada RRPP por venta.">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Visibilidad" hint={pubOrPriv === '2' ? 'Solo lo verán quienes tengan el link del evento.' : 'Aparece en el listado de eventos.'}>{({ id }) => (
                                    <Select id={id} name="tipoEvento" value={pubOrPriv} onChange={(e) => setPubOrPriv(e.target.value)}>
                                        <option value="1">Público</option>
                                        <option value="2">Privado</option>
                                    </Select>
                                )}</Field>
                                <Field label="Edad mínima">{({ id }) => (
                                    <div className="flex gap-2">
                                        <Select id={id} value={esMayores ? 'si' : 'no'} onChange={(e) => setEsMayores(e.target.value === 'si')} className="flex-1">
                                            <option value="no">Apto todo público</option>
                                            <option value="si">Con edad mínima</option>
                                        </Select>
                                        {esMayores && <Input type="number" min="1" max="99" aria-label="Edad mínima" value={eventoEdad} onChange={(e) => setEventoEdad(e.target.value)} className="w-24" />}
                                    </div>
                                )}</Field>
                                <Field label="Ventas estimadas ($)" hint="Solo para tus estadísticas.">{({ id }) => <Input id={id} type="number" min="1" name="montoVentas" placeholder="0" required />}</Field>
                                <Field label="Comisión para RRPP (%)">{({ id }) => <Input id={id} type="number" min="0" max="100" name="porcentajeRRPP" defaultValue={0} />}</Field>
                            </div>
                            <Field label="Aviso importante" optional hint="Se destaca en la página de compra (ej: no se permite el ingreso con…).">{({ id }) => <Textarea id={id} name="aviso" className="min-h-20" />}</Field>
                            <Field label="Video promocional" optional>{({ id }) => <Input id={id} name="linkVideo" type="url" placeholder="https://youtube.com/…" />}</Field>
                        </Seccion>

                        <div className="flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
                            <label className="flex items-start gap-3 text-sm text-muted">
                                <input type="checkbox" required className="mt-0.5 size-4 shrink-0 accent-brand-500" />
                                <span>Acepto los <Link to="/conditions" className="text-brand-300 underline-offset-2 hover:underline">términos y condiciones</Link> para publicar eventos.</span>
                            </label>
                            <Button type="submit" size="lg" loading={loading} iconRight={Icon.ArrowRight} className="sm:shrink-0">Crear evento y seguir</Button>
                        </div>
                        {errorGeneral && <Alert tone="danger" className="mt-4">{errorGeneral}</Alert>}
                    </form>
                </Card>
            )}

            {paso === 1 && (
                <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
                    <Card className="p-5 sm:p-8">
                        <h2 className="text-lg font-semibold text-fg">Agregá una entrada</h2>
                        <p className="mt-1 text-sm text-muted">Creá al menos una. Podés sumar más (General, VIP, anticipadas…) y editarlas después.</p>
                        <form key={formTicketKey} onSubmit={createEventTickets} encType="multipart/form-data" className="mt-6 grid gap-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Nombre">{({ id }) => <Input id={id} name="nombreTicket" placeholder="Ej: General" required />}</Field>
                                <Field label="Descripción" optional>{({ id }) => <Input id={id} name="descripcionTicket" placeholder="Ej: Ingreso hasta las 2 AM" />}</Field>
                                {estado === '5'
                                    ? <p className="self-end pb-2 text-sm text-muted">Gratis. Cualquiera la pide desde la página del evento, hasta el máximo por email.</p>
                                    : <Field label="Precio ($)" hint="0 = gratis">{({ id }) => <Input id={id} type="number" min="0" name="precio" placeholder="0" required />}</Field>}
                                <Field label="Cantidad disponible">{({ id }) => <Input id={id} type="number" min="1" name="cantidad" placeholder="100" required />}</Field>
                                <Field label="Cierre de la venta" error={errores.cierre}>{({ id, invalid }) => <Input id={id} invalid={invalid} type="datetime-local" onChange={(e) => setCloseDate(e.target.value)} required />}</Field>
                                <Field label="Tipo">{({ id }) => (
                                    <Select id={id} name="estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
                                        <option value="1">Activa (a la venta)</option>
                                        <option value="2">No visible</option>
                                        <option value="3">Cortesía</option>
                                        <option value="5">Cortesía para el público</option>
                                    </Select>
                                )}</Field>
                                {estado === '3' && (
                                    <Field label="Cortesía para">{({ id }) => (
                                        <Select id={id} name="distribution" value={distribution} onChange={(e) => setDistribution(e.target.value)}>
                                            <option value="0" disabled>Elegir</option>
                                            <option value="1">RRPP</option>
                                            <option value="2">Clientes</option>
                                        </Select>
                                    )}</Field>
                                )}
                                {estado === '5' && (
                                    <Field label="Máximo por email">{({ id }) => <Input id={id} type="number" min="1" name="limit" placeholder="Ej: 2" required />}</Field>
                                )}
                                {estado === '3' && distribution === '2' && (
                                    <Field label="Límite por persona">{({ id }) => <Input id={id} type="number" min="1" name="limit" placeholder="Ej: 3" required />}</Field>
                                )}
                            </div>
                            <div className="max-w-xs">
                                <ImagePicker label="Imagen de la entrada (opcional)" name="imgTicket" aspect="aspect-[3/1]" preview={previewTicket}
                                    onChange={(e) => { const file = e.target.files?.[0]; if (file) setPreviewTicket(URL.createObjectURL(file)) }} />
                            </div>
                            <div className="flex justify-end border-t border-line pt-5">
                                <Button type="submit" loading={loading} icon={Icon.Plus}>{ticketsCreados.length ? 'Agregar otra entrada' : 'Agregar entrada'}</Button>
                            </div>
                        </form>
                    </Card>

                    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                        <Card className="p-5">
                            <h3 className="text-sm font-semibold text-fg">Entradas del evento</h3>
                            {ticketsCreados.length === 0 ? (
                                <p className="mt-2 text-sm text-subtle">Todavía no agregaste ninguna.</p>
                            ) : (
                                <ul className="mt-3 divide-y divide-line">
                                    {ticketsCreados.map((t, i) => (
                                        <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                                            <span className="truncate text-fg">{t.nombre}</span>
                                            <span className="shrink-0 text-muted">{t.tipo === '3' || t.tipo === '5' ? <Badge tone="brand">Cortesía</Badge> : Number(t.precio) === 0 ? 'Gratis' : `$${Number(t.precio).toLocaleString('es-AR')}`} · {t.cantidad}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card>
                        <Button block size="lg" disabled={ticketsCreados.length === 0} onClick={() => { setPaso(2); window.scrollTo({ top: 0, behavior: 'smooth' }) }} iconRight={Icon.ArrowRight}>Terminar</Button>
                    </aside>
                </div>
            )}

            {paso === 2 && (
                <Card className="mx-auto max-w-lg p-8 text-center animate-fade-up">
                    <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-ok/12 text-ok ring-8 ring-ok/10"><Icon.CheckCircle className="size-8" /></div>
                    <h2 className="mt-6 text-2xl font-bold tracking-tight text-fg">¡Tu evento está listo!</h2>
                    <p className="mt-2 text-[15px] text-muted">Compartí este link para empezar a vender. También lo encontrás en Mis producciones.</p>
                    <div className="mt-6 flex items-center gap-2 rounded-xl border border-line bg-surface-2 p-1.5 pl-3.5">
                        <span className="min-w-0 flex-1 truncate text-left text-sm text-muted">{linkEvento}</span>
                        <Button size="sm" variant="secondary" icon={Icon.Copy} onClick={async () => { try { await navigator.clipboard.writeText(linkEvento); toast.success('Link copiado') } catch { toast.error('No pudimos copiar el link') } }}>Copiar</Button>
                    </div>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Button to={`/editar_evento/${saveEventId}`} variant="secondary">Seguir editando</Button>
                        <Button to="/productions">Ir a mis producciones</Button>
                    </div>
                </Card>
            )}
        </Page>
    )
}

export default CreateEventForm
