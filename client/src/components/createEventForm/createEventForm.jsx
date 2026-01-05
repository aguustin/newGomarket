import { useState } from "react"
import { createEventRequest, createEventTicketsRequest } from "../../api/eventRequests"
import eventoJpg from '../../assets/images/fondoB.jpeg'
import { useContext } from "react"
import UserContext from "../../context/userContext"
import {Country, State, City} from "country-state-city"
import { Link } from "react-router"
import ticketPng from '../../assets/images/ticket.png'
import { LoadingButton } from "../../globalscomp/globalscomp"
import closePng from '../../assets/botones/close.png'
import advicePng from '../../assets/images/advice.png'
import megaphonePng from '../../assets/images/megaphone.png'
import uploadPng from '../../assets/botones/upload.png'


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
    const [eventoEdad, setEventoEdad] = useState()
    const [countries, setCountries] = useState(Country.getAllCountries())
    const [currency, setCurrency] = useState(null)
    const [states, setStates] = useState([])
    const [cities, setCities] = useState([])
    const [selectedCountry, setSelectedCountry] = useState(null)
    const [selectedState, setSelectedState] = useState(null)
    const [selectedCity, setSelectedCity] = useState(null)
    const [showEventInfo, setShowEventInfo] = useState(true)
    const [previewImage, setPreviewImage] = useState(null)
    const [imageFile, setImageFile] = useState()
    const [previewBanner, setPreviewBanner] = useState(null)
    const [imageBanner, setImageBanner] = useState()
    const [previewDescriptive, setPreviewDescriptive] = useState(null)
    const [imageDescriptive, setImageDescriptive] = useState()
    const [loading, setLoading] = useState(false)
    const [categorias, setCategorias] = useState([])
    const [dateMsg, setDateMsg] = useState(0)
    const [pubOrPriv, setPubOrPriv] = useState(1)
    let message = ''
  

    const createEvent = async (e) => {
            e.preventDefault()
           /* if(!imageFile){
                alert("Por favor, carga una imagen de la portada del evento antes de continuar.");
                return;
            }*/
            setLoading(true)
            const currentDateTime = new Date()
            const startDateToDate = new Date(startDate)
            const endDateToDate = new Date(endDate)

            if(startDateToDate > endDateToDate){
                setLoading(false)
                setDateMsg(2)
                message = 'La fecha de inicio no puede ser mayor a la fecha de fin'
            }else if(startDateToDate < currentDateTime){
                setDateMsg(1)
                message = 'La fecha de inicio no puede ser menor a la fecha actual'
            }else{
                
                currency
                selectedState?.name
                selectedCity?.name
                const tipoEvento = e.target.elements.tipoEvento.value
                const rawEdad = eventoEdad;
                // Si hay un número válido, lo agregás al FormData
                const formData = new FormData()
                formData.append('userId', session?.userFinded?.[0]?._id)
                formData.append('prodMail', session?.userFinded?.[0]?.mail) //aca va el mail de la session
                formData.append('codigoPais', selectedCity.countryCode)
                formData.append('codigoCiudad', selectedCity.stateCode)
                formData.append('paisDestino', selectedCountry.name)
                formData.append('tipoEvento', tipoEvento)
                if (rawEdad && !isNaN(Number(rawEdad))) {
                    formData.append('eventoEdad', rawEdad);
                }
                formData.append('nombreEvento', e.target.elements.nombreEvento.value)
                formData.append('descripcionEvento', e.target.elements.descripcionEvento.value)
                formData.append('aviso', e.target.elements.aviso.value)
                formData.append('categoriasEventos', JSON.stringify(categorias))
                formData.append('artistas', e.target.elements.artistas.value)
                formData.append('montoVentas', e.target.elements.montoVentas.value)
                formData.append('porcentajeRRPP', e.target.elements.porcentajeRRPP.value ?? 0)
                formData.append('fechaInicio',  new Date(startDate).toISOString())
                formData.append('fechaFin', new Date(endDate).toISOString())
                formData.append('provincia', selectedState?.name)
                formData.append('localidad', selectedCity?.name)
                formData.append('tipoMoneda', currency),
                formData.append('direccion', e.target.elements.direccion.value)
                formData.append('lugarEvento', e.target.elements.lugarEvento.value)
                formData.append('linkVideo', e.target.elements.linkVideo.value)
                formData.append('imgEvento', imageFile)
                formData.append('bannerEvento', imageBanner)
                formData.append('imagenDescriptiva', imageDescriptive)
                formData.append('comisionServicio', session?.userFinded?.[0]?.comisionServicio ?? 15)
                
                const res = await createEventRequest(formData)
    
                if(res.data.estado === 1){
                    setDateMsg(0)
                    setLoading(false)
                    setShowTickets(1)
                    setSaveEventId(res.data.eventId)
                }
                setShowEventInfo(false)
            }
            setLoading(false)
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
            formData.append('descripcionTicket', e.target.elements.descripcionTicket.value ?? '')
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
      setImageFile(file);
    }
};

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
 
    return(
        <>
        <div className="create-event-and-ticket-container mx-auto mt-[20px] mb-[20px] pl-12 pr-12 ">
            {showEventInfo &&
            <div className="create-event-container w-[100%] flex items-start mx-auto justify-center ">
                <div className="w-[375px] bg-white rounded-2xl p-3 bg-gradient-to-br from-gray-800 to-gray-900">
                    <b className="text-white text-xl">Portada del evento</b>
                    <img className="object-cover rounded-2xl mx-auto mt-3 " src={previewImage ?? eventoJpg} alt="" loading="lazy"></img>
                    <p className="flex items-center p-3 bg-gradient-to-r from-orange-200 to-orange-300 mt-3 mb-3 rounded-xl text-[#111827]"><img src={advicePng} alt=""></img> Recomendación: 550 x 600px JPG/PNG</p>
                    <div className="portal-evento bg-gradient-to-r from-amber-500 to-yellow-500 p-3 text-center rounded-2xl">
                        <label htmlFor="fileUpload" className="text-[#111827]!">Cargar portada</label>
                        <input id="fileUpload" className="hidden" type="file" name="imgEvento" onChange={handleImageChange}  required/>
                    </div>
                   {/* <button onClick={() => window.navigator.clipboard.writeText()}></button> */}
                </div>
                 <div className="event-form max-w-[70vw]">
                    <div className="mx-6 mb-3">
                        <div className="bg-gradient-to-r from-amber-600 to-yellow-500 rounded-2xl overflow-hidden p-4">
                            <h2 className="text-3xl font-bold text-[#111827]!">Crear nuevo evento:</h2>
                            <label className="text-[#111827]!">Llena todos los campos para poder publicar tu evento</label>

                        </div>
                        <p className="w-[auto] flex items-center p-3 bg-gradient-to-r from-orange-200 to-orange-300 mt-3 mb-3 rounded-xl text-[#111827]"><img className="mr-3" src={megaphonePng} alt=""></img> Consejo: Un titulo corto + una portada llamativa mejora la busqueda del evento</p>
                    </div>
               <form className="create-event-form relative bg-gradient-to-r from-gray-800 to-gray-900 text-[#111827]! flex flex-wrap mx-9 rounded-2xl p-5" onSubmit={(e) => createEvent(e)} encType="multipart/form-data">
                    <div className="create-event-form-div-child w-[50%]">
                        <div>
                            <label className="text-amber-500!">Pais del evento</label><br></br>
                            <select className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!" name="paisDestino" onChange={(e) => handleCountryChange(countries.find((c) => c.isoCode === e.target.value))} required>
                                <option className="text-[#111827]!" value=''>Elegir país</option>
                                {countries.map((cts) => (<option className="text-[#111827]" key={cts.isoCode} value={cts.isoCode}>{cts.name}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="text-white!">Privacidad del evento:</label><br></br>
                            <select className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!" name="tipoEvento" onChange={(e) => setPubOrPriv(e.target.value)}>
                                <option className="text-[#111827]!" value={1}>Publico</option>
                                <option className="text-[#111827]!" value={2}>Privado</option>
                            </select>
                        {pubOrPriv == 2 && <p className="w-[90%] p-2 bg-[#ffdeca] mt-1 mb-2 rounded-xl text-[#111827]">El evento solo sera visto por las personas a las que le envies tu enlace (link) del evento una vez creado</p> } 
                        </div>
                        <div>
                            <label className="text-white!">Evento para mayores de edad:</label><br></br>
                            <select className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!" onChange={(e) => setEstadoEdad(e.target.value)}>
                                <option className="text-[#111827]!" value={1}>NO</option>
                                <option className="text-[#111827]!" value={2}>SI</option>
                            </select>
                            {estadoEdad && <input className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white! border-gray-600!" type="number" placeholder="A partir de que edad" value={eventoEdad || ''} onChange={(e) => setEventoEdad(e.target.value === '' ? undefined : e.target.value)}></input>}
                        </div>
                        <div>
                            <label className="text-white!">Nombre del evento:</label>
                            <div>
                                <input className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white! border-gray-600!" type="text"  placeholder="..." name="nombreEvento" required></input>
                            </div>
                        </div>
                        <div>
                            <label>Descripcion del evento (opcional):</label>
                            <div>
                                <textarea className="h-[199px] bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white! border-gray-600!" type="text"  placeholder="..." name="descripcionEvento"></textarea>
                            </div>
                        </div>
                         <div>
                            <label>Aviso importante (opcional):</label>
                            <div>
                                <textarea className="h-[165px] bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!" type="text"  placeholder="..." name="aviso"></textarea>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="fileUpload" className="text-[#111827]">Banner del evento (opcional)</label>
                            <input id="fileUpload" className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!" type="file" name="bannerEvento" onChange={handleBannerChange} />
                        </div>
                        <div>
                            <label htmlFor="fileUpload" className="text-[#111827]">Imagen descriptiva (opcional)</label>
                            <input id="fileUpload" className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!" type="file" name="imagenDescriptiva" onChange={handleDescriptiveChange} />
                        </div>
                    </div>
                    <div className="create-event-form-div-child w-[50%]">
                        <div>
                            <label>Categorias del evento:</label>
                            <div>
                                <select className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!" onChange={handleChange} defaultValue="" required>
                                    <option className="text-[#111827]!" value="" disabled>Selecciona una categoría</option>
                                    <option className="text-[#111827]!" value="baile">Baile</option>
                                    <option className="text-[#111827]!" value="musica">Música</option>
                                    <option className="text-[#111827]!" value="arte">Arte</option>
                                    <option className="text-[#111827]!" value="teatro">Teatro</option>
                                    <option className="text-[#111827]!" value="deporte">Deporte</option>
                                </select>
                                {/*<input type="text"  placeholder="..." name="categorias" required></input>*/ }
                            </div>
                            <div className="flex items-center ">
                            {categorias.map((cat, i) => ( 
                            <div key={i} className="flex ml-1 pt-2 pb-2 pl-3 pr-3 rounded-lg bg-orange-500">
                                <label className="rounded-xl text-white!">{cat}</label>
                                <button className="remove-cat ml-2 cursor-pointer " type="button" onClick={(e) => removeCategory(e, cat)}><img src={closePng} alt=""></img></button>
                            </div>))}
                            </div>
                        </div>
                        <div>
                            <label>Artistas que participan (opcional):</label>
                            <div>
                                <input className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!" type="text"  placeholder="..." name="artistas"></input>
                            </div>
                        </div>
                            <div>
                                <label>Monto de ventas estimado:</label>
                                <div>
                                    <input className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!" type="number" min="1" placeholder="0" name="montoVentas" required></input>
                                </div>
                            </div>
                            <div>
                                <label>Comision para colaboradores por venta:</label>
                                <div>
                                    <input className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!" type="number" min="0" max="100" placeholder="0%" name="porcentajeRRPP" defaultValue={0}></input>
                                </div>
                            </div>   
                            <div>
                                <label>Fecha y hora de inicio:</label>
                                <div>
                                <input className="bg-gradient-to-r from-amber-600 to-yellow-500 text-[#111827]! border-[#111827]!" type="datetime-local" onChange={(e) => setStartDate(e.target.value)} required></input>  {dateMsg == 1 && <p className="text-red-600!">La fecha de inicio no puede ser menor a la fecha actual</p>}
                                </div>
                            </div>
                            <div>
                                <label>Fecha y hora de fin:</label>
                                <div>
                                    <input className="bg-gradient-to-r from-amber-600 to-yellow-500 text-[#111827]! border-[#111827]!" type="datetime-local" onChange={(e) => setEndDate(e.target.value)} required></input> {dateMsg == 2 && <p className="text-red-600!">La fecha de inicio no puede ser mayor a la fecha de fin</p>}
                                </div>
                            </div>
                                <div>
                                    <label>Provincia:</label>
                                    <select className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!" name="provincia" disabled={!selectedCountry} onChange={(e) => handleStateChange(states.find((s) => s.isoCode === e.target.value))} required>
                                        <option className="text-[#111827]" value=''>Elegir</option>
                                        {states.map((st) => (
                                            <option className="text-[#111827]" key={st.isoCode} value={st.isoCode}>{st.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label>Localidad:</label>
                                    <select className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!" name="localidad" disabled={!selectedState} onChange={(e) => handleCityChange(cities.find((c) => c.name === e.target.value))} required>
                                    <option className="text-[#111827]" value=''>Elegir</option>
                                    {cities.map((city) => (
                                        <option className="text-[#111827]" key={city.name} value={city.name}>{city.name}</option>
                                    ))}
                                    </select>
                                </div>
                            
                            <div>
                                <label>Direccion:</label>
                                <div>
                                    <input className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!" name="direccion" placeholder="..." required></input>
                                </div>
                            </div>
                            <div>
                                <label>Lugar del evento:</label>
                                <div>
                                    <input className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!" name="lugarEvento" placeholder="..." required></input>
                                </div>
                            </div>
                            <div>
                                <label>Video del evento (opcional):</label>
                                <div>
                                    <input className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!" name="linkVideo" placeholder="..."></input>
                                </div>
                            </div>
                            
                </div>
                <div>
                    <div className="banner-descImg flex flex-wrap justify-center">
                        {previewBanner && 
                        <div className="w-[300px] bg-white rounded-2xl p-1">
                            <img className="object-cover rounded-2xl mx-auto mt-3" src={previewBanner} alt="" loading="lazy"></img>
                            <div className="portal-evento text-center rounded-2xl">
                                <label htmlFor="fileUpload" className="flex items-center justify-center p-3 bg-[#ffdeca] mt-1 mb-3 rounded-xl text-[#111827]!">Banner del evento</label>
                                <input id="fileUpload" className="hidden" type="file" name="imgEvento" onChange={handleBannerChange} />
                            </div>
                        </div> }
                        {previewDescriptive && 
                        <div className="w-[300px] bg-white rounded-2xl p-1">
                            <img className="object-cover rounded-2xl mx-auto mt-3" src={previewDescriptive} alt="" loading="lazy"></img>
                            <div className="portal-evento text-center rounded-2xl">
                                <label htmlFor="fileUpload" className="flex items-center justify-center p-3 bg-[#ffdeca] mt-1 mb-3 rounded-xl text-[#111827]!">Imagen descriptiva</label>
                                <input id="fileUpload" className="hidden" type="file" name="imgEvento" onChange={handleDescriptiveChange} />
                            </div>
                        </div>}
                    </div>
                    <div className="relative mt-10 max-[760px]:mt-2 items-center flex flex-wrap">
                        <Link className='text-blue-500! underline!' to={"/conditions"}>Terminos y condiciones.</Link>
                        <label className="text-md text-white! ml-1">Acepto términos y condiciones</label>
                        <input className="mt-3 ml-2 w-[15px]! min-w-[15px]!" type="checkbox" required></input>
                    </div> 
                </div>
                    <button className="absolute right-4 bottom-4 bg-yellow-600 p-4 rounded-lg max-[760px]:relative max-[760px]:w-full max-[760px]:mt-6 max-[760px]:right-0 max-[760px]:bottom-0 text-[#111827]! font-bold hover:bg-amber-300 transition-all duration-300" type="submit">{loading ? <LoadingButton/> : 'CREAR EVENTO' } </button>
            </form> 
                </div>   
            </div>
               } 
            <div className="create-ticket-container-father mx-auto pt-3 pb-3 pl-6 pr-6">
                <div className="create-ticket-container max-w-[1000px] mx-auto rounded-2xl relative bg-gray-800">
                {showTickets >= 1 && 
                    <form className="create-ticket-form" onSubmit={(e) => createEventTickets(e)} encType="multipart/form-data">
                        <div className="mt-9">
                            <p className="w-[auto] flex items-center p-3 bg-[#ffdeca] mt-3 mb-3 rounded-xl text-[#111827]"><img className="mr-3" src={megaphonePng} alt=""></img> Crea al menos un ticket para continuar:</p>
                            <div className="flex items-center pl-3 mb-6 mt-6">
                                <img id="img-create-ticket" className="mr-3" src={ticketPng} alt="" loading="lazy"></img>
                                <h3 className="text-xl text-gray-200!">Crear nuevo ticket:</h3>
                            </div>
                            <div className="create-new-ticket rounded-2xl">
                                <div className="mt-3 p-3">
                                    <label className="text-gray-300!">Fecha y hora de fin:</label><br></br>
                                    <input className="reset-inp border-[2px]! border-gray-500! rounded-lg! text-gray-300!" type="datetime-local" onChange={(e) => setCloseDate(e.target.value)} required></input>
                                    {dateMsg == 3 && <p className="text-yellow-500!">La fecha de cierre del ticket no puede ser menor a la de inicio del evento</p>}
                                    {dateMsg == 4 && <p className="text-yellow-500!">La fecha de fin del ticket no puede ser mayor a la fecha de fin del evento</p>}
                                </div>
                                <div className="flex flex-wrap items-center">
                                    <div className="div-inputs-tickets  w-[50%] min-w-[270px] p-3">
                                        <div>
                                            <label className="text-gray-300!">Nombre del ticket</label>
                                            <input className="reset-inp border-[2px]! border-gray-500! rounded-lg! text-white!" type="text" placeholder="..." name="nombreTicket" required></input>
                                        </div>
                                        <div>
                                            <label className="text-gray-300!">Descripcion del ticket</label>
                                            <input className="reset-inp border-[2px]! border-gray-500! rounded-lg! text-white!" type="text" placeholder="..." name="descripcionTicket"></input>
                                        </div>
                                    </div>
                                    <div className="div-inputs-tickets w-[50%] min-w-[270px] p-3">
                                        <div>
                                            <label className="text-gray-300!">Precio del ticket</label>
                                            <input className="reset-inp border-[2px]! border-gray-500! rounded-lg! text-white!" type="number" min="0" placeholder="..." name="precio" required></input>
                                        </div>
                                        <div>
                                            <label className="text-gray-300!">Cantidad</label>
                                            <input className="reset-inp border-[2px]! border-gray-500! rounded-lg! text-white!" type="number" min="1" placeholder="..." name="cantidad" required></input>
                                        </div> 
                                    </div>
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center ml-3">
                                        <div>
                                            <label className="text-gray-300!">Estado:</label>
                                            <select className="reset-inp border-[2px]! border-gray-500! rounded-lg! text-white!" name="estado" onChange={(e) => setEstado(e.target.value)}>
                                                <option className="text-[#111827]!" value={1}>Activo</option>
                                                <option className="text-[#111827]!" value={2}>No visible</option>
                                                <option className="text-[#111827]!" value={3}>Cortesia</option>
                                            </select>
                                        </div>
                                    {estado === '3' &&
                                        <>
                                                <div>
                                                    <label className="text-gray-300!">Para:</label>
                                                    <select className="ml-1 text-white!" name="distribution" onChange={(e) => setDistribution(e.target.value)}>
                                                        <option className="text-[#111827]!" value={1}>RRPP</option>
                                                        <option className="text-[#111827]!" value={2}>Clientes</option>
                                                    </select>
                                                </div>
                                            
                                            {distribution === '2' &&
                                                    <div>
                                                        <label className="text-gray-300!">Limite a sacar por persona:</label>
                                                        <input className="reset-inp text-white!" type="number" name="limit" placeholder="Ej: 3" required></input>
                                                    </div>
                                            } 
                                        </>
                                    } 
                                    </div>
                                </div>
                                <div className="charge-ticket-img flex items-center mt-6 ml-3 max-[450px]:ml-0 max-[450px]:justify-center">
                                    <p className="text-gray-300!">Opcional: </p>
                                    <div className="bg-gradient-to-r from-amber-600 to-yellow-500 flex items-center p-3 rounded-xl ml-3 max-[450px]:ml-0 max-[450px]:w-[300px] max-[450px]:mx-auto! cursor-pointer hover:from-yellow-400 hover:to-yellow-400 "><img src={uploadPng} alt=""></img><label className="ml-3 text-[#111827]! cursor-pointer" htmlFor="imgTicketHtml">Cargar Imagen del ticket</label></div>
                                    <input id="imgTicketHtml" className="hidden" type="file" name="imgTicket"></input>
                                </div>
                            </div>
                            <div className="relative text-center w-full">
                                <div className="relative mt-6 h-[250px]">
                                    <button className="bg-orange-500! p-3 rounded-xl mb-6 text-lg text-white bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-500" type="submit">{loading ? <LoadingButton/> : disabledButton ? '+ Agregar otro ticket' : '+ Agregar ticket'}</button><br></br>
                                    {disabledButton && <><p className="text-xl! text-yellow-400!">Tu ticket fue creado con exito!</p><br></br></>}
                                    <p className="text-gray-300! text-lg mb-6 max-[530px]:text-sm!">Podras copiar el link de tu evento en la seccion - Mis producciones</p>
                                    {/*disabledButton && */<Link className="w-[200px]! mx-auto! primary-button mx-auto mb-10 p-2 rounded-2xl flex items-center justify-center text-xl" to="/">Continuar</Link>}
                                </div>
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