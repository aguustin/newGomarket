import { useState } from "react"
import { createEventTicketsRequest, updateTicketsRequest } from "../../api/eventRequests"
import { formatDateB, formatearFechaParaInput } from "../../globalscomp/globalscomp"
import { Icon } from "../../ui/icons"
import { Badge, Button, Card, EmptyState, Field, Input, Select } from "../../ui/primitives"
import Modal from "../../ui/Modal"
import ImagePicker from "../../ui/ImagePicker"
import { toast } from "../../ui/toast"

//Pestaña "Entradas" de Editar evento: lista + crear + editar (mismos datos que antes al servidor).
const pesos = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(n) || 0)
const ESTADOS = { 1: { label: 'Activa', tone: 'ok' }, 2: { label: 'No visible', tone: 'neutral' }, 3: { label: 'Cortesía', tone: 'brand' }, 4: { label: 'Agotada', tone: 'warn' } }

const CrearEntrada = ({ evento, onClose, onChanged }) => {
  const [estado, setEstado] = useState('1')
  const [distribution, setDistribution] = useState('0')
  const [closeDate, setCloseDate] = useState('')
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)

  const crear = async (e) => {
    e.preventDefault()
    const f = e.target.elements
    setLoading(true)
    const formData = new FormData()
    formData.append("prodId", evento._id)
    formData.append("nombreTicket", f.nombreTicket.value)
    formData.append("descripcionTicket", f.descripcionTicket.value ?? '')
    formData.append("precio", estado === '3' ? 0 : f.precio.value)
    formData.append("cantidad", f.cantidad.value)
    formData.append("fechaDeCierre", new Date(closeDate))
    formData.append("imgTicket", f.imgTicket.files[0])
    formData.append("visibilidad", estado)  //igual que en Crear evento (antes viajaba vacio)
    formData.append("distribution", estado === '3' ? distribution : 0)
    formData.append("limit", f?.limit?.value ?? '')
    formData.append("estado", parseInt(estado))
    try {
      const res = await createEventTicketsRequest(formData)
      if (res.data.estado > 0) {
        toast.success('¡Agregamos la entrada!')
        await onChanged()
        onClose()
      } else toast.error('No pudimos crear la entrada.')
    } catch (err) {
      if (!err?.avisado) toast.error('No pudimos crear la entrada. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Nueva entrada" description="Se suma a las entradas del evento." size="lg"
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" form="crear-entrada" loading={loading}>Agregar entrada</Button></>}>
      <form id="crear-entrada" onSubmit={crear} encType="multipart/form-data" className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre">{({ id }) => <Input id={id} name="nombreTicket" placeholder="Ej: VIP" required />}</Field>
        <Field label="Descripción" optional>{({ id }) => <Input id={id} name="descripcionTicket" />}</Field>
        <Field label="Tipo">{({ id }) => (
          <Select id={id} name="estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="1">Activa (a la venta)</option>
            <option value="2">No visible</option>
            <option value="3">Cortesía</option>
            <option value="4">Agotada</option>
          </Select>
        )}</Field>
        {estado === '3' ? (
          <Field label="Cortesía para">{({ id }) => (
            <Select id={id} name="distribution" value={distribution} onChange={(e) => setDistribution(e.target.value)} required>
              <option value="0" disabled>Elegir</option>
              <option value="1">RRPP</option>
              <option value="2">Clientes</option>
            </Select>
          )}</Field>
        ) : (
          <Field label="Precio ($)" hint="0 = gratis">{({ id }) => <Input id={id} type="number" min="0" name="precio" placeholder="0" required />}</Field>
        )}
        <Field label="Cantidad">{({ id }) => <Input id={id} type="number" min="1" name="cantidad" placeholder="100" required />}</Field>
        <Field label="Límite por persona" optional>{({ id }) => <Input id={id} type="number" min="1" name="limit" placeholder="Ej: 3" required={estado === '3' && distribution === '2'} />}</Field>
        <Field label="Cierre de la venta" className="sm:col-span-2">{({ id }) => <Input id={id} type="datetime-local" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} required />}</Field>
        <div className="sm:col-span-2 sm:max-w-xs">
          <ImagePicker label="Imagen (opcional)" name="imgTicket" aspect="aspect-[3/1]" preview={preview}
            onChange={(e) => { const file = e.target.files?.[0]; if (file) setPreview(URL.createObjectURL(file)) }} />
        </div>
      </form>
    </Modal>
  )
}

const EditarEntrada = ({ tick, onClose, onChanged }) => {
  const [datos, setDatos] = useState({})
  const [estado, setEstado] = useState(String(tick.estado ?? 1))
  const [archivo, setArchivo] = useState(null)
  const [loading, setLoading] = useState(false)
  const esCortesia = Number(estado) === 3
  const v = (campo, original) => datos[campo] ?? original ?? ''
  const cambiar = (campo) => (e) => setDatos((prev) => ({ ...prev, [campo]: e.target.value }))
  const cantidadOriginal = esCortesia ? tick.cantidadDeCortesias : tick.cantidad

  const guardar = async (e) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData()
    formData.append("imgTicket", archivo?.file ?? tick.imgTicket)
    formData.append("ticketId", tick._id)
    formData.append("nombreTicket", v('nombreTicket', tick.nombreTicket))
    formData.append("descripcionTicket", v('descripcionTicket', tick.descripcionTicket))
    formData.append("precio", datos.precio ?? tick.precio ?? '')
    formData.append("cantidad", datos.cantidad ?? cantidadOriginal)
    formData.append("limit", datos.limit ?? tick.limit)
    formData.append("fechaDeCierre", datos.fechaDeCierre ?? tick.fechaDeCierre)
    formData.append("visibilidad", tick.visibilidad)
    formData.append("estado", parseInt(estado))
    try {
      const res = await updateTicketsRequest(formData)
      if (res.data.estado > 0) {
        toast.success('¡Entrada actualizada!')
        await onChanged()
        onClose()
      } else toast.error('No pudimos guardar la entrada.')
    } catch (err) {
      if (!err?.avisado) toast.error('No pudimos guardar la entrada. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Editar entrada" description={tick.nombreTicket} size="lg"
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" form="editar-entrada" loading={loading}>Guardar cambios</Button></>}>
      <form id="editar-entrada" onSubmit={guardar} className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre">{({ id }) => <Input id={id} name="nombreTicket" value={v('nombreTicket', tick.nombreTicket)} onChange={cambiar('nombreTicket')} />}</Field>
        <Field label="Descripción" optional>{({ id }) => <Input id={id} name="descripcionTicket" value={v('descripcionTicket', tick.descripcionTicket)} onChange={cambiar('descripcionTicket')} />}</Field>
        {!esCortesia && <Field label="Precio ($)">{({ id }) => <Input id={id} type="number" min="0" name="precio" value={v('precio', tick.precio)} onChange={cambiar('precio')} />}</Field>}
        <Field label="Cantidad">{({ id }) => <Input id={id} type="number" min="1" name="cantidad" value={v('cantidad', cantidadOriginal)} onChange={cambiar('cantidad')} />}</Field>
        <Field label="Límite por persona" optional>{({ id }) => <Input id={id} type="number" min="1" name="limit" value={v('limit', tick.limit)} onChange={cambiar('limit')} />}</Field>
        <Field label="Estado">{({ id }) => (
          <Select id={id} name="estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
            {tick.estado === 3 && <option value="3">Cortesía</option>}
            <option value="1">Activa</option>
            <option value="2">No visible</option>
            <option value="4">Agotada</option>
          </Select>
        )}</Field>
        <Field label="Cierre de la venta" hint={`Actual: ${formatDateB(tick.fechaDeCierre)}`} className="sm:col-span-2">{({ id }) => (
          <Input id={id} type="datetime-local" value={datos.fechaDeCierre ?? formatearFechaParaInput(tick.fechaDeCierre)} onChange={cambiar('fechaDeCierre')} />
        )}</Field>
        <div className="sm:col-span-2 sm:max-w-xs">
          <ImagePicker label="Imagen" name="imgTicket" aspect="aspect-[3/1]" preview={archivo?.url ?? tick.imgTicket}
            onChange={(e) => { const file = e.target.files?.[0]; if (file) setArchivo({ file, url: URL.createObjectURL(file) }) }} />
        </div>
      </form>
    </Modal>
  )
}

const TicketsTab = ({ evento, onChanged }) => {
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState(null)
  const entradas = [
    ...(evento.tickets ?? []).map((t) => ({ ...t, tipo: 'ticket' })),
    ...(evento.cortesiaRRPP ?? []).map((c) => ({ ...c, tipo: 'cortesia' }))
  ]

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-fg">Entradas</h2>
          <p className="text-sm text-muted">Tipos de entrada, precios, cupos y cortesías.</p>
        </div>
        <Button icon={Icon.Plus} onClick={() => setCreando(true)}>Nueva entrada</Button>
      </div>

      {entradas.length === 0 ? (
        <Card><EmptyState icon={Icon.Ticket} title="Este evento no tiene entradas" description="Agregá al menos una para poder vender." action={<Button icon={Icon.Plus} onClick={() => setCreando(true)}>Nueva entrada</Button>} /></Card>
      ) : (
        <Card className="divide-y divide-line overflow-hidden">
          {entradas.map((t) => {
            const est = ESTADOS[t.estado] ?? ESTADOS[1]
            const cantidad = t.cantidad ?? t.cantidadDeCortesias
            return (
              <div key={t._id} className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap sm:px-5">
                {t.imgTicket ? <img src={t.imgTicket} alt="" className="size-12 shrink-0 rounded-xl object-cover" loading="lazy" />
                  : <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-brand-300"><Icon.Ticket /></span>}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-fg">{t.nombreTicket}</p>
                    <Badge tone={est.tone}>{est.label}</Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-muted">
                    {t.tipo === 'cortesia' || t.estado === 3 ? 'Cortesía' : Number(t.precio) === 0 ? 'Gratis' : pesos(t.precio)}
                    <span className="text-subtle"> · </span>{cantidad ?? 0} disponibles
                    {t.fechaDeCierre && <><span className="text-subtle"> · </span>cierra {formatDateB(t.fechaDeCierre)}</>}
                  </p>
                </div>
                <Button variant="secondary" size="sm" icon={Icon.Edit} onClick={() => setEditando(t)}>Editar</Button>
              </div>
            )
          })}
        </Card>
      )}

      {creando && <CrearEntrada evento={evento} onClose={() => setCreando(false)} onChanged={onChanged} />}
      {editando && <EditarEntrada tick={editando} onClose={() => setEditando(null)} onChanged={onChanged} />}
    </div>
  )
}

export default TicketsTab
