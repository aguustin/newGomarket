import { useContext, useEffect, useState } from "react"
import { useParams } from "react-router"
import { buyTicketsRequest, getEventToBuyRequest, getRelateEventsRequest } from "../../api/eventRequests"
import { formatDate, LoadingButton, MapComponent, Message, Timer } from "../../globalscomp/globalscomp"
import checkWhitePng from "../../assets/images/check-white.png"
import mapPng from "../../assets/botones/map.png"
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import UserContext from "../../context/userContext"
import { useNavigate } from "react-router"

const BuyTicket = () => {
    const {session} = useContext(UserContext)
    const {prodId, emailHash} = useParams()
    const [prod, setProd] = useState([])
    const [quantities, setQuantities] = useState({});
    const [totalQuantity, setTotalQuantity] = useState(0)
    const [showMsg, setShowMsg] = useState(0)
    const [loading, setLoading] = useState(false)
    const [showMap, setShowMap] = useState(false)
    const [relates, setRelates] = useState([])
    const navigate = useNavigate()

 useEffect(() => {
  // Si session aún no está disponible, no hacer nada
  if (!session) return;

  // Si userFinded aún no se cargó, esperar
  if (!Array.isArray(session.userFinded)) return;

  // Si la sesión es inválida (array vacío), redirigir
  if (session.userFinded.length === 0) {
    console.log('Sesión inválida');
    navigate('/');
    return;
  }

  const fetchData = async () => {
    try {
      const resEvent = await getEventToBuyRequest(prodId);
      setProd(resEvent.data);

      const resRelated = await getRelateEventsRequest(prodId);
      setRelates(resRelated.data.relacionados);
    } catch (error) {
      console.error('Error al obtener eventos:', error);
    }
  };

  fetchData();
}, [session, prodId, navigate]);

    const currencyFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
});

console.log(prod)
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
    const addQuantity = (e, ticketId, limit, cantidad) => {
        e.preventDefault();
        setQuantities(prev => {
            const current = prev[ticketId] || 0;
            const maxLimit = limit !== undefined ? limit : 20; // Usa 20 si no hay limit (tickets pagos)
            if (current < maxLimit && current < cantidad) {
                setTotalQuantity(totalQuantity + 1);
            
                return {
                    ...prev,
                    [ticketId]: current + 1,
                };
            }

            return prev;
        });
    };

    const total = prod.flatMap(p => p.tickets).reduce((acc, tck) => {
        const qty = quantities[tck._id] || 0;
        return acc + qty * tck.precio + (qty * tck.precio) / 10;
    }, 0);

    const buyTickets = async (e) => {
        e.preventDefault();
        const mail = e.target.elements.mail.value;
        const repetirMail = e.target.elements.repetirMail.value
        const nombreCompleto = e.target.elements.nombreCompleto.value
        const dni = e.target.elements.dni.value

        const hasTickets = Object.values(quantities).some(value => parseInt(value) > 0);
        
        if (!hasTickets) {
            setShowMsg(1)
            return; // Detiene la ejecución si todos son <= 0
        }
        if(mail.length <= 0 || repetirMail.length <= 0 || nombreCompleto.length <= 0 || dni.length <= 0){
            setShowMsg(2)
            return;
        }

        if(mail !== repetirMail){
            setShowMsg(3)
            return;
        }
        
        try {
            const data = await buyTicketsRequest(prodId, prod[0].nombreEvento, quantities, mail, 1, total, emailHash, nombreCompleto, dni);
            
            if (!data?.init_point) {
                console.log('entro aca en sin init_point')
                return;
            }
            setLoading(false)
            window.location.href = data.init_point;
        } catch (error) {
            console.error("Error en handlePayment:", error);
        }
    }
    
    return(
         
        <div className="buy-tickets-container relative mx-12 mt-[30px] bg-white border-[1px] border-gray-100 rounded-2xl p-5 mb-8">
            {prod.map((p) => 
            <div className="relative flex flex-wrap justify-center" key={p._id}>
                        <div>
                            <h2 className="text-center text-2xl font-bold">COMPRAR TICKETS</h2>
                            <img className="h-[320px] object-cover rounded-lg mt-3" src={p.imgEvento} alt="" loading="lazy"></img>   
                        </div>
                        <div className="desc-and-map text-left ml-4 mt-9">
                            <h2 className="text-xl text-[#111827]">Evento: {p.nombreEvento}</h2>
                            <p className="mb-2 secondary-p">Dirección: {p.direccion}</p>
                            <div className="flex items-center mt-2">
                                <p className="secondary-p">Fecha de inicio: {formatDate(p.fechaInicio) }</p>
                                <p className="ml-3 secondary-p">Fecha de cierre: {formatDate(p.fechaFin) }</p>
                            </div>
                            <div className="flex items-center mt-2">
                                <p className="secondary-p">Artistas: {p.artistas}</p>
                            </div>
                            <div className="mb-2">
                                <p className="secondary-p mt-3 text-sm">{p.descripcionEvento}</p>
                                {p?.aviso?.length > 0 && <p className="primary-p mt-3 text-sm bg-pink-400! p-2">{p.aviso}</p> }
                            </div>
                            <button className="text-[#111827] flex items-center mb-2 rounded-lg bg-orange-500! p-2" onClick={() => setShowMap(!showMap)}><img className="mr-2" src={mapPng} alt=""></img>{showMap ? 'Ocultar mapa' : 'Ver mapa'}</button>
                            {showMap && <MapComponent className="mx-2" provincia={p.provincia} direccion={p.direccion} />}
                            <img className="w-[70%] mx-auto mt-3 mb-3" src={p.bannerEvento} alt=""></img>
                        </div>
                    </div>
            )}
            <form className="form-buy-inputs mt-6" onSubmit={(e) => buyTickets(e)}>
                <div className="flex flex-wrap items-center justify-center">
                    <div className="w-[30%] min-w-[265px]! mx-2 mb-2! border-[1px] border-gray-200 rounded-2xl p-2">
                        <label className="text-MD">NOMBRE:</label><br></br>
                        <input className="w-[100%]" type="text" name="nombreCompleto" placeholder="..."></input>
                    </div>
                    <div className="w-[30%] min-w-[265px]! mx-2 mb-2! border-[1px] border-gray-200 rounded-2xl p-2">
                        <label className="text-MD">EMAIL:</label><br></br>
                        <input className="w-[100%]" type="email" name="mail" placeholder="example@gmail.com"></input>
                    </div>
                     <div className="w-[30%] min-w-[265px]! mx-2 mb-2! border-[1px] border-gray-200 rounded-2xl p-2">
                        <label className="text-MD">REPETIR EMAIL:</label><br></br>
                        <input className="w-[100%]" type="email" name="repetirMail" placeholder="example@gmail.com"></input>
                    </div>
                    <div className="w-[30%] min-w-[265px]! mx-2 border-[1px] border-gray-200 rounded-2xl p-2">
                        <label className="text-MD">DNI:</label><br></br>
                        <input className="w-[100%]" type="number" name="dni" placeholder="..."></input>
                    </div>
                </div>
                <div>
                    <Timer duration={720000}></Timer>
                </div>
                
            <div> 
              {prod.map((p) => {
                    return (
                        <>
                            <div>
                                <img className="w-[350px] mx-auto mt-10" src={p.imagenDescriptiva} alt=""></img>
                            </div>
                            <div className="cortesies-desc-container mt-6 text-center max-h-[432px]! mb-10">
                            {p.tickets.filter((tck) => tck.estado !== 2).map((tck, i) => (
                                <div className="flex justify-center mx-auto text-center" key={tck._id}>
                                    <div className="tickets-desc-container w-full flex flex-wrap items-center mb-3 p-1!">
                                        <div className="flex items-center w-full justify-between">
                                            <div className="flex items-center">
                                                <img className="ticket-img w-[60px] h-[60px] ml-1" src={tck.imgTicket} alt="" loading="lazy"></img>
                                                <div className="buy-tickets-name-date block text-left">
                                                    <p className="primary-p text-md ml-3">{tck.nombreTicket}</p>
                                                    <p className="secondary-p text-md ml-3">Valido hasta: {formatDate(tck.fechaDeCierre)}</p>
                                                    <p className="secondary-p text-[13px]! ml-3">{tck.descripcionTicket}</p>
                                                </div>
                                            </div>
                                                {tck.cantidad >= 1 ? 
                                            <div className="flex flex-wrap items-center justify-center mx-auto">
                                                <div className="buy-tickets-price">
                                                    <p className="ml-2 mr-2 text-sm secondary-p">${tck.precio} c/u</p>
                                                </div>
                                                <div className="summary-buttons-buy-tickets flex items-center justify-between w-[150px] border-[1px] border-gray-200 rounded-xl ">
                                                    <button
                                                        className="bg-transparent text-xl text-[#111827] primary-p cursor-pointer rounded-l-xl w-[40px] h-[40px]  text-[#111827]!"
                                                        onClick={(e) => restQuantity(e, tck._id, tck.limit)}
                                                    >
                                                        -
                                                    </button>
                                                    <p className="text-md w-[50px] secondary-p">{quantities[tck._id] || 0}</p>
                                                    <button
                                                        className=" text-xl bg-orange-500 cursor-pointer rounded-r-xl w-[40px] h-[40px] text-[#111827]!"
                                                        onClick={(e) => addQuantity(e, tck._id, tck.limit, tck.cantidad)}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <div>
                                                    <p className="buy-ticket-total-p-tck primary-p mx-3">Total: {currencyFormatter.format((quantities[tck._id] || 0) * tck.precio)}</p> 
                                                </div>
                                            </div>
                                                : 
                                                <div className="flex flex-wrap items-center justify-center mx-auto">
                                                    <div className="flex items-center justify-between w-[150px]">
                                                    <p className="text-[#111827] bg-gray-300 p-2 rounded-xl">Agotado</p>
                                                    </div>
                                                </div>
                                                }
                                        </div>
                                    
                                    </div>
                                </div>
                            ))}
                            {p.cortesiaRRPP.filter((crt) => crt.estado !== 2).map((crt) => (
                                <div className="flex justify-center mx-auto text-center" key={crt._id}>
                                    <div className="tickets-desc-container w-full flex flex-wrap items-center mb-3 p-1!">
                                        <div className="flex items-center w-full justify-between">
                                           <div className="flex items-center">
                                            <img className="ticket-img w-[60px] h-[60px] ml-1" src={crt.imgTicket} alt="" loading="lazy"></img>
                                            <div className="block text-left">
                                                <p className="primary-p text-md ml-3">{crt.nombreTicket} </p>
                                                <p className="secondary-p text-md ml-3">Valido hasta: {formatDate(crt.fechaDeCierre)}</p>
                                                <p className="secondary-p text-[13px]! ml-3">{crt.descripcionTicket}</p>
                                            </div>
                                        </div>
                                            <div className="flex flex-wrap items-center justify-center mx-auto">
                                                <div className="buy-tickets-price mr-3">
                                                    <p className="ml-2 text-sm secondary-p">Disponibles: {crt.limit}</p>
                                                </div>
                                                <div className="summary-buttons-buy-tickets flex items-center justify-between w-[150px] border-[1px] border-gray-200 rounded-xl ">
                                                    <button
                                                        className="bg-transparent text-xl text-[#111827] primary-p cursor-pointer rounded-l-xl w-[40px] h-[40px]  text-[#111827]!"
                                                        onClick={(e) => restQuantity(e, crt._id, crt.limit)}
                                                    >
                                                        -
                                                    </button>
                                                    <p className="text-md w-[50px] secondary-p">{quantities[crt._id] || 0}</p>
                                                    <button
                                                        className="text-xl bg-orange-500 cursor-pointer rounded-r-xl w-[40px] h-[40px] text-[#111827]!"
                                                        onClick={(e) => addQuantity(e, crt._id, crt.limit, crt.cantidadDeCortesias)}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <div className="buy-tickets-price mr-3">
                                                        <p className="ml-2 text-md primary-p">Cortesias</p>
                                                </div>
                                            </div>
                                        </div>
                                     
                                    </div>
                                </div>
                            ))}
                            </div>
                        </>
                    );
                })}
                </div>
                <div className="relative h-[120px]">
                    <p className="absolute top-[-30px] right-6 text-2xl primary-p">Total:{currencyFormatter.format(total)}</p>
                    {showMsg === 1 && <p className="text-md text-orange-500! h-[0px]">Debes agregar al menos un ticket</p>}
                    {showMsg === 2 && <p className="text-md text-orange-500! h-[0px]">Debes llenar todos los campos</p>}
                    {showMsg === 3 && <p className="text-md text-orange-500! h-[0px]">Los emails no coinciden</p>}
                    <button className="buy-butt primary-button w-[300px] mx-auto flex items-center justify-center bottom-3 mt-16 p-4 rounded-3xl cursor-pointer text-2xl" type="submit"><img className="mr-3" src={checkWhitePng} alt=""></img>{ loading ? <LoadingButton/> : 'Comprar'}</button>
                </div>
            </form>
        </div>
    )
}

export default BuyTicket