import { useEffect } from "react"
import { useParams } from "react-router"
import { getOneProdRequest, getProdsRequest, staffQrRequest } from "../../../api/eventRequests"
import { useState } from "react"

const Staff = () => {
    const {prodId} = useParams()
    const [producction, setProducction] = useState([])
    const [quantities, setQuantities] = useState({});
    const [quantity, setQuantity] = useState(0)
    const [totalQuantity, setTotalQuantity] = useState(0)

    useEffect(() => {
        const obtainUserProd = async () => {
            const res = await getOneProdRequest(prodId)  //despues reemplazar el valor por userId de la session
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
        const mail = e.target.elements.emailStaff.value
        const sendData = {
            prodId, 
            quantities, 
            mail
        }
        const res = await staffQrRequest(sendData)
        console.log(res.data)
    }

    return(
        <>
            <form onSubmit={(e) => addStaff(e)} className="mt-30">
                <label>Agregas mail del colaborador:</label>
                <input type="email" name="emailStaff"></input>
                  {producction.map((p) =>
                    p.cortesiaRRPP.map((tck) => 
                    <div key={tck._id}>
                        <div className="flex">
                            l
                            <label>{tck.nombreTicket}: </label>
                            <div className="flex">
                                <button onClick={(e) => restQuantity(e, tck._id)}>-</button>
                                <p>{quantities[tck._id] || 0}</p>
                                <button onClick={(e) => addQuantity(e, tck._id)}>+</button>
                                <p>Precio c/u: {tck.precio}</p>
                            </div>
                        </div>
                    </div>
                )
                )}
                <button type="submit">Enviar tickets</button>
            </form>
        </>
    )
}

export default Staff