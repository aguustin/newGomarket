import { useContext, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import UserContext from "../../context/userContext"
import { getAllEventsRequest } from "../../api/eventRequests"
import { getFavoritesEventsRequest, saveEventRequest } from "../../api/userRequests"
//Solo provincias y ciudades de Argentina (la libreria completa pesa ~8 MB y frenaba la carga de la portada).
//Generado desde country-state-city: si hace falta actualizarlo, regenerar src/data/argentina.json
import ARGENTINA from "../../data/argentina.json"
import { Icon } from "../../ui/icons"
import { Button, EmptyState, Input, Select, Skeleton, cx } from "../../ui/primitives"
import EventCard from "../../ui/EventCard"
import { toast } from "../../ui/toast"

//Portada (rediseño): busqueda + filtros arriba, categorias como chips y grilla de eventos.
//La logica de filtrado y favoritos es la misma de antes.
const CATEGORIAS = [
  { valor: '', label: 'Todos', icon: Icon.Sparkles },
  { valor: 'musica', label: 'Música', icon: Icon.Music },
  { valor: 'baile', label: 'Baile', icon: Icon.Disc },
  { valor: 'arte', label: 'Arte', icon: Icon.Palette },
  { valor: 'teatro', label: 'Teatro', icon: Icon.Masks },
  { valor: 'deporte', label: 'Deporte', icon: Icon.Trophy }
]

const Chip = ({ activo, icon: Ico, children, ...props }) => (
  <button type="button" aria-pressed={activo}
    className={cx('inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-all duration-200 active:scale-95',
      activo ? 'border-brand-400/60 bg-brand-500/15 text-brand-200' : 'border-line bg-surface text-muted hover:border-line-strong hover:text-fg')}
    {...props}>
    {Ico && <Ico className="size-4" />}{children}
  </button>
)

const Home = () => {
    const { session } = useContext(UserContext)
    const navigate = useNavigate()
    const usuario = session?.userFinded?.[0]
    const [allEvents, setAllEvents] = useState([])
    const [search, setSearch] = useState('')
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('')
    const [edad, setEdad] = useState(0)
    const [favoriteEventIds, setFavoriteEventIds] = useState(() => {
        const s = JSON.parse(localStorage.getItem("session"))
        return (s?.userFinded?.[0]?.favorites || []).map((fav) => fav?.eventId)
    })
    const [favoritesFilter, setFavoritesFilter] = useState(null)
    const [provinciaSeleccionada, setProvinciaSeleccionada] = useState("")
    const [localidadSeleccionada, setLocalidadSeleccionada] = useState("")
    const [fechaInicioFiltro, setFechaInicioFiltro] = useState("")
    const [fechaFinFiltro, setFechaFinFiltro] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)

    useEffect(() => {
        const cargar = async () => {
            setIsLoading(true)
            try {
                const res = await getAllEventsRequest()
                setAllEvents(Array.isArray(res.data) ? res.data : [])
            } catch {
                toast.error('No pudimos cargar los eventos. Revisá tu conexión e intentá de nuevo.')
            } finally {
                setIsLoading(false)
            }
        }
        cargar()
        setFavoriteEventIds((session?.userFinded?.[0]?.favorites || []).map((f) => f.eventId))
    }, [])

    const localidades = useMemo(
        () => provinciaSeleccionada ? (ARGENTINA.find((p) => p.isoCode === provinciaSeleccionada)?.ciudades ?? []) : [],
        [provinciaSeleccionada]
    )

    const saveEvent = async (eventId) => {
        const s = JSON.parse(localStorage.getItem("session"))
        const user = s?.userFinded?.[0]
        if (!user) {
            toast.info('Ingresá a tu cuenta para guardar eventos en favoritos.')
            navigate('/login?next=/')
            return
        }
        const yaEsFavorito = favoriteEventIds.includes(eventId)
        const updatedFavorites = yaEsFavorito
            ? user.favorites.filter((f) => f?.eventId !== eventId)
            : [...user.favorites, { eventId, _id: Math.random().toString(36).substring(2, 15) }]

        localStorage.setItem("session", JSON.stringify({ ...s, userFinded: [{ ...user, favorites: updatedFavorites }] }))
        setFavoriteEventIds(updatedFavorites.map((f) => f?.eventId))
        if (yaEsFavorito && favoritesFilter) setFavoritesFilter((prev) => prev?.filter((ev) => ev._id !== eventId) ?? null)

        try {
            await saveEventRequest({ userId: user._id, eventId })
        } catch {
            toast.error('No pudimos actualizar tus favoritos. Intentá de nuevo.')
        }
    }

    const toggleFavoritos = async () => {
        if (favoritesFilter) return setFavoritesFilter(null)
        setCategoriaSeleccionada('')
        try {
            const res = await getFavoritesEventsRequest(usuario?._id)
            setFavoritesFilter(res.data.favorites ?? [])
        } catch {
            toast.error('No pudimos cargar tus favoritos.')
        }
    }

    const clearFilters = () => {
        setSearch('')
        setCategoriaSeleccionada('')
        setEdad(0)
        setProvinciaSeleccionada('')
        setLocalidadSeleccionada('')
        setFechaInicioFiltro('')
        setFechaFinFiltro('')
        setFavoritesFilter(null)
    }

    const eventsToRender = favoritesFilter || allEvents
    const filteredEvents = eventsToRender.filter((allEv) => {
        const searchLower = search.toLowerCase().trim()
        const matchesSearch = searchLower === '' || allEv.nombreEvento.toLowerCase().includes(searchLower)
        const matchesType = allEv.tipoEvento === 1
        const matchesCategory = categoriaSeleccionada === '' ||
            allEv.categoriasEventos.some((cat) => cat.toLowerCase().trim() === categoriaSeleccionada.toLowerCase().trim())
        const eventoEdad = parseInt(allEv.eventoEdad)
        const hasEdad = !isNaN(eventoEdad)
        const matchesEdad = edad === 0 ? true : !hasEdad ? true : edad === 1 ? eventoEdad < 18 : edad === 2 ? eventoEdad >= 18 : true
        const matchesProvincia = provinciaSeleccionada === '' ||
            allEv.provincia?.toLowerCase() === ARGENTINA.find((p) => p.isoCode === provinciaSeleccionada)?.name.toLowerCase()
        const matchesLocalidad = localidadSeleccionada === '' || allEv.localidad?.toLowerCase() === localidadSeleccionada.toLowerCase()
        const fechaEvento = allEv.fechaInicio?.slice(0, 10)
        const matchesFechaRango = (!fechaInicioFiltro || !fechaFinFiltro) || (fechaEvento >= fechaInicioFiltro && fechaEvento <= fechaFinFiltro)
        return matchesSearch && matchesType && matchesCategory && matchesEdad && matchesProvincia && matchesLocalidad && matchesFechaRango
    })

    const filtrosDeLugarYFecha = [provinciaSeleccionada, localidadSeleccionada, fechaInicioFiltro || fechaFinFiltro].filter(Boolean).length
    const hayFiltros = Boolean(search || categoriaSeleccionada || edad || filtrosDeLugarYFecha || favoritesFilter)

    return (
        <main className="flex-1">
            {/* Encabezado con busqueda */}
            <section className="relative overflow-hidden border-b border-line/60">
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgb(118_99_247/0.22),transparent_70%)]" />
                <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[48rem] -translate-x-1/2 rounded-full bg-brand-500/10 blur-3xl" />
                <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 sm:pb-10 sm:pt-16 lg:px-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-300">Entradas online</p>
                    <h1 className="mt-3 max-w-2xl text-[2rem] font-bold leading-[1.1] tracking-tight text-fg sm:text-5xl">
                        Descubrí tu próximo evento
                    </h1>
                    <p className="mt-3 max-w-xl text-[15px] text-muted sm:text-base">Fiestas, recitales, teatro y más. Comprá en minutos y recibí tu QR por email.</p>

                    <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="relative flex-1">
                            <Input size="lg" icon={Icon.Search} name="searchEvent" placeholder="Buscá por nombre del evento"
                                value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar evento"
                                inputClassName="bg-surface/80 backdrop-blur pr-11" />
                            {search && (
                                <button type="button" onClick={() => setSearch('')} aria-label="Borrar búsqueda"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-subtle transition-colors hover:text-fg">
                                    <Icon.X className="size-4" />
                                </button>
                            )}
                        </div>
                        <Button variant="secondary" size="lg" icon={Icon.Sliders} className="lg:hidden" onClick={() => setFiltrosAbiertos((v) => !v)} aria-expanded={filtrosAbiertos}>
                            Filtros{filtrosDeLugarYFecha > 0 && <span className="ml-1 rounded-full bg-brand-500 px-2 py-0.5 text-xs text-white">{filtrosDeLugarYFecha}</span>}
                        </Button>
                        <div className={cx('gap-3 sm:grid-cols-2 lg:flex lg:w-auto lg:items-center', filtrosAbiertos ? 'grid animate-fade-in' : 'hidden lg:flex')}>
                            <Select icon={Icon.MapPin} aria-label="Provincia" value={provinciaSeleccionada} className="lg:w-52"
                                onChange={(e) => { setProvinciaSeleccionada(e.target.value); setLocalidadSeleccionada('') }}>
                                <option value="">Toda Argentina</option>
                                {ARGENTINA.map((prov) => <option key={prov.isoCode} value={prov.isoCode}>{prov.name}</option>)}
                            </Select>
                            <Select aria-label="Localidad" value={localidadSeleccionada} disabled={!provinciaSeleccionada} className="lg:w-44"
                                onChange={(e) => setLocalidadSeleccionada(e.target.value)}>
                                <option value="">{provinciaSeleccionada ? 'Todas las localidades' : 'Localidad'}</option>
                                {localidades.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
                            </Select>
                            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:col-span-2 lg:flex lg:col-span-1">
                                <Input type="date" aria-label="Desde" title="Desde" value={fechaInicioFiltro} onChange={(e) => setFechaInicioFiltro(e.target.value)} className="min-w-0 flex-1 lg:w-40" inputClassName="min-w-0" />
                                <span className="text-subtle">–</span>
                                <Input type="date" aria-label="Hasta" title="Hasta" value={fechaFinFiltro} min={fechaInicioFiltro || undefined} onChange={(e) => setFechaFinFiltro(e.target.value)} className="min-w-0 flex-1 lg:w-40" inputClassName="min-w-0" />
                            </div>
                        </div>
                    </div>
                    {(fechaInicioFiltro && !fechaFinFiltro) || (!fechaInicioFiltro && fechaFinFiltro) ? (
                        <p className="mt-2 text-xs text-subtle">Elegí las dos fechas para filtrar por rango.</p>
                    ) : null}
                </div>
            </section>

            <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
                {/* Categorias */}
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 py-5 scrollbar-hide sm:mx-0 sm:flex-wrap sm:px-0">
                    {CATEGORIAS.map(({ valor, label, icon }) => (
                        <Chip key={label} icon={icon} activo={!favoritesFilter && categoriaSeleccionada === valor}
                            onClick={() => { setCategoriaSeleccionada(valor); setFavoritesFilter(null) }}>{label}</Chip>
                    ))}
                    <span aria-hidden="true" className="mx-1 my-2 w-px shrink-0 bg-line" />
                    {usuario && <Chip icon={Icon.Heart} activo={Boolean(favoritesFilter)} onClick={toggleFavoritos}>Favoritos</Chip>}
                    <Chip activo={edad === 2} onClick={() => { setEdad(edad === 2 ? 0 : 2); setFavoritesFilter(null) }}>+18</Chip>
                    <Chip activo={edad === 1} onClick={() => { setEdad(edad === 1 ? 0 : 1); setFavoritesFilter(null) }}>Menores de 18</Chip>
                </div>

                {/* Resultados */}
                <div className="mb-5 flex items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-fg">
                        {favoritesFilter ? 'Tus favoritos' : 'Próximos eventos'}
                        {!isLoading && <span className="ml-2 text-sm font-normal text-subtle">{filteredEvents.length}</span>}
                    </h2>
                    {hayFiltros && <Button variant="ghost" size="sm" icon={Icon.X} onClick={clearFilters}>Limpiar filtros</Button>}
                </div>

                {isLoading ? (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="overflow-hidden rounded-2xl border border-line bg-surface">
                                <Skeleton className="aspect-[4/3] rounded-none" />
                                <div className="space-y-3 p-5"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-2/3" /></div>
                            </div>
                        ))}
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <EmptyState
                        icon={favoritesFilter ? Icon.Heart : Icon.Search}
                        title={favoritesFilter ? 'Todavía no guardaste eventos' : 'No encontramos eventos'}
                        description={favoritesFilter ? 'Tocá el corazón de un evento para encontrarlo rápido acá.' : hayFiltros ? 'Probá con otra búsqueda o quitá algunos filtros.' : 'Pronto vas a ver acá los próximos eventos.'}
                        action={hayFiltros && <Button variant="secondary" onClick={clearFilters}>Limpiar filtros</Button>}
                    />
                ) : (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredEvents.map((ev, i) => (
                            <EventCard key={ev._id} evento={ev} favorito={favoriteEventIds.includes(ev._id)}
                                onToggleFavorito={saveEvent} style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }} />
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}

export default Home
