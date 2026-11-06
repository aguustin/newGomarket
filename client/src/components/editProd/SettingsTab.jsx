import { useState } from "react"
import { cancelarEventoRequest, reactivarEventoRequest, relateEventsRequest, soldOutEventRequest } from "../../api/eventRequests"
import { formatDateB } from "../../globalscomp/globalscomp"
import { Icon } from "../../ui/icons"
import { Alert, Button, Card } from "../../ui/primitives"
import Modal, { Switch } from "../../ui/Modal"
import SmartImage from "../../ui/SmartImage"
import { toast } from "../../ui/toast"

//Pestaña "Ajustes" de Editar evento: agotado, fechas relacionadas y cancelar/reactivar.
const SettingsTab = ({ evento, othersProds, onChanged }) => {
  const [soldOut, setSoldOut] = useState(Boolean(evento.soldOut))
  const [guardandoSoldOut, setGuardandoSoldOut] = useState(false)
  const [relacionando, setRelacionando] = useState(null)
  const [modal, setModal] = useState(null)  // null | 'cancelar' | 'reactivar' | { confirmar: mensaje }
  const [procesando, setProcesando] = useState(false)
  const activo = evento.active !== false

  const cambiarSoldOut = async (valor) => {
    setSoldOut(valor)
    setGuardandoSoldOut(true)
    try {
      const res = await soldOutEventRequest({ prodId: evento._id, isSoldOut: valor })
      if (res.data.ok === 1) toast.success(valor ? 'Marcamos el evento como agotado: la venta queda bloqueada.' : 'La venta está habilitada de nuevo.')
      await onChanged()
    } catch {
      setSoldOut(!valor)
      toast.error('No pudimos cambiar el estado. Intentá de nuevo.')
    } finally {
      setGuardandoSoldOut(false)
    }
  }

  const relacionados = (evento.eventosRelacionados ?? []).map((er) => String(er.idEvento))
  const otros = othersProds.filter((o) => o._id !== evento._id)

  const relateEvents = async (otherId) => {
    setRelacionando(otherId)
    try {
      const res = await relateEventsRequest({ prodId: evento._id, otherId })
      toast.success(res.data.msg === 2 ? 'Fechas relacionadas: el comprador puede elegir entre ellas.' : 'Desvinculamos las fechas.')
      await onChanged()
    } catch {
      toast.error('No pudimos actualizar la relación. Intentá de nuevo.')
    } finally {
      setRelacionando(null)
    }
  }

  const cancelarEvento = async () => {
    setProcesando(true)
    try {
      const res = await cancelarEventoRequest({ prodId: evento._id })
      const { entradasAnuladas = 0, reembolsosEnCurso = 0 } = res.data
      toast.success(`Tu evento fue cancelado. Se anularon ${entradasAnuladas} entradas y se están procesando ${reembolsosEnCurso} reembolsos.`, { duracion: 9000 })
      setModal(null)
      await onChanged()
    } catch {
      toast.error('No se pudo cancelar el evento. Intentá de nuevo.')
    } finally {
      setProcesando(false)
    }
  }

  const reactivarEvento = async (confirmar = false) => {
    setProcesando(true)
    try {
      await reactivarEventoRequest(confirmar ? { prodId: evento._id, confirmar: true } : { prodId: evento._id })
      toast.success('Tu evento volvió a estar publicado.')
      setModal(null)
      await onChanged()
    } catch (err) {
      const body = err?.response?.data
      //Evento cancelado: el backend pide confirmacion porque las compras ya se reembolsaron
      if (body?.code === 'CONFIRMAR_REACTIVACION' && !confirmar) setModal({ confirmar: body.error })
      else toast.error('No se pudo reactivar el evento. Intentá de nuevo.')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="space-y-8">
      <Card className="p-5 sm:p-6">
        <Switch checked={soldOut} onChange={cambiarSoldOut} disabled={guardandoSoldOut}
          label="Marcar como agotado (sold out)" description="Bloquea la compra de entradas hasta que lo desactives. Se aplica al instante." />
      </Card>

      <section>
        <h2 className="text-lg font-semibold text-fg">Otras fechas del evento</h2>
        <p className="text-sm text-muted">Relacioná funciones o fechas: en la página de compra el público puede elegir entre ellas.</p>
        {otros.length === 0 ? (
          <Card className="mt-4 p-5 text-sm text-muted">No tenés otros eventos para relacionar.</Card>
        ) : (
          <Card className="mt-4 divide-y divide-line overflow-hidden">
            {otros.map((o) => {
              const relacionado = relacionados.includes(String(o._id))
              return (
                <div key={o._id} className="flex items-center gap-4 p-4 sm:px-5">
                  <SmartImage src={o.imgEvento} className="size-12 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-fg">{o.nombreEvento}</p>
                    <p className="text-sm text-muted">{formatDateB(o.fechaInicio)}</p>
                  </div>
                  <Button size="sm" variant={relacionado ? 'ghost' : 'secondary'} loading={relacionando === o._id} onClick={() => relateEvents(o._id)}
                    icon={relacionado ? Icon.X : Icon.Link}>{relacionado ? 'Desvincular' : 'Relacionar'}</Button>
                </div>
              )
            })}
          </Card>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-danger">Zona de peligro</h2>
        <Card className="mt-4 flex flex-col gap-4 border-danger/25 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="font-medium text-fg">{activo ? 'Cancelar evento' : 'Reactivar evento'}</p>
            <p className="mt-0.5 text-sm text-muted">{activo ? 'Anula todas las entradas y devuelve el dinero a los compradores.' : 'Vuelve a publicar el evento y habilita la venta.'}</p>
          </div>
          {activo
            ? <Button variant="danger" onClick={() => setModal('cancelar')}>Cancelar evento</Button>
            : <Button variant="secondary" onClick={() => setModal('reactivar')}>Reactivar evento</Button>}
        </Card>
      </section>

      <Modal open={modal === 'cancelar'} onClose={() => setModal(null)} tone="danger" size="sm" title="¿Cancelar el evento?"
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Volver</Button><Button variant="danger" loading={procesando} onClick={cancelarEvento}>Sí, cancelar evento</Button></>}>
        <p className="text-[15px] leading-relaxed text-muted">
          Se anulan todas las entradas (QR), a cada comprador se le devuelve el valor de sus entradas (sin el cargo por servicio) y el evento deja de mostrarse. <strong className="text-fg">No se puede deshacer.</strong>
        </p>
      </Modal>

      <Modal open={modal === 'reactivar'} onClose={() => setModal(null)} size="sm" title="¿Reactivar el evento?"
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>Volver</Button><Button loading={procesando} onClick={() => reactivarEvento(false)}>Reactivar</Button></>}>
        <p className="text-[15px] text-muted">El evento volverá a estar visible y disponible para la compra de entradas.</p>
      </Modal>

      <Modal open={Boolean(modal?.confirmar)} onClose={() => setModal(null)} tone="danger" size="sm" title="Este evento fue cancelado"
        footer={<><Button variant="ghost" onClick={() => setModal(null)}>No reactivar</Button><Button loading={procesando} onClick={() => reactivarEvento(true)}>Reactivar igual</Button></>}>
        <Alert tone="warn">{modal?.confirmar}</Alert>
      </Modal>
    </div>
  )
}

export default SettingsTab
