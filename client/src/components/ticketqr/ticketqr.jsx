import { useSearchParams } from "react-router";
import { useState, useEffect } from "react";

const TicketQr = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [ticketInfo, setTicketInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) {
      fetch(`http://localhost:4000/ticket/validate?token=${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.message) {
            setError(data.message);
          } else {
            setTicketInfo(data);
          }
        })
        .catch(err => setError("Error al obtener el ticket"));
    }
  }, [token]);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!ticketInfo) return <p>Cargando ticket...</p>;

  return (
    <div className="mt-30">
      <h1 className="text-white text-2xl">{ticketInfo.nombreEvento}</h1>
      <img src={ticketInfo.imgEvento} alt="evento" width="300" />
      <p>Ticket: {ticketInfo.nombreTicket}</p>
      <p>Fecha cierre ticket: {new Date(ticketInfo.fechaDeCierreTicket).toLocaleString()}</p>
      {ticketInfo.state === 3 ? <p>Free</p> : ''}
    </div>
  );
};

export default TicketQr;