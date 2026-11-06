import { useContext, useEffect, useState } from "react"
import UserContext from "../../context/userContext"
import { getFavoritesEventsRequest, saveEventRequest } from "../../api/userRequests"
import { Icon } from "../../ui/icons"
import { Button, EmptyState, Page, PageHeader, Skeleton } from "../../ui/primitives"
import EventCard from "../../ui/EventCard"
import { toast } from "../../ui/toast"

//Mis favoritos (antes la pagina existia en el menu pero no mostraba nada).
//Lista los eventos guardados; quitar uno lo saca de la lista y de la sesion guardada.
const MyFavoritesEvents = () => {
    const { session } = useContext(UserContext)
    const usuario = session?.userFinded?.[0]
    const [eventos, setEventos] = useState(null)

    useEffect(() => {
        if (!usuario?._id) return
        getFavoritesEventsRequest(usuario._id)
            .then((res) => setEventos(res.data.favorites ?? []))
            .catch(() => { setEventos([]); toast.error('No pudimos cargar tus favoritos.') })
    }, [usuario?._id])

    const quitar = async (eventId) => {
        const anteriores = eventos
        setEventos((prev) => prev.filter((ev) => ev._id !== eventId))
        try {
            await saveEventRequest({ userId: usuario._id, eventId })  //el mismo pedido agrega o quita
            const s = JSON.parse(localStorage.getItem('session'))
            const u = s?.userFinded?.[0]
            if (u) localStorage.setItem('session', JSON.stringify({ ...s, userFinded: [{ ...u, favorites: (u.favorites ?? []).filter((f) => f?.eventId !== eventId) }] }))
            toast.success('Lo quitamos de tus favoritos.')
        } catch {
            setEventos(anteriores)
            toast.error('No pudimos quitarlo. Intentá de nuevo.')
        }
    }

    return (
        <Page>
            <PageHeader eyebrow="Tu cuenta" title="Mis favoritos" description="Los eventos que guardaste para no perderlos de vista." />
            {eventos === null ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />)}
                </div>
            ) : eventos.length === 0 ? (
                <EmptyState icon={Icon.Heart} title="Todavía no guardaste eventos"
                    description="Tocá el corazón de cualquier evento para guardarlo acá."
                    action={<Button to="/" icon={Icon.Search}>Explorar eventos</Button>} />
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {eventos.map((ev) => <EventCard key={ev._id} evento={ev} favorito onToggleFavorito={quitar} />)}
                </div>
            )}
        </Page>
    )
}

export default MyFavoritesEvents
