import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getRRPPCortesiasRequest, sendRRPPCortesiasRequest } from "../../api/eventRequests";
import { EventoNoDisponible, formatDate } from "../../globalscomp/globalscomp";
import UserContext from "../../context/userContext";

//El RRPP envia cortesias de su cupo a sus clientes. El cupo y los permisos los controla el backend
//(/rrpp_cortesias y /rrpp_enviar_cortesias): la pantalla solo muestra lo disponible.
const SendFree = () => {
    const { session } = useContext(UserContext)
    const { prodId } = useParams()
    const [data, setData] = useState(null)
    const [noDisponible, setNoDisponible] = useState(false)
    const [cantidades, setCantidades] = useState({})
    const [enviando, setEnviando] = useState(null)
    const [mensajes, setMensajes] = useState({})

    const cargar = async () => {
        try {
            const res = await getRRPPCortesiasRequest(prodId)
            setData(res.data)
        } catch (err) {
            if ([400, 403, 404].includes(err?.response?.status)) setNoDisponible(true)
        }
    }

    useEffect(() => {
        if (session?.userFinded?.[0]?._id) cargar()  //esperar a que cargue la sesion
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, prodId])

    const cambiarCantidad = (e, cortesia, delta) => {
        e.preventDefault()
        setCantidades((prev) => {
            const actual = prev[cortesia.ticketId] || 0
            const maximo = Math.min(cortesia.disponibles, cortesia.limit)
            return { ...prev, [cortesia.ticketId]: Math.max(0, Math.min(maximo, actual + delta)) }
        })
    }

    const enviar = async (e, cortesia) => {
        e.preventDefault()
        const form = e.target.elements
        const cantidad = cantidades[cortesia.ticketId] || 0
        const aviso = (texto, ok = false) => setMensajes((prev) => ({ ...prev, [cortesia.ticketId]: { texto, ok } }))

        if (cantidad < 1) return aviso('Elegí cuántas cortesías enviar')
        if (form.clientMail.value !== form.repetirMail.value) return aviso('Los emails no coinciden')

        setEnviando(cortesia.ticketId)
        try {
            await sendRRPPCortesiasRequest({
                prodId, ticketId: cortesia.ticketId, cantidad,
                mail: form.clientMail.value, nombreCompleto: form.clientName.value
            })
            aviso(`¡Listo! Enviamos ${cantidad} ${cantidad === 1 ? 'cortesía' : 'cortesías'} a ${form.clientMail.value}`, true)
            setCantidades((prev) => ({ ...prev, [cortesia.ticketId]: 0 }))
            e.target.reset()
            await cargar()
        } catch (err) {
            aviso(err?.response?.data?.error || 'No pudimos enviar las cortesías. Intentá de nuevo')
            await cargar()
        } finally {
            setEnviando(null)
        }
    }

    if (noDisponible) return <EventoNoDisponible />
    if (!data) return null

    const { evento, cortesias } = data

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-5xl mx-auto bg-gray-800 rounded-3xl overflow-hidden">
                <div className="bg-gradient-to-r from-amber-600 to-yellow-500 p-6">
                    <h2 className="text-3xl font-bold text-[#111827]!">Enviar cortesías</h2>
                    <p className="text-[#111827]">{evento.nombreEvento}</p>
                </div>

                <div className="p-6 grid md:grid-cols-2 gap-6 items-center">
                    <img className="w-full h-[240px] object-cover rounded-2xl" src={evento.imgEvento} alt={evento.nombreEvento} loading="lazy" />
                    <div className="space-y-2 text-gray-300">
                        <p>Desde: {formatDate(evento.fechaInicio)} hs</p>
                        <p>Hasta: {formatDate(evento.fechaFin)} hs</p>
                        {evento.eventoEdad && <p>Edad: +{evento.eventoEdad}</p>}
                        <p>{[evento.provincia, evento.localidad, evento.direccion].filter(Boolean).join(' - ')}</p>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {cortesias.length === 0 && (
                        <p className="text-center text-gray-300!">Todavía no tenés cortesías asignadas para este evento.</p>
                    )}
                    {cortesias.map((cortesia) => {
                        const cantidad = cantidades[cortesia.ticketId] || 0
                        const mensaje = mensajes[cortesia.ticketId]
                        const sinCupo = cortesia.disponibles < 1
                        return (
                            <form key={cortesia.ticketId} onSubmit={(e) => enviar(e, cortesia)} className="bg-gray-900 rounded-2xl p-5 border border-gray-700">
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-4">
                                        {cortesia.imgTicket && <img className="w-16 h-16 rounded-xl object-cover" src={cortesia.imgTicket} alt="" loading="lazy" />}
                                        <div>
                                            <p className="text-lg text-gray-200!">{cortesia.nombreTicket}</p>
                                            <p className="text-sm text-yellow-500!">Válida hasta: {formatDate(cortesia.fechaDeCierre)}</p>
                                        </div>
                                    </div>
                                    <p className="text-gray-300!">Disponibles: <b className="text-white!">{cortesia.disponibles}</b></p>
                                </div>

                                {cortesia.cerrada ? (
                                    <p className="text-gray-400!">Esta cortesía ya no se puede enviar.</p>
                                ) : sinCupo ? (
                                    <p className="text-gray-400!">No te quedan cortesías de este tipo.</p>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3 mb-4">
                                            <p className="text-gray-300!">Cantidad:</p>
                                            <button type="button" className="w-9 h-9 bg-gray-200 rounded-lg text-gray-800" onClick={(e) => cambiarCantidad(e, cortesia, -1)}>-</button>
                                            <p className="w-8 text-center text-white!">{cantidad}</p>
                                            <button type="button" className="w-9 h-9 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg text-white" onClick={(e) => cambiarCantidad(e, cortesia, 1)}>+</button>
                                        </div>
                                        <div className="grid md:grid-cols-3 gap-3">
                                            <input className="p-2 rounded-lg bg-gray-800 text-gray-200! border border-gray-600" type="text" name="clientName" placeholder="Nombre de quien la recibe" required />
                                            <input className="p-2 rounded-lg bg-gray-800 text-gray-200! border border-gray-600" type="email" name="clientMail" placeholder="Email" required />
                                            <input className="p-2 rounded-lg bg-gray-800 text-gray-200! border border-gray-600" type="email" name="repetirMail" placeholder="Repetir email" required />
                                        </div>
                                        <button className="mt-4 bg-gradient-to-r from-amber-600 to-yellow-500 text-[#111827]! font-bold px-6 py-2 rounded-xl disabled:opacity-60" type="submit" disabled={enviando === cortesia.ticketId}>
                                            {enviando === cortesia.ticketId ? 'Enviando...' : 'Enviar cortesías'}
                                        </button>
                                    </>
                                )}
                                {mensaje && <p className={`mt-3 ${mensaje.ok ? 'text-green-400!' : 'text-orange-500!'}`}>{mensaje.texto}</p>}
                            </form>
                        )
                    })}
                </div>

                <div className="p-6 pt-0">
                    <Link className="text-gray-300! underline" to={`/get_my_rrpp_events/${session?.userFinded?.[0]?.mail}`}>Volver a mis colaboraciones</Link>
                </div>
            </div>
        </div>
    )
}

export default SendFree;
