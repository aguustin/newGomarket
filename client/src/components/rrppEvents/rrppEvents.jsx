import { useEffect } from "react"
import { generateMyRRPPLinkRequest, getRRPPInfoRequest } from "../../api/eventRequests"
import { useState } from "react"
import { redirect } from "react-router"
import CryptoJS from 'crypto-js';


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

    const buildUrl = (prodId, mail, imgEvento) => {
        const secretKey = "skulldiver"
        const imgUrl = imgEvento
        const encryptedUrl = CryptoJS.AES.encrypt(imgUrl, secretKey).toString()
        redirect(`/rrpp_get_event_free/${rpe._id}/${rpe.rrpp[0]?.mail}/${encryptedUrl}`)
    }

    const generateMyRRPPLink = async (prodId, rrppMail) => {
       const res = await generateMyRRPPLinkRequest({prodId, rrppMail})
       console.log(res)
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
                        <button onClick={() => buildUrl(rpe._id, 'agustin.molee@gmail.com'/*rpe.rrpp[0]?.mail*/, rpe.imgEvento)}>Enviar Cortesias</button>
                        <button onClick={() => generateMyRRPPLink(rpe._id, 'agustin.molee@gmail.com')}></button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default RRPPEvents