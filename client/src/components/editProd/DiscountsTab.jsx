import { useState } from "react"
import { nanoid } from "nanoid"
import { createDiscountCodeRequest } from "../../api/eventRequests"
import { Icon } from "../../ui/icons"
import { Badge, Button, Card, EmptyState, Field, Input } from "../../ui/primitives"
import Modal from "../../ui/Modal"
import { toast } from "../../ui/toast"

//Pestaña "Descuentos" de Editar evento. El codigo se genera solo al abrir el formulario.
const copiar = async (codigo) => {
  try { await navigator.clipboard.writeText(codigo); toast.success(`Código ${codigo} copiado`) } catch { toast.error('No pudimos copiar el código') }
}

const CrearDescuento = ({ evento, onClose, onChanged }) => {
  const [idDiscount, setIdDiscount] = useState(() => nanoid(8))
  const [loading, setLoading] = useState(false)

  const crear = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await createDiscountCodeRequest({
        prodId: evento._id, idDiscount,
        cantidadDescuentos: e.target.elements.cantidadDescuentos.value,
        numeroDescuento: e.target.elements.numeroDescuento.value
      })
      toast.success(res.data?.message || 'Descuento creado')
      await onChanged()
      onClose()
    } catch {
      toast.error('No pudimos crear el descuento. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Nuevo código de descuento" description="Compartilo con quien quieras: se aplica al total de la compra."
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" form="crear-descuento" loading={loading}>Crear descuento</Button></>}>
      <form id="crear-descuento" onSubmit={crear} className="grid gap-4">
        <Field label="Código">{({ id }) => (
          <div className="flex gap-2">
            <Input id={id} value={idDiscount} readOnly inputClassName="font-mono text-base tracking-wider" className="flex-1" />
            <Button variant="secondary" onClick={() => setIdDiscount(nanoid(8))} aria-label="Generar otro código">Otro</Button>
          </div>
        )}</Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Descuento (%)">{({ id }) => <Input id={id} type="number" min="1" max="100" name="numeroDescuento" placeholder="Ej: 20" required />}</Field>
          <Field label="Usos disponibles">{({ id }) => <Input id={id} type="number" min="1" name="cantidadDescuentos" placeholder="Ej: 50" required />}</Field>
        </div>
      </form>
    </Modal>
  )
}

const DiscountsTab = ({ evento, discounts, onChanged }) => {
  const [creando, setCreando] = useState(false)
  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-fg">Códigos de descuento</h2>
          <p className="text-sm text-muted">Cada código tiene un porcentaje y una cantidad de usos.</p>
        </div>
        <Button icon={Icon.Plus} onClick={() => setCreando(true)}>Nuevo código</Button>
      </div>
      {discounts.length === 0 ? (
        <Card><EmptyState icon={Icon.Tag} title="Todavía no hay descuentos" description="Creá un código para promociones, preventas o invitados especiales." action={<Button icon={Icon.Plus} onClick={() => setCreando(true)}>Nuevo código</Button>} /></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {discounts.map((ds) => (
            <Card key={ds._id} className="flex items-center gap-4 p-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/12 text-sm font-bold text-brand-200">{ds.numeroDescuento}%</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[15px] font-semibold tracking-wider text-fg">{ds.idDescuento}</p>
                <p className="text-sm text-muted">{Number(ds.cantidadDescuentos) > 0 ? `${ds.cantidadDescuentos} usos disponibles` : <Badge tone="neutral">Agotado</Badge>}</p>
              </div>
              <Button variant="ghost" size="sm" icon={Icon.Copy} onClick={() => copiar(ds.idDescuento)} aria-label={`Copiar ${ds.idDescuento}`} />
            </Card>
          ))}
        </div>
      )}
      {creando && <CrearDescuento evento={evento} onClose={() => setCreando(false)} onChanged={onChanged} />}
    </div>
  )
}

export default DiscountsTab
