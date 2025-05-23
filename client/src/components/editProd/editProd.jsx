import { useEffect, useState } from "react"
import { useParams } from "react-router"
import { getOneProdRequest, updateEventRequest, updateTicketsRequest } from "../../api/eventRequests"
import { useRef } from "react"

const EditProd = () => {
    const prodId = useParams()
    const fileRef = useRef(null);
    const fileRefsB = useRef({})
    const [prod, setProd] = useState([])
    const [ticketData, setTicketData] = useState({});
    const [eventosEditados, setEventosEditados] = useState({});

    useEffect(() => {
        const getOneProd = async () => {
            const res = await getOneProdRequest(prodId.prodId)
            setProd(res.data)
        }
        getOneProd()
    }, [])

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
        formData.append('fechaInicio', editedValues[0]?.fechaInicio ??  fechaInicio)
        formData.append('fechaFin', editedValues[0]?.fechaFin ??  fechaFin)
        formData.append('provincia', editedValues[0]?.provincia ??  provincia)
        formData.append('localidad', editedValues[0]?.localidad ??  localidad)
        formData.append('direccion', editedValues[0]?.direccion ??  direccion)
        formData.append('lugarEvento', editedValues[0]?.lugarEvento ??  lugarEvento)

        console.log('Contenido real de FormData:');
        const res = await updateEventRequest(formData)

    }
    
    const editEventTicket = async (e, ticketId, imgTicket, nombreTicket, descripcionTicket, precio, visibilidad) => {
        e.preventDefault()
       const formData = new FormData()
       const fileInput = fileRefsB.current[ticketId];
        if(fileInput?.files?.[0]){
            formData.append('imgTicket', fileInput.files[0]);
        }else{
            formData.append('imgTicket', imgTicket)
        }
        const dataToUpdate = ticketData[ticketId]
        console.log(ticketId, imgTicket, nombreTicket, descripcionTicket, precio, visibilidad)
        formData.append('ticketId', ticketId)
        formData.append('nombreTicket', dataToUpdate?.nombreTicket ?? nombreTicket)
        formData.append('descripcionTicket', dataToUpdate?.descripcionTicket ?? descripcionTicket)
        formData.append('precio', dataToUpdate?.precio ?? precio)
        formData.append('visibilidad', dataToUpdate?.visibilidad ?? visibilidad)
        const res = await updateTicketsRequest(formData)
        console.log("ok: ", res.data)
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
        console.log(eventosEditados?.nombreEvento)
    };

    return(
        <>
            <div className="flex mt-30 p-8">
                    <div>
                        {prod.map((p) => 
                        <form key={p._id} onSubmit={(e) => {e.preventDefault(); updateEvent(e, p._id, p.imgEvento, p.nombreEvento, p.descripcionEvento, p.eventoEdad, p.categorias, p.artistas, p.montoVentas, p.fechaInicio, p.fechaFin, p.provincia, p.localidad, p.direccion, p.lugarEvento) }} encType="multipart/form-data">
                            <img src={p.imgEvento} alt=""></img>
                            <div>
                                <label>Cambiar imagen del evento:</label><br></br>
                                <input type="file" name="imgEvento" ref={fileRef} />
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
                            <div>
                                <label>Monto de ventas estimado</label><br></br>
                                <input type="number" placeholder="0" value={eventosEditados[p._id]?.montoVentas ??  p.montoVentas} onChange={(e) => handleChangeEvento(e, p._id, 'montoVentas')} name="montoVentas"></input>
                            </div>
                            <div>
                                <label>Fecha y hora de inicio:</label><br></br>
                                <input type="datetime-local" value={eventosEditados[p._id]?.fechaInicio ??  p.fechaInicio} onChange={(e) => handleChangeEvento(e, p._id, 'fechaInicio')}></input>
                            </div>
                            <div>
                                <label>Fecha y hora de fin:</label><br></br>
                                <input type="datetime-local" value={eventosEditados[p._id]?.fechaFin ??  p.fechaFin} onChange={(e) => handleChangeEvento(e, p._id, 'fechaFin')}></input>
                            </div>
                            <div className="flex items-center">
                                <div>
                                    <label>Provincia:</label><br></br>
                                    <select name="provincia" onChange={(e) => setEventProv(e.target.value)}>
                                        <option value="provincia" defaultValue={eventosEditados[p._id]?.provincia ??  p.provincia}>mostrar provincias</option>
                                    </select>
                                </div>
                                <div>
                                    <label>Localidad</label><br></br>
                                    <select name="localidad" onChange={(e) => setEventLocalidad(e.target.value)}>
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
                            <button type="submit">Actualizar evento</button>
                        </form>)}
                    </div>
                    {prod.map((pr) => 
                        pr.tickets.map((tick) => 
                            <div key={tick._id}>
                                <div>
                                    <img src={tick.imgTicket} alt=""></img>
                                    <div>
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
                                        <label>Visibilidad</label><br></br>
                                        <input type="checkbox" name="visibilidad" value={ticketData[tick._id]?.visibilidad ?? tick.visibilidad}  onChange={(e) =>
                                        setTicketData(prev => ({
                                        ...prev,
                                        [tick._id]: {
                                            ...prev[tick._id],
                                            visibilidad: e.target.value
                                            }
                                         }))
                                    }></input>
                                    </div>
                                    <button onClick={(e) => editEventTicket(e, tick._id, tick.imgTicket, tick.nombreTicket, tick.descripcionTicket, tick.precio, tick.visibilidad)}>Editar</button>
                                </div>
                            </div> 
                        )
                    )}

                </div>
        </>
    )
}

export default EditProd