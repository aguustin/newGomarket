import { useEffect } from "react";
import { useState } from "react";
import { useParams } from "react-router";
import { buyTicketsRequest, getOneProdRequest } from "../../api/eventRequests";
import { v4 as uuidv4 } from 'uuid';
import { formatDate } from "../../globalscomp/globalscomp";

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
            <img src={freeT.imgEvento} alt="" className="w-[800px] mx-auto mt-30"/>
            <h3 className="text-4xl text-center mt-4 mb-5">{freeT.nombreEvento}</h3>
            <p className="text-center mt-2">De: {formatDate(freeT.fechaInicio)} hs</p>
            <p className="text-center mt-2">Hasta: {formatDate(freeT.fechaFin)} hs</p>
            <p className="text-center mt-2">Edad: {freeT.eventoEdad} </p>
            <p className="text-center mt-2">Ubicacion: {freeT.provincia} - {freeT.localidad}: {freeT.direccion} </p>
            <div className="flex justify-around mt-9 mb-9">
            {cortesiasFiltradas.map((ticketsCortesia) => {
                const cantidad = rrppConMail?.ticketsCortesias.find(
                    t => t.ticketIdCortesia === ticketsCortesia._id?.toString()
                )?.cantidadDeCortesias || 0;
                
                return (
                        <div className="free-ticket-cont flex p-5 rounded-lg mb-9" key={ticketsCortesia._id}>
                            <img className="w-[250px] rounded-lg" src={ticketsCortesia.imgTicket} alt="" />
                            <div className="ml-6">
                                <label className="text-xl">{ticketsCortesia.nombreTicket}</label>
                                <form onSubmit={(e) => sendFreeFunc(e, ticketsCortesia._id)}>                         
                                    <div className="flex items-center mb-3">
                                            <p>Enviar cortesias:</p>
                                            <button className="ml-3 mr-3  text-2xl rounded-lg w-[50px]" onClick={(e) => restQuantity(e, ticketsCortesia._id)}>-</button>
                                            <p>{quantities[ticketsCortesia._id] || 0}</p>
                                            <button className="ml-3 mr-3  text-2xl rounded-lg w-[50px]" onClick={(e) => addQuantity(e, ticketsCortesia._id, cantidad)}>+</button>
                                    </div>                          
                                        <div className="flex items-center mb-2">
                                            <p>Mail:</p>
                                            <input className="ml-2 p-1 rounded-lg" type="email" name="clientMail" placeholder="..."></input>
                                        </div>
                                    <p>Cortesías disponibles: {cantidad}</p>
                                    <button className="bg-indigo-900! p-2 mt-2 cursor-pointer" type="submit">Enviar cortesias</button>
                                </form>
                            </div>
                        </div>
                );
            })}
            </div>
        </div>
         )
    })}
        </>
    );
}

export default SendFree;