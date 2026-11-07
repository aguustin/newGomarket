import { useState } from "react"
import { updateEventRequest } from "../../api/eventRequests"
import { formatearFechaParaInput } from "../../globalscomp/globalscomp"
import { Alert, Button, Card, Field, FormSection as Seccion, Input, Select, Textarea } from "../../ui/primitives"
import ImagePicker from "../../ui/ImagePicker"
import { toast } from "../../ui/toast"

//Pestaña "Información" de Editar evento.
//Correcciones respecto de la version anterior:
//  - aviso y edad minima se guardaban con el valor ORIGINAL aunque se editaran
//  - cambiar la localidad no guardaba su nombre y los codigos de pais/ciudad viajaban como "undefined"
//  - la fecha de inicio pasada solo se valida si se cambia (antes no dejaba editar nada de un evento en curso)
//  - borrar una fecha del campo ya no rompe la pantalla
const aIso = (valor) => {
  const d = new Date(valor)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

const InfoTab = ({ evento: p, cities, onChanged }) => {
  const [ed, setEd] = useState({})          //campos editados (lo que no esta aca conserva su valor)
  const [archivos, setArchivos] = useState({}) //{ portada, banner, descriptiva } -> { file, url }
  const [ciudad, setCiudad] = useState(null)
  const [visibilidad, setVisibilidad] = useState(String(p.tipoEvento ?? 1))
  const [errores, setErrores] = useState({})
  const [loading, setLoading] = useState(false)

  const valor = (campo) => ed[campo] ?? p[campo] ?? ''
  const cambiar = (campo) => (e) => setEd((prev) => ({ ...prev, [campo]: e.target.value }))
  const cambiarFecha = (campo) => (e) => setEd((prev) => ({ ...prev, [campo]: e.target.value ? aIso(e.target.value) ?? prev[campo] : prev[campo] }))
  const elegir = (clave) => (e) => {
    const file = e.target.files?.[0]
    if (file) setArchivos((prev) => ({ ...prev, [clave]: { file, url: URL.createObjectURL(file) } }))
  }
  const hayCambios = Object.keys(ed).length > 0 || Object.keys(archivos).length > 0 || ciudad || visibilidad !== String(p.tipoEvento ?? 1)

  const guardar = async (e) => {
    e.preventDefault()
    const inicio = new Date(ed.fechaInicio ?? p.fechaInicio)
    const fin = new Date(ed.fechaFin ?? p.fechaFin)
    const nuevos = {}
    if (ed.fechaInicio && inicio < new Date()) nuevos.inicio = 'La fecha de inicio no puede ser anterior a hoy'
    if (fin < inicio) nuevos.fin = 'La fecha de fin tiene que ser posterior al inicio'
    setErrores(nuevos)
    if (Object.keys(nuevos).length) return

    setLoading(true)
    const formData = new FormData()
    formData.append("imgEvento", archivos.portada?.file ?? p.imgEvento)
    formData.append("eventId", p._id)
    formData.append("nombreEvento", valor('nombreEvento'))
    formData.append("codigoPais", ciudad?.countryCode ?? p.codigoPais ?? cities[0]?.countryCode ?? '')
    formData.append("codigoCiudad", ciudad?.stateCode ?? p.codigoCiudad ?? cities[0]?.stateCode ?? '')
    formData.append("descripcionEvento", valor('descripcionEvento'))
    formData.append("aviso", valor('aviso'))
    formData.append("eventoEdad", valor('eventoEdad'))
    formData.append("artistas", valor('artistas'))
    formData.append("montoVentas", valor('montoVentas'))
    formData.append("fechaInicio", inicio.toISOString())
    formData.append("fechaFin", fin.toISOString())
    formData.append("provincia", p.provincia)
    formData.append("tipoEvento", visibilidad)
    formData.append("localidad", ciudad?.name ?? p.localidad)
    formData.append("direccion", valor('direccion'))
    formData.append("lugarEvento", valor('lugarEvento'))
    formData.append("bannerEvento", archivos.banner?.file ?? p.bannerEvento ?? null)
    formData.append("imagenDescriptiva", archivos.descriptiva?.file ?? p.imagenDescriptiva ?? null)

    try {
      const res = await updateEventRequest(formData)
      if (res.data.state > 0) {
        toast.success('Guardamos los cambios del evento')
        setEd({}); setArchivos({}); setCiudad(null)
        await onChanged()
      } else {
        toast.error('No pudimos guardar los cambios. Intentá de nuevo.')
      }
    } catch (err) {
      if (!err?.avisado) toast.error('No pudimos guardar los cambios. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-5 sm:p-8">
      <form onSubmit={guardar} encType="multipart/form-data">
        <Seccion titulo="Información básica" descripcion="Lo que ve el público en la página del evento.">
          <Field label="Nombre del evento">{({ id }) => <Input id={id} value={valor('nombreEvento')} onChange={cambiar('nombreEvento')} required maxLength={80} />}</Field>
          <Field label="Descripción" optional>{({ id }) => <Textarea id={id} value={valor('descripcionEvento')} onChange={cambiar('descripcionEvento')} />}</Field>
          <Field label="Artistas" optional>{({ id }) => <Input id={id} name="artistas" value={valor('artistas')} onChange={cambiar('artistas')} />}</Field>
          <Field label="Aviso importante" optional hint="Se destaca en la página de compra.">{({ id }) => <Textarea id={id} className="min-h-20" value={valor('aviso')} onChange={cambiar('aviso')} />}</Field>
        </Seccion>

        <Seccion titulo="Imágenes" descripcion="Subí una nueva solo si querés reemplazar la actual.">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr]">
            <ImagePicker label="Portada" name="imgEvento" aspect="aspect-[11/12]" preview={archivos.portada?.url ?? p.imgEvento} onChange={elegir('portada')} />
            <div className="grid content-start gap-4">
              <ImagePicker label="Banner" name="bannerEvento" aspect="aspect-[21/8]" hint="Opcional" preview={archivos.banner?.url ?? p.bannerEvento} onChange={elegir('banner')} />
              <ImagePicker label="Imagen descriptiva" name="imagenDescriptiva" aspect="aspect-[21/8]" hint="Opcional" preview={archivos.descriptiva?.url ?? p.imagenDescriptiva} onChange={elegir('descriptiva')} />
            </div>
          </div>
        </Seccion>

        <Seccion titulo="Fecha y lugar">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Inicio" error={errores.inicio}>{({ id, invalid }) => <Input id={id} invalid={invalid} type="datetime-local" value={formatearFechaParaInput(ed.fechaInicio ?? p.fechaInicio)} onChange={cambiarFecha('fechaInicio')} />}</Field>
            <Field label="Fin" error={errores.fin}>{({ id, invalid }) => <Input id={id} invalid={invalid} type="datetime-local" value={formatearFechaParaInput(ed.fechaFin ?? p.fechaFin)} onChange={cambiarFecha('fechaFin')} />}</Field>
            <Field label="Localidad" hint={p.provincia}>{({ id }) => (
              <Select id={id} name="localidad" value={ciudad?.name ?? p.localidad ?? ''} onChange={(e) => setCiudad(cities.find((c) => c.name === e.target.value) ?? null)}>
                {!cities.some((c) => c.name === p.localidad) && <option value={p.localidad ?? ''}>{p.localidad}</option>}
                {cities.map((c, i) => <option key={`${c.name}-${i}`} value={c.name}>{c.name}</option>)}
              </Select>
            )}</Field>
            <Field label="Lugar">{({ id }) => <Input id={id} name="lugarEvento" value={valor('lugarEvento')} onChange={cambiar('lugarEvento')} />}</Field>
            <Field label="Dirección" className="sm:col-span-2">{({ id }) => <Input id={id} name="direccion" value={valor('direccion')} onChange={cambiar('direccion')} />}</Field>
          </div>
        </Seccion>

        <Seccion titulo="Venta y visibilidad">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Visibilidad">{({ id }) => (
              <Select id={id} name="tipoEvento" value={visibilidad} onChange={(e) => setVisibilidad(e.target.value)}>
                <option value="1">Público</option>
                <option value="2">Privado</option>
              </Select>
            )}</Field>
            <Field label="Edad mínima" optional>{({ id }) => <Input id={id} type="number" min="0" value={valor('eventoEdad')} onChange={cambiar('eventoEdad')} />}</Field>
            <Field label="Ventas estimadas ($)">{({ id }) => <Input id={id} type="number" min="0" name="montoVentas" value={valor('montoVentas')} onChange={cambiar('montoVentas')} />}</Field>
          </div>
        </Seccion>

        <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-col gap-3 border-t border-line bg-surface/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:-mb-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          {Object.keys(errores).length > 0 ? <Alert tone="danger" className="py-2">Revisá las fechas marcadas.</Alert>
            : <p className="text-sm text-subtle">{hayCambios ? 'Tenés cambios sin guardar.' : 'Sin cambios.'}</p>}
          <Button type="submit" loading={loading} disabled={!hayCambios}>Guardar cambios</Button>
        </div>
      </form>
    </Card>
  )
}

export default InfoTab
