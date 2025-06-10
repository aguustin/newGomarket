import { useEffect } from "react"
import { useParams } from "react-router"
import { getOneProdRequest, getProdsRequest } from "../../../api/eventRequests"
import { useState } from "react"

const Staff = () => {
    const {prodId} = useParams()
    const [producction, setProducction] = useState([])
    const [quantities, setQuantities] = useState({});

    useEffect(() => {
        const obtainUserProd = async () => {
            const res = await getOneProdRequest(prodId)  //despues reemplazar el valor por userId de la session
            setProducction(res.data)
        }
        obtainUserProd()
    },[])
    console.log(producction)
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

    const addQuantity = (e, ticketIdn, nombreTicket) => {
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
        const mail = e.target.elements.email.value
        const res = await staffQrRequest(prodId, quantities, mail, 3)
    }

    return(
        <>
            <form onSubmit={(e) => addStaff(e)}>
                <label>Agregas mail del colaborador:</label>
                <input type="email" name="emailStaff"></input>
                  {producction.map((p) =>
                    p.tickets.map((tck) => 
                    <div key={tck._id}>
                        <div className="flex">
                            <label>{tck.nombreTicket}: </label>
                            <div className="flex">
                                <button onClick={(e) => restQuantity(e, tck._id, tck.precio, tck.nombreTicket)}>-</button>
                                <p>{quantities[tck._id] || 0}</p>
                                <button onClick={(e) => addQuantity(e, tck._id, tck.precio, tck.nombreTicket)}>+</button>
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