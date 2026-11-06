import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router"
import { Chart, registerables } from 'chart.js'
import { getOneProdRequest } from "../../api/eventRequests"
import { EventoNoDisponible } from "../../globalscomp/globalscomp"
import { Icon } from "../../ui/icons"
import { Button, Card, EmptyState, Page, Skeleton, cx } from "../../ui/primitives"
import { fechaPartes } from "../../ui/EventCard"

Chart.register(...registerables)
Chart.defaults.font.family = "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif"

//Estadisticas (rediseño). Antes un solo grafico mezclaba cantidades y montos en el mismo eje y los
//"tickets de cortesia" se graficaban con textos como valores. Ahora: indicadores, un grafico de barras de
//UNA medida a la vez (vendidas o recaudado) y tablas con el detalle.
const pesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
const monto = (n) => pesos.format(Number(n) || 0)
const num = (n) => (Number(n) || 0).toLocaleString('es-AR')
const COLOR = '#7663F7'  //brand-500, validado contra el fondo oscuro

const Kpi = ({ label, valor, detalle, children }) => (
  <Card className="p-5">
    <p className="text-sm text-muted">{label}</p>
    <p className="mt-2 text-[1.75rem] font-bold leading-none tabular-nums tracking-tight text-fg">{valor}</p>
    {detalle && <p className="mt-2 text-xs text-subtle">{detalle}</p>}
    {children}
  </Card>
)

const Tabla = ({ titulo, descripcion, columnas, filas, vacio }) => (
  <Card className="overflow-hidden">
    <div className="border-b border-line px-5 py-4">
      <h2 className="font-semibold text-fg">{titulo}</h2>
      {descripcion && <p className="mt-0.5 text-sm text-muted">{descripcion}</p>}
    </div>
    {filas.length === 0 ? <p className="px-5 py-6 text-sm text-subtle">{vacio}</p> : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-subtle">
              {columnas.map((c) => <th key={c.label} className={cx('whitespace-nowrap px-5 py-2.5 font-medium', c.num && 'text-right')}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filas.map((f, i) => (
              <tr key={i} className="transition-colors hover:bg-surface-2/60">
                {columnas.map((c) => <td key={c.label} className={cx('whitespace-nowrap px-5 py-3', c.num ? 'text-right tabular-nums text-fg' : 'text-muted')}>{c.render(f)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </Card>
)

const Statistics = () => {
  const { prodId, userId } = useParams()
  const [evento, setEvento] = useState(null)
  const [noDisponible, setNoDisponible] = useState(false)
  const [medida, setMedida] = useState('vendidas')  // vendidas | recaudado
  const canvasRef = useRef(null)
  const chartRef = useRef(null)

  useEffect(() => {
    getOneProdRequest(prodId, userId)
      .then((res) => {
        const ev = res.data.tickets?.[0]
        if (!ev) return setNoDisponible(true) //no existe o no es de este usuario
        setEvento(ev)
      })
      .catch((err) => { if ([403, 404].includes(err?.response?.status)) setNoDisponible(true) })
  }, [prodId, userId])

  const entradas = (evento?.tickets ?? []).map((t) => ({
    nombre: t.nombreTicket, precio: Number(t.precio) || 0, vendidas: Number(t.ventas) || 0,
    disponibles: Number(t.cantidad) || 0, recaudado: (Number(t.ventas) || 0) * (Number(t.precio) || 0)
  }))

  useEffect(() => {
    if (!canvasRef.current || entradas.length === 0) return
    chartRef.current?.destroy()
    const esMonto = medida === 'recaudado'
    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: entradas.map((e) => e.nombre),
        datasets: [{
          label: esMonto ? 'Recaudado' : 'Entradas vendidas',
          data: entradas.map((e) => esMonto ? e.recaudado : e.vendidas),
          backgroundColor: COLOR, hoverBackgroundColor: '#9384FF',
          borderRadius: { topLeft: 4, topRight: 4 }, borderSkipped: 'bottom', maxBarThickness: 48, categoryPercentage: 0.7
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 400 },
        plugins: {
          legend: { display: false },  //una sola serie: el titulo la nombra
          tooltip: {
            backgroundColor: '#181823', borderColor: '#26263A', borderWidth: 1, padding: 12, cornerRadius: 10,
            titleColor: '#F3F3F8', bodyColor: '#A3A3B8', displayColors: false,
            callbacks: { label: (ctx) => esMonto ? monto(ctx.parsed.y) : `${num(ctx.parsed.y)} vendidas` }
          }
        },
        scales: {
          x: { grid: { display: false }, border: { color: '#26263A' }, ticks: { color: '#A3A3B8' } },
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false },
            ticks: { color: '#72728A', precision: 0, callback: (v) => esMonto ? monto(v) : num(v) } }
        }
      }
    })
    return () => chartRef.current?.destroy()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evento, medida])

  if (noDisponible) return <EventoNoDisponible />
  if (!evento) {
    return <Page><Skeleton className="h-10 w-72" /><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div><Skeleton className="mt-6 h-80 rounded-2xl" /></Page>
  }

  const f = fechaPartes(evento.fechaInicio)
  const objetivo = Number(evento.montoVentas) || 0
  const recaudado = Number(evento.totalMontoVendido) || 0
  const avance = objetivo > 0 ? Math.min(100, Math.round((recaudado / objetivo) * 100)) : null
  const rrpp = (evento.rrpp ?? []).map((r) => ({
    mail: r.mail, vendidas: (r.ventasRRPP ?? []).reduce((a, v) => a + (Number(v.vendidos) || 0), 0),
    recaudado: Number(r.montoTotalVendidoRRPP) || 0, cortesias: Number(r.freeEntregados) || 0
  })).sort((a, b) => b.recaudado - a.recaudado)
  const cortesias = (evento.rrpp ?? []).flatMap((r) => (r.ticketsCortesias ?? []).flatMap((tc) => (tc.cortesiaRRPP ?? []).map((c) => ({
    rrpp: r.mail, nombre: c.nombreTicket, cantidad: Number(c.cantidadCortesias) || 0, entregadas: Number(c.entregados) || 0
  }))))

  return (
    <Page>
      <Button to="/productions" variant="ghost" size="sm" icon={Icon.ArrowLeft} className="-ml-3 mb-4">Mis producciones</Button>
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-300">Estadísticas</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-fg sm:text-3xl">{evento.nombreEvento}</h1>
        {f && <p className="mt-1 text-sm text-muted"><span className="capitalize">{f.larga}</span> · {f.hora} h · {[evento.localidad, evento.provincia].filter(Boolean).join(', ')}</p>}
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Entradas vendidas" valor={num(evento.totalVentas)} detalle="Compras confirmadas" />
        <Kpi label="Recaudado" valor={monto(recaudado)} detalle="Valor de las entradas vendidas" />
        <Kpi label="Objetivo de ventas" valor={avance === null ? '—' : `${avance}%`} detalle={objetivo > 0 ? `de ${monto(objetivo)}` : 'Sin objetivo cargado'}>
          {avance !== null && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={avance} aria-label="Avance del objetivo">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${avance}%` }} />
            </div>
          )}
        </Kpi>
        <Kpi label="Devoluciones" valor={num(evento.totalDevoluciones)} detalle="Entradas reembolsadas" />
      </div>

      <Card className="mt-6 p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-fg">{medida === 'recaudado' ? 'Recaudado por tipo de entrada' : 'Entradas vendidas por tipo'}</h2>
            <p className="text-sm text-muted">Pasá el mouse sobre una barra para ver el valor.</p>
          </div>
          <div role="radiogroup" aria-label="Medida" className="inline-flex rounded-xl border border-line bg-surface-2 p-1">
            {[['vendidas', 'Vendidas'], ['recaudado', 'Recaudado']].map(([v, l]) => (
              <button key={v} type="button" role="radio" aria-checked={medida === v} onClick={() => setMedida(v)}
                className={cx('rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors', medida === v ? 'bg-surface-3 text-fg' : 'text-muted hover:text-fg')}>{l}</button>
            ))}
          </div>
        </div>
        {entradas.length === 0
          ? <EmptyState icon={Icon.Chart} title="Sin entradas todavía" description="Cuando cargues entradas y se vendan, vas a ver el gráfico acá." />
          : <div className="h-72 sm:h-80"><canvas ref={canvasRef} role="img" aria-label="Gráfico de barras por tipo de entrada; el detalle está en la tabla de abajo" /></div>}
      </Card>

      <div className="mt-6 grid gap-6">
        <Tabla titulo="Detalle por entrada" filas={entradas} vacio="Este evento no tiene entradas."
          columnas={[
            { label: 'Entrada', render: (e) => <span className="font-medium text-fg">{e.nombre}</span> },
            { label: 'Precio', num: true, render: (e) => e.precio === 0 ? 'Gratis' : monto(e.precio) },
            { label: 'Vendidas', num: true, render: (e) => num(e.vendidas) },
            { label: 'Disponibles', num: true, render: (e) => num(e.disponibles) },
            { label: 'Recaudado', num: true, render: (e) => monto(e.recaudado) }
          ]} />
        <div className="grid gap-6 lg:grid-cols-2">
          <Tabla titulo="Ventas por RRPP" descripcion="Ordenado por monto vendido." filas={rrpp} vacio="Ningún RRPP vendió todavía."
            columnas={[
              { label: 'RRPP', render: (r) => <span className="text-fg">{r.mail}</span> },
              { label: 'Vendidas', num: true, render: (r) => num(r.vendidas) },
              { label: 'Recaudado', num: true, render: (r) => monto(r.recaudado) },
              { label: 'Cortesías', num: true, render: (r) => num(r.cortesias) }
            ]} />
          <Tabla titulo="Cortesías de RRPP" filas={cortesias} vacio="No hay cortesías asignadas a RRPP."
            columnas={[
              { label: 'Cortesía', render: (c) => <span className="text-fg">{c.nombre}</span> },
              { label: 'RRPP', render: (c) => c.rrpp },
              { label: 'Asignadas', num: true, render: (c) => num(c.cantidad) },
              { label: 'Entregadas', num: true, render: (c) => num(c.entregadas) }
            ]} />
        </div>
      </div>
    </Page>
  )
}

export default Statistics
