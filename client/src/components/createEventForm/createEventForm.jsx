import { useState } from "react"
import { createEventRequest, createEventTicketsRequest } from "../../api/eventRequests"
import eventoJpg from '../../assets/imgpruebaEventos.jpg'
import continueArrowPng from '../../assets/botones/continue_arrow.png'

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
            formData.append('prodMail', 'agustin.molee@gmail.com') //aca va el mail de la session
            formData.append('paisDestino', paisDestino)
            formData.append('tipoEvento', tipoEvento)
            formData.append('eventoEdad', eventoEdad)
            formData.append('nombreEvento', e.target.elements.nombreEvento.value)
            formData.append('descripcionEvento', e.target.elements.descripcionEvento.value)
            formData.append('categorias', e.target.elements.categorias.value)
            formData.append('artistas', e.target.elements.artistas.value)
            formData.append('montoVentas', e.target.elements.montoVentas.value)
            formData.append('fechaInicio',  new Date(startDate).toISOString())
            formData.append('fechaFin', new Date(endDate).toISOString())
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

    const createEventTickets = (e) => { //agregar estado a los tickets
        e.preventDefault()
        const formData = new FormData()
        formData.append('prodId', saveEventId)
        formData.append('nombreTicket', e.target.elements.nombreTicket.value)
        formData.append('descripcionTicket', e.target.elements.descripcionTicket.value)
        formData.append('precio', e.target.elements.precio.value)
        formData.append('cantidad', e.target.elements.cantidad.value)
        formData.append('fechaDeCierre', new Date(closeDate).toISOString())
        formData.append('imgTicket', e.target.elements.imgTicket.files[0])
        formData.append('estado', e.target.elements.estado.value)
        createEventTicketsRequest(formData)
        setDisabledButton(false)
    }

    return(
        <>
        <div className="create-form flex justify-around mt-[70px] pl-12 pr-12">
            <div className="w-[450px]">
                <form className="create-event-form mt-9" onSubmit={(e) => createEvent(e)} encType="multipart/form-data">
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
                        <div>
                            <input type="text"  placeholder="..." name="nombreEvento"></input>
                        </div>
                    </div>
                    <div>
                        <label>Descripcion del evento:</label>
                        <div>
                            <textarea type="text"  placeholder="..." name="descripcionEvento"></textarea>
                        </div>
                    </div>
                    <div>
                        <label>Categorias del evento:</label>
                        <div>

                        <input type="text"  placeholder="..." name="categorias"></input>
                        </div>
                    </div>
                    <div>
                        <label>Artistas que participan:</label>
                        <div>

                        <input type="text"  placeholder="..." name="artistas"></input>
                        </div>
                    </div>
                    <div>
                        <label>Monto de ventas estimado</label>
                        <div>

                        <input type="number" placeholder="0" name="montoVentas"></input>
                        </div>
                    </div>
                    <div>
                        <label>Fecha y hora de inicio:</label>
                        <div>

                        <input type="datetime-local" onChange={(e) => setStartDate(e.target.value)}></input>
                        </div>
                    </div>
                    <div>
                        <label>Fecha y hora de fin:</label>
                        <div>
                            <input type="datetime-local" onChange={(e) => setEndDate(e.target.value)}></input>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <div>
                            <label>Provincia:</label>
                            <select name="provincia">
                                <option value="prov" defaultValue={"prov"} selected> Elegir</option>
                                <option defaultValue={"argentina"} value="Argentina">Argentina</option>
                                <option value="chile">Chile</option>
                                <option value="uruguay">Uruguay</option>
                            </select>
                        </div>
                        <div>
                            <label>Localidad</label>
                            <select name="localidad">
                                <option value="locald" defaultValue={"locald"} selected>Elegir</option>
                                <option defaultValue={"argentina"} value="Argentina">Centro</option>
                                <option value="chile">Godoy Cruz</option>
                                <option value="uruguay">Guaymallen</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label>Direccion:</label>
                        <div>

                        <input name="direccion" placeholder="..."></input>
                        </div>
                    </div>
                    <div>
                        <label>Lugar del evento:</label>
                        <div>

                        <input name="lugarEvento" placeholder="..."></input>
                        </div>
                    </div>
                    <div>
                        <label>Video del evento (opcional):</label>
                        <div>

                        <input name="linkEvento" placeholder="..."></input>
                        </div>
                    </div>
                    <div className="portal-evento">
                        <label>Portada del evento:</label>
                        <input type="file" placeholder="..." name="imgEvento"></input>
                    </div>
                <div id="terminos-condiciones">
                    <div>
                        <label>Acepto términos y condiciones</label>
                        <input type="checkbox"></input>
                    </div>
                </div>
                <button className="bg-violet-900 p-4 rounded-lg w-full mt-10 mb-20" type="submit">CREAR EVENTO</button>
            </form>
            </div>
            <div className="mt-9">
                <div>
                    <img className="w-[430px] h-[450px] object-cover rounded-lg" src={eventoJpg} alt=""></img>
                </div>
                <div className="w-[430px] relative">
                {showTickets >= 1 && 
                    <form onSubmit={(e) => createEventTickets(e)} encType="multipart/form-data">
                        <div className="mt-9">
                            <div className="mt-3">
                                <label>Nombre del ticket</label>
                                <input type="text" placeholder="..." name="nombreTicket" required></input>
                            </div>
                            <div className="mt-3">
                                <label>Descripcion del ticket</label>
                                <input type="text" placeholder="..." name="descripcionTicket" required></input>
                            </div>
                            <div className="flex flex-wrap items-center">
                                <div className="mt-3">
                                    <label>Precio del ticket</label>
                                    <input type="number" placeholder="..." name="precio" required></input>
                                </div>
                                <div className="mt-3">
                                    <label>Cantidad</label>
                                    <input type="number" placeholder="..." name="cantidad" required></input>
                                </div>
                                <div className="mt-3">
                                    <label>Estado:</label>
                                    <select name="estado">
                                        <option defaultValue={1} value={1}>Activo</option>
                                        <option value={2}>No visible</option>
                                        <option value={3}>Cortesia</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-3">
                                <label>Fecha y hora de fin:</label>
                                <input type="datetime-local" onChange={(e) => setCloseDate(e.target.value)} required></input>
                            </div>
                            <div className="mt-3">
                                <label>Imagen del ticket</label>
                                <input type="file" name="imgTicket"></input>
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-6">
                            <button className="bg-violet-700 p-3 rounded-lg" type="submit">+ Agregar tickets</button>
                        </div>
                        {disabledButton ? <a className="continuar-button absolute mt-30 p-4 rounded-lg flex items-center w-[180px] justify-between" disabled>Continuar<img src={continueArrowPng} alt=""></img></a> : <a className="continuar-button absolute mt-30 p-4 rounded-lg flex items-center w-[180px] justify-between" href="/">Continuar<img src={continueArrowPng} alt=""></img></a>}
                    </form>
                }
                </div>
            </div>
        </div>
        </>
    )
}

export default CreateEventForm