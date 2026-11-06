import { useContext, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { chargeExcelRequest, chargeRRPPExcelRequest } from "../../api/cortesieRequest"
import UserContext from "../../context/userContext"
import excelEjPng from "../../assets/images/excelEj.png"
import { getOneProdRequest } from "../../api/eventRequests"
import { EventoNoDisponible } from "../../globalscomp/globalscomp"
import { Icon } from "../../ui/icons"
import { Button, Card, Field, Input, Page, PageHeader, cx } from "../../ui/primitives"
import { toast } from "../../ui/toast"

//Nueva lista por Excel (rediseño). Subir la lista NO envia nada: el envio se hace despues desde "Listas de invitados"
//(antes el aviso decia "fueron enviadas con exito", y no era asi).
const PASOS = [
  'Creá un Excel (.xlsx).',
  'En la columna A poné los nombres y en la B los emails. La primera fila es el encabezado.',
  'Subilo acá con un nombre que te ayude a reconocerlo.',
  'Desde la lista, tocá "Enviar" para mandar los mails.'
]

const NewCortesie = () => {
  const { prodId } = useParams()
  const { session } = useContext(UserContext)
  const userId = session?.userFinded?.[0]?._id
  const [evento, setEvento] = useState(null)
  const [listType, setListType] = useState('2')  // 1 = RRPP, 2 = invitados
  const [archivo, setArchivo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [noDisponible, setNoDisponible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!prodId || !userId) return  //esperar a que cargue la sesion
    getOneProdRequest(prodId, userId).then((res) => {
      const ev = res.data.tickets?.[0]
      setNoDisponible(!ev) //no existe o no es de este usuario
      setEvento(ev ?? null)
    })
  }, [prodId, userId])

  const handleExcelUpload = async (e) => {
    e.preventDefault()
    if (!archivo) return toast.error('Elegí el archivo Excel de la lista.')
    setLoading(true)
    const formData = new FormData()
    formData.append('userId', userId)
    formData.append('prodId', prodId)
    formData.append('eventName', evento?.nombreEvento)
    formData.append('excelName', e.target.elements.excelName.value)
    formData.append('fechaCreacion', Date.now())
    formData.append('excelFile', archivo)
    try {
      const res = listType === '1' ? await chargeRRPPExcelRequest(formData) : await chargeExcelRequest(formData)
      if (res.data.success) {
        toast.success('Cargamos la lista. Tocá "Enviar" para mandar los mails.', { duracion: 7000 })
        navigate(`/cortesies/${prodId}`)
      }
    } catch (err) {
      //Archivo rechazado (tipo, tamaño o cantidad de filas) u otro error: se queda en la pantalla para corregirlo
      if (!err?.avisado) toast.error(err?.response?.data?.message || err?.response?.data?.error || 'No pudimos cargar el Excel. Intentá de nuevo')
    } finally {
      setLoading(false)
    }
  }

  if (noDisponible) return <EventoNoDisponible />

  return (
    <Page size="medium">
      <Button to={`/cortesies/${prodId}`} variant="ghost" size="sm" icon={Icon.ArrowLeft} className="-ml-3 mb-4">Listas de invitados</Button>
      <PageHeader eyebrow={evento?.nombreEvento ?? 'Cortesías'} title="Nueva lista" description="Cargá muchos invitados (o RRPP) de una sola vez desde un Excel." />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="p-5 sm:p-8">
          <form onSubmit={handleExcelUpload} encType="multipart/form-data" className="grid gap-5">
            <div>
              <p className="mb-1.5 text-[13px] font-medium text-muted">Tipo de lista</p>
              <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
                {[['2', 'Invitados', 'Reciben su entrada (QR) por email.', Icon.Ticket], ['1', 'RRPP', 'Se suman como RRPP y reciben su link de venta.', Icon.Users]].map(([v, t, d, Ico]) => (
                  <button key={v} type="button" role="radio" aria-checked={listType === v} onClick={() => setListType(v)}
                    className={cx('flex gap-3 rounded-xl border p-4 text-left transition-colors', listType === v ? 'border-brand-400/60 bg-brand-500/10' : 'border-line bg-surface-2 hover:border-line-strong')}>
                    <Ico className={cx('mt-0.5 size-5 shrink-0', listType === v ? 'text-brand-300' : 'text-subtle')} />
                    <span><span className="block font-medium text-fg">{t}</span><span className="text-sm text-muted">{d}</span></span>
                  </button>
                ))}
              </div>
            </div>
            <Field label="Nombre de la lista">{({ id }) => <Input id={id} name="excelName" placeholder="Ej: Invitados prensa" required />}</Field>
            <div>
              <p className="mb-1.5 text-[13px] font-medium text-muted">Archivo</p>
              <label htmlFor="excelFileHtml" className={cx('flex cursor-pointer items-center gap-4 rounded-xl border border-dashed p-5 transition-colors',
                archivo ? 'border-brand-400/50 bg-brand-500/5' : 'border-line-strong bg-surface-2 hover:border-brand-400')}>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/12 text-brand-300">{archivo ? <Icon.Check /> : <Icon.Upload />}</span>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-fg">{archivo ? archivo.name : 'Elegir archivo Excel'}</span>
                  <span className="text-sm text-subtle">{archivo ? 'Tocá para cambiarlo' : '.xlsx de hasta 2 MB y 2000 filas'}</span>
                </span>
              </label>
              <input id="excelFileHtml" className="sr-only" type="file" accept=".xlsx" name="excelFile" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
            </div>
            <div className="flex justify-end border-t border-line pt-5">
              <Button type="submit" loading={loading} icon={Icon.Upload}>Cargar lista</Button>
            </div>
          </form>
        </Card>

        <aside className="space-y-4">
          <Card className="p-5">
            <h2 className="font-semibold text-fg">Cómo armar el Excel</h2>
            <ol className="mt-4 space-y-3">
              {PASOS.map((p, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-3 text-xs font-semibold text-fg">{i + 1}</span>{p}
                </li>
              ))}
            </ol>
            <img src={excelEjPng} alt="Ejemplo: columna A con nombres y columna B con emails" className="mt-5 w-full rounded-xl border border-line" loading="lazy" />
          </Card>
        </aside>
      </div>
    </Page>
  )
}

export default NewCortesie
