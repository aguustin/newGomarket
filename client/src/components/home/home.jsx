import { useEffect, useState } from "react"
import UserContext from "../../context/userContext"
import { getAllEventsRequest } from "../../api/eventRequests"
import { formatDateB, truncarConElipsis } from "../../globalscomp/globalscomp"
import { Link } from "react-router"
import FadeInImage from "../../globalscomp/globalscomp"
import eventsPng from "../../assets/botones/event.png"
import theatrePng from '../../assets/botones/theatre.png'
import plusPng from '../../assets/botones/18-plus.png'
import musicPng from '../../assets/botones/musical-note.png'
import discoPng from '../../assets/botones/dance.png'
import artPng from '../../assets/botones/paint.png'
import footprintsPng from '../../assets/botones/footprints.png'
import Skeleton from 'react-loading-skeleton';
import { saveEventRequest } from "../../api/userRequests"
import { useContext } from "react"

const Home = () => {
    const {session} = useContext(UserContext)
    const [allEvents, setAllEvents] = useState([])
    const [search, setSearch] = useState('')
    const [width, setWidth] = useState(null)
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
    const [edad, setEdad] = useState(0);  //continuar con esto para filtrar por edad
    const [favoriteEventIds, setFavoriteEventIds] = useState(() => {
            const session = JSON.parse(localStorage.getItem("session"));
            const userFavorites = session?.userFinded?.[0]?.favorites || [];
            return userFavorites.map(fav => fav?.eventId);
    });

    useEffect(() => { 
        const getAllEventsFunc = async () => {
            const getEvents = await getAllEventsRequest()
            setAllEvents(getEvents.data)
        }
        getAllEventsFunc()

        const favs = session?.userFinded?.[0]?.favorites || [];
        setFavoriteEventIds(favs.map(f => f.eventId));

        const mediaQuery = window.matchMedia("(min-width: 1376px)");

        const handleResize = () => {
           setWidth(mediaQuery.matches ? 1376 : 1375);
        };
       
        handleResize(); // valor inicial
        mediaQuery.addEventListener("change", handleResize);
       
        return () => mediaQuery.removeEventListener("change", handleResize);
    },[])
    
    if (width === null) return null;

    const saveEvent = async (eventId) => {
        const session = JSON.parse(localStorage.getItem("session"));
        const user = session?.userFinded?.[0];

        if (!user) {
            // Redirigir al login o mostrar cartel
            return;
        }

        let updatedFavorites;

        if (favoriteEventIds.includes(eventId)) {
            // Quitar de favoritos
            updatedFavorites = user.favorites.filter(f => f?.eventId !== eventId);
        } else {
            // Agregar a favoritos
            const newFavorite = {
                eventId: eventId,
                _id: Math.random().toString(36).substring(2, 15), // generar id temporal si querés
            };
            updatedFavorites = [...user.favorites, newFavorite];
        }

        // Actualizar localStorage
        const updatedSession = {
            ...session,
            userFinded: [
                {
                    ...user,
                    favorites: updatedFavorites
                }
            ]
        };
        localStorage.setItem("session", JSON.stringify(updatedSession));

        // Actualizar estado para render
        setFavoriteEventIds(updatedFavorites.map(f => f?.eventId));

        const data = {
            userId: session?.userFinded?.[0]?._id,
            eventId: eventId
        }
        const res = await saveEventRequest(data)

        if(res.data.empty){
                console.log("debes iniciar sesion")  //mostrar un cartel que diga que debe iniciar sesion y dejarle un link para que navegue al login (o poner un timeout y mandarlo directo al login)
        }else{
                console.log("Guardado con exito")
        }
    }


    return(
        <>
            <div className="home pt-10 pr-10 pl-10 mb-16">
                <div className="w-[100%] relative">
                    <div>
                        <h1>Encuentra tu evento:</h1> 
                    </div>
                    <div className="mt-4">
                        <form className="search-form justify-center flex items-center w-[90%] ml-3" >
                            <p className="primary-p text-lg w-[150px]">Buscar evento:</p>
                            <input className="w-[92%] bg-white ml-3 p-3 border-[1px] border-gray-200 rounded-3xl" placeholder="Escribe el titulo del evento" name="searchEvent" onChange={(e) => setSearch(e.target.value)}></input>
                        </form>
                    </div>
                    <div className="esc-tit mt-6">
                        <p className="secondary-p">Escribe para filtrar por titulo. Usa categorias para explorar</p>
                    </div>
                   
                        {width < 1376 &&
                            <div className="flex justify-center relative mx-6">
                                <div className="flex flex-wrap justify-around">
                                    <button className="flex items-center border-[1px] border-gray-200 text-left rounded-lg mt-6 p-3 text-[#111827]" onClick={() => setCategoriaSeleccionada('')}><img src={eventsPng} alt="" loading="lazy"></img><p className="ml-4">Todos</p></button>
                                    <button className="flex items-center border-[1px] border-gray-200 text-left rounded-lg mt-6 p-3 text-[#111827]" onClick={() => setCategoriaSeleccionada("baile")} name="baile"><img src={discoPng} alt="" loading="lazy"></img><p className="ml-4">Baile</p></button>
                                    <button className="flex items-center border-[1px] border-gray-200 text-left rounded-lg mt-6 p-3 text-[#111827]" onClick={() => setCategoriaSeleccionada("musica")} name="musica"><img src={musicPng} alt="" loading="lazy"></img><p className="ml-4">Musica</p></button>
                                    <button className="flex items-center border-[1px] border-gray-200 text-left rounded-lg mt-6 p-3 text-[#111827]" onClick={() => setCategoriaSeleccionada("arte")} name="arte"><img src={artPng} alt="" loading="lazy"></img><p className="ml-4">Arte</p></button>
                                    <button className="flex items-center border-[1px] border-gray-200 text-left rounded-lg mt-6 p-3 text-[#111827]" onClick={() => setCategoriaSeleccionada("teatro")} name="teatro"><img src={theatrePng} alt="" loading="lazy"></img><p className="ml-4">Teatro</p></button>
                                    <button className="flex items-center border-[1px] border-gray-200 text-left rounded-lg mt-6 p-3 text-[#111827]" onClick={() => setEdad(1)} name="menores"><img src={footprintsPng} alt="" loading="lazy"></img><p className="ml-4">Eventos -18</p></button>
                                    <button className="flex items-center border-[1px] border-gray-200 text-left rounded-lg mt-6 p-3 text-[#111827]" onClick={() => setEdad(2)} name="mayores"><img src={plusPng} alt="" loading="lazy"></img><p className="ml-4">Eventos +18</p></button>
                                </div>
                            </div>
                        }
                         <div className="events-and-categories flex items-start">
                            <div className="events-container flex flex-wrap items-start max-h-[1200px] w-[100%] mb-9">
                            {allEvents
                                .filter((allEv) => {
                                    const matchesSearch =
                                    search.toLowerCase() === '' ||
                                    allEv.nombreEvento.toLowerCase().includes(search.toLowerCase());
                                    const matchesType = allEv.tipoEvento === 1;
                                    const matchesCategory =
                                    categoriaSeleccionada === '' || // <- esto permite que no filtre si no hay categoría
                                    allEv.categoriasEventos.some(cat =>
                                        cat.toLowerCase().trim() === categoriaSeleccionada.toLowerCase().trim()
                                    );
                                    const eventoEdad = parseInt(allEv.eventoEdad); // o allEv.edadMinima si ese es el nombre correcto
                                    const hasEdad = !isNaN(eventoEdad);

                                    const matchesEdad =
                                        edad === '' || edad === null
                                            ? true
                                            : !hasEdad // si no tiene edad, incluirlo
                                            ? true
                                            : edad === 1
                                            ? eventoEdad < 18
                                            : edad === 2
                                            ? eventoEdad >= 18
                                            : true;

                                    return matchesSearch && matchesType && matchesCategory && matchesEdad;
                                })
                                .map((allEv) => (
                                    
                                    <div key={allEv?._id} className="primary-div w-[300px] p-4 relative mt-8 mx-3 rounded-xl border-[1px] border-gray-200">
                                        <Link to={{ pathname: `/buy_tickets/${allEv._id}/${allEv.prodMail}` }}>
                                            <FadeInImage
                                            src={allEv.imgEvento}
                                            alt={allEv.nombreEvento}
                                            className="mx-auto brightness-70"
                                            />
                                        </Link>
                                        <div className="event-desc rounded-b-lg bottom-0 mt-6">
                                            <h3 className="text-xl font-semibold">{allEv.nombreEvento}</h3>
                                            <p className="secondary-p event-desc-text  mb-2">
                                            {truncarConElipsis(allEv.descripcionEvento, 80)}
                                            </p>
                                            <label className="text-lg secondary-p">{formatDateB(allEv.fechaInicio)}</label>
                                        </div>
                                        <div className="flex items-center justify-between mt-5">
                                             {favoriteEventIds.includes(allEv._id) ? (
                                                    <button
                                                        className="primary-p bg-gray-400 p-2 rounded-xl"
                                                        onClick={() => saveEvent(allEv._id)}
                                                    >
                                                        Guardado
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="primary-p bg-orange-500 p-2 rounded-xl"
                                                        onClick={() => saveEvent(allEv._id)}
                                                    >
                                                        Guardar
                                                    </button>
                                                )}
                                                <Link className="primary-button p-2 rounded-xl" to={{ pathname: `/buy_tickets/${allEv._id}/${allEv.prodMail}` }}>Ver más</Link>
                                        </div>    
                                    </div>
                                ))}
                            </div>
                            {width > 1375 &&
                                <div className="secondary-button-fucsia categories-web-container rounded-xl mt-8">
                                    <div className="w-[400px] pl-4 pr-4 pt-7 pb-7">
                                        <p className="text-lg font-bold">Categorias</p>
                                        <button className="flex items-center bg-white text-left mt-7 p-3 rounded-2xl w-[100%] text-[#111827]" onClick={() => setCategoriaSeleccionada("")}><img src={eventsPng} alt="" loading="lazy"></img><p className="ml-4">Todos</p></button>
                                        <button className="flex items-center bg-white text-left mt-2 p-3 rounded-2xl w-[100%] text-[#111827]" onClick={() => setCategoriaSeleccionada("baile")} name="baile"><img src={discoPng} alt="" loading="lazy"></img><p className="ml-4">Baile</p></button>
                                        <button className="flex items-center bg-white text-left mt-2 p-3 rounded-2xl w-[100%] text-[#111827]" onClick={() => setCategoriaSeleccionada("musica")} name="musica"><img src={musicPng} alt="" loading="lazy"></img><p className="ml-4">Musica</p></button>
                                        <button className="flex items-center bg-white text-left mt-2 p-3 rounded-2xl w-[100%] text-[#111827]" onClick={() => setCategoriaSeleccionada("arte")} name="arte"><img src={artPng} alt="" loading="lazy"></img><p className="ml-4">Arte</p></button>
                                        <button className="flex items-center bg-white text-left mt-2 p-3 rounded-2xl w-[100%] text-[#111827]" onClick={() => setCategoriaSeleccionada("teatro")} name="teatro"><img src={theatrePng} alt="" loading="lazy"></img><p className="ml-4">Teatro</p></button>
                                        <button className="flex items-center bg-white text-left mt-2 p-3 rounded-2xl w-[100%] text-[#111827]" onClick={() => setEdad(1)} name="menores"><img src={footprintsPng} alt="" loading="lazy"></img><p className="ml-4">Eventos -18</p></button>
                                        <button className="flex items-center bg-white text-left mt-2 p-3 rounded-2xl w-[100%] text-[#111827]" onClick={() => setEdad(2)} name="mayores"><img src={plusPng} alt="" loading="lazy"></img><p className="ml-4">Eventos +18</p></button>
                                    </div>
                                                                                                                                                  
                                </div>
                            }
                    </div>
                </div>
            </div>
        </>
    )
}

export default Home