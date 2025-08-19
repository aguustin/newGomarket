import { useState } from "react"
import { createEventRequest, createEventTicketsRequest } from "../../api/eventRequests"
import eventoJpg from '../../assets/imgpruebaEventos.jpg'
import continueArrowPng from '../../assets/botones/continue_arrow.png'
import { useContext } from "react"
import UserContext from "../../context/userContext"
import {Country, State, City} from "country-state-city"
import { Link } from "react-router"
import ticketPng from '../../assets/images/ticket.png'
import { LoadingButton } from "../../globalscomp/globalscomp"
import closePng from '../../assets/botones/close.png'

const CreateEventForm = () => {
    const {session} = useContext(UserContext)
    const [startDate, setStartDate] = useState()
    const [endDate, setEndDate] = useState()
    const [showTickets, setShowTickets] = useState(0)
    const [estado, setEstado] = useState(1)
    const [distribution, setDistribution] = useState(0)
    const [closeDate, setCloseDate] = useState()
    const [disabledButton, setDisabledButton] = useState(false)
    const [saveEventId, setSaveEventId] = useState()
    const [estadoEdad, setEstadoEdad] = useState()
    const [countries, setCountries] = useState(Country.getAllCountries())
    const [currency, setCurrency] = useState(null)
    const [states, setStates] = useState([])
    const [cities, setCities] = useState([])
    const [selectedCountry, setSelectedCountry] = useState(null)
    const [selectedState, setSelectedState] = useState(null)
    const [selectedCity, setSelectedCity] = useState(null)
    const [showEventInfo, setShowEventInfo] = useState(true)
    const [previewImage, setPreviewImage] = useState(null)
    const [loading, setLoading] = useState(false)
    const [categorias, setCategorias] = useState([])
    const [dateMsg, setDateMsg] = useState(0)
    const [pubOrPriv, setPubOrPriv] = useState(1)
    let message = ''

    const createEvent = async (e) => {
            e.preventDefault()
            setLoading(true)
            const currentDateTime = new Date()
            const startDateToDate = new Date(startDate)
            const endDateToDate = new Date(endDate)

            if(startDateToDate > endDateToDate){
                setLoading(false)
                setDateMsg(2)
                console.log(message)
                message = 'La fecha de inicio no puede ser mayor a la fecha de fin'
            }else if(startDateToDate < currentDateTime){
                setDateMsg(1)
                message = 'La fecha de inicio no puede ser menor a la fecha actual'
            }else{
                currency
                selectedState?.name
                selectedCity?.name
                const tipoEvento = e.target.elements.tipoEvento.value
                const eventoEdad = e?.target?.elements?.eventoEdad?.value || null
                const formData = new FormData()
                formData.append('userId', session?.userFinded?.[0]?._id)
                formData.append('prodMail', session?.userFinded?.[0]?.mail) //aca va el mail de la session
                formData.append('paisDestino', selectedCountry.name)
                formData.append('tipoEvento', tipoEvento)
                formData.append('eventoEdad', eventoEdad)
                formData.append('nombreEvento', e.target.elements.nombreEvento.value)
                formData.append('descripcionEvento', e.target.elements.descripcionEvento.value)
                formData.append('categorias', JSON.stringify(categorias))
                formData.append('artistas', e.target.elements.artistas.value)
                formData.append('montoVentas', e.target.elements.montoVentas.value)
                formData.append('fechaInicio',  new Date(startDate).toISOString())
                formData.append('fechaFin', new Date(endDate).toISOString())
                formData.append('provincia', selectedState?.name)
                formData.append('localidad', selectedCity?.name)
                formData.append('tipoMoneda', currency),
                formData.append('direccion', e.target.elements.direccion.value)
                formData.append('lugarEvento', e.target.elements.lugarEvento.value)
                formData.append('linkVideo', e.target.elements.linkVideo.value)
                formData.append('imgEvento', e.target.elements.imgEvento.files[0])

                const res = await createEventRequest(formData)
    
                if(res.data.estado === 1){
                    setDateMsg(0)
                    setLoading(false)
                    setShowTickets(1)
                    setSaveEventId(res.data.eventId)
                }
                setShowEventInfo(false)
            }
            
    }

    const createEventTickets = async (e) => { //agregar estado a los tickets
        e.preventDefault()
        setLoading(true)
        const startDateToDate = new Date(startDate)
        const clodeDateToDate = new Date(closeDate)
        const endDateToDate = new Date(endDate)

        if(startDateToDate > clodeDateToDate){
            setLoading(false)
            setDateMsg(3)
            message = 'La fecha de cierre del ticket no puede ser menor a la de inicio del evento'
        }else if(endDateToDate < clodeDateToDate){
            setLoading(false)
            setDateMsg(4)
            message = 'La fecha de fin del ticket no puede ser mayor a la fecha de fin del evento'
        }else{
            setDateMsg(0)
            const formData = new FormData()
            formData.append('prodId', saveEventId)
            formData.append('nombreTicket', e.target.elements.nombreTicket.value)
            formData.append('descripcionTicket', e.target.elements.descripcionTicket.value)
            formData.append('precio', e.target.elements.precio.value)
            formData.append('cantidad', e.target.elements.cantidad.value)
            formData.append('fechaDeCierre', new Date(closeDate).toISOString())
            formData.append('imgTicket', e.target.elements.imgTicket.files[0])
            formData.append('visibilidad', e.target.elements.estado.value)
            formData.append('estado', estado)
            formData.append('distribution', distribution)
            formData.append('limit', e.target.elements?.limit?.value)
            const res = await createEventTicketsRequest(formData)

            if(res.data.estado === 1){
                setLoading(false)
                setDisabledButton(true)
                e.target.reset()
            }
        }

    }

    const handleCountryChange = (country) => {
        setSelectedCountry(country)
        setCurrency(country.currency)
        setStates(State.getStatesOfCountry(country.isoCode))
        setCities([])
    }

    const handleStateChange = (state) => {
        setSelectedState(state)
        setCities(City.getCitiesOfState(selectedCountry.isoCode, state.isoCode))
    }

    const handleCityChange = (city) => {
        setSelectedCity(city)
    }

    const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
    }
  };

    const handleChange = (e) => {
        const selected = e.target.value;

        // Agregamos si no está ya en el array
        if (!categorias.includes(selected)) {
            setCategorias((prev) => [...prev, selected]);
        }
    };
    
    const removeCategory = (e, categoryName) => {
        e.preventDefault()
        setCategorias(categorias.filter(c => !c.includes(categoryName)))
    }
   console.log(pubOrPriv)
    return(
        <>
        <div className="create-form mx-auto flex justify-around mt-[20px] pl-12 pr-12">
               {showEventInfo &&
            <div className="w-[450px]">
               <form className="create-event-form mt-9" onSubmit={(e) => createEvent(e)} encType="multipart/form-data">
                    <div>
                        <label>Pais del evento</label>
                        <select name="paisDestino" onChange={(e) => handleCountryChange(countries.find((c) => c.isoCode === e.target.value))} required>
                            <option value=''>Elegir país</option>
                            {countries.map((cts) => (<option key={cts.isoCode} value={cts.isoCode}>{cts.name}</option>))}
                        </select>
                    </div>
                    <div>
                        <label>Privacidad del evento:</label>
                        <select name="tipoEvento" onChange={(e) => setPubOrPriv(e.target.value)}>
                            <option value={1}>Publico</option>
                            <option value={2}>Privado</option>
                        </select>
                       {pubOrPriv == 2 && <p className="text-violet-600!">El evento solo sera visto por las personas a las que le envies tu enlace (link) del evento una vez creado</p> } 
                    </div>
                    <div>
                        <label>Evento para mayores de edad:</label>
                        <select onChange={(e) => setEstadoEdad(e.target.value)}>
                            <option value={1}>NO</option>
                            <option value={2}>SI</option>
                        </select>
                        {estadoEdad && <input type="number" placeholder="A partir de que edad" name="eventoEdad" required></input>}
                    </div>
                    <div>
                        <label>Nombre del evento:</label>
                        <div>
                            <input type="text"  placeholder="..." name="nombreEvento" required></input>
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
                            <select onChange={handleChange} defaultValue="" required>
                                <option value="" disabled>Selecciona una categoría</option>
                                <option value="baile">Baile</option>
                                <option value="musica">Música</option>
                                <option value="arte">Arte</option>
                                <option value="teatro">Teatro</option>
                            </select>
                            {/*<input type="text"  placeholder="..." name="categorias" required></input>*/ }
                        </div>
                        <div className="flex items-center mt-5 mb-2">
                        {categorias.map((cat, i) => ( 
                        <div key={i} className="flex ml-1 pt-2 pb-2 pl-3 pr-3 rounded-lg bg-violet-600!">
                            <label className="rounded-xl">{cat}</label>
                            <button className="remove-cat ml-2 cursor-pointer" type="button" onClick={(e) => removeCategory(e, cat)}><img src={closePng} alt=""></img></button>
                        </div>))}
                        </div>
                    </div>
                    <div>
                        <label>Artistas que participan (opcional):</label>
                        <div>
                            <input type="text"  placeholder="..." name="artistas"></input>
                        </div>
                    </div>
                    <div>
                        <label>Monto de ventas estimado</label>
                        <div>
                            <input type="number" placeholder="0" name="montoVentas" required></input>
                        </div>
                    </div>
                    <div>
                        <label>Fecha y hora de inicio:</label>
                        <div>
                           <input type="datetime-local" onChange={(e) => setStartDate(e.target.value)} required></input>  {dateMsg == 1 && <p className="text-red-600!">La fecha de inicio no puede ser menor a la fecha actual</p>}
                        </div>
                    </div>
                    <div>
                        <label>Fecha y hora de fin:</label>
                        <div>
                            <input type="datetime-local" onChange={(e) => setEndDate(e.target.value)} required></input> {dateMsg == 2 && <p className="text-red-600!">La fecha de inicio no puede ser mayor a la fecha de fin</p>}
                        </div>
                    </div>
                    <div className="flex items-center">
                        <div>
                            <label>Provincia:</label>
                            <select name="provincia" disabled={!selectedCountry} onChange={(e) => handleStateChange(states.find((s) => s.isoCode === e.target.value))} required>
                                <option value=''>Elegir</option>
                                {states.map((st) => (
                                    <option key={st.isoCode} value={st.isoCode}>{st.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="ml-6">
                            <label>Localidad:</label>
                            <select name="localidad" disabled={!selectedState} onChange={(e) => handleCityChange(cities.find((c) => c.name === e.target.value))} required>
                               <option value=''>Elegir</option>
                               {cities.map((city) => (
                                <option key={city.name} value={city.name}>{city.name}</option>
                               ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label>Direccion:</label>
                        <div>
                            <input name="direccion" placeholder="..." required></input>
                        </div>
                    </div>
                    <div>
                        <label>Lugar del evento:</label>
                        <div>
                            <input name="lugarEvento" placeholder="..." required></input>
                        </div>
                    </div>
                    <div>
                        <label>Video del evento (opcional):</label>
                        <div>
                            <input name="linkVideo" placeholder="..."></input>
                        </div>
                    </div>
                    <div className="portal-evento">
                        <label>Portada del evento:</label>
                        <input type="file" placeholder="..." name="imgEvento" onChange={handleImageChange}></input>
                    </div>
                <div id="terminos-condiciones">
                    <div className="relative mt-10">
                        <label>Acepto términos y condiciones</label>
                        <input className="absolute left-18" type="checkbox" required></input>
                    </div>
                </div>
                <button className="bg-violet-900 p-4 rounded-lg w-full mt-10 mb-20" type="submit">{loading ? <LoadingButton/> : 'CREAR EVENTO' } </button>
            </form> 
            </div>
               } 
            <div className="mt-9 mb-25 mx-auto">
                <div>
                    <img className="event-img w-[430px] h-[450px] object-cover rounded-lg" src={previewImage ?? eventoJpg} alt="" loading="lazy"></img>
                </div>
                <div className="w-[430px] relative">
                {showTickets >= 1 && 
                    <form className="create-ticket-form" onSubmit={(e) => createEventTickets(e)} encType="multipart/form-data">
                        <div className="mt-9">
                            <p className="text-violet-400! mb-2 underline">Crea al menos un ticket para continuar:</p>
                            <div className="flex items-center">
                                <h3 className="text-violet-500! text-xl">Crear nuevo ticket:</h3>
                                <img id="img-create-ticket" className="ml-5" src={ticketPng} alt="" loading="lazy"></img>
                            </div>
                            <div className="mt-3">
                                <label>Nombre del ticket</label>
                                <input className="reset-inp" type="text" placeholder="..." name="nombreTicket" required></input>
                            </div>
                            <div className="mt-3">
                                <label>Descripcion del ticket</label>
                                <input className="reset-inp" type="text" placeholder="..." name="descripcionTicket" required></input>
                            </div>
                            <div className="flex flex-wrap items-center">
                                <div className="mt-3">
                                    <label>Precio del ticket</label>
                                    <input className="reset-inp" type="number" placeholder="..." name="precio" required></input>
                                </div>
                                <div className="mt-3">
                                    <label>Cantidad</label>
                                    <input className="reset-inp" type="number" placeholder="..." name="cantidad" required></input>
                                </div>
                                <div className="mt-3">
                                    <div className="flex items-center">
                                        <label>Estado:</label>
                                        <select className="reset-inp ml-1" name="estado" onChange={(e) => setEstado(e.target.value)}>
                                            <option value={1}>Activo</option>
                                            <option value={2}>No visible</option>
                                            <option value={3}>Cortesia</option>
                                        </select>
                                    </div>
                                   {estado === '3' &&
                                    <>
                                            <div className="flex items-center mt-3">
                                                <label>Para:</label>
                                                <select className="ml-1" name="distribution" onChange={(e) => setDistribution(e.target.value)}>
                                                    <option value={1}>RRPP</option>
                                                    <option value={2}>Clientes</option>
                                                </select>
                                            </div>
                                        
                                           {distribution === '2' &&
                                                <div className="mt-3">
                                                    <label>Limite a sacar por persona:</label>
                                                    <input className="reset-inp" type="number" name="limit" placeholder="Ej: 3" required></input>
                                                </div>
                                           } 
                                        </>
                                   } 
                                </div>
                            </div>
                            <div className="mt-3">
                                <label>Fecha y hora de fin:</label>
                                <input className="reset-inp" type="datetime-local" onChange={(e) => setCloseDate(e.target.value)} required></input>
                                {dateMsg == 3 && <p className="text-red-600!">La fecha de cierre del ticket no puede ser menor a la de inicio del evento</p>}
                                {dateMsg == 4 && <p className="text-red-600!">La fecha de fin del ticket no puede ser mayor a la fecha de fin del evento</p>}
                            </div>
                            <div className="mt-3">
                                <label>Imagen del ticket</label>
                                <input className="reset-inp" type="file" name="imgTicket" required></input>
                            </div>
                        </div>
                        <div className="relative flex items-center w-full">
                            <div className="items-center mt-6">
                                <button className="bg-violet-700 p-3 rounded-lg mb-6" type="submit">{loading ? <LoadingButton/> : disabledButton ? '+ Agregar otro ticket' : '+ Agregar ticket'}</button><br></br>
                                {disabledButton && <><p className="text-xl! text-violet-400!">Tu ticket fue creado con exito!</p><br></br></>}
                                <p className="text-violet-600! text-lg mb-10">Podras copiar el link de tu evento en la seccion - Mis producciones</p>
                                {disabledButton && <Link className="continuar-button absolute right-0 mt-36 mb-10 p-4 rounded-lg flex items-center w-[180px] justify-between " to="/Home">Continuar<img src={continueArrowPng} alt="" loading="lazy"></img></Link>}
                            </div>
                        </div>
                    </form>
                }
                </div>
            </div>
        </div>
        </>
    )
}

export default CreateEventForm