import { useState } from "react";
import { useParams } from "react-router";

const SendFree = () => {
    const {prodId, mail} = useParams()
    const [quantities, setQuantities] = useState({});
    const [quantity, setQuantity] = useState(0)
    const [totalQuantity, setTotalQuantity] = useState(0)

    console.log("prodId: ", prodId, "mail: ", mail)

    //PONER LA FUNCION PARA TRAER EL EVENTO CON TICKETSCORTESIAS - CANTIDADDECORTESIAS
    
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

    return(
        <>
            <div>
                <div>
                  
                </div>
                <div>
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
                </div>
            </div>
        </>
    )
}

export default SendFree;