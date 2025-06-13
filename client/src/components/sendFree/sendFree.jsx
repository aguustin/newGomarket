import { useEffect } from "react";
import { useState } from "react";
import { useParams } from "react-router";
import { buyTicketsRequest, getOneProdRequest } from "../../api/eventRequests";
import { v4 as uuidv4 } from 'uuid';

const SendFree = () => {
    const {prodId, mail} = useParams()
    const [quantities, setQuantities] = useState({});
    const [freeTickets, setFreeTickets] = useState([])
    
    //PONER LA FUNCION PARA TRAER EL EVENTO CON TICKETSCORTESIAS - CANTIDADDECORTESIAS
    useEffect(() => {
        const getEventsFrees = async () => {
            const res = await getOneProdRequest(prodId) /*await getEventsFreesRequest(prodId, mail)*/
            setFreeTickets(res.data)
        }
        
        getEventsFrees()
    }, [])

    const restQuantity = (e, ticketId) => {
        e.preventDefault();
        setQuantities(prev => {
            const current = prev[ticketId] || 0;
            if (current > 0) {
            return {
                ...prev,
                [ticketId]: current - 1
            };
            }
            return prev; // No hace nada si ya está en 0
        });
    };


    const addQuantity = (e, ticketId, maxCantidad) => {
        e.preventDefault();
        setQuantities(prev => {
            const current = prev[ticketId] || 0;
            if (current < maxCantidad) {
            return {
                ...prev,
                [ticketId]: current + 1
            };
            }
            return prev; // No hace nada si ya alcanzó el máximo
        });
    };
    const sendFreeFunc = async (e) => {
        e.preventDefault()
        const clientMail = e.target.elements.clientMail.value
        const res = await buyTicketsRequest(freeTickets[0]?.nombreEvento, quantities, clientMail, 3);
        console.log(res.msg)
    }
    return (
        <>
        {freeTickets.map((freeT) => {
         const rrppConMail = freeT.rrpp.find(rrpp => rrpp.mail === mail);
         const ticketIdsRRPP = rrppConMail?.ticketsCortesias.map(t => t.ticketIdCortesia) || [];
         const cortesiasFiltradas = freeT.cortesiaRRPP.filter(tc =>
             ticketIdsRRPP.includes(tc._id?.toString())
         );
         return(
        <div key={freeT._id}>
            <img src={freeT.imgEvento} alt="" />

            {cortesiasFiltradas.map((ticketsCortesia) => {
                const cantidad = rrppConMail?.ticketsCortesias.find(
                    t => t.ticketIdCortesia === ticketsCortesia._id?.toString()
                )?.cantidadDeCortesias || 0;

                return (
                    <div key={ticketsCortesia._id}>
                        <img src={ticketsCortesia.imgTicket} alt="" />
                        <label>{ticketsCortesia.nombreTicket}</label>
                        <form onSubmit={(e) => sendFreeFunc(e, ticketsCortesia._id)}>                         
                            <div className="flex">
                                <button onClick={(e) => restQuantity(e, ticketsCortesia._id)}>-</button>
                                <p>{quantities[ticketsCortesia._id] || 0}</p>
                                <button onClick={(e) => addQuantity(e, ticketsCortesia._id)}>+</button>
                                <input type="email" name="clientMail" placeholder="..."></input>
                            </div>                          
                            <p>Cortesías disponibles: {cantidad}</p>
                            <button type="submit">Enviar cortesias</button>
                        </form>
                    </div>
                );
            })}
        </div>
         )
    })}
        </>
    );
}

export default SendFree;