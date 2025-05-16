import { useEffect, useState } from "react"
import { useParams } from "react-router"
import { getOneProdRequest } from "../../api/eventRequests"

const EditProd = () => {
    const prodId = useParams()
    const [prod, setProd] = useState([])
    const [eventNombre , setEventNombre] = useState()
    const [eventDesc, setEventDesc] = useState()
    const [eventEdad, setEventEdad] = useState()
    const [eventCategoria, setEventCategoria] = useState()
    const [eventArtistas, setEventArtistas] = useState()
    const [eventMontoVent, setEventMonvoVent] = useState()
    const [startDate, setStartDate] = useState()
    const [endDate, setEndDate] = useState()
    const [eventProv, setEventProv] = useState()
    const [eventLocalidad, setEventLocalidad] = useState()
    const [eventDirecc, setEventDirecc] = useState()
    const [eventLugar, setEventLugar] = useState()

    useEffect(() => {
        const getOneProd = async () => {
            const res = await getOneProdRequest(prodId.prodId)
            setProd(res.data)
        }
        getOneProd()
    }, [])

    const updateEvent = (e) => {
        const formData = new FormData()
        formData.append('imgEvento', )
    }
    console.log(prod)

    return(
        <>
            <div>
                    <div>
                        {prod.map((p) => 
                        <form key={p._id} onSubmit={(e) => updateEvent(e)} encType="multipart/form-data">
                            <img src={p.imgEvento} alt=""></img>
                            <div>
                                <label>Nombre del evento:</label>
                                <input type="text" value={p.nombreEvento} onChange={() => setEventNombre(e.target.value)}></input>
                            </div>
                            <div>
                                <label>Descripcion</label>
                                <input type="text" value={p.descripcionEvento} onChange={() => setEventDesc(e.target.value)}></input>
                            </div>
                            <div>
                                <label>Edad minima</label>
                                <input type="text" value={p.eventoEdad} onChange={() => setEventEdad(e.target.value)}></input>
                            </div>
                                <div>
                            <label>Categorias del evento:</label>
                                <input type="text"  placeholder="..." value={p.categorias} onChange={() => setEventCategoria(e.target.value)} name="categorias"></input>
                            </div>
                            <div>
                                <label>Artistas que participan:</label>
                                <input type="text"  placeholder="..." value={p.artistas} onChange={() => setEventArtistas(e.target.value)} name="artistas"></input>
                            </div>
                            <div>
                                <label>Monto de ventas estimado</label>
                                <input type="number" placeholder="0" value={p.montoVentas} onChange={() => setEventMonvoVent(e.target.value)} name="montoVentas"></input>
                            </div>
                            <div>
                                <label>Fecha y hora de inicio:</label>
                                <input type="datetime-local" value={p.fechaInicio} onChange={(e) => setStartDate(e.target.value)}></input>
                            </div>
                            <div>
                                <label>Fecha y hora de fin:</label>
                                <input type="datetime-local" value={p.fechaFin} onChange={(e) => setEndDate(e.target.value)}></input>
                            </div>
                            <div className="flex items-center">
                                <div>
                                    <label>Provincia:</label>
                                    <select name="provincia" onChange={() => setEventProv(e.target.value)}>
                                        <option value="prov" defaultValue={p.provincia} selected>mostrar provincias</option>
                                    </select>
                                </div>
                                <div>
                                    <label>Localidad</label>
                                    <select name="localidad" onChange={() => setEventLocalidad(e.target.value)}>
                                        <option value="locald" defaultValue={p.localidad} selected>mostrar localidad</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label>Direccion:</label>
                                <input name="direccion" value={p.direccion} onChange={() => setEventDirecc(e.target.value)}></input>
                            </div>
                            <div>
                                <label>Lugar del evento:</label>
                                <input name="lugarEvento" value={p.lugarEvento} onChange={() => setEventLugar(e.target.value)}></input>
                            </div>
                        </form>)}
                    </div>
                    <div>
                        <div>

                        </div>
                    </div>

                </div>
        </>
    )
}

export default EditProd