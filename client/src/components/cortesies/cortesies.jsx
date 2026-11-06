import { useContext, useEffect, useState } from "react"
import { useParams } from "react-router"
import UserContext from "../../context/userContext"
import { getOneProdRequest } from "../../api/eventRequests"
import { EventoNoDisponible } from "../../globalscomp/globalscomp"
import { deleteCortesieRequest, deleteRRPPExcelRequest, getAllExcelsRequest, getAllRRPPExcelsRequest, sendCortesiesRequest, sendRRPPLinksRequest } from "../../api/cortesieRequest"
import { Icon } from "../../ui/icons"
import { Badge, Button, Card, EmptyState, Page, PageHeader, Skeleton, cx } from "../../ui/primitives"
import Modal from "../../ui/Modal"
import { toast } from "../../ui/toast"

//Listas de invitados y de RRPP cargadas por Excel (rediseño). Los envios corren en segundo plano:
//la lista muestra el avance al actualizar. Volver a enviar solo manda a quienes todavia no lo recibieron.
const Progreso = ({ envio, total }) => {
  if (!envio || envio.sinEnviar === envio.total) return <p className="text-sm text-muted">{total ?? 0} personas · <span className="text-subtle">sin enviar</span></p>
  const pct = envio.total ? Math.round((envio.enviadas / envio.total) * 100) : 0
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="tabular-nums text-fg">{envio.enviadas}/{envio.total} enviados</span>
        {envio.pendientes > 0 && <Badge tone="brand">{envio.pendientes} enviándose</Badge>}
        {envio.conError > 0 && <Badge tone="danger">{envio.conError} con error</Badge>}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3"><div className="h-full rounded-full bg-brand-500 transition-[width]" style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

const Cortesies = () => {
  const { session } = useContext(UserContext)
  const userId = session?.userFinded?.[0]?._id
  const { prodId } = useParams()
  const [tab, setTab] = useState('invitados')
  const [listas, setListas] = useState({ invitados: null, rrpp: null })
  const [noDisponible, setNoDisponible] = useState(false)
  const [enviando, setEnviando] = useState(null)
  const [aEliminar, setAEliminar] = useState(null)
  const [actualizando, setActualizando] = useState(false)

  const cargar = async (cual) => {
    const res = cual === 'rrpp' ? await getAllRRPPExcelsRequest(userId, prodId) : await getAllExcelsRequest(userId, prodId)
    setListas((prev) => ({ ...prev, [cual]: res.data ?? [] }))
  }

  useEffect(() => {
    if (!userId) return //esperar a que cargue la sesion
    getOneProdRequest(prodId, userId).then((prod) => {
      if (!prod.data.tickets?.length) return setNoDisponible(true) //no existe o no es de este usuario
      cargar('invitados')
    }).catch(() => toast.error('No pudimos cargar las listas.'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, prodId])

  useEffect(() => { if (userId && tab === 'rrpp' && listas.rrpp === null) cargar('rrpp').catch(() => toast.error('No pudimos cargar las listas de RRPP.')) }, [tab])  // eslint-disable-line react-hooks/exhaustive-deps

  const actualizar = async () => {
    setActualizando(true)
    try { await cargar(tab) } catch { toast.error('No pudimos actualizar.') } finally { setActualizando(false) }
  }

  const enviar = async (id) => {
    const esRRPP = tab === 'rrpp'
    const que = esRRPP ? 'avisos a RRPP' : 'mails de invitación'
    setEnviando(id)
    try {
      const res = esRRPP ? await sendRRPPLinksRequest({ prodId, rrppListId: id }) : await sendCortesiesRequest({ prodId, cortesieId: id })
      const d = res.data
      if (!d.aEnviar) toast.info(`Todos los ${que} de esta lista ya fueron enviados.`)
      else toast.success(`Se están enviando ${d.aEnviar} ${que}${d.yaEnviadas ? ` (${d.yaEnviadas} ya habían sido enviados)` : ''}. Puede tardar unos minutos: tocá "Actualizar" para ver el avance.`, { duracion: 8000 })
      await cargar(tab)
    } catch (err) {
      toast.error(err?.response?.data?.error || 'No se pudo enviar. Intentá de nuevo.')
    } finally {
      setEnviando(null)
    }
  }

  //Borra solo el registro del Excel: los mails ya enviados y los RRPP ya agregados no se deshacen
  const eliminar = async () => {
    const { id, cual } = aEliminar
    try {
      if (cual === 'rrpp') await deleteRRPPExcelRequest({ userId, rrppListId: id })
      else await deleteCortesieRequest({ userId, cortesieId: id })
      setListas((prev) => ({ ...prev, [cual]: prev[cual].filter((x) => x._id !== id) }))
      toast.success('Eliminamos la lista')
    } catch {
      toast.error('No se pudo eliminar el Excel. Intentá de nuevo.')
    } finally {
      setAEliminar(null)
    }
  }

  if (noDisponible) return <EventoNoDisponible />
  const items = listas[tab]

  return (
    <Page>
      <Button to={`/editar_evento/${prodId}`} variant="ghost" size="sm" icon={Icon.ArrowLeft} className="-ml-3 mb-4">Volver al evento</Button>
      <PageHeader eyebrow="Cortesías" title="Listas de invitados" description="Cargá un Excel y mandá las invitaciones (o los links de venta a tus RRPP) a todos de una vez."
        actions={<Button to={`/new_excel/${prodId}`} icon={Icon.Plus}>Nueva lista</Button>} />

      <div className="mb-5 flex items-center justify-between gap-3">
        <div role="tablist" className="inline-flex rounded-xl border border-line bg-surface p-1">
          {[['invitados', 'Invitados'], ['rrpp', 'RRPP']].map(([id, label]) => (
            <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => setTab(id)}
              className={cx('rounded-lg px-4 py-1.5 text-sm font-medium transition-colors', tab === id ? 'bg-surface-3 text-fg' : 'text-muted hover:text-fg')}>{label}</button>
          ))}
        </div>
        <Button variant="ghost" size="sm" icon={Icon.Clock} loading={actualizando} onClick={actualizar}>Actualizar</Button>
      </div>

      {items === null ? (
        <div className="space-y-3">{[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      ) : items.length === 0 ? (
        <Card><EmptyState icon={Icon.Users} title={tab === 'rrpp' ? 'No cargaste listas de RRPP' : 'No cargaste listas de invitados'}
          description="Subí un Excel con nombre y email en las dos primeras columnas." action={<Button to={`/new_excel/${prodId}`} icon={Icon.Plus}>Nueva lista</Button>} /></Card>
      ) : (
        <ul className="space-y-3">
          {items.map((l) => (
            <li key={l._id}>
              <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-fg">{l.excelName || 'Lista sin nombre'}</p>
                  <p className="mb-3 text-xs text-subtle">Creada el {l.fechaCreacion}</p>
                  <Progreso envio={l.envio} total={tab === 'rrpp' ? l.RRPPCount : l.courtesy} />
                </div>
                <div className="flex gap-2 sm:shrink-0">
                  <Button size="sm" icon={Icon.Mail} loading={enviando === l._id} onClick={() => enviar(l._id)}>Enviar</Button>
                  <Button size="sm" variant="ghost" icon={Icon.Trash} onClick={() => setAEliminar({ id: l._id, cual: tab, nombre: l.excelName })} aria-label={`Eliminar ${l.excelName}`} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal open={Boolean(aEliminar)} onClose={() => setAEliminar(null)} tone="danger" size="sm" title="¿Eliminar esta lista?"
        footer={<><Button variant="ghost" onClick={() => setAEliminar(null)}>Volver</Button><Button variant="danger" onClick={eliminar}>Eliminar</Button></>}>
        <p className="text-[15px] text-muted">Se quita <strong className="text-fg">{aEliminar?.nombre}</strong> de tus listas. Los envíos ya realizados no se deshacen.</p>
      </Modal>
    </Page>
  )
}

export default Cortesies
