import { useContext, useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { buyTicketsRequest, getEventToBuyRequest, getRelateEventsRequest } from "../../api/eventRequests"
import { formatDate, formatDateB, LoadingButton, MapComponent, Message, Timer } from "../../globalscomp/globalscomp"
import checkWhitePng from "../../assets/images/check-white.png"
import mapPng from "../../assets/botones/map.png"
import copyPng from "../../assets/botones/copy.png"
import UserContext from "../../context/userContext"
import { useNavigate } from "react-router"
import calendarPng from "../../assets/images/calendar.png"

const BuyTicket = () => {
    const {session, setSession} = useContext(UserContext)
    const {prodId, emailHash} = useParams()
    const [prod, setProd] = useState([])
    const [quantities, setQuantities] = useState({});
    const [totalQuantity, setTotalQuantity] = useState(0)
    const [showMsg, setShowMsg] = useState(0)
    const [loading, setLoading] = useState(false)
    const [showMap, setShowMap] = useState(false)
    const [relates, setRelates] = useState([])
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [showBanner, setShowBanner] = useState(false)
    const navigate = useNavigate()

 useEffect(() => {

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


 const restQuantity = (e, ticketId) => {
  e.preventDefault();

  setQuantities(prev => {
    const current = prev[ticketId];

    // Si no existe ese ticket, no hacemos nada
    if (!current) return prev;

    const newAmount = current.amount - 1;

    // Si el nuevo amount es 0 o menor → eliminar ese ticket del objeto
    if (newAmount <= 0) {
      const updated = { ...prev };
      delete updated[ticketId];
      return updated;
    }

    // Sino, simplemente actualizamos el amount
    return {
      ...prev,
      [ticketId]: {
        ...current,
        amount: newAmount
      }
    };
  });

  // Actualizamos el total
  setTotalQuantity(prevTotal => Math.max(prevTotal - 1, 0));
};

const addQuantity = (e, ticketId, limit, cantidad, free) => {
  e.preventDefault();
  setQuantities(prev => {
    const currentObj = prev[ticketId] || { amount: 0, free: false };
    const maxLimit = limit !== undefined ? limit : 30;

    if (currentObj.amount < maxLimit && currentObj.amount < cantidad) {
      setTotalQuantity(prev => prev + 1);
      return {
          ...prev,
          [ticketId]: {
              amount: currentObj.amount + 1,
              free: free || currentObj.free 
            }
        };
    }
    
    return prev;
});
};

console.log(quantities)

    const total = prod.flatMap(p => p.tickets).reduce((acc, tck) => {
        const qty = quantities[tck._id]?.amount || 0;
        return acc + qty * tck.precio + (qty * tck.precio) / 10;
    }, 0);

    const buyTickets = async (e) => {
        e.preventDefault();
        const mail = e.target.elements.mail.value;
        const repetirMail = e.target.elements.repetirMail.value
        const nombreCompleto = e.target.elements.nombreCompleto.value
        const dni = e.target.elements.dni.value

        const hasTickets = Object.values(quantities).some(value => parseInt(value?.amount) > 0);
        
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
            setLoading(true)
            const data = await buyTicketsRequest(prodId, prod[0].nombreEvento, quantities, mail, 1, total, emailHash, nombreCompleto, dni);
            
            if (!data?.init_point) {
                console.log('entro aca en sin init_point')
                return;
            }
          /*  const updateSessionInfo = await getUserProfileRequest(session?.userFinded[0]?._id)

            if (updateSessionInfo.length > 0) {
                localStorage.setItem('session', JSON.stringify(updateSessionInfo?.data));
                const sess = JSON.parse(localStorage.getItem('session'))
                setSession(sess);
            } LO ULTIMO AGREGADO!!*/ 
            setLoading(false)
            window.location.href = data.init_point;
        } catch (error) {
            setLoading(false)
            console.error("Error en handlePayment:", error);
        }
    }

   const handleEventChange = (eventId) => {
        if (eventId === '') {
            setSelectedEvent(null);
        } else {
            const foundEvent = relates.find((rel) => rel._id === eventId);
            setSelectedEvent(foundEvent);
        }
    };

    const eventToRender = selectedEvent || prod[0];
    
    return(
         
        <div className="buy-tickets-container relative mx-12 mt-[30px] bg-white border-[1px] border-gray-100 rounded-2xl p-5 mb-8">
            {prod.map((p) => 
            <div className="relative flex flex-wrap justify-center" key={p._id}>
                        <div className="w-full">
                            <div className="w-full bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-lg">
                                <h2 className="text-white! text-center text-2xl font-bold flex items-center justify-center">
                                    <span className="text-4xl mr-3">🎟️</span>
                                    COMPRAR TICKETS
                                </h2>
                            </div>
                            <div className="flex justify-center">
                                <img className="h-[320px] object-cover rounded-lg mt-3" src={p.imgEvento} alt="" loading="lazy"></img>   
                            </div>
                        </div>
                        <div className="desc-and-map text-left ml-4 mt-9">
                            <h2 className="text-xl text-[#111827] mb-2">Evento: {p.nombreEvento}</h2>
                            <p className="mb-2 secondary-p">Dirección: {p.direccion}</p>
                            <div className="flex items-center mt-2">
                                <p className="secondary-p">Fecha de inicio: {formatDate(p.fechaInicio) }</p>
                                <p className="ml-3 secondary-p">Fecha de cierre: {formatDate(p.fechaFin) }</p>
                            </div>
                            <div className="flex items-center mt-2">
                                <p className="secondary-p">Artistas: {p.artistas}</p>
                            </div>
                            <div className="mb-3">
                                <p className="secondary-p mt-3 text-sm">{p.descripcionEvento}</p>
                                {p?.aviso?.length > 0 && <p className="primary-p mt-3 text-sm bg-pink-200! p-2">{p.aviso}</p> }
                            </div>
                            <div className="flex flex-wrap items-center">
                                <button className="buy-buttons w-[auto] text-white flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-5 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg" onClick={() => setShowMap(!showMap)}><img className="mr-1" src={mapPng} alt=""></img>{showMap ? 'Ocultar mapa' : 'Ver mapa'}</button>
                                <button className="buy-buttons w-[auto] text-white flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-5 py-2 ml-2 rounded-xl  transition-all duration-300 transform hover:scale-105 shadow-lg" onClick={() => navigator.clipboard.writeText(window.location.href)}><img className="mr-1" src={copyPng} alt=""></img>Copiar enlace</button>
                               {p?.linkVideo?.length > 0 && <a href={`${p.linkVideo}`} className="buy-buttons w-[169.94px]! text-white flex items-center rounded-xl bg-orange-500! p-2 ml-2  transition-all duration-300 hover:scale-105 shadow-lg" >Video promocional</a> }
                            </div>
                            {showMap && <MapComponent className="mx-2" provincia={p.provincia} direccion={p.direccion} />}
                        </div>
                           {p.bannerEvento && 
                           <div className="relative w-[100%] h-[300px] hover:brightness-80 hover:cursor-pointer duration-100 ease-linear group">
                               <img onClick={() => setShowBanner(true)} className="relative w-[100%] h-[300px] flex-start object-cover mx-auto mt-5" src={p.bannerEvento ?? ''} alt=""></img>
                              <p onClick={() => setShowBanner(true)}  className="buy-buttons p-3 rounded-lg absolute bottom-3 right-3 cursor-pointer opacity-0 group-hover:opacity-100">Ver banner completo</p>
                           </div> }
                           {showBanner &&
                           <>
                                <div onClick={() => setShowBanner(false)} className="fixed z-[6] bg-black h-screen  top-[0%] w-screen opacity-[0.5]"></div> 
                                <img onClick={() => setShowBanner(false)} className="top-40 fixed flex-start object-contain mx-auto mt-5 z-[7]" src={p.bannerEvento ?? ''} alt=""></img>
                           </>
                           }
                    </div>
            )}
            <form className="form-buy-inputs mt-16" onSubmit={(e) => buyTickets(e)}>
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
                    <div className="w-[30%] min-w-[265px]! mx-2 border-[1px] border-gray-200 rounded-2xl p-2">
                        <label className="text-MD">Telefono:</label><br></br>
                        <input className="w-[100%]" type="number" name="telefono" placeholder="..."></input>
                    </div>
                </div>
                <div className="mt-6 p-4 rounded-xl text-center" >
                    <Timer duration={720000}></Timer>
                </div>
                
            <div> 
              {eventToRender && (
                        <>
                            <div >
                                <img className="w-[350px] mx-auto mt-5" src={prod?.[0]?.imagenDescriptiva} alt=""></img>
                            </div>
                           {relates.length > 0  && 
                           <>
                           <p className="secondary-p max-[450px]:text-center">Filtrar tickets por fecha:</p>
                           <div className="max-[780px]:text-center! max-[450px]:justify-center mt-1 flex flex-wrap items-center">
                                <select className="w-auto mt-1 mb-3 bg-[#f4f4f4] p-3 border border-gray-300 rounded-lg appearance-none" name="otrasFechas" onChange={(e) => handleEventChange(e.target.value)}>
                                    <option value=''>Cambiar fecha</option>
                                    {relates.map((rel) => (<option key={rel._id} value={rel._id}>{rel.nombreEvento} - {formatDateB(rel.fechaInicio)}</option>))}
                                </select>
                                <Link className="w-[101.5px]! ml-3! secondary-button-fucsia text-white! rounded-lg p-2" to={{ pathname: `/buy_tickets/${eventToRender._id}/${eventToRender.prodMail}` }}>Ir a evento</Link>
                            </div> 
                           </> }
                            <div className="cortesies-desc-container mt-6 text-center max-h-[432px]! mb-6">
                            {eventToRender.tickets.filter((tck) => tck.estado !== 2).map((tck, i) => (
    <div key={tck._id} className="flex justify-center mx-auto text-center">
      <div className="w-full mb-3 p-4 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-100 rounded-2xl hover:shadow-lg transition-all duration-300">

        <div className="flex items-center justify-between flex-wrap gap-4">

          {/* Imagen + nombre + descripción */}
          <div className="flex items-center space-x-4 min-w-[200px]">
            <img 
              className="w-16 h-16 rounded-xl object-cover shadow-md" 
              src={tck.imgTicket} 
              alt="Ticket"
              loading="lazy"
            />

            <div className="text-left">
              <p className="text-gray-800 text-md">{tck.nombreTicket}</p>
              <p className="text-sm text-gray-500">Válido hasta: {formatDate(tck.fechaDeCierre)}</p>
              <p className="text-xs text-gray-500 max-w-[260px]">{tck.descripcionTicket}</p>
            </div>
          </div>

          {/* Precio + fecha */}
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <p className="text-xs text-gray-500 font-medium">Precio</p>
              <p className="text-sm text-gray-800">${tck.precio} c/u</p>
            </div>

            <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
              <img className="h-5 w-5" src={calendarPng} alt="" />
               <p className="text-sm text-gray-600 font-medium">
                {formatDate(tck.fechaDeCierre)}
              </p>
            </div>
          </div>

          {/* Cantidades */}
          {tck.cantidad >= 1 ? (
            <div className="flex items-center space-x-2 bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
              <button
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-all active:scale-95" 
                onClick={(e) => restQuantity(e, tck._id, tck.limit)}
              >
                -
              </button>

              <div className="w-14 text-center">
                <p className="text-md text-gray-800">
                  {quantities[tck._id]?.amount || 0}
                </p>
              </div>

              <button
                className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-lg text-white transition-all active:scale-95 shadow-md" 
                onClick={(e) => addQuantity(e, tck._id, tck.limit, tck.cantidad)}
              >
                +
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 bg-red-100 border border-red-300 px-4 py-2 rounded-xl shadow-sm">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11V5a1 1 0 10-2 0v2a1 1 0 002 0zm0 8v-6a1 1 0 10-2 0v6a1 1 0 002 0z" clipRule="evenodd"/>
                </svg>
                <p className="text-red-700 font-semibold">Agotado</p>
            </div>
          )}
          {tck.cantidad >= 1 && (
            <p className="text-gray-800 font-medium text-sm mt-2">
              {currencyFormatter.format((quantities[tck._id]?.amount || 0) * tck.precio)}
            </p>
          )}

        </div>
      </div>
    </div>
))}
                           {eventToRender.cortesiaRRPP
  .filter((crt) => crt.estado !== 2)
  .map((crt) => {
    const userCortesia = session?.userFinded?.[0]?.cortesias?.find(
      c => c.cortesiaId === crt._id
    );

    const isDisabled = userCortesia && userCortesia.qty >= crt.limit;

    return (
      <div
        key={crt._id}
        className={`flex justify-center mx-auto text-center ${isDisabled ? "opacity-50 pointer-events-none" : ""}`}
      >
        <div className="w-full mb-3 p-5 bg-gradient-to-r from-gray-50 to-white border-2 border-gray-100 rounded-2xl hover:shadow-lg transition-all duration-300">

          <div className="flex items-center justify-between flex-wrap gap-4">

            {/* Imagen + nombre + desc */}
            <div className="flex items-center space-x-4 min-w-[200px]">
              <img
                className="w-16 h-16 rounded-xl object-cover shadow-md"
                src={crt.imgTicket}
                alt="Ticket"
                loading="lazy"
              />

              <div className="text-left">
                <p className="text-gray-800 text-md">{crt.nombreTicket}</p>
                <p className="text-sm text-gray-500">
                  Válido hasta: {formatDate(crt.fechaDeCierre)}
                </p>
                <p className="text-xs text-gray-500 max-w-[260px]">
                  {crt.descripcionTicket}
                </p>
              </div>
            </div>

            {/* Disponibles + fecha */}
            <div className="flex items-center space-x-6">

              <div className="text-center">
                <p className="text-xs text-gray-500 font-medium">Disponibles</p>
                <p className="text-md text-gray-800">{crt.limit}</p>
              </div>

              <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
                <img className="h-5 w-5" src={calendarPng} alt="" />
                <p className="text-sm text-gray-600 font-medium">
                  {formatDate(crt.fechaDeCierre)}
                </p>
              </div>
            </div>

            {/* Controles */}
            {crt.cantidadDeCortesias >= 1 ? (
            <div className="flex items-center space-x-2 bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
              <button
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-all active:scale-95"
                onClick={(e) => restQuantity(e, crt._id, crt.limit)}
              >
                -
              </button>

              <div className="w-14 text-center">
                <p className="text-md text-gray-800">
                  {quantities[crt._id]?.amount || 0}
                </p>
              </div>

              <button
                className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg text-white transition-all active:scale-95 shadow-md"
                onClick={(e) =>
                  addQuantity(e, crt._id, crt.limit, crt.cantidadDeCortesias, true)
                }
              >
                +
              </button>
            </div>
            ):(
             
            <div className="flex items-center space-x-2 bg-red-100 border border-red-300 px-4 py-2 rounded-xl shadow-sm">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11V5a1 1 0 10-2 0v2a1 1 0 002 0zm0 8v-6a1 1 0 10-2 0v6a1 1 0 002 0z" clipRule="evenodd"/>
                </svg>
                <p className="text-red-700 font-semibold">Agotado</p>
            </div>
            )}
            {crt.cantidadDeCortesias >= 1 && (<p className="text-green-800 font-medium text-sm mt-2">
              Cortesia
            </p>)}
          </div>
        </div>
      </div>
    );
  })}

                            </div>
                        </>
                   
                )}
                </div>
                <div className="relative h-[auto]">
                    {showMsg === 1 && <p className="text-md text-orange-500! h-[0px]">Debes agregar al menos un ticket</p>}
                    <p className="text-center text-xl primary-p">Total:{currencyFormatter.format(total)}</p>
                    {showMsg === 2 && <p className="text-md text-orange-500! h-[0px]">Debes llenar todos los campos</p>}
                    {showMsg === 3 && <p className="text-md text-orange-500! h-[0px]">Los emails no coinciden</p>}
                    <p className="text-center text-gray-400! mt-3 text-sm">En caso de no realizarse el evento o este no cumplir con algún aspecto fundamental del mismo GoTicket regresará el valor de las entradas No así el cargo por servicio.</p>
                    <button className="flex items-center w-[auto] mx-auto mt-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg px-12 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl" type="submit"><img className="mr-3" src={checkWhitePng} alt=""></img>{ loading ? <LoadingButton/> : 'Comprar'}</button>
                </div>
            </form>
        </div>
    )
}

export default BuyTicket