import { Link } from 'react-router'
import { Icon } from './icons'
import { Badge, cx } from './primitives'
import SmartImage from './SmartImage'

//Formatos de fecha/precio compartidos por las pantallas del comprador
const fmtDia = new Intl.DateTimeFormat('es-AR', { weekday: 'short', day: '2-digit', month: 'short' })
const fmtHora = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const fmtPrecio = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

export const fechaPartes = (iso) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return {
    dia: d.toLocaleDateString('es-AR', { day: '2-digit' }),
    mes: d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', ''),
    larga: fmtDia.format(d).replace(/\./g, ''),
    hora: fmtHora.format(d)
  }
}
export const precio = (n) => fmtPrecio.format(Number(n) || 0)

//Precio mas bajo entre las entradas a la venta (las de precio 0 cuentan como gratis)
export const precioDesde = (tickets = []) => {
  //Mismo criterio que la pagina de compra: se muestran las entradas con estado distinto de 2
  const precios = tickets.filter((t) => t && t.estado !== 2).map((t) => Number(t.precio)).filter((p) => !Number.isNaN(p))
  if (precios.length === 0) return null
  const min = Math.min(...precios)
  return min === 0 ? 'Gratis' : `Desde ${precio(min)}`
}

export const lugarDe = (ev) => [ev?.lugarEvento, ev?.localidad || ev?.provincia].filter(Boolean).join(' · ')

//Estado de un evento para el productor (insignia en Mis producciones y Editar evento)
export const estadoEvento = (ev) => {
  if (ev.cancelado) return { label: 'Cancelado', tone: 'danger' }
  if (ev.fechaFin && new Date(ev.fechaFin) < new Date()) return { label: 'Finalizado', tone: 'neutral' }
  if (ev.active === false) return { label: 'Pausado', tone: 'warn' }
  if (ev.soldOut) return { label: 'Agotado', tone: 'warn' }
  return { label: 'En venta', tone: 'ok' }
}

const EventCard = ({ evento, favorito, onToggleFavorito, puedeGuardar = true, style }) => {
  const f = fechaPartes(evento.fechaInicio)
  const desde = precioDesde(evento.tickets)
  const categoria = evento.categoriasEventos?.[0]
  const mayores = Number(evento.eventoEdad) >= 18

  return (
    <article style={style}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-glow animate-fade-up">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        <SmartImage src={evento.imgEvento} alt=""
          className="size-full transition-transform duration-500 ease-out group-hover:scale-[1.04]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

        {f && (
          <div className="absolute left-3 top-3 flex min-w-12 flex-col items-center rounded-xl border border-white/15 bg-black/50 px-2.5 py-1.5 leading-none text-white backdrop-blur-md">
            <span className="text-lg font-bold">{f.dia}</span>
            <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-white/80">{f.mes}</span>
          </div>
        )}

        {puedeGuardar && onToggleFavorito && (
          <button type="button" onClick={() => onToggleFavorito(evento._id)}
            aria-label={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'} aria-pressed={favorito}
            className={cx('absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-200 active:scale-90',
              favorito ? 'border-brand-400/40 bg-brand-500/85 text-white' : 'border-white/15 bg-black/45 text-white/90 hover:bg-black/65')}>
            {favorito ? <Icon.HeartFilled className="size-[18px]" /> : <Icon.Heart className="size-[18px]" />}
          </button>
        )}

        {mayores && <Badge tone="glass" className="absolute bottom-3 left-3">+18</Badge>}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="line-clamp-2 text-[17px] font-semibold leading-snug tracking-tight text-fg">
          {/* El link cubre toda la tarjeta (el boton de favoritos queda por encima) */}
          <Link to={`/buy_tickets/${evento._id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {evento.nombreEvento}
          </Link>
        </h3>
        <div className="mt-2 space-y-1 text-sm text-muted">
          {f && <p className="flex items-center gap-2"><Icon.Calendar className="size-4 shrink-0 text-subtle" /><span className="capitalize">{f.larga}</span><span className="text-subtle">·</span>{f.hora} h</p>}
          {lugarDe(evento) && <p className="flex items-center gap-2"><Icon.MapPin className="size-4 shrink-0 text-subtle" /><span className="truncate">{lugarDe(evento)}</span></p>}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className={cx('text-[15px] font-semibold', desde === 'Gratis' ? 'text-ok' : 'text-fg')}>{desde ?? 'Próximamente'}</span>
          {categoria && <Badge tone="brand" className="capitalize">{categoria.toLowerCase()}</Badge>}
        </div>
      </div>
    </article>
  )
}

export default EventCard
