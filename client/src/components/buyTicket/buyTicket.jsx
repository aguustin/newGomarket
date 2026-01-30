import { useContext, useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { activeDiscountCodeRequest, buyTicketsRequest, getEventToBuyRequest, getRelateEventsRequest } from "../../api/eventRequests"
import { formatDate, formatDateB, LoadingButton, MapComponent, Message, Timer } from "../../globalscomp/globalscomp"
import checkWhitePng from "../../assets/images/check-white.png"
import mapPng from "../../assets/botones/map.png"
import copyPng from "../../assets/botones/copy.png"
import UserContext from "../../context/userContext"
import { useNavigate } from "react-router"
import calendarPng from "../../assets/images/calendar.png"
import goPng from "../../assets/bannerR.png"

const BuyTicket = () => {
    const {session} = useContext(UserContext)
    const {prodId, emailHash} = useParams()
    const [prod, setProd] = useState([])
    const [quantities, setQuantities] = useState({});
    // eslint-disable-next-line no-unused-vars
    const [totalQuantity, setTotalQuantity] = useState(0)
    const [discountCode, setDiscountValueCode] = useState(0)
    const [discountValue, setDiscountValue] = useState(0)
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
      if(!resEvent.data[0]?.active){
        navigate('/')
      }
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


let total = prod.reduce((accProd, p) => {
  const comision = p?.comisionServicio ?? 13; // 13% si no existe
  const totalTickets = p.tickets.reduce((accTck, tck) => {
    const qty = quantities[tck._id]?.amount || 0;
    const subtotal = qty * tck.precio;
    return accTck + subtotal + subtotal * (comision / 100);
  }, 0);
  return accProd + totalTickets;
}, 0);

const activeDiscountCode = async (e) => {
  e.preventDefault()
 
  if(discountCode?.length > 0){
    const res = await activeDiscountCodeRequest({prodId, discountCode})
    console.log(res)
    if(res.data.discount){
      setDiscountValue(res.data.discount.numeroDescuento)
      return console.log('bien, salio')
    }

    return console.log('no se encuentra el descuento')
  }
}



    /*const total = prod.flatMap(p => p.tickets).reduce((acc, tck) => { //version estable pero sin comision
        const qty = quantities[tck._id]?.amount || 0;
        return acc + qty * tck.precio + (qty * tck.precio) / 13/*tck?.comisionServicio;
    }, 0);*/

    const buyTickets = async (e) => {
        e.preventDefault();
        const mail = e.target.elements.mail.value;
        const repetirMail = e.target.elements.repetirMail.value
        const nombreCompleto = e.target.elements.nombreCompleto.value
        const dni = e.target.elements.dni.value
        const telefono = e.target.elements.telefono.value

        const hasTickets = Object.values(quantities).some(value => parseInt(value?.amount) > 0);
        
        if (!hasTickets) {
            setShowMsg(1)
            return;
        }
        if(mail.length <= 0 || repetirMail.length <= 0 || nombreCompleto.length <= 0 || dni.length <= 0 || telefono.length <= 0){
            setShowMsg(2)
            return;
        }

        if(mail !== repetirMail){
            setShowMsg(3)
            return;
        }
        
        try {
            setLoading(true)
            const data = await buyTicketsRequest(prodId, prod[0].nombreEvento, quantities, mail, 1, total, emailHash, nombreCompleto, dni, telefono);
            
            if (!data?.init_point) {
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
         
        <div className="buy-tickets-container relative mx-12 mt-[30px] border-[1px] border-gray-700 rounded-2xl p-5 mb-8 bg-gradient-to-br from-gray-800 to-gray-900">
            {prod.map((p) => 
            <div className="relative flex flex-wrap justify-center " key={p._id}>
                        <div className="w-full">
                            <div className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 p-6 rounded-t-lg">
                                <h2 className="text-[#111827] text-center text-2xl font-bold flex items-center justify-center">
                                    <span className="text-4xl mr-3">🎟️</span>
                                    COMPRAR TICKETS
                                </h2>
                            </div>
                        <div className="desc-and-map text-left ml-4 mt-9">
                            <h2 className="text-xl text-gray-200! mb-2">Evento: {p.nombreEvento}</h2>
                            <p className="mb-2 text-gray-400!">Dirección: {p.direccion}</p>
                            <div className="flex items-center mt-2">
                                <p className="text-yellow-500">Fecha de inicio: {formatDate(p.fechaInicio) }</p>
                                <p className="ml-3 text-yellow-500">Fecha de cierre: {formatDate(p.fechaFin) }</p>
                            </div>
                            <div className="flex items-center mt-2">
                                <p className="text-gray-400">Artistas: {p.artistas}</p>
                            </div>
                            <div className="mb-3">
                                <p className="text-gray-400 mt-3 text-sm">{p.descripcionEvento}</p>
                                {p?.aviso?.length > 0 && <p className="text-[#111827] mt-3 text-sm bg-gray-400! p-2 rounded-lg">{p.aviso}</p> }
                            </div>
                            <div className="flex flex-wrap items-center mb-2">
                                <button className="buy-buttons w-[auto] text-white flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-[#111827]! px-5 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg" onClick={() => setShowMap(!showMap)}><img className="mr-1" src={mapPng} alt=""></img>{showMap ? 'Ocultar mapa' : 'Ver mapa'}</button>
                                <button className="buy-buttons w-[auto] text-white flex items-center gap-2 bg-gradient-to-r from-orange-600 to-orange-500 text-[#111827]! px-5 py-2 ml-2 rounded-xl  transition-all duration-300 transform hover:scale-105 shadow-lg" onClick={() => navigator.clipboard.writeText(window.location.href)}><img className="mr-1" src={copyPng} alt=""></img>Copiar enlace</button>
                               {/*p?.linkVideo?.length > 0 && <a href={`${p.linkVideo}`} className="buy-buttons w-[169.94px]! text-white flex items-center rounded-xl bg-orange-500! p-2 ml-2  transition-all duration-300 hover:scale-105 shadow-lg" >Video promocional</a> */}
                            </div>
                            {showMap && <MapComponent className="mx-2" provincia={p.provincia} direccion={p.direccion} />}
                        </div>
                            <div className="flex justify-center mt-3">
                                <img className="h-[320px] object-cover rounded-lg mt-3" src={p.imgEvento} alt="" loading="lazy"></img>   
                            </div>
                        </div>
                           {p.bannerEvento && 
                           <div className="relative w-[100%] h-[300px] hover:brightness-80 hover:cursor-pointer duration-100 ease-linear group">
                               <img onClick={() => setShowBanner(true)} className="relative w-[100%] h-[300px] flex-start object-cover mx-auto mt-5" src={p.bannerEvento ?? ''} alt=""></img>
                              <p onClick={() => setShowBanner(true)}  className="buy-buttons p-3 rounded-lg absolute bottom-3 right-3 cursor-pointer opacity-0 group-hover:opacity-100">Ver banner completo</p>
                           </div> }
                           {showBanner &&
                           <>
                                <div onClick={() => setShowBanner(false)} className="fixed z-[6] bg-black h-screen top-[0%] w-screen opacity-[0.5]"></div> 
                                <img onClick={() => setShowBanner(false)} className="top-40 fixed flex-start object-contain mx-auto mt-5 z-[7]" src={p.bannerEvento ?? ''} alt=""></img>
                           </>
                           }
                    </div>
            )}
            <form className="form-buy-inputs " onSubmit={(e) => buyTickets(e)}>
                 <div> 
              {eventToRender && (
                        <>
                            <div >
                                <img className="w-[350px] mx-auto mt-5" src={prod?.[0]?.imagenDescriptiva} alt=""></img>
                            </div>
                           {relates.length > 0  && 
                           <>
                           <p className="text-gray-300! max-[450px]:text-center">Filtrar tickets por fecha:</p>
                           <div className="max-[780px]:text-center! max-[450px]:justify-center mt-1 flex flex-wrap items-center">
                                <select className="w-auto mt-1 mb-3 bg-gradient-to-r from-gray-950 to-gray-900 p-3 border border-gray-300 rounded-lg appearance-none text-gray-300!" name="otrasFechas" onChange={(e) => handleEventChange(e.target.value)}>
                                    <option className="bg-gray-950!" value=''>Cambiar fecha</option>
                                    {relates.map((rel) => (<option className="bg-gray-950!" key={rel._id} value={rel._id}>{rel.nombreEvento} - {formatDateB(rel.fechaInicio)}</option>))}
                                </select>
                                <Link className="w-[101.5px]! ml-3! text-[#111827]! bg-yellow-500 rounded-lg p-2 mb-2" to={{ pathname: `/buy_tickets/${eventToRender._id}/${eventToRender.prodMail}` }}>Ir a evento</Link>
                            </div> 
                           </> }
                            <div className="cortesies-desc-container mt-6 text-center max-h-[432px]! mb-6">
                            {eventToRender.tickets.filter((tck) => tck.estado !== 2).map((tck) => (
                            <div key={tck._id} className="flex justify-center mx-auto text-center">
                              <div className="w-full mb-3 p-4 bg-gray-800  border-2 border-gray-600 rounded-2xl hover:shadow-lg transition-all duration-300">

                                <div className="flex items-center justify-between flex-wrap gap-4">

                                  {/* Imagen + nombre + descripción */}
                                  <div className="flex items-center space-x-4 min-w-[200px]">
                                    <img 
                                      className="w-16 h-16 rounded-xl object-cover shadow-md" 
                                      src={tck.imgTicket ?? goPng} 
                                      alt="Ticket"
                                      loading="lazy"
                                    />

                                    <div className="text-left">
                                      <p className="text-gray-200 text-md">{tck.nombreTicket}</p>
                                      <p className="text-sm text-yellow-500">Válido hasta: {formatDate(tck.fechaDeCierre)}</p>
                                      <p className="text-xs text-gray-400 max-w-[260px] mt-1">{tck.descripcionTicket}</p>
                                    </div>
                                  </div>

                                  {/* Precio + fecha */}
                                  <div className="flex items-center space-x-6">
                                    <div className="text-center">
                                      <p className="text-xs text-gray-300 font-medium">Precio</p>
                                      <p className="text-sm text-gray-200">${tck.precio} c/u</p>
                                    </div>

                                    <div className="flex items-center space-x-2 bg-gray-700 px-4 py-2 rounded-lg border border-gray-600">
                                      <img className="h-5 w-5" src={calendarPng} alt="" />
                                      <p className="text-sm text-gray-200 font-medium">
                                        {formatDate(tck.fechaDeCierre)}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Cantidades */}
                                  {/*tck.cantidad >= 1 && */ tck.estado !== 4 && !eventToRender?.soldOut ? (
                                    <div className="flex items-center space-x-2 bg-gray-700 rounded-xl p-1 border border-gray-200 shadow-sm">
                                      <button
                                        className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-all active:scale-95" 
                                        onClick={(e) => restQuantity(e, tck._id, tck.limit)}
                                      >
                                        -
                                      </button>

                                      <div className="w-14 text-center">
                                        <p className="text-md text-white!">
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
                                  {tck.cantidad >= 1 && eventToRender?.soldOut === false && (
                                    <p className="text-gray-800 font-medium text-sm mt-2">
                                      {currencyFormatter.format((quantities[tck._id]?.amount || 0) * tck.precio)}
                                    </p>
                                  )}

                                </div>
                              </div>
                            </div>
))}

{/**eventToRender.cortesiaRRPP iba aca */}
                            </div>
                        </>
                   
                )}
                </div>
                <div className="flex flex-wrap items-center justify-center">
                    <div className="w-[30%] min-w-[265px]! mx-2 mb-2! border-[1px] border-yellow-500 rounded-2xl p-2">
                        <label className="text-MD text-gray-300!">NOMBRE COMPLETO:</label><br></br>
                        <input className="w-[100%] text-gray-200!" type="text" name="nombreCompleto" placeholder="..."></input>
                    </div>
                    <div className="w-[30%] min-w-[265px]! mx-2 mb-2! border-[1px] border-yellow-500 rounded-2xl p-2">
                        <label className="text-MD text-gray-300!">EMAIL:</label><br></br>
                        <input className="w-[100%] text-gray-200!" type="email" name="mail" placeholder="example@gmail.com"></input>
                    </div>
                     <div className="w-[30%] min-w-[265px]! mx-2 mb-2! border-[1px] border-yellow-500 rounded-2xl p-2">
                        <label className="text-MD text-gray-300!">REPETIR EMAIL:</label><br></br>
                        <input className="w-[100%] text-gray-200!" type="email" name="repetirMail" placeholder="example@gmail.com"></input>
                    </div>
                    <div className="w-[30%] min-w-[265px]! mx-2 mb-2! border-[1px] border-yellow-500 rounded-2xl p-2">
                        <label className="text-MD text-gray-300!">DNI:</label><br></br>
                        <input className="w-[100%] text-gray-200!" type="number" name="dni" placeholder="..."></input>
                    </div>
                    <div className="w-[30%] min-w-[265px]! mx-2 border-[1px] border-yellow-500 rounded-2xl p-2">
                        <label className="text-MD text-gray-300!">CONTACTO:</label><br></br>
                        <input className="w-[100%] text-gray-200!" type="number" name="telefono" placeholder="..."></input>
                    </div>
                </div>
                <div className="flex items-center mt-4">
                  <p>Codigo de descuento:</p>
                  <input className="border-[1px] border-gray-400 rounded-lg p-2 ml-1 text-gray-300!" type="text" onChange={(e) => setDiscountValueCode(e.target.value)}></input>
                  <button className="flex items-center py-2 px-3 ml-2 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg" type="button" onClick={(e) => activeDiscountCode(e)}>
                    <svg viewBox="0 0 24 24" width={24} className="mr-1" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M3.9889 14.6604L2.46891 13.1404C1.84891 12.5204 1.84891 11.5004 2.46891 10.8804L3.9889 9.36039C4.2489 9.10039 4.4589 8.59038 4.4589 8.23038V6.08036C4.4589 5.20036 5.1789 4.48038 6.0589 4.48038H8.2089C8.5689 4.48038 9.0789 4.27041 9.3389 4.01041L10.8589 2.49039C11.4789 1.87039 12.4989 1.87039 13.1189 2.49039L14.6389 4.01041C14.8989 4.27041 15.4089 4.48038 15.7689 4.48038H17.9189C18.7989 4.48038 19.5189 5.20036 19.5189 6.08036V8.23038C19.5189 8.59038 19.7289 9.10039 19.9889 9.36039L21.5089 10.8804C22.1289 11.5004 22.1289 12.5204 21.5089 13.1404L19.9889 14.6604C19.7289 14.9204 19.5189 15.4304 19.5189 15.7904V17.9403C19.5189 18.8203 18.7989 19.5404 17.9189 19.5404H15.7689C15.4089 19.5404 14.8989 19.7504 14.6389 20.0104L13.1189 21.5304C12.4989 22.1504 11.4789 22.1504 10.8589 21.5304L9.3389 20.0104C9.0789 19.7504 8.5689 19.5404 8.2089 19.5404H6.0589C5.1789 19.5404 4.4589 18.8203 4.4589 17.9403V15.7904C4.4589 15.4204 4.2489 14.9104 3.9889 14.6604Z" stroke="#111827" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M9 15L15 9" stroke="#111827" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M14.4945 14.5H14.5035" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M9.49451 9.5H9.50349" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
                    <p className="text-[#111827]">Aplicar descuento</p>
                  </button>
                </div>
                <div className="mt-3 p-4 rounded-xl text-center" >
                    <Timer duration={720000}></Timer>
                </div>
                <div className="relative h-[auto] mt-4">
                    {showMsg === 1 && <p className="text-md text-orange-500! h-[0px]">Debes agregar al menos un ticket</p>}
                    <p className="text-center text-2xl text-yellow-500!">Total:{currencyFormatter.format(total -  (total * discountValue) / 100)}</p>
                    {showMsg === 2 && <p className="text-md text-orange-500! h-[0px]">Debes llenar todos los campos</p>}
                    {showMsg === 3 && <p className="text-md text-orange-500! h-[0px]">Los emails no coinciden</p>}
                    <p className="text-center text-gray-300! mt-3 text-sm">En caso de no realizarse el evento o este no cumplir con algún aspecto fundamental del mismo Ipass regresará el valor de las entradas No así el cargo por servicio.</p>
                    <button className="flex items-center w-[auto] mx-auto mt-6 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-yellow-400 hover:to-yellow-400 text-[#111827] font-bold text-lg px-12 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-2xl" type="submit"><img className="mr-3" src={checkWhitePng} alt=""></img>{ loading ? <LoadingButton/> : 'Comprar'}</button>
                </div>
            </form>
        </div>
    )
}

export default BuyTicket

   {/*eventToRender.cortesiaRRPP
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
        <div className="w-full mb-3 p-5 bg-gray-800 border-2 border-gray-600 rounded-2xl hover:shadow-lg transition-all duration-300">

          <div className="flex items-center justify-between flex-wrap gap-4">

            {/* Imagen + nombre + desc }
            <div className="flex items-center space-x-4 min-w-[200px]">
              <img
                className="w-16 h-16 rounded-xl object-cover shadow-md"
                src={crt.imgTicket ?? goPng}
                alt="Ticket"
                loading="lazy"
              />

              <div className="text-left">
                <p className="text-gray-200 text-md">{crt.nombreTicket}</p>
                <p className="text-sm text-yellow-500">
                  Válido hasta: {formatDate(crt.fechaDeCierre)}
                </p>
                <p className="text-xs text-gray-400 max-w-[260px] mt-1">
                  {crt.descripcionTicket}
                </p>
              </div>
            </div>

            {/* Disponibles + fecha }
            <div className="flex items-center space-x-6">

              <div className="text-center">
                <p className="text-xs text-gray-300 font-medium">Disponibles</p>
                <p className="text-md text-gray-200">{crt.limit}</p>
              </div>

              <div className="flex items-center space-x-2 bg-gray-700 px-4 py-2 rounded-lg border border-gray-600">
                <img className="h-5 w-5" src={calendarPng} alt="" />
                <p className="text-sm text-gray-200 font-medium">
                  {formatDate(crt.fechaDeCierre)}
                </p>
              </div>
            </div>

            {/* Controles }
            {crt.cantidadDeCortesias >= 1 && eventToRender?.soldOut === false ? (
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
            {crt.cantidadDeCortesias >= 1 && eventToRender?.soldOut === false && (<p className="text-green-800 font-medium text-sm mt-2">
              Cortesia
            </p>)}
          </div>
        </div>
      </div>
    );
  })*/}