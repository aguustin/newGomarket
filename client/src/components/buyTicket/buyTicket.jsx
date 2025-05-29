import { useEffect, useState } from "react"
import { useParams } from "react-router"
import { buyTicketsRequest, getEventToBuyRequest } from "../../api/eventRequests"

const BuyTicket = () => {
    const prodId = useParams()
    const [prod, setProd] = useState([])
    const [quantity, setQuantity] = useState(0)
    const [quantities, setQuantities] = useState({});
    const [totalQuantity, setTotalQuantity] = useState(0)

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
                setTotalQuantity(totalQuantity - 1)
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
            setTotalQuantity(totalQuantity + 1)
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
    
    const buyTickets = async (e) => {
   try {
    e.preventDefault();
    const mail = e.target.elements.mail.value;

    const data = await buyTicketsRequest(quantities, total, totalQuantity, mail, prod[0].nombreEvento);
    console.log("Respuesta del backend:", data);

    if (!data?.init_point) {
      console.error("init_point no recibido");
      return;
    }

    window.location.href = data.init_point;
  } catch (error) {
    console.error("Error en handlePayment:", error);
  }
    }

    return(
        <>
        
            {prod.map((p) => 
            <div key={p._id}>
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
               {prod.map((p) =>
                    p.tickets.map((tck) => 
                    <div key={tck._id}>
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