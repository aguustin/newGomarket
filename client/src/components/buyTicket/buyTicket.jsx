import { useEffect, useState } from "react"
import { useParams } from "react-router"
import { buyTicketsRequest, getEventToBuyRequest } from "../../api/eventRequests"

const BuyTicket = () => {
    const prodId = useParams()
    const [prod, setProd] = useState([])
    const [quantity, setQuantity] = useState(0)
    const [quantities, setQuantities] = useState({});
    console.log(prodId)
    useEffect(() => {
            const getOneEvent = async () => {
                const res = await getEventToBuyRequest(prodId.prodId)
                setProd(res.data)
            }
            getOneEvent()
    }, [])

    const restQuantity = (e, ticketId) => {
        e.preventDefault()
        setQuantities(prev => {
            const current = prev[ticketId] || 0;
            if (current > 0) {
                return {
                    ...prev,
                    [ticketId]: current - 1
                };
            }
            return prev;
        });
    };

    const addQuantity = (e, ticketId) => {
        e.preventDefault()
        const ticketData = null
        if(quantity < 20){
      setQuantities(prev => ({
            ...prev,
            [ticketId]: (prev[ticketId] || 0) + 1
        }));
        }
    }

    const total = prod.flatMap(p => p.tickets).reduce((acc, tck) => {
        const qty = quantities[tck._id] || 0;
        return acc + qty * tck.precio;
    }, 0);
    console.log(quantities)
    const buyTickets = async (e) => {
        e.preventDefault()
        const res = await buyTicketsRequest(quantities)
    }

    return(
        <>
        
            {prod.map((p) => 
            <div>
                <img src={p.imgEvento}></img>
            </div>
            )}
            <form onSubmit={(e) => buyTickets(e)}>
                <div>
                    <label>Nombre completo:</label>
                    <input type="text" name="nombreCompleto" placeholder="Ej: John Doe"></input>
                </div>
                <div>
                    <label>Mail:</label>
                    <input type="email" name="mail" placeholder="example@gmail.com"></input>
                </div>
                <div>
                    <label>Celular:</label>
                    <input type="number" name="celular" placeholder="Ej: 251222222"></input>
                </div>
                <div>
                    <label>Celular:</label>
                    <input type="number" name="celular" placeholder="Ej: 251222222"></input>
                </div>
               {prod.map((p) =>
                    p.tickets.map((tck) => 
                    <div>
                        <div className="flex">
                            <label>{tck.nombreTicket}: </label>
                            <div className="flex">
                                <button onClick={(e) => restQuantity(e, tck._id, tck.precio)}>-</button>
                                <p>{quantities[tck._id] || 0}</p>
                                <button onClick={(e) => addQuantity(e, tck._id, tck.precio)}>+</button>
                                <p>Precio c/u: {tck.precio}</p>
                            </div>
                        </div>
                    </div>
                )
                )}
                <p>Total:${total}</p>
                <button type="submit">Comprar</button>
            </form>
       
        </>
    )
}

export default BuyTicket