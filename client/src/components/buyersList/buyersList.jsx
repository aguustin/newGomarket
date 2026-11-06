import { useContext, useEffect, useState } from "react"
import { useParams } from "react-router"
import UserContext from "../../context/userContext"
import { descargarCompradoresRequest, entregasPendientesRequest, getBuyersRequest, reenviarEntradasRequest } from "../../api/eventRequests"
import { EventoNoDisponible, formatDateB } from "../../globalscomp/globalscomp"
import { Icon } from "../../ui/icons"
import { Alert, Button, Card, EmptyState, Input, Page, PageHeader, Skeleton } from "../../ui/primitives"
import { toast } from "../../ui/toast"

//Compradores de un evento (rediseño): buscador, tabla, descarga en Excel y reenvio de entradas que no salieron.
const BuyersList = () => {
  const { session } = useContext(UserContext)
  const userId = session?.userFinded?.[0]?._id
  const { prodId } = useParams()
  const [buyers, setBuyers] = useState(null)
  const [noDisponible, setNoDisponible] = useState(false)
  const [pendientes, setPendientes] = useState([])
  const [reenviando, setReenviando] = useState(null)
  const [descargando, setDescargando] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  const cargarPendientes = () => entregasPendientesRequest(prodId)
    .then((res) => setPendientes(res.data?.pendientes ?? []))
    .catch(() => setPendientes([]))

  useEffect(() => {
    if (!userId) return //esperar la sesion
    getBuyersRequest(prodId)
      .then((res) => { setBuyers(res.data ?? []); cargarPendientes() })
      .catch((err) => {
        if ([400, 403, 404].includes(err?.response?.status)) setNoDisponible(true)
        else { setBuyers([]); toast.error('No pudimos cargar los compradores.') }
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, prodId])

  //Solo se reenvia a compras cuyo mail nunca salio (no se puede cambiar el mail del comprador)
  const reenviar = async (paymentId) => {
    setReenviando(paymentId)
    try {
      await reenviarEntradasRequest(prodId, paymentId)
      toast.success('Entradas enviadas')
    } catch (err) {
      toast.error(err?.response?.data?.error || 'No se pudo reenviar. Intentá de nuevo más tarde')
    } finally {
      setReenviando(null)
      cargarPendientes()
    }
  }

  const descargar = async () => {
    setDescargando(true)
    try { await descargarCompradoresRequest({ prodId }) } catch { toast.error('No pudimos descargar el Excel.') } finally { setDescargando(false) }
  }

  if (noDisponible) return <EventoNoDisponible />

  const q = busqueda.trim().toLowerCase()
  const filtrados = (buyers ?? []).filter((b) => !q || [b.nombreCompleto, b.email, String(b.dni ?? '')].some((v) => String(v ?? '').toLowerCase().includes(q)))

  return (
    <Page>
      <Button to={`/editar_evento/${prodId}`} variant="ghost" size="sm" icon={Icon.ArrowLeft} className="-ml-3 mb-4">Volver al evento</Button>
      <PageHeader eyebrow="Compradores" title="Quiénes compraron" description="Datos de contacto de cada compra confirmada."
        actions={<Button variant="secondary" icon={Icon.Download} loading={descargando} onClick={descargar} disabled={!buyers?.length}>Descargar Excel</Button>} />

      {pendientes.length > 0 && (
        <Card className="mb-6 border-warn/30 p-5">
          <Alert tone="warn">
            <strong className="font-semibold">Entradas sin enviar ({pendientes.length}).</strong> El mail con las entradas de estas compras no se pudo enviar. Podés reenviarlo al mail que cargó el comprador.
          </Alert>
          <ul className="mt-3 divide-y divide-line">
            {pendientes.map((p) => (
              <li key={p.paymentId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="text-sm text-fg">{p.nombre || 'Sin nombre'} <span className="text-muted">· {p.email}</span></span>
                <Button size="sm" loading={reenviando === p.paymentId} onClick={() => reenviar(p.paymentId)} icon={Icon.Mail}>Reenviar entradas</Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm text-muted">{buyers ? `${filtrados.length} de ${buyers.length} compradores` : 'Cargando…'}</p>
          <Input icon={Icon.Search} placeholder="Buscar por nombre, email o DNI" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="sm:w-80" aria-label="Buscar comprador" />
        </div>
        {buyers === null ? (
          <div className="space-y-3 p-5">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : buyers.length === 0 ? (
          <EmptyState icon={Icon.Users} title="Todavía no hay compradores" description="Acá vas a ver a cada persona que compre entradas de este evento." />
        ) : filtrados.length === 0 ? (
          <EmptyState title="Sin resultados" description="Probá con otro nombre, email o DNI." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-subtle">
                {['Nombre', 'Email', 'DNI', 'Teléfono', 'Compra'].map((h) => <th key={h} className="whitespace-nowrap px-5 py-2.5 font-medium">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-line">
                {filtrados.map((b) => (
                  <tr key={b._id} className="transition-colors hover:bg-surface-2/60">
                    <td className="whitespace-nowrap px-5 py-3 font-medium text-fg">{b.nombreCompleto}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted">{b.email}</td>
                    <td className="whitespace-nowrap px-5 py-3 tabular-nums text-muted">{b.dni || '—'}</td>
                    <td className="whitespace-nowrap px-5 py-3 tabular-nums text-muted">{b.telefono || '—'}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-muted">{formatDateB(b.fechaCompra)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Page>
  )
}

export default BuyersList
