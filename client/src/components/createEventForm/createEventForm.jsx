import { useState } from "react"
import { createEventRequest, createEventTicketsRequest } from "../../api/eventRequests"

const CreateEventForm = () => {

    const [startDate, setStartDate] = useState()
    const [endDate, setEndDate] = useState()
    const [showTickets, setShowTickets] = useState(0)
    const [closeDate, setCloseDate] = useState()
    const [disabledButton, setDisabledButton] = useState(true)
    const [saveEventId, setSaveEventId] = useState()

    const createEvent = async (e) => {
        e.preventDefault()
        
            const paisDestino = e.target.elements.paisDestino.value
            const tipoEvento = e.target.elements.tipoEvento.value
            const eventoEdad = e.target.elements.eventoEdad.value
            const provincia = e.target.elements.provincia.value
            const localidad = e.target.elements.localidad.value
            const formData = new FormData()
            formData.append('userId', "682230196086949adb9b9c77")
            formData.append('paisDestino', paisDestino)
            formData.append('tipoEvento', tipoEvento)
            formData.append('eventoEdad', eventoEdad)
            formData.append('nombreEvento', e.target.elements.nombreEvento.value)
            formData.append('descripcionEvento', e.target.elements.descripcionEvento.value)
            formData.append('categorias', e.target.elements.categorias.value)
            formData.append('artistas', e.target.elements.artistas.value)
            formData.append('montoVentas', e.target.elements.montoVentas.value)
            formData.append('fechaInicio',  new Date(startDate))
            formData.append('fechaFin', new Date(endDate))
            formData.append('provincia', provincia)
            formData.append('localidad', localidad)
            formData.append('direccion', e.target.elements.direccion.value)
            formData.append('lugarEvento', e.target.elements.lugarEvento.value)
            formData.append('linkEvento', e.target.elements.linkEvento.value)
            formData.append('imgEvento', e.target.elements.imgEvento.files[0])
    
            const res = await createEventRequest(formData)

            if(res.data.estado === 1){
                setShowTickets(1)
                setSaveEventId(res.data.eventId)
            }
            console.log(showTickets)
    }

    const createEventTickets = (e) => {
        e.preventDefault()
        const formData = new FormData()
        formData.append('eventId', saveEventId)
        formData.append('nombreTicket', e.target.elements.nombreTicket.value)
        formData.append('descripcionTicket', e.target.elements.descripcionTicket.value)
        formData.append('precio', e.target.elements.precio.value)
        formData.append('cantidad', e.target.elements.cantidad.value)
        formData.append('fechaDeCierre', new Date(closeDate))
        formData.append('imgTicket', e.target.elements.imgTicket.files[0])
        createEventTicketsRequest(formData)
        setDisabledButton(false)
    }

    return(
        <>
            <form onSubmit={(e) => createEvent(e)} encType="multipart/form-data">
                <div>
                    <label>Pais del evento</label>
                    <select name="paisDestino">
                        <option defaultValue={"argentina"} value="Argentina">Argentina</option>
                        <option value="chile">Chile</option>
                        <option value="uruguay">Uruguay</option>
                    </select>
                </div>
                <div>
                    <label>Privacidad del evento:</label>
                    <select name="tipoEvento">
                        <option defaultValue={"publico"} value="publico" selected>Publico</option>
                        <option value="privado">Privado</option>
                    </select>
                </div>
                <div>
                    <label>Evento para mayores de edad:</label>
                    <select name="eventoEdad">
                        <option defaultValue={1} value={1}>Si</option>
                        <option value={2} selected>No</option>
                    </select>
                </div>
                <div>
                    <label>Nombre del evento:</label>
                    <input type="text"  placeholder="..." name="nombreEvento"></input>
                </div>
                  <div>
                    <label>Descripcion del evento:</label>
                    <input type="text"  placeholder="..." name="descripcionEvento"></input>
                </div>
                <div>
                    <label>Categorias del evento:</label>
                    <input type="text"  placeholder="..." name="categorias"></input>
                </div>
                <div>
                    <label>Artistas que participan:</label>
                    <input type="text"  placeholder="..." name="artistas"></input>
                </div>
                <div>
                    <label>Monto de ventas estimado</label>
                    <input type="number" placeholder="0" name="montoVentas"></input>
                </div>
                <div>
                    <label>Fecha y hora de inicio:</label>
                    <input type="datetime-local" onChange={(e) => setStartDate(e.target.value)}></input>
                </div>
                 <div>
                    <label>Fecha y hora de fin:</label>
                    <input type="datetime-local" onChange={(e) => setEndDate(e.target.value)}></input>
                </div>
                 <div className="flex items-center">
                    <div>
                        <label>Provincia:</label>
                        <select name="provincia">
                            <option value="prov" defaultValue={"prov"} selected>mostrar provincias</option>
                        </select>
                    </div>
                      <div>
                        <label>Localidad</label>
                        <select name="localidad">
                            <option value="locald" defaultValue={"locald"} selected>mostrar localidad</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label>Direccion:</label>
                    <input name="direccion" placeholder="..."></input>
                </div>
                 <div>
                    <label>Lugar del evento:</label>
                    <input name="lugarEvento" placeholder="..."></input>
                </div>
                 <div>
                    <label>Video del evento (opcional):</label>
                    <input name="linkEvento" placeholder="..."></input>
                </div>
                <div>
                    <label>Portada del evento:</label>
                    <input type="file" placeholder="..." name="imgEvento"></input>
                </div>
                <div>
                    <input type="checkbox"></input>
                    <p>Acepto términos y condiciones</p>
                </div>
                <button type="submit">CREAR EVENTO</button>
            </form>
            {showTickets >= 1 && 
                <form onSubmit={(e) => createEventTickets(e)} encType="multipart/form-data">
                    <div className="mt-9">
                        <div>
                            <label>Nombre del ticket</label>
                            <input type="text" placeholder="..." name="nombreTicket" required></input>
                        </div>
                        <div>
                            <label>Descripcion del ticket</label>
                            <input type="text" placeholder="..." name="descripcionTicket" required></input>
                        </div>
                        <div className="flex items-center">
                            <div>
                                <label>Precio del ticket</label>
                                <input type="number" placeholder="..." name="precio" required></input>
                            </div>
                            <div>
                                <label>Cantidad</label>
                                <input type="number" placeholder="..." name="cantidad" required></input>
                            </div>
                        </div>
                        <div>
                            <label>Fecha y hora de fin:</label>
                            <input type="datetime-local" onChange={(e) => setCloseDate(e.target.value)} required></input>
                        </div>
                        <div>
                            <label>Imagen del ticket</label>
                            <input type="file" name="imgTicket"></input>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <button type="submit">Agregar tickets</button>
                        {disabledButton ? <button disabled>Continuar</button> : <a href="/">Continuar</a>}
                    </div>
                </form>
            }
        </>
    )
}

export default CreateEventForm