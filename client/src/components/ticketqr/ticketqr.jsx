import { Link, useParams } from "react-router"
import { useState, useEffect } from "react"
import { formatDateB } from "../../globalscomp/globalscomp"
import { getEntradaRequest, validarEntradaRequest } from "../../api/eventRequests"
import { Icon } from "../../ui/icons"
import { Button, Card, Spinner, cx } from "../../ui/primitives"
import SmartImage from "../../ui/SmartImage"

//Pantalla que se abre al escanear el QR de una entrada (rediseño, pensada para el celular en la puerta).
//Abrirla SOLO muestra la entrada. El ingreso lo valida el organizador o un RRPP del evento con su sesion
//(boton "Validar ingreso"); el backend lo marca de forma atomica y nunca dos veces.
const ESTADOS = {
  vigente: { texto: 'Entrada válida', icon: Icon.CheckCircle, clase: 'bg-ok/15 text-ok ring-ok/30' },
  usada: { texto: 'Entrada ya usada', icon: Icon.XCircle, clase: 'bg-danger/15 text-danger ring-danger/30' },
  vencida: { texto: 'Entrada vencida', icon: Icon.Clock, clase: 'bg-white/8 text-muted ring-line' },
  anulada: { texto: 'Entrada anulada: el evento fue cancelado', icon: Icon.XCircle, clase: 'bg-danger/15 text-danger ring-danger/30' }
}

const Dato = ({ label, children }) => (
  <div className="flex items-start justify-between gap-4 py-3">
    <dt className="text-sm text-muted">{label}</dt>
    <dd className="text-right text-[15px] font-medium text-fg">{children}</dd>
  </div>
)

const TicketQr = () => {
  const { token } = useParams()
  const [ticketInfo, setTicketInfo] = useState(null)
  const [error, setError] = useState(false)
  const [validando, setValidando] = useState(false)
  const [resultado, setResultado] = useState(null)  //{ ok, texto }

  useEffect(() => {
    getEntradaRequest(token).then((res) => setTicketInfo(res.data)).catch(() => setError(true))
  }, [token])

  const validar = async () => {
    setValidando(true)
    try {
      const res = await validarEntradaRequest(token)
      setTicketInfo((prev) => ({ ...prev, ...res.data, puedeValidar: true }))
      setResultado({ ok: true, texto: 'Ingreso validado' })
    } catch (err) {
      const body = err?.response?.data
      if (body?.estado) setTicketInfo((prev) => ({ ...prev, ...body, puedeValidar: true }))
      setResultado({ ok: false, texto: body?.error || 'No se pudo validar la entrada. Intentá de nuevo' })
    } finally {
      setValidando(false)
    }
  }

  if (error) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-danger/12 text-danger ring-8 ring-danger/10"><Icon.AlertCircle className="size-8" /></div>
        <h1 className="mt-6 text-xl font-semibold text-fg">La entrada no existe</h1>
        <p className="mt-2 text-muted">Revisá que el QR sea el que llegó por email.</p>
      </main>
    )
  }
  if (!ticketInfo) return <main className="flex flex-1 items-center justify-center gap-3 py-24 text-muted"><Spinner className="size-6 text-brand-400" />Cargando entrada…</main>

  const estado = ESTADOS[ticketInfo.estado] ?? ESTADOS.vencida
  const Ico = resultado?.ok ? Icon.CheckCircle : estado.icon

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 pb-16 pt-6">
      <div className={cx('flex items-center gap-3 rounded-2xl px-5 py-4 ring-1 animate-fade-up', resultado?.ok ? ESTADOS.vigente.clase : estado.clase)} role="status">
        <Ico className="size-8 shrink-0" />
        <div>
          <p className="text-lg font-bold leading-tight">{resultado?.ok ? 'Ingreso validado' : estado.texto}</p>
          {ticketInfo.estado === 'usada' && ticketInfo.usadaEn && <p className="mt-0.5 text-sm opacity-90">Validada el {formatDateB(ticketInfo.usadaEn)}</p>}
        </div>
      </div>

      <Card className="mt-4 overflow-hidden">
        <SmartImage src={ticketInfo.imgEvento} className="aspect-[16/9] w-full" />
        <div className="p-5">
          <h1 className="text-xl font-bold tracking-tight text-fg">{ticketInfo.nombreEvento}</h1>
          <dl className="mt-2 divide-y divide-line">
            <Dato label="Entrada">{ticketInfo.nombreTicket}{ticketInfo.tipo ? ` · ${ticketInfo.tipo}` : ''}</Dato>
            {ticketInfo.nombreCompleto && <Dato label="A nombre de">{ticketInfo.nombreCompleto}</Dato>}
            {ticketInfo.eventoEdad ? <Dato label="Edad mínima">+{ticketInfo.eventoEdad}</Dato> : null}
            <Dato label="Fecha">{formatDateB(ticketInfo.fechaInicioEvento)}</Dato>
            <Dato label="Lugar">{[ticketInfo.direccion, ticketInfo.localidad].filter(Boolean).join(', ')}</Dato>
          </dl>
        </div>
      </Card>

      {ticketInfo.puedeValidar && ticketInfo.estado === 'vigente' && !resultado?.ok && (
        <Button size="lg" block loading={validando} onClick={validar} className="mt-5 h-16 text-lg" icon={Icon.Check}>Validar ingreso</Button>
      )}
      {resultado && !resultado.ok && <p role="alert" className="mt-4 text-center text-base font-semibold text-warn">{resultado.texto}</p>}
      {!ticketInfo.puedeValidar && ticketInfo.estado === 'vigente' && (
        <p className="mt-6 text-center text-sm leading-relaxed text-muted">
          Presentá este QR en el acceso. ¿Sos el organizador?{' '}
          <Link to={`/login?next=${encodeURIComponent(`/ticket/validate/${token}`)}`} className="font-semibold text-brand-300 underline-offset-2 hover:underline">Iniciá sesión</Link> para validar entradas.
        </p>
      )}
    </main>
  )
}

export default TicketQr
