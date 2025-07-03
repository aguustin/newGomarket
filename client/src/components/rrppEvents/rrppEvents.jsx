import { useEffect } from "react"
import { generateMyRRPPLinkRequest, getRRPPInfoRequest } from "../../api/eventRequests"
import { useState } from "react"
import { redirect, useNavigate } from "react-router"
import CryptoJS from 'crypto-js';
import { formatDate } from "../../globalscomp/globalscomp";


const RRPPEvents = () => {
    const [rrppEvents, setEvents] = useState([])
    const nav = useNavigate()
    
    useEffect(() => {
        const getRRPPInfo = async () => {
            const res = await getRRPPInfoRequest('agustin.molee@gmail.com') //meter mail de la session
            setEvents(res.data)
        }
        getRRPPInfo()
    }, [])
    console.log("rrppEvents: ", rrppEvents)

    const buildUrl = (prodId, mail, imgEvento) => {
        const secretKey = "skulldiver"
        const imgUrl = imgEvento
        const encryptedUrl = CryptoJS.AES.encrypt(imgUrl, secretKey).toString()
        console.log(prodId, ' ', mail)
        nav(`/rrpp_get_event_free/${prodId}/${mail}`) ///${encryptedUrl}
    }

    const generateMyRRPPLink = async (prodId, rrppMail) => {
       const res = await generateMyRRPPLinkRequest({prodId, rrppMail})
       console.log(res)
    }

            /*<form onSubmit={(e) => addStaff(e)} className="mt-30">
                  {producction.map((p) =>
                  <div className="text-center" key={p._id}>
                    <div className="mx-auto text-center">
                        <img className="w-[350px] h-[380px] mx-auto object-cover" src={p.imgEvento} alt=""></img>   
                        <h3 className="mt-2 mb-6 text-4xl">Evento: {p.nombreEvento}</h3>
                        <p className="mt-2 text-xl">Fecha de inicio: {formatDate(p.fechaInicio) }</p>
                        <p className="mt-2 text-xl">Fecha de cierre: {formatDate(p.fechaFin) }</p>
                        
                    </div>
                    <div className="mt-10 text-center">
                        <p className="text-2xl underline">Enviar Cortesias:</p>
                        {p.cortesiaRRPP.map((tck) => 
                        <div className="flex justify-center mx-auto mt-3 mb-6 text-center" key={tck._id}>
                            <div className="flex mt-3">
                                <label className="text-xl">{tck.nombreTicket}: </label>
                                <div className="flex items-center">
                                    <button className="w-[100px] ml-3 mr-3 text-xl bg-violet-900 cursor-pointer rounded-lg" onClick={(e) => restQuantity(e, tck._id)}>-</button>
                                    <p className="text-xl w-[100px]">{quantities[tck._id] || 0}</p>
                                    <button className="w-[100px] ml-3 mr-3 text-xl bg-violet-900 cursor-pointer rounded-lg" onClick={(e) => addQuantity(e, tck._id)}>+</button>
                                </div>
                            </div>
                        </div>
                        )}
                    </div>
                    <div className="mt-8">
                        <label className="">Agregas mail del colaborador:</label>
                        <input className="email-staff w-[350px] ml-2 pl-3" type="email" name="emailStaff"></input>
                    </div>
                    <button className="mt-10 mb-18 p-4 pl-9 pr-9 bg-indigo-900 rounded-lg cursor-pointer" type="submit">Confirmar</button>
                  </div>
                )}
            </form>*/
    return(
        <div className="w-screen h-screen flex justify-around mt-20 p-10">
            {rrppEvents.map((rpe, i) => 
                <div key={rpe._id} className="cursor-pointer">
                    <div>
                        <div className="w-[350px] h-[380px] mx-auto">
                            <img className="object-cover h-[500px] rounded-lg brightness-70" src={rpe.imgEvento} alt=""></img>
                        </div>
                        <div>
                            <h2>{rpe.nombreEvento}</h2>
                            <p>Fecha de cierre: {formatDate(rpe.fechaFin)}</p>
                            <button onClick={() => generateMyRRPPLink(rpe._id, 'agustin.molee@gmail.com')}>Generar mi link de pago</button>
                            <button onClick={() => buildUrl(rpe._id, 'agustin.molee@gmail.com'/*rpe.rrpp[0]?.mail*/, rpe.imgEvento)}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default RRPPEvents