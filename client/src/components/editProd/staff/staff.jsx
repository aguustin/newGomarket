import { useEffect } from "react"
import { useParams } from "react-router"
import { getOneProdRequest, staffQrRequest } from "../../../api/eventRequests"
import { useState } from "react"
import { formatDate } from "../../../globalscomp/globalscomp"
import { useContext } from "react"
import UserContext from "../../../context/userContext"

const Staff = () => {
    const {session} = useContext(UserContext)
    const {prodId} = useParams()
    const [producction, setProducction] = useState([])
    const [quantities, setQuantities] = useState({});
    const [quantity, setQuantity] = useState(0)
    const [totalQuantity, setTotalQuantity] = useState(0)
    const [showMsg, setShowMsg] = useState(0)

    useEffect(() => {
        const obtainUserProd = async () => {
            const userId = session?.userFinded?.[0]?._id
            const res = await getOneProdRequest(prodId, userId)  //despues reemplazar el valor por userId de la session
            setProducction(res.data)
        }
        obtainUserProd()
    },[])
  
      const restQuantity = (e, ticketId) => {
        e.preventDefault()
        setQuantities(prev => {
            const current = prev[ticketId] || 0;
            if (current > 0) {
                setTotalQuantity(totalQuantity - 1)
                return {
                    ...prev,
                    [ticketId]: current - 1
                };
            }
            return prev
        });
    };

    const addQuantity = (e, ticketId) => {
        e.preventDefault()
        if(quantity < 20){
            setTotalQuantity(totalQuantity + 1)
            setQuantities(prev => ({
                ...prev,
                [ticketId]: (prev[ticketId] || 0) + 1, 
            }));
        }
    }

    const addStaff = async (e) => {
        e.preventDefault()
        console.log(quantities)
        if(quantities.length <= 0){
            setShowMsg(2)
        }else{
            
            const mail = e.target.elements.emailStaff.value
            const sendData = {
                prodId, 
                quantities, 
                mail
            }
            
            
            const res = await staffQrRequest(sendData)
            
            if(res.data.state === 2){
                setShowMsg(3)
            }else{
                setShowMsg(1)
                setTimeout(() => {
                    setShowMsg(0)
                }, 3000);    
            }
        }
    }

    return(
        <>
            <form onSubmit={(e) => addStaff(e)} className="mt-30">
                  {producction.map((p) =>
                  <div className="text-center" key={p._id}>
                    <div className="mx-auto text-center">
                        <img className="w-[350px] h-[380px] mx-auto object-cover" src={p.imgEvento} alt="" loading="lazy"></img>   
                        <h3 className="mt-6 mb-6 text-4xl underline">Evento: {p.nombreEvento}</h3>
                        <p className="mt-2 text-xl">Fecha de inicio: {formatDate(p.fechaInicio) }</p>
                        <p className="mt-2 text-xl">Fecha de cierre: {formatDate(p.fechaFin) }</p>
                    </div>
                    <div className="mt-10 text-center">
                        <p className="text-2xl text-violet-600!">Enviar Invitaciónes a repartir:</p>
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
                        <label className="">Agregar email del colaborador:</label>
                        <input className="email-staff w-[350px] ml-2 pl-3" type="email" name="emailStaff"></input>
                    </div>
                    <button className="mt-10 mb-6 p-4 pl-9 pr-9 bg-indigo-900 rounded-lg cursor-pointer" type="submit">Confirmar</button>
                    {showMsg === 0 && '' || showMsg === 1 && <p className="text-xl text-violet-600! mb-12">Invitaciónes enviadas!</p> || showMsg === 2 && <p className="text-xl text-violet-600! mb-12">Falta agregar invitaciónes</p>}
                  </div>
                )}
            </form>
        </>
    )
}

export default Staff