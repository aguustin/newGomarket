import { useContext, useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { addRRPPRequest, cancelarEventoRequest, createEventTicketsRequest, getOneProdRequest, getProdsRequest, relateEventsRequest, updateEventRequest, updateTicketsRequest } from "../../api/eventRequests"
import { useRef } from "react"
import {Country, State, City} from "country-state-city"
import { convertirInputADateTimeLocal, formatDate, formatDateB, formatearFechaParaInput, LoadingButton } from "../../globalscomp/globalscomp"
import qrCodePng from '../../assets/images/qr-code.png'
import backArrowPng from '../../assets/images/back-arrow.png'
import ticketPng from '../../assets/images/ticket.png'
import UserContext from "../../context/userContext"
import addedTicket from "../../assets/images/added-ticket.png"
import uploadPng from '../../assets/botones/upload.png'
import megaphonePng from '../../assets/images/megaphone.png'
import updatePng from '../../assets/images/update.png'
import calendarPng from "../../assets/images/calendar.png"
import ticketCantPng from "../../assets/images/ticket-cant.png"
import cancelPng from "../../assets/images/cancel.png"
import cancelEventPng from '../../assets/images/cancel-event.png'
import eraserPng from '../../assets/images/eraser.png'
import megaphoneBPng from '../../assets/images/megaphoneB.png'

const EditProd = () => {
    const {session} = useContext(UserContext)
    const {prodId} = useParams()
    const fileRef = useRef(null);
    const fileRefBanner = useRef(null)
    const fileRefDescriptiveImg = useRef(null)
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
    const [eventVisibility, setEventVisibility] = useState()
    const [cities, setCities] = useState([])
    const [localidad, setLocalidad] = useState(null)
    const [cancelAlert, setCancelAlert] = useState(false)
    const [previewBanner, setPreviewBanner] = useState(null)
    const [imageBanner, setImageBanner] = useState()
    const [previewDescriptive, setPreviewDescriptive] = useState(null)
    const [imageDescriptive, setImageDescriptive] = useState()
    const [othersProds, setOthersProds] = useState([])
    const [showOthersProds, setShowOthersProds] = useState(false)
    const [relacionesLocales, setRelacionesLocales] = useState([]);
    
    useEffect(() => {
        const userId = session?.userFinded?.[0]?._id
        const getOneProd = async () => {
            const res = await getOneProdRequest(prodId, userId) //userId va la session del usuario
            setProd(res.data)
            const othersRes = await getProdsRequest(userId);
            setOthersProds(othersRes.data);
            setCities(City?.getCitiesOfState(res?.data[0]?.codigoPais, res?.data[0]?.codigoCiudad))
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
    aviso,
    eventoEdad,
    artistas,
    montoVentas,
    fechaInicio,
    fechaFin,
    tipoEvento,
    provincia,
    localidad,
    direccion,
    lugarEvento,
    bannerEvento,
    imagenDescriptiva
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
        formData.append('imgEvento', fileRef?.current?.files[0]);
    } else {
        formData.append('imgEvento', imgEvento);
    }

    // Agregamos los campos, usando el editado o el original
    formData.append('eventId', eventId);
    formData.append('nombreEvento', edited.nombreEvento ?? nombreEvento);
    formData.append('codigoPais', localidad.countryCode ?? cities[0]?.countryCode); //cambiado ahora el 22/09/2025
    formData.append('codigoCiudad', localidad.stateCode ?? cities[0]?.stateCode); //cambiado ahora el 22/09/2025
    formData.append('descripcionEvento', edited.descripcionEvento ?? descripcionEvento);
    formData.append('aviso', aviso ?? edited.aviso)
    formData.append('eventoEdad', eventoEdad ?? edited.eventoEdad);
    

    formData.append('artistas', edited.artistas ?? artistas);
    formData.append('montoVentas', edited.montoVentas ?? montoVentas);
    console.log(edited.montoVentas, ' ', montoVentas)
    formData.append('fechaInicio', fechaInicioFinal); //.toISOString
    formData.append('fechaFin', fechaFinFinal); //.toISOString
    formData.append('provincia', edited.provincia ?? provincia);
    console.log('tipo evento: ', eventVisibility , ' ', tipoEvento)
    formData.append('tipoEvento', eventVisibility ?? tipoEvento);

    formData.append('localidad', edited.localidad ?? localidad);
    formData.append('direccion', edited.direccion ?? direccion);
    formData.append('lugarEvento', edited.lugarEvento ?? lugarEvento);

    if (fileRefBanner.current?.files?.[0]) {
        formData.append('bannerEvento', fileRefBanner.current.files[0]);
    }else{
         formData.append('bannerEvento', bannerEvento ?? null);
    }

    if (fileRefDescriptiveImg.current?.files?.[0]) {
        formData.append('imagenDescriptiva', fileRefDescriptiveImg.current.files[0]);
    }else{
         formData.append('imagenDescriptiva', imagenDescriptiva ?? null);
    }


    // Enviar al backend
    try {
        const res = await updateEventRequest(formData);
        console.log('dasdasdasdas', res);
        if (res.data.state > 0) {
            setLoading(false);
            setMessage(5);
        }
    } catch (error) {
        console.error('Error al actualizar evento:', error);
        setLoading(false);
        
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
        
        if (estado === 3) {
            precio === 0
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
            setTimeout(() => {
                setMessage(3)
                setTicketLoading(false)
            }, 2000)
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
            const estado = parseInt(estadoRef.current.value);

            const formData = new FormData()
            formData.append('prodId', prodId)
            formData.append('nombreTicket', e.target.elements.nombreTicket.value)
            formData.append('descripcionTicket', e.target.elements.descripcionTicket.value)
            formData.append('precio', estado === 3 ? 0 : e.target.elements.precio.value)
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
        console.log(res.data.msg)
        if(res.data.msg === 1){
            console.log('eeee')
            setMessage(1)
            setTimeout(() => setMessage(0) , 3000);
        }else{
            setMessage(4)
            setTimeout(() => setMessage(0) , 5000);
        }
    }

    const showTicketFunc = async (e, ticketId) => {
        e.preventDefault()
        openTicketId === ticketId ? setOpenTicketId(null) : setOpenTicketId(ticketId)
    }

    const cancelarEvento = async (prodId) => {
        await cancelarEventoRequest({prodId})
    }

      const handleBannerChange = (e) => {
            const file = e.target.files?.[0];
            if (file) {
            const imageUrl = URL.createObjectURL(file);
            setPreviewBanner(imageUrl);
            setImageBanner(file);
            }
        };

  const handleDescriptiveChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
        const imageUrl = URL.createObjectURL(file);
        setPreviewDescriptive(imageUrl);
        setImageDescriptive(file);
        }
  };

  const relateEvents = async (e, prodId, otherId) => {
    e.preventDefault()
    const res = await relateEventsRequest({prodId, otherId})
    if(res.data.msg === 2){
        setRelacionesLocales((prev) => [...prev, otherId]);
        return setMessage(6)
    }
    setRelacionesLocales((prev) => prev.filter(id => id !== otherId));
     return setMessage(7)
  }

    return(
        <>
            <div className="edit-event-and-tickets-container mx-12 mt-[30px] mb-20 bg-white border-[1px] border-gray-100 rounded-2xl p-5">
                    <div>
                        {prod.map((p) => 
                        <>
                           <form className="form-edit-event" key={p._id} onSubmit={(e) => {e.preventDefault(); updateEvent(e, p._id, p.imgEvento, p.nombreEvento, p.descripcionEvento, p.aviso, p.eventoEdad, /*p.categorias,*/ p.artistas, p.montoVentas, p.fechaInicio, p.fechaFin, p.tipoEvento, p.provincia,p.localidad, p.direccion, p.lugarEvento, p.bannerEvento, p.imagenDescriptiva) }} encType="multipart/form-data">
                                 <div className="edit-event-img relative w-[100%] flex flex-wrap items-start mx-auto justify-center">
                                    <div className="">
                                        <h2 className="text-2xl">Editar evento</h2>
                                        <img className="w-[250px] h-[200px] object-cover rounded-lg" src={p.imgEvento} alt="" loading="lazy"></img>
                                    </div>
                                    <div className="edit-evet-desc text-left ml-4">
                                        <h2 className="text-3xl text-[#111827]">{p.nombreEvento}</h2>
                                        <p className="mt-3 secondary-p">Puedes subir otra imagen para tu evento y cambiar su información</p>
                                        <p className="w-[auto] flex items-center p-3 bg-[#ffdeca] mt-3 mb-3 rounded-xl text-[#111827]"><img className="mr-3" src={megaphonePng} alt=""></img> Consejo: Un titulo corto + una portada llamativa mejora la busqueda del evento</p>
                                    <div className="edit-evet-img-upload top-15 right-10">
                                        <label htmlFor="imgEventoHtml" className="flex items-center border-[1px] border-gray-300 text-[#111827] p-3 rounded-2xl"><img className="mr-3" src={uploadPng} alt=""></img>Cargar nueva portada</label><br></br>
                                        <input id="imgEventoHtml" className="border-none hidden" type="file" name="imgEvento" ref={fileRef} />
                                    </div>
                                    <div>
                                        <button className="relation-buttons secondary-button-fucsia text-white! p-3 rounded-lg translate-x-auto!" onClick={() => setShowOthersProds(!showOthersProds)}>Relacionar eventos</button>
                                        {showOthersProds && <div className="bg-white! mt-2">
                                            {othersProds.filter((othP) => !prod.some((p) => p._id === othP._id)).map((filteredProd) => (
                                                <div className="bg-[#f4f4f4] border-b-1 border-gray-300 p-2" key={filteredProd._id}>
                                                    <div className="flex flex-wrap text-[#111827] text-left mb-3 justify-between">
                                                        <div className="flex items-center">
                                                            <img className="w-20 h-20 rounded-lg" src={filteredProd.imgEvento} alt=""></img>
                                                            <div className="ml-2">
                                                                <p>{filteredProd.nombreEvento}</p>
                                                                <p>Inicio: {formatDateB(filteredProd.fechaInicio)}</p>
                                                                <p>Cierre: {formatDateB(filteredProd.fechaFin)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="w-[180px] h-auto">
                                                            <button className="relation-buttons ml-0! w-full bg-orange-500! rounded-lg p-1 mb-3" onClick={(e) => relateEvents(e, p._id, filteredProd._id)}>{p.eventosRelacionados.some(er => String(er.idEvento) === String(filteredProd._id)) ? 'Desvincular eventos' : 'Relacionar evento'}</button>
                                                            <a className="bg-transparent border-1 border-gray-300! rounded-lg p-1" href={`/editar_evento/${filteredProd._id}`}>Ver evento</a>
                                                        </div>
                                                    </div>
                                                </div>
                                                )
                                            )}    
                                            {message === 6 && <p className="bg-white! text-green-700! mt-2">La operacion se realizo con exito!</p>}
                                        </div>}
                                    </div>
                                    </div>
                                 </div>
                                <div className="edit-info-event flex justify-center">
                                    <div className="p-3">
                                        <div>
                                            <label>Nombre del evento:</label><br></br>
                                            <input type="text" value={eventosEditados[p._id]?.nombreEvento ?? p.nombreEvento} onChange={(e) => handleChangeEvento(e, p._id, 'nombreEvento')}></input>
                                        </div>
                                        <div>
                                            <label>Descripcion:</label><br></br>
                                            <input type="textarea" value={eventosEditados[p._id]?.descripcionEvento ??  p.descripcionEvento} onChange={(e) => handleChangeEvento(e, p._id, 'descripcionEvento')}></input>
                                        </div>
                                       <div>
                                            <label>Aviso importante:</label><br></br>
                                            <input type="textarea" value={eventosEditados[p._id]?.aviso ??  p.aviso} onChange={(e) => handleChangeEvento(e, p._id, 'aviso')}></input>
                                        </div>
                                        <div>
                                            <label>Edad minima:</label><br></br>
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
                                            <label>Monto de ventas estimado:</label><br></br>
                                            <input type="number" min="0" placeholder="0" value={eventosEditados[p._id]?.montoVentas ??  p.montoVentas} onChange={(e) => handleChangeEvento(e, p._id, 'montoVentas')} name="montoVentas"></input>
                                        </div>
                                         <div>
                                            <label htmlFor="fileUploadBanner" className="text-[#111827]">Banner del evento (opcional)</label>
                                            <input id="fileUploadBanner" className="" type="file" name="bannerEvento" onChange={handleBannerChange} ref={fileRefBanner}/>
                                        </div>
                                        <div>
                                            <label htmlFor="fileUploadDescriptive" className="text-[#111827]">Imagen descriptiva (opcional)</label>
                                            <input id="fileUploadDescriptive" className="" type="file" name="imagenDescriptiva" onChange={handleDescriptiveChange}  ref={fileRefDescriptiveImg}/>
                                        </div>
                                    </div>
                                    <div className="relative p-3">
                                        <div>
                                            <label>Fecha y hora de inicio:</label><br></br> 
                                            <input className="bg-gradient-to-r from-purple-500 to-pink-500 text-white!" type="datetime-local" value={formatearFechaParaInput(eventosEditados[p._id]?.fechaInicio ??  p.fechaInicio)} onChange={(e) => handleChangeEvento(e, p._id, 'fechaInicio')}></input>
                                            {dateMessage == 1 && <p className="text-red-600!">La fecha de inicio no puede ser menor a la fecha actual</p>}
                                        </div>
                                        <div>
                                            <label>Fecha y hora de fin:</label><br></br>
                                            <input className="bg-gradient-to-r from-purple-500 to-pink-500 text-white!" type="datetime-local" value={formatearFechaParaInput(eventosEditados[p._id]?.fechaFin ??  p.fechaFin)} onChange={(e) => handleChangeEvento(e, p._id, 'fechaFin')}></input>
                                            {dateMessage == 2 && <p className="text-red-600!">La fecha de fin no puede ser menor a la fecha de inicio</p>}
                                        </div>
                                         <div className="prov-localidad flex items-center">
                                            <div className="w-[100%]!">
                                                <label>Visibilidad del evento: {p.tipoEvento === 1 ? 'Publico' : 'Privado'}</label><br></br>
                                                <select className="pr-2 pl-2 rounded-lg" name="tipoEvento" value={eventosEditados[p._id]?.tipoEvento ??  eventVisibility} onChange={(e) => setEventVisibility(e.target.value)} defaultValue="orange">
                                                    {p.tipoEvento === 1 ?
                                                        <>
                                                        <option value={1} selected>Publico</option>
                                                        <option value={2}>Privado</option>
                                                        </>
                                                        :
                                                        <>
                                                        <option value={1}>Publico</option>
                                                        <option value={2} selected>Privado</option>
                                                        </> 
                                                    }
                                                </select>
                                            </div>
                                        </div>
                                        <div className="prov-localidad flex items-center">
                                            {/* <div>
                                               <label>Provincia: {p.provincia}  </label><br></br>
                                                <select className="bg-violet-900! pr-2 pl-2 rounded-lg" name="provincia" onChange={(e) => setEventProv(e.target.value)}>
                                                    <option value="provincia" defaultValue={eventosEditados[p._id]?.provincia ??  p.provincia}>mostrar provincias</option>
                                                </select>
                                            </div>*/}
                                            <div className="w-[100%]!">
                                                <label>Localidad: {p.localidad}</label><br></br>
                                                <select className="pr-2 pl-2 rounded-lg"name="localidad" onChange={(e) => setLocalidad(cities.find((c) => c.name === e.target.value))}>
                                                    <option value={eventosEditados[p._id]?.localidad ??  p.localidad}>Cambiar localidad</option>
                                                    {cities.map((city) => (
                                                        <option key={city.name} value={city.name}>{city.name}</option>
                                                    ))}
                                                </select>
                                                {/**    <select name="localidad" disabled={!selectedState} onChange={(e) => handleCityChange(cities.find((c) => c.name === e.target.value))} required>
                                                <option value=''>Elegir</option>
                                                {cities.map((city) => (
                                                    <option key={city.name} value={city.name}>{city.name}</option>
                                                ))}
                                                </select> */}
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
                    <div className="flex flex-wrap items-center p-0">
                                                       {previewBanner && 
                        <div className="w-[50%] min-w-[180px] bg-white rounded-2xl p-1">
                            <img className="w-full object-cover h-[160px] rounded-2xl mx-auto mt-3" src={previewBanner} alt="" loading="lazy"></img>
                            <div className="portal-evento text-center rounded-2xl">
                                <label htmlFor="fileUpload" className="flex items-center justify-center p-3 bg-[#ffdeca] mt-1 mb-3 rounded-xl text-[#111827]!">Banner del evento</label>
                                <input id="fileUpload" className="hidden" type="file" name="bannerEvento" onChange={handleBannerChange} />
                            </div>
                        </div> }
                        {previewDescriptive && 
                        <div className="w-[50%] min-w-[180px] bg-white rounded-2xl p-1">
                            <img className="w-full object-cover h-[160px] rounded-2xl mx-auto mt-3" src={previewDescriptive} alt="" loading="lazy"></img>
                            <div className="portal-evento text-center rounded-2xl">
                                <label htmlFor="fileUpload" className="flex items-center justify-center p-3 bg-[#ffdeca] mt-1 mb-3 rounded-xl text-[#111827]!">Imagen descriptiva</label>
                                <input id="fileUpload" className="hidden" type="file" name="imagenDescriptiva" onChange={handleDescriptiveChange} />
                            </div>
                        </div>}
                                        </div>
                                         <button className="secondary-button-fucsia absolute right-3 bottom-[-60px] rounded-2xl p-3 text-md text-white!" type="submit">{loading ? <LoadingButton/> : <div className="flex items-center"><img src={updatePng} alt=""></img><p className="ml-3">Actualizar evento</p></div>}</button>
                                    </div>
                                </div>
                            </form>
                            {message === 5 && <div className="mb-10 mt-[-20px]">
                                <p className="text-green-700 text-2xl text-center">El evento se actualizo exitosamente!</p>
                                </div>}
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
                                    {estado !== '3' &&
                                    <div>
                                        <label>Precio del ticket:</label>
                                        <input className="w-[120px]" type="number" min="1" placeholder="..." name="precio" required></input>
                                    </div>  }
                                    <div className="qty">
                                        <label>Cantidad:</label>
                                        <input className="w-[120px]" type="number" min="1" placeholder="..." name="cantidad" required></input>
                                    </div>
                                    <div className="est ml-3">
                                        <label>Estado:</label><br></br>
                                        <select className="pr-2 pl-2  rounded-lg" name="estado" onChange={(e) => setEstado(e.target.value)} ref={estadoRef}>
                                            <option value={1}>Activo</option>
                                            <option value={2}>No visible</option>
                                            <option value={3}>Cortesia</option>
                                        </select>
                                    </div>
                                </div>
                                {estado === '3' && 
                                        <div className="est mt-3">
                                            <label>Para:</label><br></br>
                                            <select className="ml-1" name="distribution" onChange={(e) => setDistribution(e.target.value)}>
                                                <option value={1}>RRPP</option>
                                                <option value={2}>Clientes</option>
                                            </select>
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
                                    <p className="ml-2 mt-3 text-lg text-orange-500!">Se agrego el nuevo ticket!</p>
                                </div>
                               } 
                        </form>
                    </> }
                    </div>
                    <div className="flex items-center">
                        {/*<button className="flex items-center text-xl mt-16 bg-violet-900 pl-6 pr-6 pt-3 pb-3 rounded-lg cursor-pointer"><p>Editar tickets</p><img className="w-[15px] h-[15px] ml-3" src={downArrow} alt=""></img></button> */}
                    </div>
                    <div className="edit-tickets-container mt-10">
                        <div className="add-ticket flex items-center mb-3">
                            <h2 className="text-xl underline">Tickets</h2>
                            <button className="bg-orange-500! flex items-center pt-1 pb-1 pl-3 pr-3 cursor-pointer rounded-lg primary-p ml-3" type="button" onClick={() => setShowCreateTicketForm(true)}>Agregar nuevo ticket +</button>
                        </div>
                        <div className="tickets-edit-prod max-h-[432px]!">
                           {prod.map((pr) => {
                            const allTickets = [
                                ...(pr.tickets?.map(t => ({ ...t, type: 'ticket' })) || []),
                                ...(pr.cortesiaRRPP?.map(c => ({ ...c, type: 'cortesia' })) || [])
                            ];
                            return allTickets.map((tick) => (
                                <div key={tick._id}>
                                        <div className="flex justify-center mx-auto text-center" key={tick._id}>
                                            <div className="tickets-desc-container relative w-full flex items-center justify-between mb-3 p-1!">
                                                <img className="ticket-img w-[60px] h-[60px] rounded-xl ml-1" src={tick.imgTicket} alt="" loading="lazy"></img>
                                                <div className="summary-event-info text-left w-full">
                                                    <p className="primary-p text-sm ml-3" >{tick.nombreTicket}</p>
                                                    <p className="secondary-p text-sm ml-3 ">{tick.precio >= 0 ? `$${tick.precio}` : 'Cortesia' }</p>
                                                    <p className="secondary-p text-sm ml-3 flex items-center">Cant. :<img className="h-[16px]! w-[16px]! ml-2 mr-1" src={ticketCantPng} alt=""></img>{tick.cantidad}</p>
                                                    <p className="secondary-p text-sm ml-3 flex flex-wrap items-center">Cierre: <img className="h-[16px]! w-[16px]! ml-2 mr-1" src={calendarPng} alt=""></img>{formatDate(tick.fechaDeCierre)}</p>     
                                                </div>
                                            <button className="editProd-edit-ticket primary-p p-3 cursor-pointer text-md rounded-xl" onClick={(e) => showTicketFunc(e, tick._id)}>Editar</button>
                                            </div>
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
                                            {Number(ticketData[tick._id]?.estado ?? tick.estado) !== 3 && (
                                            <div>
                                                <label>Precio:</label><br />
                                                <input
                                                type="number"
                                                min="1"
                                                name="precio"
                                                value={ticketData[tick._id]?.precio ?? tick.precio}
                                                onChange={(e) =>
                                                    setTicketData(prev => ({
                                                    ...prev,
                                                    [tick._id]: {
                                                        ...prev[tick._id],
                                                        precio: e.target.value
                                                    }
                                                    }))
                                                }
                                                />
                                            </div>
                                            )}
                                            <div>
                                                <label>Cantidad:</label><br></br>
                                                <input type="number"  min="1" name="cantidad" value={ticketData[tick._id]?.cantidad ?? tick.cantidad}  onChange={(e) =>
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
                                                <input type="number"  min="1" name="limit" value={ticketData[tick._id]?.limit ?? tick.limit}  onChange={(e) =>
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
                                                    <option value={tick.estado} >{tick.estado === 1 && 'Activo' || tick.estado === 2 && 'No visible' || tick.estado === 3 && 'Cortesia'}</option>
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
                                                <button className="secondary-button-fucsia mt-5 p-3 w-[100px] rounded-lg" onClick={() =>  setOpenTicketId(null)}>Cancelar</button>
                                                <button className="bg-orange-500! mt-5 p-3 w-[100px] rounded-lg cursor-pointer" onClick={(e) => editEventTicket(e, tick._id, tick.imgTicket, tick.nombreTicket, tick.descripcionTicket, tick.precio, tick.cantidad, tick.limit, tick.fechaDeCierre, tick.visibilidad)}>{ticketLoading ? <LoadingButton/> : 'Editar'}</button>
                                            </div>
                                        </div>
                                        </>
                                    )}
                                    </div>
                            ))
                      
                        })}
                        </div>
                    </div>
                    <div className="send-back relative flex flex-wrap justify-between items-center">
                        <form className="add-colab-form items-center mt-9 mb-6" onSubmit={(e) => addRRPP(e)}>
                            <div className="flex flex-wrap items-center">
                                <input className="h-[40px]" type="email" placeholder="añade un colaborador" minLength="8" maxLength="60" name="rrppMail" required></input>
                                <button className="bg-orange-500! flex items-center p-2 cursor-pointer rounded-xl ml-3" type="submit">Añadir Colaborador</button>
                            </div>
                             {message == 1 && <p className="text-lg mt-2 text-green-700 text-center">Se añadio el colaborador al evento!</p>}
                             {message == 4 && <p className="text-lg mt-2 text-[#111827]! text-center">El colaborador ya existe!</p>}
                        </form>
                        <div className="edit-prod-bottom-buttons flex flex-wrap justify-center items-center mt-2">
                            <Link className="flex items-center mx-2 p-2 border-[1px] border-gray-300 rounded-lg text-[#111827] text-sm! min-w-[240px] mt-2!" to={`/editar_evento/staff/${prod[0]?._id}`}><img src={qrCodePng} alt="" loading="lazy"></img><p className="ml-2">Enviar Invitaciónes</p></Link>
                            <Link className="flex items-center mx-2 p-2 border-[1px] border-gray-300 rounded-lg text-[#111827] text-sm! min-w-[240px] mt-2!" to={`/cortesies/${prod[0]?._id}`}><img src={qrCodePng} alt="" loading="lazy"></img><p className="ml-2">Crear lista de invitaciónes</p></Link>
                            <button className="flex items-center mx-2 p-2 bg-[#EC4899] rounded-lg text-white! text-sm! min-w-[173px] mt-2!" onClick={() => setCancelAlert(true)}><img src={cancelPng} alt="" loading="lazy"></img><p className="ml-2">Cancelar evento</p></button>
                            <Link className="flex items-center mx-2 p-2 bg-orange-500 rounded-lg text-white! text-sm! min-w-[172px] mt-2!" to="/productions"><img src={backArrowPng} alt="" loading="lazy"></img><p className="ml-2">Continuar</p></Link>
                        </div>
                    </div>
                </div>
                {cancelAlert && <>
                    <div className="fixed z-[3] bg-black h-screen  top-[0%] w-screen opacity-[0.5]"></div>
                    <div className="cancel-alert fixed z-[4] top-[50%] w-[450px] text-center bg-white">
                            <div className="flex items-center justify-center bg-orange-500 p-2">
                                <img className="megaphone" src={megaphoneBPng} alt=""></img>
                                <h2 className="text-3xl text-white! ml-2">Aviso!</h2>
                            </div>
                            <div className="p-4">
                                <p className="text-md text-[#111827]">¿Estas seguro de cancelar el evento? Si eliminas el evento se reembolsaran el dinero de los tickets comprados y se eliminara el evento.</p>
                            </div>
                            <div className="flex justify-center mt-1 mb-8">
                                <img src={cancelEventPng} alt=""></img>
                                <img className="ml-5" src={eraserPng} alt=""></img>
                            </div>
                            <div className="flex items-center justify-around pb-2">
                                <button className="w-[100px] rounded-lg text-[#111827] p-2 bg-[#EC4899]" onClick={() => setCancelAlert(false)}>Atras</button>
                                <button className="w-[100px] rounded-lg text-[#111827] p-2 bg-red-400" onClick={() => cancelarEvento(prod[0]._id)}>Eliminar</button>
                            </div>
                    </div>
                </> }
        </>
    )
}

export default EditProd