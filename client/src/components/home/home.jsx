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
import footballPng from '../../assets/botones/football.png'
import starPng from '../../assets/botones/star.png'
import starBPng from '../../assets/botones/starB.png'
import Skeleton from 'react-loading-skeleton';
import { saveEventRequest } from "../../api/userRequests"
import { useContext } from "react"
import { Country, State, City } from "country-state-city"
import djPartyPng from '../../assets/dj-party-meaning.png'
import goOriginalPng from '../../assets/goticketImgs/GO ORIGINAL SIN FONDO.png'

const Home = () => {
    const { session } = useContext(UserContext)
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
    const [provincias, setProvincias] = useState([]);
    const [localidades, setLocalidades] = useState([]);
    const [provinciaSeleccionada, setProvinciaSeleccionada] = useState("");
    const [localidadSeleccionada, setLocalidadSeleccionada] = useState("");
    const [fechaInicioFiltro, setFechaInicioFiltro] = useState("");
    const [fechaFinFiltro, setFechaFinFiltro] = useState("");

    const toggleCategoria = (categoria) => {
    setCategoriaSeleccionada((prev) => (prev === categoria ? '' : categoria));
    };

    const toggleEdad = (edad) => {
        setEdad((prev) => (prev === edad ? null : edad));
    };

    useEffect(() => {
        const provinciasArg = State.getStatesOfCountry("AR");
        setProvincias(provinciasArg);

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
    }, [])

    useEffect(() => {
        if (provinciaSeleccionada) {
            const ciudades = City.getCitiesOfState("AR", provinciaSeleccionada);
            setLocalidades(ciudades);
        } else {
            setLocalidades([]);
        }
    }, [provinciaSeleccionada]);

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

        if (res.data.empty) {
            console.log("debes iniciar sesion")  //mostrar un cartel que diga que debe iniciar sesion y dejarle un link para que navegue al login (o poner un timeout y mandarlo directo al login)
        } else {
            console.log("Guardado con exito")
        }
    }

    return (
        <>
            <div className="home mb-16">
                <div className="relative w-full h-[500px] max-[440px]:h-[540px]">
                    <img
                        className="absolute top-0 left-0 w-full h-full object-cover"
                        src={djPartyPng}
                        alt="Imagen fondo"
                    />
                    <div className="absolute top-0 left-0 w-full h-full bg-black opacity-[50%]"></div>
                    <div className="relative z-3 flex flex-col items-center justify-center h-full text-white text-center">
                        <div className="filtrar-eventos w-full max-w-3xl px-4">
                            <img className="w-[600px] h-[150px] mx-auto max-[620px]:h-auto" src={goOriginalPng} alt=""></img>
                            {/*<h1 className="text-3xl font-bold mb-4 text-white!">Encuentra tu evento:</h1>*/}
                            <form className="search-form justify-center flex items-center w-full">
                                <p className="text-lg w-[170px] text-white">Buscar evento:</p>
                                <input
                                    className="max-[575px]:w-[90%] w-full bg-white text-black ml-3 p-3 border-[1px] border-gray-200 rounded-3xl"
                                    placeholder="Go Busqueda"
                                    name="searchEvent"
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </form>
                        </div>
                        <div className="max-[575px]:w-[96%] mt-6 flex flex-wrap gap-4 justify-center items-center">
                             <p
                                className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                            >
                                Filtrado
                            </p>
                            <select
                                className="px-4 py-2 rounded-lg border border-gray-300 text-black bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={provinciaSeleccionada}
                                onChange={(e) => setProvinciaSeleccionada(e.target.value)}
                            >
                                <option value="">Provincia</option>
                                {provincias.map((prov) => (
                                    <option key={prov.isoCode} value={prov.isoCode}>
                                        {prov.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                className="max-[575px]:w-[70%]! px-4 py-2 rounded-lg border border-gray-300 text-black bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={localidadSeleccionada}
                                onChange={(e) => setLocalidadSeleccionada(e.target.value)}
                                disabled={!provinciaSeleccionada}
                            >
                                <option value="">Localidad</option>
                                {localidades.map((loc) => (
                                    <option key={loc.name} value={loc.name}>
                                        {loc.name}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="date"
                                className="max-[440px]:w-[50%] max-[440px]:mx-auto px-4 py-2 rounded-lg border border-gray-300 text-black bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={fechaInicioFiltro}
                                onChange={(e) => setFechaInicioFiltro(e.target.value)}
                            />
                            
                            <input
                                type="date"
                                className="max-[440px]:w-[50%] max-[440px]:mx-auto px-4 py-2 rounded-lg border border-gray-300 text-black bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={fechaFinFiltro}
                                onChange={(e) => setFechaFinFiltro(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="events w-[100%] pr-10 pl-10 relative">
                    {width < 1376 &&
                        <div className="categories flex justify-center relative mx-6">
                            <div className="flex flex-wrap justify-around">
                                <button className={`flex items-center border-[1px] border-gray-200 text-left rounded-lg mt-6 p-3 text-[#111827] ${categoriaSeleccionada === '' ? 'bg-[#f97316]' : ''}`} onClick={() => setCategoriaSeleccionada('')}><img src={eventsPng} alt="" loading="lazy"></img><p className="ml-4">Todos</p></button>
                                <button className={`flex items-center border-[1px] border-gray-200 text-left rounded-lg mt-6 p-3 text-[#111827] ${categoriaSeleccionada === 'baile' ? 'bg-[#f97316]' : ''}`} onClick={() => setCategoriaSeleccionada("baile")} name="baile"><img src={discoPng} alt="" loading="lazy"></img><p className="ml-4">Baile</p></button>
                                <button className={`flex items-center border-[1px] border-gray-200 text-left rounded-lg mt-6 p-3 text-[#111827] ${categoriaSeleccionada === 'musica' ? 'bg-[#f97316]' : ''}`} onClick={() => setCategoriaSeleccionada("musica")} name="musica"><img src={musicPng} alt="" loading="lazy"></img><p className="ml-4">Musica</p></button>
                                <button className={`flex items-center border-[1px] border-gray-200 text-left rounded-lg mt-6 p-3 text-[#111827] ${categoriaSeleccionada === 'arte' ? 'bg-[#f97316]' : ''}`} onClick={() => setCategoriaSeleccionada("arte")} name="arte"><img src={artPng} alt="" loading="lazy"></img><p className="ml-4">Arte</p></button>
                                <button className={`flex items-center border-[1px] border-gray-200 text-left rounded-lg mt-6 p-3 text-[#111827] ${categoriaSeleccionada === 'teatro' ? 'bg-[#f97316]' : ''}`} onClick={() => setCategoriaSeleccionada("teatro")} name="teatro"><img src={theatrePng} alt="" loading="lazy"></img><p className="ml-4">Teatro</p></button>
                                <button className={`flex items-center border-[1px] border-gray-200 text-left rounded-lg mt-6 p-3 text-[#111827] ${categoriaSeleccionada === 'deporte' ? 'bg-[#f97316]' : ''}`} onClick={() => setCategoriaSeleccionada("deporte")} name="deporte"><img src={footballPng} alt="" loading="lazy"></img><p className="ml-4">Deporte</p></button>
                                <button className={`flex items-center border-[1px] border-gray-200 text-left rounded-lg mt-6 p-3 text-[#111827] ${edad === 1 ? 'bg-[#f97316]' : ''}`} onClick={() => setEdad(edad === 1 ? 0 : 1)} name="menores"><img src={footprintsPng} alt="" loading="lazy"></img><p className="ml-4">Eventos -18</p></button>
                                <button className={`flex items-center border-[1px] border-gray-200 text-left rounded-lg mt-6 p-3 text-[#111827] ${edad === 2 ? 'bg-[#f97316]' : ''}`} onClick={() => setEdad(edad === 2 ? 0 : 2)} name="mayores"><img src={plusPng} alt="" loading="lazy"></img><p className="ml-4">Eventos +18</p></button>
                            </div>
                        </div>
                    }
                        {width > 1375 &&
                            <div className="categories w-full  mt-3">
                                <div className="w-full pb-1 flex bg-gradient-to-r from-purple-500 to-pink-500 transition-all">
                                    <button className={`flex justify-center border-r-[2px] items-center border-y-white-500! text-white font-semibold text-center mt-2 p-3 w-[100%] text-[#111827] ${categoriaSeleccionada === '' ? 'bg-gradient-to-r from-purple-700' : ''}`} onClick={() => setCategoriaSeleccionada("")}><img src={eventsPng} alt="" loading="lazy"></img><p className="ml-4">Todos</p></button>
                                    <button className={`flex justify-center border-r-[2px] items-center border-y-white-500! text-white font-semibold text-center mt-2 p-3 w-[100%] text-[#111827] ${categoriaSeleccionada === 'baile' ? 'bg-gradient-to-r from-purple-700' : ''}`} onClick={() => setCategoriaSeleccionada("baile")} name="baile"><img src={discoPng} alt="" loading="lazy"></img><p className="ml-4">Baile</p></button>
                                    <button className={`flex justify-center border-r-[2px] items-center border-y-white-500! text-white font-semibold text-center mt-2 p-3 w-[100%] text-[#111827] ${categoriaSeleccionada === 'musica' ? 'bg-gradient-to-r from-purple-700' : ''}`} onClick={() => setCategoriaSeleccionada("musica")} name="musica"><img src={musicPng} alt="" loading="lazy"></img><p className="ml-4">Musica</p></button>
                                    <button className={`flex justify-center border-r-[2px] items-center border-y-white-500! text-white font-semibold text-center mt-2 p-3 w-[100%] text-[#111827] ${categoriaSeleccionada === 'arte' ? 'bg-gradient-to-r from-purple-700' : ''}`} onClick={() => setCategoriaSeleccionada("arte")} name="arte"><img src={artPng} alt="" loading="lazy"></img><p className="ml-4">Arte</p></button>
                                    <button className={`flex justify-center border-r-[2px] items-center border-y-white-500! text-white font-semibold text-center mt-2 p-3 w-[100%] text-[#111827] ${categoriaSeleccionada === 'teatro' ? 'bg-gradient-to-r from-purple-700' : ''}`} onClick={() => setCategoriaSeleccionada("teatro")} name="teatro"><img src={theatrePng} alt="" loading="lazy"></img><p className="ml-4">Teatro</p></button>
                                    <button className={`flex justify-center border-r-[2px] items-center border-y-white-500! text-white font-semibold text-center mt-2 p-3 w-[100%] text-[#111827] ${categoriaSeleccionada === 'deporte' ? 'bg-gradient-to-r from-purple-700' : ''}`} onClick={() => setCategoriaSeleccionada("deporte")} name="deporte"><img src={footballPng} alt="" loading="lazy"></img><p className="ml-4">Deporte</p></button>
                                    <button className={`flex justify-center border-r-[2px] items-center border-y-white-500! text-white font-semibold text-center mt-2 p-3 w-[100%] text-[#111827] ${edad === 1 ? 'bg-gradient-to-r from-purple-700' : ''}`} onClick={() => setEdad(edad === 1 ? 0 : 1)} name="menores"><img src={footprintsPng} alt="" loading="lazy"></img><p className="ml-4">Eventos -18</p></button>
                                    <button className={`flex justify-center  items-center border-y-white-500! text-white font-semibold text-center mt-2 p-3 w-[100%] text-[#111827] ${edad === 2 ? 'bg-gradient-to-r from-purple-700' : ''}`} onClick={() => setEdad(edad === 2 ? 0 : 2)} name="mayores"><img src={plusPng} alt="" loading="lazy"></img><p className="ml-4">Eventos +18</p></button>
                                </div>
                            </div>
                        }
                    <div className="events-and-categories flex items-start">
                        <div className="events-container flex flex-wrap items-start max-h-[1200px] w-[100%] mb-9">
   {allEvents
  .filter((allEv) => {
    const searchLower = search.toLowerCase().trim();
    const matchesSearch =
      searchLower === '' ||
      allEv.nombreEvento.toLowerCase().includes(searchLower);

    const matchesType = allEv.tipoEvento === 1;

    const matchesCategory =
      categoriaSeleccionada === '' ||
      allEv.categoriasEventos.some(cat =>
        cat.toLowerCase().trim() === categoriaSeleccionada.toLowerCase().trim()
      );

    const eventoEdad = parseInt(allEv.eventoEdad);
    const hasEdad = !isNaN(eventoEdad);

    const matchesEdad =
      edad === 0
        ? true
        : !hasEdad
          ? true
          : edad === 1
            ? eventoEdad < 18
            : edad === 2
              ? eventoEdad >= 18
              : true;

    const matchesProvincia =
      provinciaSeleccionada === '' ||
      allEv.provincia?.toLowerCase() ===
        State.getStateByCodeAndCountry(provinciaSeleccionada, 'AR')?.name.toLowerCase();

    const matchesLocalidad =
      localidadSeleccionada === '' ||
      allEv.localidad?.toLowerCase() === localidadSeleccionada.toLowerCase();

    const fechaEvento = allEv.fechaInicio?.slice(0, 10); // "YYYY-MM-DD"
    
    const matchesFechaRango =
      (!fechaInicioFiltro || !fechaFinFiltro) || // Si alguna no está definida, no filtra
      (fechaEvento >= fechaInicioFiltro && fechaEvento <= fechaFinFiltro);

    return (
      matchesSearch &&
      matchesType &&
      matchesCategory &&
      matchesEdad &&
      matchesProvincia &&
      matchesLocalidad &&
      matchesFechaRango
    );
  })
                                .map((allEv) => (

                                    <div key={allEv?._id} className="primary-div w-[300px] relative mt-8 mx-3 rounded-xl border-[1px] border-gray-200">
                                        <Link to={{ pathname: `/buy_tickets/${allEv._id}/${allEv.prodMail}` }}>
                                            <FadeInImage
                                                src={allEv.imgEvento}
                                                alt={allEv.nombreEvento}
                                                className="mx-auto rounded-t-xl brightness-70"
                                            />
                                        </Link>
                                        <div className="event-desc relative rounded-b-lg bottom-0 p-4 h-[156px]">
                                              {favoriteEventIds.includes(allEv._id) ? (
                                                <button
                                                    className="primary-p absolute right-4 top-3 p-1 rounded-xl"
                                                    onClick={() => saveEvent(allEv._id)}
                                                >
                                                    <img src={starBPng} alt=""></img>
                                                </button>
                                            ) : (
                                                <button
                                                    className="primary-p absolute right-4 top-3 p-1 rounded-xl"
                                                    onClick={() => saveEvent(allEv._id)}
                                                >
                                                    <img src={starPng} alt=""></img>
                                                </button>
                                            )}
                                            <h3 className="text-xl font-semibold w-[225px]">{allEv.nombreEvento}</h3>
                                            <p className="secondary-p event-desc-text mt-3 mb-2">
                                                {`${allEv.provincia} - ${truncarConElipsis(allEv.direccion, 45)}`}
                                            </p>
                                            <label className="text-xl text-[#111827]!">{formatDateB(allEv.fechaInicio)}</label>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Home