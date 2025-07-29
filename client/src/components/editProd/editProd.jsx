import { useContext, useEffect, useLayoutEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { addRRPPRequest, createEventTicketsRequest, getOneProdRequest, updateEventRequest, updateTicketsRequest } from "../../api/eventRequests"
import { useRef } from "react"
import downArrow from '../../assets/botones/down_arrow.png'
import ticketPng from '../../assets/images/ticket.png'
import qrCodePng from '../../assets/images/qr-code.png'
import backArrowPng from '../../assets/images/back-arrow.png'
import { formatDate } from "../../globalscomp/globalscomp"
import UserContext from "../../context/userContext"

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
    const [message, setMessage] = useState(false)
    const [estado, setEstado] = useState(1)
    const [distribution, setDistribution] = useState(0)
    const [width, setWidth] = useState(null)
    const [showEventInfo, setShowEventInfo] = useState(true)
    const [openTicketId, setOpenTicketId] = useState(null)

    useEffect(() => {
        const userId = session?.userFinded?.[0]?._id
        const getOneProd = async () => {
            console.log(userId)
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
    
    const updateEvent = async (e, eventId, imgEvento, nombreEvento, descripcionEvento, eventoEdad, categorias, artistas, montoVentas, fechaInicio, fechaFin, provincia, localidad, direccion, lugarEvento) => {
        e.preventDefault()
      
        const editedValues = Object.entries(eventosEditados).map(([id, values]) => ({
            id,
            ...values,
        }));

        const formData = new FormData()
        if (fileRef.current?.files?.[0]) {
            formData.append('imgEvento', fileRef.current.files[0]);
        } else {
            formData.append('imgEvento', imgEvento); // string (url existente)
        }
        //formData.append('imgEvento', )
        formData.append('eventId', eventId)
        formData.append('nombreEvento',  editedValues[0]?.nombreEvento ??  nombreEvento)
        formData.append('descripcionEvento', editedValues[0]?.descripcionEvento ??  descripcionEvento)
        formData.append('eventoEdad', editedValues[0]?.eventoEdad ??  eventoEdad)
        formData.append('categorias', editedValues[0]?.categorias ??  categorias)
        formData.append('artistas', editedValues[0]?.artistas ??  artistas)
        formData.append('montoVentas', editedValues[0]?.montoVentas ??  montoVentas)
        formData.append('fechaInicio', new Date(editedValues[0]?.fechaInicio).toISOString() ??  new Date(fechaInicio).toISOString())
        formData.append('fechaFin', new Date(editedValues[0]?.fechaFin).toISOString() ??  new Date(fechaFin).toISOString())
        formData.append('provincia', editedValues[0]?.provincia ??  provincia)
        formData.append('localidad', editedValues[0]?.localidad ??  localidad)
        formData.append('direccion', editedValues[0]?.direccion ??  direccion)
        formData.append('lugarEvento', editedValues[0]?.lugarEvento ??  lugarEvento)

        console.log('Contenido real de FormData:');
        const res = await updateEventRequest(formData)

    }
    
    const editEventTicket = async (e, ticketId, imgTicket, nombreTicket, descripcionTicket, precio, cantidad, limit, fechaDeCierre, visibilidad) => {
        e.preventDefault()
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

        console.log(dataToUpdate?.fechaDeCierre)
        const res = await updateTicketsRequest(formData)
    }

    const handleChangeEvento = (e, id, field) => {
        const value = e.target.value;
        setEventosEditados(prev => ({
            ...prev,
            [id]: {
            ...prev[id],
            [field]: value
            }
        }));
    };

    const createEventTickets = (e) => {
            e.preventDefault()
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
            createEventTicketsRequest(formData)
            setVisibilidad()
    }

    const addRRPP = async (e) => {
        e.preventDefault()
        const rrppMail = e.target.elements.rrppMail.value
        const nombreEvento = prod[0]?.nombreEvento
        const eventImg = prod[0]?.imgEvento
        const res = await addRRPPRequest({prodId, rrppMail, nombreEvento, eventImg})
        if(res.data.msg === 1){
            setMessage(true)
            setTimeout(() => setMessage(false) , 3000);
        }
    }

    const showTicketFunc = async (e, ticketId) => {
        e.preventDefault()
        openTicketId === ticketId ? setOpenTicketId(null) : setOpenTicketId(ticketId)
    }

    return(
        <>
            <div className="edit-prod-container mt-10 p-8">
                    <div>
                        {prod.map((p) => 
                        <>
                           
                           <form className={`form-edit-event ${width >= 1290 ? 'flex relative' : 'block'}`} key={p._id} onSubmit={(e) => {e.preventDefault(); updateEvent(e, p._id, p.imgEvento, p.nombreEvento, p.descripcionEvento, p.eventoEdad, p.categorias, p.artistas, p.montoVentas, p.fechaInicio, p.fechaFin, p.provincia, p.localidad, p.direccion, p.lugarEvento) }} encType="multipart/form-data">
                                <img className={`${width >= 1290 ? 'w-[350px] h-[380px]' : 'mx-auto w-[350px] h-[380px] mb-9'}`} src={p.imgEvento} alt=""></img>
                                <div className="edit-info-event flex justify-center">
                                    <div className={`${width >= 1290 ? 'ml-10' : 'ml-0'}`}>
                                        <h3 className={`${width >= 1290 ? 'ml-10 text-2xl' : 'text-2xl text-center'}`}>Edita la informarcion de tu evento:</h3>
                                        <div>
                                            <label>Cambiar imagen del evento:</label><br></br>
                                            <input className="border-none" type="file" name="imgEvento" ref={fileRef} />
                                        </div>
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
                                            <input type="text" value={eventosEditados[p._id]?.eventoEdad ??  p.eventoEdad} onChange={(e) => handleChangeEvento(e, p._id, 'eventoEdad')}></input>
                                        </div>
                                        <div>
                                            <label>Categorias del evento:</label><br></br>
                                            <input type="text"  placeholder="..." value={eventosEditados[p._id]?.categorias ??  p.categorias} onChange={(e) => handleChangeEvento(e, p._id, 'categorias')} name="categorias"></input>
                                        </div>
                                        <div>
                                            <label>Artistas que participan:</label><br></br>
                                            <input type="text"  placeholder="..." value={eventosEditados[p._id]?.artistas ??  p.artistas} onChange={(e) => handleChangeEvento(e, p._id, 'artistas')} name="artistas"></input>
                                        </div>
                                    </div>
                                    <div className="ml-6">
                                        <div className="h-[17px]"></div>
                                        <div>
                                            <label>Monto de ventas estimado</label><br></br>
                                            <input type="number" placeholder="0" value={eventosEditados[p._id]?.montoVentas ??  p.montoVentas} onChange={(e) => handleChangeEvento(e, p._id, 'montoVentas')} name="montoVentas"></input>
                                        </div>
                                        <div>
                                            <label>Fecha y hora de inicio:</label><br></br>
                                            <input type="datetime-local" value={formatDate(eventosEditados[p._id]?.fechaInicio) ??  formatDate(p.fechaInicio)} onChange={(e) => handleChangeEvento(e, p._id, 'fechaInicio')}></input>
                                        </div>
                                        <div>
                                            <label>Fecha y hora de fin:</label><br></br>
                                            <input type="datetime-local" value={formatDate(eventosEditados[p._id]?.fechaFin) ??  formatDate(p.fechaFin)} onChange={(e) => handleChangeEvento(e, p._id, 'fechaFin')}></input>
                                        </div>
                                        <div className="flex items-center">
                                            <div>
                                                <label>Provincia:</label><br></br>
                                                <select className="bg-violet-900 pr-2 pl-2 rounded-lg" name="provincia" onChange={(e) => setEventProv(e.target.value)}>
                                                    <option value="provincia" defaultValue={eventosEditados[p._id]?.provincia ??  p.provincia}>mostrar provincias</option>
                                                </select>
                                            </div>
                                            <div className="ml-5">
                                                <label>Localidad</label><br></br>
                                                <select className="bg-violet-900 pr-2 pl-2 rounded-lg"name="localidad" onChange={(e) => setEventLocalidad(e.target.value)}>
                                                    <option value="localidad" defaultValue={eventosEditados[p._id]?.localidad ??  p.localidad}>mostrar localidad</option>
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
                                    </div>
                                </div>
                                <button className="absolute bg-indigo-900 right-50 h-[40px] pr-6 pl-6" type="submit">Actualizar evento</button>
                            </form>
                           
                            </>
                        )}
                        <form className="add-tickets-form" onSubmit={(e) => createEventTickets(e)} encType="multipart/form-data">
                            <div className="mt-9">
                                <div className="flex items-center">
                                    <h3 className="text-xl">Crear nuevo ticket:</h3>
                                    <img className="ml-5" src={ticketPng} alt=""></img>
                                </div>
                                <div>
                                    <label>Nombre del ticket:</label>
                                    <input type="text" placeholder="..." name="nombreTicket" required></input>
                                </div>
                                <div>
                                    <label>Descripcion del ticket:</label>
                                    <input type="text" placeholder="..." name="descripcionTicket" required></input>
                                </div>
                                <div className="price-qty-state flex items-center">
                                    <div>
                                        <label>Precio del ticket:</label>
                                        <input className="w-[120px]" type="number" placeholder="..." name="precio" required></input>
                                    </div>
                                    <div className="qty ml-5">
                                        <label>Cantidad:</label>
                                        <input  className="w-[120px]" type="number" placeholder="..." name="cantidad" required></input>
                                    </div>
                                    <div className="state ml-5">
                                        <label>Estado:</label>
                                        <select className="bg-violet-900 pr-2 pl-2 rounded-lg" name="estado" onChange={(e) => setEstado(e.target.value)}>
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
                                <div className="mt-3 h-[50px]">
                                    <label>Limite a sacar por persona:</label>
                                    <input type="number" name="limit" placeholder="Ej: 3"></input>
                                </div>
                                <div className="edit-form-date">
                                    <label>Fecha y hora de fin:</label>
                                    <input type="datetime-local" onChange={(e) => setCloseDate(e.target.value)} required></input>
                                </div>
                                {/*<div className="flex items-center">
                                        <label>Visibilidad</label><br></br>
                                        <input type="checkbox" name="visibilidad" onChange={(e) => setVisibilidad(e.target.value)}/>
                                </div>*/ }
                                <div className="mt-1">
                                    <label>Imagen del ticket</label>
                                    <input type="file" name="imgTicket"></input>
                                </div>
                            </div>
                            <div className="flex justify-center items-center w-[180px] mt-5">
                                <button className="w-[180px] bg-indigo-900 p-2" type="submit">Agregar tickets</button>
                            </div>
                        </form>
                         <form className="add-colab-form flex items-center mt-9" onSubmit={(e) => addRRPP(e)}>
                             <input type="email" placeholder="añade un colaborador" minLength="8" maxLength="60" name="rrppMail" required></input>
                             <button className="ml-3 cursor-pointer" type="submit">Añadir Colaborador</button>
                             {message && <p className="ml-3">Se añadio el colaborador al evento!</p>}
                        </form>
                    </div>
                    <div className="flex items-center">
                        {/*<button className="flex items-center text-xl mt-16 bg-violet-900 pl-6 pr-6 pt-3 pb-3 rounded-lg cursor-pointer"><p>Editar tickets</p><img className="w-[15px] h-[15px] ml-3" src={downArrow} alt=""></img></button> */}
                    </div>
                    <div className="edit-tickets-container flex flex-wrap justify-around">
                    {prod.map((pr) => 
                        pr.tickets.map((tick) => 
                            <div className="form-edit-ticket w-[350px] mt-18 text-center" key={tick._id}>
                                    <img className="ticket-img mx-auto mb-5 w-[185px] h-[185px] object-cover rounded-sm" src={tick.imgTicket} alt=""></img>
                                    <button className="pb-3 pt-3 pl-2 pr-2 bg-indigo-900! rounded-lg max-w-[350px] cursor-pointer" onClick={(e) => showTicketFunc(e, tick._id)}>Editar: {tick.nombreTicket}</button>
                                    {openTicketId === tick._id && ( 
                                    <>
                                        <div className="mb-3">
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
                                        <div className="mt-3">
                                            <div className="items-center">
                                            <label>Fecha de cierre: </label><br></br>
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
                                        <div className="flex justify-center items-center mt-3">
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
                                        </div>
                                        <div className="mt-3 mb-3">
                                            <label>Estado:</label>
                                            <select className="bg-violet-900 pr-2 pl-2 rounded-lg" name="estado" ref={estadoRef}>
                                                <option value={tick.estado}>{tick.estado === 1 && 'Visible' || tick.estado === 2 && 'No visible' || tick.estado === 3 && 'cortesia'}</option>
                                                <option value={1}>Activo</option>
                                                <option value={2}>No visible</option>
                                                <option value={3}>Cortesia</option>
                                            </select>
                                        </div>
                                        <button className="mt-5 p-3 w-[100px] rounded-lg cursor-pointer" onClick={(e) => editEventTicket(e, tick._id, tick.imgTicket, tick.nombreTicket, tick.descripcionTicket, tick.precio, tick.cantidad, tick.limit, tick.fechaDeCierre, tick.visibilidad)}>Editar</button>
                                    </>) }
                                </div>
                        )
                    )}
                    </div>
                    <div className="send-back relative flex items-center h-[150px]">
                        <Link className="absolute right-50 flex items-center mt-12 ml-6 p-4 bg-violet-900 rounded-lg" to={`/editar_evento/staff/${prod[0]?._id}`}><img src={qrCodePng} alt=""></img><p className="ml-3">Enviar tickets</p></Link>
                        <Link className="absolute right-0 flex items-center mt-12 ml-6 p-4 bg-black rounded-lg" to="/home"><img src={backArrowPng} alt=""></img><p className="ml-3">Volver</p></Link>
                    </div>
                </div>
        </>
    )
}

export default EditProd