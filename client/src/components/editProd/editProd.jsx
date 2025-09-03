import { useContext, useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { addRRPPRequest, createEventTicketsRequest, getOneProdRequest, updateEventRequest, updateTicketsRequest } from "../../api/eventRequests"
import { useRef } from "react"
import ticketPng from '../../assets/images/ticket.png'
import qrCodePng from '../../assets/images/qr-code.png'
import backArrowPng from '../../assets/images/back-arrow.png'
import { convertirInputADateTimeLocal, formatDate, formatearFechaParaInput, LoadingButton } from "../../globalscomp/globalscomp"
import UserContext from "../../context/userContext"
import addedTicket from "../../assets/images/added-ticket.png"
import uploadPng from '../../assets/botones/upload.png'
import megaphonePng from '../../assets/images/megaphone.png'
import updatePng from '../../assets/images/update.png'

const EditProd = () => {
    const {session} = useContext(UserContext)
    const {prodId} = useParams()
    const fileRef = useRef(null);
    const fileRefsB = useRef({})
    const estadoRef = useRef()
    const [closeDate, setCloseDate] = useState()
    const [prod, setProd] = useState([])
    const [ticketData, setTicketData] = useState({});
    const [eventosEditados, setEventosEditados] = useState({});
    const [visibilidad, setVisibilidad] = useState()
    const [message, setMessage] = useState(0)
    const [dateMessage, setDateMessage] = useState(0)
    const [estado, setEstado] = useState(1)
    const [distribution, setDistribution] = useState(0)
    const [width, setWidth] = useState(null)
    const [showEventInfo, setShowEventInfo] = useState(true)
    const [openTicketId, setOpenTicketId] = useState(null)
    const [loading, setLoading] = useState(false)
    const [ticketLoading, setTicketLoading] = useState(false)
    const [loadingCreateTicket, setLoadingCreateTicket] = useState(false)
    const [showCreateTicketForm, setShowCreateTicketForm] = useState(false)
    

    useEffect(() => {
        const userId = session?.userFinded?.[0]?._id
        const getOneProd = async () => {
            const res = await getOneProdRequest(prodId, userId) //userId va la session del usuario
            setProd(res.data)
        }
        getOneProd()
        const mediaQuery = window.matchMedia("(min-width: 1290px)");
        const mediaQueryB = window.matchMedia("(min-width: 890px)");
        
        const handleResize = () => {
            setWidth(mediaQuery.matches ? 1290 : 1289);
            setShowEventInfo(mediaQueryB.matches ? 890 : 889);
        };
        handleResize(); // valor inicial
        mediaQuery.addEventListener("change", handleResize);
        
        return () => mediaQuery.removeEventListener("change", handleResize);
    }, [session])
    
    if (width === null) return null;
    
   const updateEvent = async (
    e,
    eventId,
    imgEvento,
    nombreEvento,
    descripcionEvento,
    eventoEdad,
    artistas,
    montoVentas,
    fechaInicio,
    fechaFin,
    provincia,
    localidad,
    direccion,
    lugarEvento
) => {
    e.preventDefault();
    setLoading(true);

    // Obtenemos los datos editados si existen
    const edited = eventosEditados[eventId] || {};

    // Parseamos las fechas para validación
    const fechaInicioFinal = new Date(edited.fechaInicio ?? fechaInicio);
    const fechaFinFinal = new Date(edited.fechaFin ?? fechaFin);
    const now = new Date();

    // Validación de fechas
    if (fechaInicioFinal < now) {
        setLoading(false);
        setDateMessage(1);
        return;
    }

    if (fechaFinFinal < fechaInicioFinal) {
        setLoading(false);
        setDateMessage(2);
        return;
    }

    // Armamos el FormData
    const formData = new FormData();

    // Imagen: si se subió una nueva, usamos esa. Si no, usamos la existente (URL).
    if (fileRef.current?.files?.[0]) {
        formData.append('imgEvento', fileRef.current.files[0]);
    } else {
        formData.append('imgEvento', imgEvento);
    }

    // Agregamos los campos, usando el editado o el original
    formData.append('eventId', eventId);
    formData.append('nombreEvento', edited.nombreEvento ?? nombreEvento);
    formData.append('descripcionEvento', edited.descripcionEvento ?? descripcionEvento);

    if (eventoEdad && !isNaN(Number(eventoEdad))) {
        formData.append('eventoEdad', eventoEdad);
    }

    formData.append('artistas', edited.artistas ?? artistas);
    formData.append('montoVentas', edited.montoVentas ?? montoVentas);
    formData.append('fechaInicio', fechaInicioFinal.toISOString());
    formData.append('fechaFin', fechaFinFinal.toISOString());
    formData.append('provincia', edited.provincia ?? provincia);
    formData.append('localidad', edited.localidad ?? localidad);
    formData.append('direccion', edited.direccion ?? direccion);
    formData.append('lugarEvento', edited.lugarEvento ?? lugarEvento);

    // Enviar al backend
    try {
        const res = await updateEventRequest(formData);
        console.log(res);
        if (res.data.estado > 0) {
            setLoading(false);
            // Podés agregar lógica adicional acá si es necesario
        }
    } catch (error) {
        console.error('Error al actualizar evento:', error);
        setLoading(false);
        // Mostrar mensaje de error general si querés
    }
};

    
    const editEventTicket = async (e, ticketId, imgTicket, nombreTicket, descripcionTicket, precio, cantidad, limit, fechaDeCierre, visibilidad) => {
        e.preventDefault()
       setTicketLoading(true)
       const formData = new FormData()
       const fileInput = fileRefsB.current[ticketId];
       const estado = parseInt(estadoRef.current.value);

        if(fileInput?.files?.[0]){
            formData.append('imgTicket', fileInput.files[0]);
        }else{
            formData.append('imgTicket', imgTicket)
        }
        
        const dataToUpdate = ticketData[ticketId]
        formData.append('ticketId', ticketId)
        formData.append('nombreTicket', dataToUpdate?.nombreTicket ?? nombreTicket)
        formData.append('descripcionTicket', dataToUpdate?.descripcionTicket ?? descripcionTicket)
        formData.append('precio', dataToUpdate?.precio ?? precio)
        formData.append('cantidad', dataToUpdate?.cantidad ?? cantidad)
        formData.append('limit', dataToUpdate?.limit ?? limit)
        formData.append('fechaDeCierre', dataToUpdate?.fechaDeCierre ?? fechaDeCierre)
        formData.append('visibilidad', dataToUpdate?.visibilidad ?? visibilidad)
        formData.append('estado', estado)
        const res = await updateTicketsRequest(formData)

        if(res.data.estado > 0){
            setMessage(3)
            setTicketLoading(false)
        }
    }

    const handleChangeEvento = (e, id, field) => {
        const rawValue = e.target.value;
        const value = (field === 'fechaInicio' || field === 'fechaFin')
        ? convertirInputADateTimeLocal(rawValue)
        : rawValue;

    setEventosEditados(prev => ({
        ...prev,
        [id]: {
            ...prev[id],
            [field]: value
        }
    }));
    };

    const createEventTickets = async (e) => {
            e.preventDefault()
            setLoadingCreateTicket(true)
            const formData = new FormData()
            formData.append('prodId', prodId)
            formData.append('nombreTicket', e.target.elements.nombreTicket.value)
            formData.append('descripcionTicket', e.target.elements.descripcionTicket.value)
            formData.append('precio', e.target.elements.precio.value)
            formData.append('cantidad', e.target.elements.cantidad.value)
            formData.append('fechaDeCierre', new Date(closeDate))
            formData.append('imgTicket', e.target.elements.imgTicket.files[0])
            formData.append('visibilidad', visibilidad)
            formData.append('distribution', distribution)
            formData.append('limit', e.target.elements?.limit?.value)
            formData.append('estado', estado)
            const res = await createEventTicketsRequest(formData)
            setVisibilidad()
            if(res.data.estado > 0){
                setMessage(2)
                setLoadingCreateTicket(false)
                setTimeout(() => {
                    window.location.reload(false)
                },2000)
            }
    }

    const addRRPP = async (e) => {
        e.preventDefault()
        const rrppMail = e.target.elements.rrppMail.value
        const nombreEvento = prod[0]?.nombreEvento
        const eventImg = prod[0]?.imgEvento
        const res = await addRRPPRequest({prodId, rrppMail, nombreEvento, eventImg})
        if(res.data.msg === 1){
            setMessage(1)
            setTimeout(() => setMessage(0) , 3000);
        }
    }

    const showTicketFunc = async (e, ticketId) => {
        e.preventDefault()
        openTicketId === ticketId ? setOpenTicketId(null) : setOpenTicketId(ticketId)
    }

    return(
        <>
            <div className="mx-12 mt-[30px] bg-white border-[1px] border-gray-100 rounded-2xl p-5">
                    <div>
                        {prod.map((p) => 
                        <>
                           <form className="form-edit-event" key={p._id} onSubmit={(e) => {e.preventDefault(); updateEvent(e, p._id, p.imgEvento, p.nombreEvento, p.descripcionEvento, p.eventoEdad, /*p.categorias,*/ p.artistas, p.montoVentas, p.fechaInicio, p.fechaFin, p.provincia, p.localidad, p.direccion, p.lugarEvento) }} encType="multipart/form-data">
                                 <div className="relative flex flex-start">
                                    <div>
                                        <h2>Editar evento</h2>
                                        <img className="w-[250px] h-[200px] object-cover rounded-lg" src={p.imgEvento} alt="" loading="lazy"></img>
                                    </div>
                                    <div className="text-left ml-4">
                                        <h2 className="text-3xl text-[#111827]">{p.nombreEvento}</h2>
                                        <p className="mt-3 secondary-p">Puedes subir otra imagen para tu evento y cambiar su información</p>
                                        <p className="w-[auto] flex items-center p-3 bg-[#ffdeca] mt-3 mb-3 rounded-xl text-[#111827]"><img className="mr-3" src={megaphonePng} alt=""></img> Consejo: Un titulo corto + una portada llamativa mejora la busqueda del evento</p>
                                    </div>
                                    <div className="absolute top-15 right-10">
                                        <label htmlFor="imgEventoHtml" className="flex items-center border-[1px] border-gray-300 text-[#111827] p-3 rounded-2xl"><img className="mr-3" src={uploadPng} alt=""></img>Cargar portada</label><br></br>
                                        <input id="imgEventoHtml" className="border-none hidden" type="file" name="imgEvento" ref={fileRef} />
                                    </div>
                                 </div>
                                <div className="edit-info-event flex justify-center">
                                    <div className="p-3">
                                        <div>
                                            <label>Nombre del evento:</label><br></br>
                                            <input type="text" value={eventosEditados[p._id]?.nombreEvento ?? p.nombreEvento} onChange={(e) => handleChangeEvento(e, p._id, 'nombreEvento')}></input>
                                        </div>
                                        <div>
                                            <label>Descripcion</label><br></br>
                                            <input type="text" value={eventosEditados[p._id]?.descripcionEvento ??  p.descripcionEvento} onChange={(e) => handleChangeEvento(e, p._id, 'descripcionEvento')}></input>
                                        </div>
                                        <div>
                                            <label>Edad minima</label><br></br>
                                            <input type="number" value={eventosEditados[p._id]?.eventoEdad ??  p.eventoEdad} onChange={(e) => handleChangeEvento(e, p._id, 'eventoEdad')}></input>
                                        </div>
                                        {/*<div>
                                            <label>Categorias del evento:</label><br></br>
                                            <input type="text"  placeholder="..." value={eventosEditados[p._id]?.categorias ??  p.categorias} onChange={(e) => handleChangeEvento(e, p._id, 'categorias')} name="categorias"></input>
                                        </div>*/}
                                        <div>
                                            <label>Artistas que participan:</label><br></br>
                                            <input type="text"  placeholder="..." value={eventosEditados[p._id]?.artistas ??  p.artistas} onChange={(e) => handleChangeEvento(e, p._id, 'artistas')} name="artistas"></input>
                                        </div>
                                        <div>
                                            <label>Monto de ventas estimado</label><br></br>
                                            <input type="number" placeholder="0" value={eventosEditados[p._id]?.montoVentas ??  p.montoVentas} onChange={(e) => handleChangeEvento(e, p._id, 'montoVentas')} name="montoVentas"></input>
                                        </div>
                                    </div>
                                    <div className="relative p-3">
                                        <div>
                                            <label>Fecha y hora de inicio:</label><br></br> 
                                            <input type="datetime-local" value={formatearFechaParaInput(eventosEditados[p._id]?.fechaInicio ??  p.fechaInicio)} onChange={(e) => handleChangeEvento(e, p._id, 'fechaInicio')}></input>
                                            {dateMessage == 1 && <p className="text-red-600!">La fecha de inicio no puede ser menor a la fecha actual</p>}
                                        </div>
                                        <div>
                                            <label>Fecha y hora de fin:</label><br></br>
                                            <input type="datetime-local" value={formatearFechaParaInput(eventosEditados[p._id]?.fechaFin ??  p.fechaFin)} onChange={(e) => handleChangeEvento(e, p._id, 'fechaFin')}></input>
                                            {dateMessage == 2 && <p className="text-red-600!">La fecha de fin no puede ser menor a la fecha de inicio</p>}
                                        </div>
                                        <div className="prov-localidad flex items-center">
                                            {/* <div>
                                               <label>Provincia: {p.provincia}  </label><br></br>
                                                <select className="bg-violet-900! pr-2 pl-2 rounded-lg" name="provincia" onChange={(e) => setEventProv(e.target.value)}>
                                                    <option value="provincia" defaultValue={eventosEditados[p._id]?.provincia ??  p.provincia}>mostrar provincias</option>
                                                </select>
                                            </div>*/}
                                            <div>
                                                <label>Localidad: {p.localidad}</label><br></br>
                                                <select className="pr-2 pl-2 rounded-lg"name="localidad" onChange={(e) => setEventLocalidad(e.target.value)}>
                                                    <option value={eventosEditados[p._id]?.localidad ??  p.localidad}>Cambiar localidad</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label>Direccion:</label><br></br>
                                            <input name="direccion" value={eventosEditados[p._id]?.direccion ?? p.direccion} onChange={(e) => handleChangeEvento(e, p._id, 'direccion')}></input>
                                        </div>
                                        <div>
                                            <label>Lugar del evento:</label><br></br>
                                            <input type="text" value={eventosEditados[p._id]?.lugarEvento ?? p.lugarEvento} onChange={(e) => handleChangeEvento(e, p._id, 'lugarEvento')} name="lugarEvento"></input>
                                        </div>
                                         <button className="secondary-button-fucsia absolute right-3 bottom-[-60px] rounded-2xl p-3 text-xl text-white!" type="submit">{loading ? <LoadingButton/> : <div className="flex items-center"><img src={updatePng} alt=""></img><p className="ml-3">Actualizar evento</p></div>}</button>
                                    </div>
                                </div>
                            </form>
                            </>
                        )}
                       {showCreateTicketForm &&  <>
                        <div className="abc fixed w-screen h-screen top-0 bottom-0 left-0 right-0 bg-black-500" onClick={() =>  setShowCreateTicketForm(!showCreateTicketForm)}></div>
                        <form className="add-tickets-form fixed pl-4 pr-7 pb-4 rounded-xl" onSubmit={(e) => createEventTickets(e)} encType="multipart/form-data">
                            <div className="mt-4">
                                <div className="flex items-center">
                                    <h3 className="text-xl">Crear nuevo ticket:</h3>
                                    <img className="ml-5" src={ticketPng} alt="" loading="lazy"></img>
                                </div>
                                <div className="mt-4">
                                    <label>Nombre del ticket:</label>
                                    <input type="text" placeholder="..." name="nombreTicket" required></input>
                                </div>
                                <div className="mt-2">
                                    <label>Descripcion del ticket:</label>
                                    <input type="text" placeholder="..." name="descripcionTicket" required></input>
                                </div>
                                <div className="price-qty-state flex items-center mt-3">
                                    <div>
                                        <label>Precio del ticket:</label>
                                        <input className="w-[120px]" type="number" placeholder="..." name="precio" required></input>
                                    </div>
                                    <div className="qty ml-5">
                                        <label>Cantidad:</label>
                                        <input  className="w-[120px]" type="number" placeholder="..." name="cantidad" required></input>
                                    </div>
                                    <div className="ml-3">
                                        <label>Estado:</label><br></br>
                                        <select className="pr-2 pl-2  rounded-lg" name="estado" onChange={(e) => setEstado(e.target.value)}>
                                            <option value={1}>Activo</option>
                                            <option value={2}>No visible</option>
                                            <option value={3}>Cortesia</option>
                                        </select>
                                    </div>
                                </div>
                                {estado === '3' && 
                                    <div className="flex items-center">
                                        <div className="flex items-center mt-3">
                                            <label>Para:</label>
                                            <select className="ml-1" name="distribution" onChange={(e) => setDistribution(e.target.value)}>
                                                <option value={1}>RRPP</option>
                                                <option value={2}>Clientes</option>
                                            </select>
                                        </div>
                                    </div>
                                }
                                <div className=" mt-2">
                                    <label>Limite a sacar por persona:</label>
                                    <input type="number" name="limit" placeholder="Ej: 3"></input>
                                </div>
                                <div className="edit-form-date mt-3">
                                    <label>Fecha y hora de fin:</label>
                                    <input type="datetime-local" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} required></input>
                                </div>
                                {/*<div className="flex items-center">
                                        <label>Visibilidad</label><br></br>
                                        <input type="checkbox" name="visibilidad" onChange={(e) => setVisibilidad(e.target.value)}/>
                                </div>*/}
                                <div className="mt-2">
                                    <label>Imagen del ticket</label>
                                    <input type="file" name="imgTicket"></input>
                                </div>
                            </div>
                            <div className="h-[80px] w-[300px] flex justify-between items-center w-full mt-5">
                                <button className="secondary-button-fucsia text-white! p-2 rounded-xl" onClick={() =>  setShowCreateTicketForm(!showCreateTicketForm)}>Cancelar</button>
                                <button className="w-[180px]  bg-orange-500! primary-p rounded-xl p-2" type="submit">{loadingCreateTicket ? <LoadingButton/> : 'Agregar ticket'}</button>
                            </div>
                               {message == 2 && 
                                    <div className="flex items-center">
                                        <img className="mt-3" src={addedTicket} alt=""></img>
                                        <p className="ml-2 mt-3 text-lg text-violet-600!">Se agrego el nuevo ticket!</p>
                                    </div>
                               } 
                        </form>
                    </> }
                    </div>
                    <div className="flex items-center">
                        {/*<button className="flex items-center text-xl mt-16 bg-violet-900 pl-6 pr-6 pt-3 pb-3 rounded-lg cursor-pointer"><p>Editar tickets</p><img className="w-[15px] h-[15px] ml-3" src={downArrow} alt=""></img></button> */}
                    </div>
                    <div className="mt-24">
                        <div className="flex items-center mb-3">
                            <h2 className="text-xl">Tickets</h2>
                            <button className="bg-orange-500! flex items-center pt-1 pb-1 pl-3 pr-3 cursor-pointer rounded-lg primary-p ml-3" type="button" onClick={() => setShowCreateTicketForm(true)}>Agregar nuevo ticket +</button>
                        </div>
                        <div className="tickets-edit-prod max-h-[432px]!">
                            {prod.map((pr) => 
                            pr.tickets.map((tick) => 
                                <div key={tick._id}>
                                    <div className="tickets-desc-container flex items-center justify-between mb-3">
                                        <div className="flex items-center">
                                            <img className="ticket-img w-[125px] h-[100px] rounded-xl" src={tick.imgTicket} alt="" loading="lazy"></img>
                                            <p className="primary-p text-2xl ml-3">{tick.nombreTicket}</p>
                                        </div>
                                        <p className="secondary-p text-xl">${tick.precio}</p>
                                        <p className="secondary-p text-xl">Quedan: {tick.cantidad} </p>
                                        <button className="primary-p p-3 cursor-pointer text-xl rounded-xl" onClick={(e) => showTicketFunc(e, tick._id)}>Editar</button>
                                    </div>
                                        {openTicketId === tick._id && ( 
                                        <>
                                        <div className="abc fixed w-screen h-screen top-0 bottom-0 left-0 right-0 bg-black-500" onClick={() =>  setOpenTicketId(null)}></div>
                                        <div className="add-tickets-form fixed p-6 rounded-lg">
                                            <div className="mt-3 mb-3">
                                                <label>Cambiar imagen del ticket:</label><br></br>
                                                <input type="file" name="imgTicket" ref={el => fileRefsB.current[tick._id] = el} />
                                            </div>
                                            <div>
                                                <label>Nombre del ticket:</label><br></br>
                                                <input type="text" name="nombreTicket" value={ticketData[tick._id]?.nombreTicket ?? tick.nombreTicket}  onChange={(e) =>
                                                setTicketData(prev => ({
                                                ...prev,
                                                [tick._id]: {
                                                ...prev[tick._id],
                                                nombreTicket: e.target.value
                                                }
                                            }))
                                            }></input>
                                            </div>     
                                            <div>
                                                <label>Descripcion del ticket</label><br></br>
                                                <input type="text" name="descripcionTicket" value={ticketData[tick._id]?.descripcionTicket ?? tick.descripcionTicket}  onChange={(e) =>
                                                setTicketData(prev => ({
                                                ...prev,
                                                [tick._id]: {
                                                ...prev[tick._id],
                                                descripcionTicket: e.target.value
                                                }
                                            }))
                                            }></input>
                                            </div>
                                            <div>
                                                <label>Precio:</label><br></br>
                                                <input type="number" name="precio" value={ticketData[tick._id]?.precio ?? tick.precio}  onChange={(e) =>
                                                setTicketData(prev => ({
                                                ...prev,
                                                [tick._id]: {
                                                ...prev[tick._id],
                                                precio: e.target.value
                                                }
                                            }))
                                            }></input>
                                            </div>
                                            <div>
                                                <label>Cantidad:</label><br></br>
                                                <input type="number" name="cantidad" value={ticketData[tick._id]?.cantidad ?? tick.cantidad}  onChange={(e) =>
                                                setTicketData(prev => ({
                                                ...prev,
                                                [tick._id]: {
                                                ...prev[tick._id],
                                                cantidad: e.target.value
                                                }
                                            }))
                                            }></input>
                                            </div>
                                            <div>
                                                <label>Limite:</label><br></br>
                                                <input type="number" name="limit" value={ticketData[tick._id]?.limit ?? tick.limit}  onChange={(e) =>
                                                setTicketData(prev => ({
                                                ...prev,
                                                [tick._id]: {
                                                ...prev[tick._id],
                                                limit: e.target.value
                                                }
                                            }))
                                            }></input>
                                            </div>
                                                        <div className="mt-3 mb-3">
                                                            <label>Estado:</label><br></br>
                                                            <select className="rounded-lg" name="estado" ref={estadoRef}>
                                                                <option value={tick.estado}>{tick.estado === 1 && 'Visible' || tick.estado === 2 && 'No visible' || tick.estado === 3 && 'cortesia'}</option>
                                                                <option value={1}>Activo</option>
                                                                <option value={2}>No visible</option>
                                                                <option value={3}>Cortesia</option>
                                                            </select>
                                                        </div>
                                            <div className="mt-3">
                                                <div className="items-center text-center">
                                                    <label>Fecha de cierre: </label>
                                                    <label>{formatDate(tick.fechaDeCierre)}</label><br></br>
                                                    <div className="mt-3">
                                                        <label>Cambiar fecha a:</label><br></br>
                                                        <input type="datetime-local" value={ticketData[tick._id]?.fechaDeCierre ?? tick.fechaDeCierre}  onChange={(e) =>
                                                            setTicketData(prev => ({
                                                            ...prev,
                                                            [tick._id]: {
                                                                ...prev[tick._id],
                                                                fechaDeCierre: e.target.value
                                                                }
                                                            }))
                                                        }></input>
                                                    </div>
                                                </div>
                                            </div>
                                        {/*  <div className="flex justify-center items-center mt-3">
                                                <label>Visibilidad</label>
                                                <input className="ml-2" type="checkbox" name="visibilidad" value={ticketData[tick._id]?.visibilidad ?? tick.visibilidad}  onChange={(e) =>
                                                setTicketData(prev => ({
                                                ...prev,
                                                [tick._id]: {
                                                    ...prev[tick._id],
                                                    visibilidad: e.target.value
                                                    }
                                                }))
                                            }></input>
                                            </div> */}
                                            <div className="flex items-center justify-between">
                                                <button className="secondary-button-fucsia mt-5 p-3 w-[100px] rounded-lg">Cancelar</button>
                                                <button className="bg-orange-500! mt-5 p-3 w-[100px] rounded-lg cursor-pointer" onClick={(e) => editEventTicket(e, tick._id, tick.imgTicket, tick.nombreTicket, tick.descripcionTicket, tick.precio, tick.cantidad, tick.limit, tick.fechaDeCierre, tick.visibilidad)}>{ticketLoading ? <LoadingButton/> : 'Editar'}</button>
                                            </div>
                                        </div>
                                        </>
                                    ) }
                                    </div>
                            )
                        )}

                        </div>
                    </div>
                    
                    <div className="send-back relative flex flex-wrap justify-between items-center h-[150px]">
                          <form className="add-colab-form flex items-center mt-9 mb-6" onSubmit={(e) => addRRPP(e)}>
                             <input className="h-[40px]" type="email" placeholder="añade un colaborador" minLength="8" maxLength="60" name="rrppMail" required></input>
                             <button className="bg-orange-500! flex items-center p-2 cursor-pointer rounded-xl ml-3" type="submit">Añadir Colaborador</button>
                             {message == 1 && <p className="ml-3">Se añadio el colaborador al evento!</p>}
                        </form>
                        <div className="flex items-center">
                            <Link className="flex items-center ml-6 p-2 primary-button rounded-lg" to={`/editar_evento/staff/${prod[0]?._id}`}><img src={qrCodePng} alt="" loading="lazy"></img><p className="ml-3">Enviar Invitaciónes</p></Link>
                            <Link className=" flex items-center ml-6 p-2 primary-button rounded-lg" to={`/cortesies/${prod[0]?._id}`}><img src={qrCodePng} alt="" loading="lazy"></img><p className="ml-3">Crear lista de invitaciónes</p></Link>
                            <Link className=" flex items-center ml-6 p-2 bg-black rounded-lg" to="/home"><img src={backArrowPng} alt="" loading="lazy"></img><p className="ml-3">Volver</p></Link>
                        </div>
                    </div>
                </div>
        </>
    )
}

export default EditProd