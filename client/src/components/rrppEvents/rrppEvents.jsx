import { useContext, useEffect } from "react"
import { generateMyRRPPLinkRequest, getRRPPInfoRequest } from "../../api/eventRequests"
import { useState } from "react"
import { redirect, useNavigate } from "react-router"
import CryptoJS from 'crypto-js';
import { formatDate } from "../../globalscomp/globalscomp";
import UserContext from "../../context/userContext";
import spacePng from "../../assets/space.png"

const RRPPEvents = () => {
    const {session} = useContext(UserContext)
    const [rrppEvents, setEvents] = useState([])
    const nav = useNavigate()
    
    useEffect(() => {
        const getRRPPInfo = async () => {
            const res = await getRRPPInfoRequest(session?.userFinded?.[0]?.mail) //meter mail de la session
            setEvents(res.data)
        }
        getRRPPInfo()
    }, [session])
    console.log(rrppEvents)
    /*const buildUrl = (prodId, mail, imgEvento) => {
        const secretKey = "skulldiver"
        const imgUrl = imgEvento
        const encryptedUrl = CryptoJS.AES.encrypt(imgUrl, secretKey).toString()
        console.log(prodId, ' ', mail)
        nav(`/rrpp_get_event_free/${prodId}/${mail}`) ///${encryptedUrl}
    }*/
   
    const generateMyRRPPLink = async (prodId, rrppMail) => {
       await generateMyRRPPLinkRequest({prodId, rrppMail})
      // getRRPPInfo()
    }
    return(
    <div className="w-screen h-screen flex justify-around p-10">
    {rrppEvents?.map((rpe, i) => {
    // Filtramos el RRPP que coincide con el mail
        const rrppCoincidente = rpe.rrpp.find(linkP => linkP.mail === session?.userFinded?.[0]?.mail);
        console.log(rrppCoincidente)
        if(rrppCoincidente){
            return (
            <div key={rpe._id} className="w-[350px] cursor-pointer">
                <div>
                <div className="mx-auto">
                    <img className="object-cover h-[500px] rounded-lg brightness-70" src={rpe.imgEvento} alt="" />
                </div>
                <div className="text-center mt-2">
                    <h2 className="text-3xl">Evento: {rpe.nombreEvento}</h2>
                    <p className="text-xl mt-2 mb-3">Fecha de cierre: {formatDate(rpe.fechaFin)}</p>
                    <div className="pl-6 pr-6">
                    {rrppCoincidente && (
                        <form className="aca">
                        <p className="mb-2 break-words">{rrppCoincidente.linkDePago}</p>
                        <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(rrppCoincidente.linkDePago)}
                            className="bg-blue-600 text-white px-3 py-1 rounded"
                        >
                            Copiar
                        </button>
                        </form>
                    )}
                    <button
                        className="w-full p-3 mt-2 bg-violet-900 rounded-lg"
                        onClick={() => generateMyRRPPLink(rpe._id, session?.userFinded?.[0]?.mail)}
                    >
                        Generar mi link de pago
                    </button>
                    {/* 
                    <button
                        className="w-full p-3 mt-2 bg-violet-900 rounded-lg"
                        onClick={() => buildUrl(rpe._id, rrppMail)}
                    >
                        Confirmar
                    </button> 
                    */}
                    </div>
                </div>
                </div>
            </div>
            );
        }else{
            return (
                <div className="w-screen flex justify-center items-center mx-auto text-center">
                    <div>
                        <img className="mx-auto" src={spacePng} alt=""></img>
                        <p className="space-text text-3xl text-white!">Ups, no tienes colaboraciones por el momento!</p>
                    </div>
                </div>
            );
        }
    })}
        </div>
    )
}

export default RRPPEvents