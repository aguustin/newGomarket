import { useEffect, useState } from "react"
import { useParams } from "react-router"
import { buyTicketsRequest, getEventToBuyRequest } from "../../api/eventRequests"
import { formatDate } from "../../globalscomp/globalscomp"

const BuyTicket = () => {
    const {prodId, emailHash} = useParams()
    const [prod, setProd] = useState([])
    const [quantities, setQuantities] = useState({});
    const [totalQuantity, setTotalQuantity] = useState(0)
    console.log(emailHash)

    useEffect(() => {
            const getOneEvent = async () => {
                const res = await getEventToBuyRequest(prodId)
                setProd(res.data)
            }
            getOneEvent()
    }, [])

 const restQuantity = (e, ticketId) => {
    e.preventDefault();
    setQuantities(prev => {
        const current = prev[ticketId] || 0;
        if (current > 0) {
            setTotalQuantity(totalQuantity - 1);
            return {
                ...prev,
                [ticketId]: current - 1
            };
        }

        return prev;
    });
};
    const addQuantity = (e, ticketId, limit) => {
    e.preventDefault();
    setQuantities(prev => {
        const current = prev[ticketId] || 0;
        const maxLimit = limit !== undefined ? limit : 20; // Usa 20 si no hay limit (tickets pagos)

        if (current < maxLimit) {
            setTotalQuantity(totalQuantity + 1);

            return {
                ...prev,
                [ticketId]: current + 1,
            };
        }

        console.warn(`No se pueden seleccionar más de ${maxLimit} entradas para este ticket.`);
        return prev;
    });
};

    const total = prod.flatMap(p => p.tickets).reduce((acc, tck) => {
        const qty = quantities[tck._id] || 0;
        return acc + qty * tck.precio;
    }, 0);

    const buyTickets = async (e) => {
            try {
                e.preventDefault();
                const mail = e.target.elements.mail.value;
                const nombreCompleto = e.target.elements.nombreCompleto.value
                const dni = e.target.elements.dni.value
                const data = await buyTicketsRequest(prodId, prod[0].nombreEvento, quantities, mail, 1, total, emailHash, nombreCompleto, dni);

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
        <div className="buy-ticket mx-auto mt-10 mb-10 text-center max-w-[500px]">
            {prod.map((p) => 
            <div key={p._id}>
                <h2 className="text-3xl mb-3">{p.nombreEvento}</h2>
                <p className="mb-1">{p.direccion}</p>
                <p className="text-lg mb-5">{formatDate(p.fechaInicio)}</p>
                <img className="rounded-lg" src={p.imgEvento}></img>
            </div>
            )}
            <form onSubmit={(e) => buyTickets(e)}>
                <div className="mt-4">
                    <label className="text-xl">Nombre completo:</label><br></br>
                    <input type="text" name="nombreCompleto" placeholder="..."></input>
                </div>
                <div className="mt-4">
                    <label className="text-xl">Mail:</label><br></br>
                    <input type="email" name="mail" placeholder="example@gmail.com"></input>
                </div>
                <div className="mt-4">
                    <label className="text-xl">dni:</label><br></br>
                    <input type="number" name="dni" placeholder="..."></input>
                </div>
              {prod.map((p) => {
    return (
        <>
            {p.tickets.map((tck) => (
                <div key={tck._id}>
                    <div className="flex justify-center mt-6">
                        <label className="text-xl">{tck.nombreTicket}: </label>
                        <div className="flex items-center ">
                            <button
                                className="cursor-pointer bg-violet-900 pt-1 pb-1 pl-6 pr-6 rounded-lg ml-3 mr-3"
                                onClick={(e) => restQuantity(e, tck._id)}
                            >
                                -
                            </button>
                            <p className="text-xl">{quantities[tck._id] || 0}</p>
                            <button
                                className="cursor-pointer bg-violet-900 pt-1 pb-1 pl-6 pr-6 rounded-lg ml-3 mr-3"
                                onClick={(e) => addQuantity(e, tck._id)}
                            >
                                +
                            </button>
                            <p className="text-xl">Precio c/u: {tck.precio}</p>
                        </div>
                    </div>
                </div>
            ))}
            {p.cortesiaRRPP.map((crt) => (
                <div key={crt._id}>
                    <div className="flex justify-center mt-6">
                        <label className="text-xl">{crt.nombreTicket}: </label>
                        <div className="flex items-center ">
                            <button
                                className="cursor-pointer bg-violet-900 pt-1 pb-1 pl-6 pr-6 rounded-lg ml-3 mr-3"
                                onClick={(e) => restQuantity(e, crt._id, crt.limit)}
                            >
                                -
                            </button>
                            <p className="text-xl">{quantities[crt._id] || 0}</p>
                            <button
                                className="cursor-pointer bg-violet-900 pt-1 pb-1 pl-6 pr-6 rounded-lg ml-3 mr-3"
                                onClick={(e) => addQuantity(e, crt._id, crt.limit)}
                            >
                                +
                            </button>
                            <p className="text-xl">Precio c/u: {crt.precio}</p>
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
})}

                <p className="text-2xl mt-6">Total:${total}</p>
                <button className="bg-violet-900 p-4 mt-6 w-[280px] rounded-lg text-2xl cursor-pointer" type="submit">Comprar</button>
            </form>
       
        </div>
    )
}

export default BuyTicket