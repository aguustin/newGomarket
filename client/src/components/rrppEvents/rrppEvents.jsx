import { useEffect } from "react"
import { getRRPPInfoRequest } from "../../api/eventRequests"
import { useState } from "react"

const RRPPEvents = () => {
    const [rrppEvents, setEvents] = useState([])
    
    useEffect(() => {
        const getRRPPInfo = async () => {
            const res = await getRRPPInfoRequest('agustin.molee@gmail.com')
            setEvents(res.data)
        }
        getRRPPInfo()
    }, [])
    console.log("rrppEvents: ", rrppEvents)
    
    function formatDate() {
        const dateD = new Date()
        const year = dateD.getFullYear();
        const month = String(dateD.getMonth() + 1).padStart(2, '0');
        const day = String(dateD.getDate()).padStart(2, '0');
        const hours = String(dateD.getHours()).padStart(2, '0');
        const minutes = String(dateD.getMinutes()).padStart(2, '0');

        return `${year}/${month}/${day}  ${hours}:${minutes}hs`;
    }

    return(
        <div>
            {rrppEvents.map((rpe, i) => 
                <div key={rpe._id}>
                    <div>
                        <img src={rpe.imgEvento} alt=""></img>
                    </div>
                    <div>
                        <h2>{rpe.nombreEvento}</h2>
                        <p>Fecha de cierre: {formatDate(rpe.fechaFin)}</p>
                        <a href={`/rrpp_get_event_free/${rpe._id}/${rpe.rrpp[0]?.mail}`}>Enviar Cortesias</a>
                    </div>
                </div>
            )}
        </div>
    )
}

export default RRPPEvents