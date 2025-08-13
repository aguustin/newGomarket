import { useParams, useSearchParams } from "react-router";
import { useState, useEffect } from "react";
import warningPng from "../../assets/warning.png"
import { formatDateB } from "../../globalscomp/globalscomp";

const TicketQr = ({params}) => {
  const [searchParams] = useSearchParams();
  const token = useParams();

  const [ticketInfo, setTicketInfo] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (token) {
      fetch(`${import.meta.env.VITE_URL}/ticket/validate/${token?.token}`)
        .then(res => res.json())
        .then(data => {
          if (data.error === 1) {
            setError(true);
          } else {
            setTicketInfo(data);
          }
        })
        .catch(err => setError("Error al obtener el ticket"));
    }
  }, [token]);

 if (error) 
      return (
          <div className="h-screen text-center mt-[110px] pt-10 pr-3 pl-3">
            <img className="mx-auto" src={warningPng} loading="lazy"></img>
            <p className="text-red-500! text-center mt-6 text-3xl">El ticket no existe o ya fue escaneado</p>
          </div>
  )
  
  if (!ticketInfo) return <p>Cargando ticket...</p>;
  return (
      <div className='evento-desc mt-[110px] mb-[240px] flex justify-center'>
          <div className="mx-auto text-center h-full">
                <h1 className="text-white text-4xl underline">{ticketInfo.nombreEvento}</h1>
                <img className="mx-auto mt-6" src={ticketInfo.imgEvento} alt="evento" width="300" loading="lazy"/>
                <p className='text-2xl mt-9'><b className="text-violet-500">Ticket: </b>{ticketInfo.nombreTicket} - {ticketInfo.tipo} - Edad: +{ticketInfo.eventoEdad}</p>
                <p className="text-2xl mt-3"><b className="text-violet-500">Lugar: </b>{ticketInfo.localidad} </p>
                <p className='text-2xl mt-3'><b className="text-violet-500">Dirección: </b>{ticketInfo.direccion}</p>
                <p className='text-2xl mt-3'><b className="text-violet-500">Fecha: </b>{formatDateB(ticketInfo.fechaInicioEvento)}</p>
          </div>
      </div>
   
  );
};

export default TicketQr;