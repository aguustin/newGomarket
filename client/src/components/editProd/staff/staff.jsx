import { useEffect } from "react"
import { useParams } from "react-router"
import { getOneProdRequest, staffQrRequest } from "../../../api/eventRequests"
import { useState } from "react"
import { formatDate } from "../../../globalscomp/globalscomp"
import { useContext } from "react"
import UserContext from "../../../context/userContext"
import checkWhitePng from "../../../assets/images/check-white.png"

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
            <form onSubmit={(e) => addStaff(e)} className="relative mx-12 mt-[30px] bg-white border-[1px] border-gray-100 rounded-2xl p-5 mb-8">
                  {producction.map((p) =>
                   <>
                  <div className="relative" key={p._id}>
                    <div className="relative flex flex-start flex-wrap justify-center">
                        <div>
                            <h2 className="text-2xl">Confirmar detalles</h2>
                            <img className="w-[250px] h-[200px] object-cover rounded-lg" src={p.imgEvento} alt="" loading="lazy"></img>   
                        </div>
                        <div className="text-left ml-4 mt-6">
                            <h2 className="text-xl text-[#111827]">Evento: {p.nombreEvento}</h2>
                            <div className="flex items-center">
                                <p className="mt-3 secondary-p">Fecha de inicio: {formatDate(p.fechaInicio) }</p>
                                <p className="mt-3 ml-3 secondary-p">Fecha de cierre: {formatDate(p.fechaFin) }</p>
                            </div>
                            <div className="email-staff mt-8">
                                <label className="">Enviar invitaciónes a:</label><br></br>
                                <input className="w-[350px]! pl-3" type="email" name="emailStaff" placeholder="Email de colaborador..."></input>
                            </div>
                        </div>
                    </div>
                    <div className="cortesies-desc-container mt-10 text-center max-h-[432px]! mb-20"> 
                        {p.cortesiaRRPP.map((tck) => 
                        <div className="flex justify-center mx-auto text-center" key={tck._id}>
                            <div className="tickets-desc-container w-full flex items-center justify-between mb-3">
                                <img className="ticket-img w-[70px] h-[50px] rounded-xl" src={tck.imgTicket} alt="" loading="lazy"></img>
                                <p className="primary-p text-xl ml-3">{tck.nombreTicket}: </p>
                                <p className="secondary-p text-xl ml-3">Total: {tck.cantidadDeCortesias}</p>
                                <div className="summary-buttons flex items-center">
                                    <button className="bg-transparent ml-3 mr-3 text-xl primary-p cursor-pointer rounded-[200px] w-[40px] h-[40px] " onClick={(e) => restQuantity(e, tck._id)}>-</button>
                                    <p className="text-xl w-[50px] secondary-p">{quantities[tck._id] || 0}</p>
                                    <button className=" ml-3 mr-3 text-xl primary-button cursor-pointer rounded-3xl rounded-[200px] w-[40px] h-[40px]" onClick={(e) => addQuantity(e, tck._id)}>+</button>
                                </div>
                            </div>
                        </div>
                        )}
                    </div>
                  </div>
                    <button className="primary-button flex  items-center absolute right-3 bottom-3 mt-10 p-4  rounded-3xl cursor-pointer" type="submit"><img className="mr-3" src={checkWhitePng} alt=""></img>Confirmar</button>
                    {showMsg === 0 && '' || showMsg === 1 && <p className="text-xl text-violet-600! mb-12">Invitaciónes enviadas!</p> || showMsg === 2 && <p className="text-xl text-violet-600! mb-12">Falta agregar invitaciónes</p>}
                </>
                )}
            </form>
        </>
    )
}

export default Staff