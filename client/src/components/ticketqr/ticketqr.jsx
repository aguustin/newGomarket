import { useParams } from "react-router"
import { getInfoQrRequest } from "../../api/eventRequests";
import { useState, useEffect } from "react";

const TicketQr = () => {
  const {eventId, ticketId} = useParams()
  const [ticketInfo, setTicketInfo] = useState(null);

  useEffect(() => {
    if (eventId && ticketId) {
      fetch(`http://localhost:4000/ticket/${eventId}/${ticketId}`)
        .then(res => res.json())
        .then(data => setTicketInfo(data));
    }
  }, [eventId, ticketId]);

  if (!ticketInfo) return <p>Cargando ticket...</p>
 
    return(
        <div className="mt-30">
            <h1 className="text-white text-2xl">{ticketInfo.nombreEvento}</h1>
            <img src={ticketInfo.imgEvento} alt="evento" width="300" />
            <p>Ticket: {ticketInfo.nombreTicket}</p>
        </div>
    )
}

export default TicketQr