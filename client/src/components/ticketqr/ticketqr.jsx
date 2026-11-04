import { useParams, Link } from "react-router";
import { useState, useEffect } from "react";
import warningPng from "../../assets/warning.png"
import { formatDateB } from "../../globalscomp/globalscomp";
import { getEntradaRequest, validarEntradaRequest } from "../../api/eventRequests";

//Pantalla que se abre al escanear el QR de una entrada.
//Abrirla SOLO muestra la entrada. El ingreso lo valida el organizador o un RRPP del evento con su sesion
//(boton "Validar ingreso"); el backend lo marca de forma atomica y nunca dos veces.
const ESTADOS = {
  vigente: { texto: 'Entrada válida', clase: 'bg-green-600' },
  usada: { texto: 'Entrada ya usada', clase: 'bg-red-600' },
  vencida: { texto: 'Entrada vencida', clase: 'bg-gray-600' },
  anulada: { texto: 'Entrada anulada: el evento fue cancelado', clase: 'bg-red-800' }
}

const TicketQr = () => {
  const { token } = useParams();
  const [ticketInfo, setTicketInfo] = useState(null);
  const [error, setError] = useState(false);
  const [validando, setValidando] = useState(false);
  const [resultado, setResultado] = useState(null);  //{ ok, texto }

  useEffect(() => {
    getEntradaRequest(token)
      .then((res) => setTicketInfo(res.data))
      .catch(() => setError(true))
  }, [token]);

  const validar = async () => {
    setValidando(true)
    try {
      const res = await validarEntradaRequest(token)
      setTicketInfo((prev) => ({ ...prev, ...res.data, puedeValidar: true }))
      setResultado({ ok: true, texto: 'Ingreso validado' })
    } catch (err) {
      const body = err?.response?.data
      if (body?.estado) setTicketInfo((prev) => ({ ...prev, ...body, puedeValidar: true }))
      setResultado({ ok: false, texto: body?.error || 'No se pudo validar la entrada. Intentá de nuevo' })
    } finally {
      setValidando(false)
    }
  }

  if (error)
    return (
      <div className="h-screen text-center mt-[110px] pt-10 pr-3 pl-3">
        <img className="mx-auto" src={warningPng} loading="lazy"></img>
        <p className="text-white! text-center mt-6 text-xl">La entrada no existe</p>
      </div>
    )

  if (!ticketInfo) return <p>Cargando ticket...</p>;

  const estado = ESTADOS[ticketInfo.estado] ?? ESTADOS.vencida

  return (
    <div className='evento-desc flex justify-center'>
      <div className="mx-auto text-center h-full px-3">
        <h1 className="text-white text-4xl underline">{ticketInfo.nombreEvento}</h1>
        <img className="mx-auto mt-6" src={ticketInfo.imgEvento} alt="evento" width="300" loading="lazy"/>

        <p className={`inline-block mt-6 px-5 py-2 rounded-xl text-white! text-xl font-bold ${estado.clase}`}>{estado.texto}</p>
        {ticketInfo.estado === 'usada' && ticketInfo.usadaEn && (
          <p className="text-gray-300! mt-2">Validada el {formatDateB(ticketInfo.usadaEn)}</p>
        )}

        <p className='text-2xl mt-6'><b className="text-violet-500">Ticket: </b>{ticketInfo.nombreTicket} - {ticketInfo.tipo}{ticketInfo.eventoEdad ? ` - Edad: +${ticketInfo.eventoEdad}` : ''}</p>
        {ticketInfo.nombreCompleto && <p className='text-2xl mt-3'><b className="text-violet-500">A nombre de: </b>{ticketInfo.nombreCompleto}</p>}
        <p className="text-2xl mt-3"><b className="text-violet-500">Lugar: </b>{ticketInfo.localidad} </p>
        <p className='text-2xl mt-3'><b className="text-violet-500">Dirección: </b>{ticketInfo.direccion}</p>
        <p className='text-2xl mt-3'><b className="text-violet-500">Fecha: </b>{formatDateB(ticketInfo.fechaInicioEvento)}</p>

        {ticketInfo.puedeValidar && ticketInfo.estado === 'vigente' && !resultado?.ok && (
          <button
            className="mt-8 w-full max-w-sm bg-gradient-to-r from-green-600 to-emerald-500 text-white! text-2xl font-bold py-5 rounded-2xl disabled:opacity-60"
            onClick={validar}
            disabled={validando}
          >
            {validando ? 'Validando...' : 'Validar ingreso'}
          </button>
        )}
        {resultado && (
          <p className={`mt-6 text-2xl font-bold ${resultado.ok ? 'text-green-400!' : 'text-orange-500!'}`}>
            {resultado.ok ? '✓ ' : ''}{resultado.texto}
          </p>
        )}
        {!ticketInfo.puedeValidar && ticketInfo.estado === 'vigente' && (
          <p className="text-gray-400! mt-8 text-sm">Presentá este QR en el acceso. ¿Sos el organizador? <Link className="underline text-gray-300!" to="/login">Iniciá sesión</Link> para validar entradas.</p>
        )}
      </div>
    </div>
  );
};

export default TicketQr;
