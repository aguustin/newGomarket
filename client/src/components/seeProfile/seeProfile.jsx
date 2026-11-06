import { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { getUserProfileRequest } from '../../api/userRequests'
import UserContext from '../../context/userContext'
import { Icon } from '../../ui/icons'
import { Button, Card, EmptyState, Page, Skeleton } from '../../ui/primitives'

//Perfil (rediseño). Correcciones: mostraba la foto de quien miraba (no la del perfil) y cualquier visitante
//veia email, telefono y titular de la cuenta. Ahora esos datos solo los ve el dueño del perfil.
const Dato = ({ label, valor }) => valor ? (
  <div className="py-3">
    <dt className="text-xs text-subtle">{label}</dt>
    <dd className="mt-0.5 break-words text-[15px] text-fg">{valor}</dd>
  </div>
) : null

const ProfileCards = () => {
  const { userId } = useParams()
  const { session } = useContext(UserContext)
  const esMio = userId === session?.userFinded?.[0]?._id
  const [perfil, setPerfil] = useState(undefined)

  useEffect(() => {
    getUserProfileRequest({ userId }).then((res) => setPerfil(res.data?.[0] ?? null)).catch(() => setPerfil(null))
  }, [userId])

  if (perfil === undefined) return <Page size="medium"><Skeleton className="h-40 rounded-2xl" /><Skeleton className="mt-6 h-64 rounded-2xl" /></Page>
  if (perfil === null) return <Page size="medium"><Card><EmptyState icon={Icon.User} title="No encontramos este perfil" action={<Button to="/" variant="secondary">Ir al inicio</Button>} /></Card></Page>

  const nombre = perfil.nombreProductora || perfil.nombreCompleto
  const tieneProductora = Boolean(perfil.nombreProductora)

  return (
    <Page size="medium">
      <Card className="relative overflow-hidden p-6 sm:p-8">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(70%_100%_at_30%_0%,rgb(118_99_247/0.25),transparent_70%)]" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          {perfil.imagenProductora
            ? <img src={perfil.imagenProductora} alt="" className="size-24 rounded-full object-cover ring-4 ring-surface" />
            : <span className="flex size-24 items-center justify-center rounded-full bg-brand-500/15 text-3xl font-semibold text-brand-200 ring-4 ring-surface">{(nombre || '?').charAt(0).toUpperCase()}</span>}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold tracking-tight text-fg sm:text-3xl">{nombre}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              {tieneProductora && <span className="inline-flex items-center gap-1.5"><Icon.Sparkles className="size-4 text-brand-300" />Productora</span>}
              {(perfil.paisProductora || perfil.pais) && <span className="inline-flex items-center gap-1.5"><Icon.MapPin className="size-4 text-subtle" />{perfil.paisProductora || perfil.pais}</span>}
            </p>
          </div>
          {esMio && <Button to="/user_info" variant="secondary" icon={Icon.Edit}>Editar perfil</Button>}
        </div>
      </Card>

      {esMio && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h2 className="flex items-center gap-2 font-semibold text-fg"><Icon.User className="size-4 text-brand-300" />Particular</h2>
            <dl className="mt-2 divide-y divide-line">
              <Dato label="Nombre" valor={perfil.nombreCompleto} />
              <Dato label="Email" valor={perfil.mail} />
              <Dato label="Teléfono" valor={perfil.telefono} />
              <Dato label="País" valor={perfil.pais} />
              <Dato label="Titular de la cuenta" valor={perfil.nombreTitular} />
            </dl>
          </Card>
          <Card className="p-6">
            <h2 className="flex items-center gap-2 font-semibold text-fg"><Icon.Sparkles className="size-4 text-brand-300" />Productora</h2>
            {tieneProductora ? (
              <dl className="mt-2 divide-y divide-line">
                <Dato label="Nombre" valor={perfil.nombreProductora} />
                <Dato label="Email" valor={perfil.mailProductora} />
                <Dato label="Teléfono" valor={perfil.telefonoProductora} />
                <Dato label="Domicilio" valor={perfil.domicilioProductora} />
                <Dato label="País" valor={perfil.paisProductora} />
                <Dato label="Titular de la cuenta" valor={perfil.nombreTitularProductora} />
              </dl>
            ) : (
              <p className="mt-3 text-sm text-muted">Todavía no cargaste los datos de una productora. <Button to="/user_info" variant="ghost" size="sm" className="mt-2 -ml-3">Completar ahora</Button></p>
            )}
          </Card>
        </div>
      )}
    </Page>
  )
}

export default ProfileCards
