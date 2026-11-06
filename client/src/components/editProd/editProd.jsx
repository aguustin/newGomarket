import { useCallback, useContext, useEffect, useState } from "react"
import { useParams } from "react-router"
import { City } from "country-state-city"
import { getOneProdRequest, getProdsRequest } from "../../api/eventRequests"
import UserContext from "../../context/userContext"
import { EventoNoDisponible } from "../../globalscomp/globalscomp"
import { Icon } from "../../ui/icons"
import { Badge, Button, Page, Skeleton, cx } from "../../ui/primitives"
import SmartImage from "../../ui/SmartImage"
import { estadoEvento, fechaPartes } from "../../ui/EventCard"
import { toast } from "../../ui/toast"
import InfoTab from "./InfoTab"
import TicketsTab from "./TicketsTab"
import DiscountsTab from "./DiscountsTab"
import TeamTab from "./TeamTab"
import SettingsTab from "./SettingsTab"

//Editar evento (rediseño). Antes era un solo componente de 2.400 lineas; ahora cada seccion es una pestaña
//en su propio archivo. Las llamadas al servidor son las mismas.
const PESTANAS = [
  { id: 'info', label: 'Información', icon: Icon.Edit },
  { id: 'entradas', label: 'Entradas', icon: Icon.Ticket },
  { id: 'descuentos', label: 'Descuentos', icon: Icon.Tag },
  { id: 'equipo', label: 'Equipo y cortesías', icon: Icon.Users },
  { id: 'ajustes', label: 'Ajustes', icon: Icon.Settings }
]

const EditProd = () => {
  const { session } = useContext(UserContext)
  const userId = session?.userFinded?.[0]?._id
  const { prodId } = useParams()
  const [evento, setEvento] = useState(null)
  const [discounts, setDiscounts] = useState([])
  const [othersProds, setOthersProds] = useState([])
  const [cities, setCities] = useState([])
  const [noDisponible, setNoDisponible] = useState(false)
  const [tab, setTab] = useState('info')

  //Recarga los datos del evento (despues de cada cambio, en vez de recargar la pagina)
  const cargar = useCallback(async () => {
    if (!userId) return //esperar a que cargue la sesion
    try {
      const res = await getOneProdRequest(prodId, userId)
      const ev = res.data.tickets?.[0]
      if (!ev) { setNoDisponible(true); return } //no existe o no es de este usuario
      setNoDisponible(false)
      setEvento(ev)
      setDiscounts(res.data.prodDiscount ?? [])
      //Antes se calculaba con res.data[0] (que no existe) y la lista de localidades quedaba vacia
      setCities(ev.codigoPais && ev.codigoCiudad ? City.getCitiesOfState(ev.codigoPais, ev.codigoCiudad) : [])
      const otros = await getProdsRequest(userId)
      setOthersProds(otros.data ?? [])
    } catch {
      toast.error('No pudimos cargar el evento. Revisá tu conexión.')
    }
  }, [prodId, userId])

  useEffect(() => { cargar() }, [cargar])

  if (noDisponible) return <EventoNoDisponible />
  if (!evento) {
    return (
      <Page>
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="mt-6 h-11 w-full max-w-xl" />
        <Skeleton className="mt-6 h-96 w-full rounded-2xl" />
      </Page>
    )
  }

  const f = fechaPartes(evento.fechaInicio)
  const est = estadoEvento(evento)
  const link = `${import.meta.env.VITE_URL_FRONT}/buy_tickets/${evento._id}`
  const props = { evento, onChanged: cargar }

  return (
    <Page>
      <Button to="/productions" variant="ghost" size="sm" icon={Icon.ArrowLeft} className="-ml-3 mb-4">Mis producciones</Button>

      <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <SmartImage src={evento.imgEvento} className="size-20 shrink-0 rounded-2xl border border-line sm:size-24" />
        <div className="min-w-0 flex-1">
          <Badge tone={est.tone}>{est.label}</Badge>
          <h1 className="mt-2 truncate text-2xl font-bold tracking-tight text-fg sm:text-3xl">{evento.nombreEvento}</h1>
          {f && <p className="mt-1 text-sm text-muted"><span className="capitalize">{f.larga}</span> · {f.hora} h · {[evento.lugarEvento, evento.localidad].filter(Boolean).join(', ')}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={Icon.Copy} onClick={async () => { try { await navigator.clipboard.writeText(link); toast.success('Link de compra copiado') } catch { toast.error('No pudimos copiar el link') } }}>Copiar link</Button>
          <Button href={link} target="_blank" rel="noreferrer" variant="secondary" size="sm" iconRight={Icon.ArrowRight}>Ver página</Button>
        </div>
      </header>

      <div role="tablist" aria-label="Secciones del evento" className="-mx-4 mt-8 flex gap-1 overflow-x-auto border-b border-line px-4 scrollbar-hide sm:mx-0 sm:px-0">
        {PESTANAS.map(({ id, label, icon: Ico }) => (
          <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => setTab(id)}
            className={cx('relative inline-flex shrink-0 items-center gap-2 px-3.5 py-3 text-sm font-medium transition-colors',
              tab === id ? 'text-fg' : 'text-muted hover:text-fg')}>
            <Ico className="size-4" />{label}
            {tab === id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-400" />}
          </button>
        ))}
      </div>

      <div className="mt-8" role="tabpanel">
        {tab === 'info' && <InfoTab {...props} cities={cities} />}
        {tab === 'entradas' && <TicketsTab {...props} />}
        {tab === 'descuentos' && <DiscountsTab {...props} discounts={discounts} />}
        {tab === 'equipo' && <TeamTab {...props} />}
        {tab === 'ajustes' && <SettingsTab {...props} othersProds={othersProds} />}
      </div>
    </Page>
  )
}

export default EditProd
