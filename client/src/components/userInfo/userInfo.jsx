import { useContext, useEffect, useState } from 'react'
import { createSellerProfileRequest } from '../../api/userRequests'
import UserContext from '../../context/userContext'
import { Icon } from '../../ui/icons'
import { Alert, Button, Card, Field, FormSection, Input, Page, PageHeader, cx } from '../../ui/primitives'
import { toast } from '../../ui/toast'

//Editar perfil (rediseño): foto + datos para cobrar como Particular o como Productora (una a la vez).
//Se envian los mismos campos de antes (dataA..dataN). Correcciones: el campo "País" de productora decia
//"Nombre del titular", el codigo internacional era obligatorio aunque es solo para fuera de Argentina,
//la foto quedaba fuera de los formularios y los errores no se avisaban.
const PARTICULAR = [
  ['nombreCompleto', 'Nombre completo', { autoComplete: 'name' }], ['telefono', 'Teléfono', { type: 'tel', inputMode: 'tel' }],
  ['dni', 'DNI', { inputMode: 'numeric' }], ['cuit', 'CUIT', { inputMode: 'numeric' }],
  ['domicilio', 'Domicilio', { autoComplete: 'street-address' }], ['pais', 'País', { autoComplete: 'country-name' }]
]
const PARTICULAR_COBRO = [['cbu', 'CBU', { inputMode: 'numeric', maxLength: 22, pattern: '\\d*' }], ['alias', 'Alias'], ['nombreTitular', 'Nombre del titular']]
const PRODUCTORA = [
  ['nombreProductora', 'Nombre de la productora'], ['razonSocial', 'Razón social'],
  ['cuitProductora', 'CUIT', { inputMode: 'numeric' }], ['dniRepresentante', 'DNI del representante', { inputMode: 'numeric' }],
  ['mailProductora', 'Email', { type: 'email' }], ['telefonoProductora', 'Teléfono', { type: 'tel', inputMode: 'tel' }],
  ['domicilioProductora', 'Domicilio'], ['paisProductora', 'País']
]
const PRODUCTORA_COBRO = [
  ['nombreBanco', 'Banco'], ['numeroCuenta', 'Número de cuenta', { inputMode: 'numeric' }],
  ['cbuProductora', 'CBU', { inputMode: 'numeric', maxLength: 22, pattern: '\\d*' }], ['aliasProductora', 'Alias'],
  ['nombreTitularProductora', 'Nombre del titular'], ['codigoInternacional', 'Código internacional (SWIFT)', { optional: true, hint: 'Solo si la cuenta no es de Argentina.' }]
]

const Campos = ({ lista, datos, onChange }) => (
  <div className="grid gap-4 sm:grid-cols-2">
    {lista.map(([name, label, { optional, hint, ...extra } = {}]) => (
      <Field key={name} label={label} optional={optional} hint={hint}>
        {({ id }) => <Input id={id} name={name} value={datos[name] ?? ''} onChange={(e) => onChange(name, e.target.value)} required={!optional} {...extra} />}
      </Field>
    ))}
  </div>
)

const UserInfo = () => {
  const { session, setSession } = useContext(UserContext)
  const u = session?.userFinded?.[0]
  const [tipo, setTipo] = useState(1)  // 1 particular | 2 productora
  const [datos, setDatos] = useState({})
  const [foto, setFoto] = useState(null) // { file, url }
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!u?.nombreCompleto) return
    setDatos({
      nombreCompleto: u.nombreCompleto, telefono: u.telefono, pais: u.pais, dni: u.dni, cuit: u.cuit, domicilio: u.domicilio,
      cbu: u.cbu, alias: u.alias, nombreTitular: u.nombreTitular,
      nombreProductora: u.nombreProductora, telefonoProductora: u.telefonoProductora, paisProductora: u.paisProductora,
      dniRepresentante: u.dniRepresentante, cuitProductora: u.cuitProductora, domicilioProductora: u.domicilioProductora,
      razonSocial: u.razonSocial, numeroCuenta: u.numeroCuenta, cbuProductora: u.cbuProductora, aliasProductora: u.aliasProductora,
      nombreBanco: u.nombreBanco, codigoInternacional: u.codigoInternacional, mailProductora: u.mail, nombreTitularProductora: u.nombreTitularProductora
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const cambiar = (campo, valor) => setDatos((prev) => ({ ...prev, [campo]: valor }))
  const fotoActual = foto?.url ?? u?.imagenProductora

  const guardar = async (e) => {
    e.preventDefault()
    setLoading(true)
    const d = datos
    const formData = new FormData()
    formData.append('userId', u?._id)
    const valores = tipo === 1
      ? [d.nombreCompleto, d.dni, d.domicilio, d.cuit, u?.mail, d.telefono, d.pais, d.cbu, d.alias, d.nombreTitular]
      : [d.nombreProductora, d.dniRepresentante, d.domicilioProductora, d.mailProductora, d.cuitProductora, d.telefonoProductora,
         d.paisProductora, d.cbuProductora, d.aliasProductora, d.nombreTitularProductora, d.razonSocial, d.numeroCuenta, d.nombreBanco, d.codigoInternacional ?? '']
    valores.forEach((v, i) => formData.append(`data${String.fromCharCode(65 + i)}`, v ?? ''))
    formData.append('tipo', tipo)
    if (foto?.file) formData.append('productoraImg', foto.file)
    else if (u?.imagenProductora) formData.append('productoraImg', u.imagenProductora)

    try {
      const res = await createSellerProfileRequest(formData)
      localStorage.setItem('session', JSON.stringify({ ...res?.data, token: session?.token }))  //se conserva el token de la sesion
      setSession(JSON.parse(localStorage.getItem('session')))
      setFoto(null)
      toast.success(tipo === 1 ? 'Guardamos tus datos de particular' : 'Guardamos los datos de tu productora')
    } catch (err) {
      if (!err?.avisado) toast.error('No pudimos guardar tus datos. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Page size="medium">
      <PageHeader eyebrow="Tu cuenta" title="Editar perfil" description="Estos datos se usan para transferirte lo que vendas. Revisá que sean correctos." />

      <form onSubmit={guardar} encType="multipart/form-data">
        <Card className="p-5 sm:p-8">
          <FormSection titulo="Foto de perfil" descripcion="Se muestra en tu perfil público y en la barra. JPG, PNG o WebP.">
            <div className="flex items-center gap-5">
              {fotoActual ? <img src={fotoActual} alt="" className="size-20 rounded-full object-cover ring-1 ring-line" />
                : <span className="flex size-20 items-center justify-center rounded-full bg-brand-500/15 text-2xl font-semibold text-brand-200">{(u?.nombreCompleto || '?').charAt(0).toUpperCase()}</span>}
              <div>
                <label htmlFor="fotoPerfil" className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3.5 text-sm font-semibold text-fg transition-colors hover:bg-surface-3">
                  <Icon.Upload className="size-4" />{fotoActual ? 'Cambiar foto' : 'Subir foto'}
                </label>
                <input id="fotoPerfil" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) setFoto({ file, url: URL.createObjectURL(file) }) }} />
                <p className="mt-1.5 text-xs text-subtle">Recomendado: 250 × 300 px</p>
              </div>
            </div>
          </FormSection>

          <FormSection titulo="¿Cómo cobrás?" descripcion="Elegí si cobrás como persona o como productora (empresa).">
            <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
              {[[1, 'Particular', 'Cobro a mi nombre', Icon.User], [2, 'Productora', 'Cobro como empresa', Icon.Sparkles]].map(([v, t, desc, Ico]) => (
                <button key={v} type="button" role="radio" aria-checked={tipo === v} onClick={() => setTipo(v)}
                  className={cx('flex gap-3 rounded-xl border p-4 text-left transition-colors', tipo === v ? 'border-brand-400/60 bg-brand-500/10' : 'border-line bg-surface-2 hover:border-line-strong')}>
                  <Ico className={cx('mt-0.5 size-5 shrink-0', tipo === v ? 'text-brand-300' : 'text-subtle')} />
                  <span><span className="block font-medium text-fg">{t}</span><span className="text-sm text-muted">{desc}</span></span>
                </button>
              ))}
            </div>
          </FormSection>

          {tipo === 1 ? (
            <>
              <FormSection titulo="Datos personales">
                <Field label="Email" hint="No se puede cambiar.">{({ id }) => <Input id={id} type="email" name="email" value={u?.mail ?? ''} disabled />}</Field>
                <Campos lista={PARTICULAR} datos={datos} onChange={cambiar} />
              </FormSection>
              <FormSection titulo="Datos para cobrar" descripcion="Cuenta donde te transferimos las ventas.">
                <Campos lista={PARTICULAR_COBRO} datos={datos} onChange={cambiar} />
              </FormSection>
            </>
          ) : (
            <>
              <FormSection titulo="Datos de la productora"><Campos lista={PRODUCTORA} datos={datos} onChange={cambiar} /></FormSection>
              <FormSection titulo="Datos para cobrar" descripcion="Cuenta de la productora donde te transferimos las ventas.">
                <Campos lista={PRODUCTORA_COBRO} datos={datos} onChange={cambiar} />
              </FormSection>
            </>
          )}

          <Alert tone="info" className="mt-2">Asegurate de que el CBU y el titular coincidan: si no, la transferencia puede rebotar.</Alert>
          <div className="mt-6 flex justify-end border-t border-line pt-5">
            <Button type="submit" loading={loading}>{tipo === 1 ? 'Guardar datos' : 'Guardar productora'}</Button>
          </div>
        </Card>
      </form>
    </Page>
  )
}

export default UserInfo
