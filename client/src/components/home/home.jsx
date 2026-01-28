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
import starBipng from '../../assets/botones/starBi.png'
import starPng from '../../assets/botones/star.png'
import starBPng from '../../assets/botones/starB.png'
import Skeleton from 'react-loading-skeleton';
import { getFavoritesEventsRequest, saveEventRequest } from "../../api/userRequests"
import { useContext } from "react"
import { Country, State, City } from "country-state-city"
import ipassReducidoSvg from '../../assets/goticketImgs/IPS_REDUCIDO.svg'
import ipassBanckground from '../../assets/images/fondo.jpeg'

const Home = () => {
    const { session } = useContext(UserContext)
    const [allEvents, setAllEvents] = useState([])
    const [search, setSearch] = useState('')
    const [width, setWidth] = useState(null)
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
    const [edad, setEdad] = useState(0);
    const [favoriteEventIds, setFavoriteEventIds] = useState(() => {
        const session = JSON.parse(localStorage.getItem("session"));
        const userFavorites = session?.userFinded?.[0]?.favorites || [];
        return userFavorites.map(fav => fav?.eventId);
    });
    const [favoritesFilter, setFavoritesFilter] = useState(null)
    const [provincias, setProvincias] = useState([]);
    const [localidades, setLocalidades] = useState([]);
    const [provinciaSeleccionada, setProvinciaSeleccionada] = useState("");
    const [localidadSeleccionada, setLocalidadSeleccionada] = useState("");
    const [fechaInicioFiltro, setFechaInicioFiltro] = useState("");
    const [fechaFinFiltro, setFechaFinFiltro] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const provinciasArg = State.getStatesOfCountry("AR");
        setProvincias(provinciasArg);

        const getAllEventsFunc = async () => {
            setIsLoading(true);
            const getEvents = await getAllEventsRequest()
            setAllEvents(getEvents.data)
            setIsLoading(false);
        }
        getAllEventsFunc()

        const favs = session?.userFinded?.[0]?.favorites || [];
        setFavoriteEventIds(favs.map(f => f.eventId));

        const mediaQuery = window.matchMedia("(min-width: 1376px)");

        const handleResize = () => {
            setWidth(mediaQuery.matches ? 1376 : 1375);
        };

        handleResize();
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
            return;
        }

        let updatedFavorites;

        if (favoriteEventIds.includes(eventId)) {
            updatedFavorites = user.favorites.filter(f => f?.eventId !== eventId);
        } else {
            const newFavorite = {
                eventId: eventId,
                _id: Math.random().toString(36).substring(2, 15),
            };
            updatedFavorites = [...user.favorites, newFavorite];
        }

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

        setFavoriteEventIds(updatedFavorites.map(f => f?.eventId));

        const data = {
            userId: session?.userFinded?.[0]?._id,
            eventId: eventId
        }
        const res = await saveEventRequest(data)

        if (res.data.empty) {
            console.log("debes iniciar sesion")
        } else {
            console.log("Guardado con exito")
        }
    }

    const getFavoritesEventsFunc = async () => {
        if(favoritesFilter?.length > 0){
           return setFavoritesFilter(null)
        }
        const res = await getFavoritesEventsRequest(session?.userFinded?.[0]?._id)
        setFavoritesFilter(res.data.favorites)
    }

    const clearFilters = () => {
        setSearch('');
        setCategoriaSeleccionada('');
        setEdad(0);
        setProvinciaSeleccionada('');
        setLocalidadSeleccionada('');
        setFechaInicioFiltro('');
        setFechaFinFiltro('');
        setFavoritesFilter(null);
    };

    const eventsToRender = favoritesFilter || allEvents;

    const filteredEvents = eventsToRender.filter((allEv) => {
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

        const fechaEvento = allEv.fechaInicio?.slice(0, 10);
        
        const matchesFechaRango =
            (!fechaInicioFiltro || !fechaFinFiltro) ||
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
    });

    return (
        <>
            <div className="home mb-16">
                {/* HERO SECTION WITH ENHANCED GRADIENT OVERLAY */}
                <div className="relative w-full h-[500px] max-[440px]:h-[580px] overflow-hidden">
                    <img
                        className="absolute top-0 left-0 w-full h-full object-cover"
                        src={ipassBanckground}
                        alt="Imagen fondo"
                    />
                    {/* Enhanced gradient overlay */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>
                    
                    <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-4">
                        <div className="filtrar-eventos w-full max-w-4xl">
                            <img 
                                className="w-[100px] h-[150px] mx-auto mt-[-40px] max-[620px]:h-auto max-[575px]:mt-[0px] drop-shadow-2xl" 
                                src={ipassReducidoSvg} 
                                alt="Logo"
                            />
                            
                            {/* SEARCH BAR WITH ENHANCED STYLING */}
                            <form className="search-form justify-center flex items-center w-full mb-6">
                                <p className="text-lg w-[170px] text-white font-semibold">Buscar evento:</p>
                                <div className="relative flex-1 max-w-2xl ml-3">
                                    <input
                                        className="w-full bg-gradient-to-r from-gray-800/90 to-gray-900/90 backdrop-blur-sm text-white pl-4 pr-10 py-3 border-2 border-amber-500/50 rounded-full focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all duration-300 placeholder-gray-400"
                                        placeholder="Nombre del evento..."
                                        name="searchEvent"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => setSearch('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </form>
                            
                            {/* FILTERS SECTION WITH BETTER LAYOUT */}
                            <div className="max-[575px]:w-[96%] mt-6 flex flex-wrap gap-3 justify-center items-center">
                                <div className="px-6 py-2 rounded-full bg-gradient-to-r from-amber-600 to-yellow-500 text-[#111827] font-bold text-sm shadow-lg">
                                    FILTROS
                                </div>
                                
                                <select
                                    className="px-4 py-2.5 rounded-full border-2 bg-gray-800/90 backdrop-blur-sm border-amber-500/50 text-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                                    value={provinciaSeleccionada}
                                    onChange={(e) => setProvinciaSeleccionada(e.target.value)}
                                >
                                    <option value="">📍 Provincia</option>
                                    {provincias.map((prov) => (
                                        <option className="text-white bg-gray-800" key={prov.isoCode} value={prov.isoCode}>
                                            {prov.name}
                                        </option>
                                    ))}
                                </select>
                                
                                <select
                                    className="max-[575px]:w-[70%] px-4 py-2.5 rounded-full border-2 bg-gray-800/90 backdrop-blur-sm border-amber-500/50 text-white focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    value={localidadSeleccionada}
                                    onChange={(e) => setLocalidadSeleccionada(e.target.value)}
                                    disabled={!provinciaSeleccionada}
                                >
                                    <option value="">🏙️ Localidad</option>
                                    {localidades.map((loc) => (
                                        <option className="text-white bg-gray-800" key={loc.name} value={loc.name}>
                                            {loc.name}
                                        </option>
                                    ))}
                                </select>
                                
                                <div className="flex flex-wrap gap-3 justify-center items-center">
                                    <label className="text-white font-semibold text-sm max-[575px]:w-full text-center">
                                        📅 Fecha Inicio - Fin
                                    </label>
                                    <input
                                        type="date"
                                        className="max-[440px]:w-[48%] px-4 py-2.5 rounded-full border-2 border-amber-500/50 bg-gradient-to-r from-amber-600 to-yellow-500 text-[#111827] font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/20 transition-all"
                                        value={fechaInicioFiltro}
                                        onChange={(e) => setFechaInicioFiltro(e.target.value)}
                                    />
                                    <input
                                        type="date"
                                        className="max-[440px]:w-[48%] px-4 py-2.5 rounded-full border-2 border-amber-500/50 bg-gradient-to-r from-amber-600 to-yellow-500 text-[#111827] font-semibold focus:outline-none focus:ring-4 focus:ring-amber-500/20 transition-all"
                                        value={fechaFinFiltro}
                                        onChange={(e) => setFechaFinFiltro(e.target.value)}
                                    />
                                </div>
                                
                                {/* CLEAR FILTERS BUTTON */}
                                {(search || categoriaSeleccionada || edad || provinciaSeleccionada || localidadSeleccionada || fechaInicioFiltro || fechaFinFiltro || favoritesFilter) && (
                                    <button
                                        onClick={clearFilters}
                                        className="px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
                                    >
                                        🗑️ Limpiar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="events w-[100%] pr-10 pl-10 relative max-[750px]:px-4">
                    {/* MOBILE CATEGORIES */}
                    {width < 1376 && (
                        <div className="categories relative w-screen max-w-full overflow-hidden -mx-10 max-[750px]:mx-[-1rem]">
                            <div className="flex gap-4 overflow-x-auto flex-nowrap py-6 px-6 scrollbar-thin scrollbar-thumb-amber-500 scrollbar-track-gray-800">
                                <CategoryButton 
                                    icon={eventsPng} 
                                    label="Todos" 
                                    isActive={categoriaSeleccionada === ''} 
                                    onClick={() => { setCategoriaSeleccionada(''); setFavoritesFilter(null) }} 
                                />
                                <CategoryButton 
                                    icon={discoPng} 
                                    label="Baile" 
                                    isActive={categoriaSeleccionada === 'baile'} 
                                    onClick={() => { setCategoriaSeleccionada('baile'); setFavoritesFilter(null) }} 
                                />
                                <CategoryButton 
                                    icon={musicPng} 
                                    label="Música" 
                                    isActive={categoriaSeleccionada === 'musica'} 
                                    onClick={() => { setCategoriaSeleccionada('musica'); setFavoritesFilter(null) }} 
                                />
                                <CategoryButton 
                                    icon={artPng} 
                                    label="Arte" 
                                    isActive={categoriaSeleccionada === 'arte'} 
                                    onClick={() => { setCategoriaSeleccionada('arte'); setFavoritesFilter(null) }} 
                                />
                                <CategoryButton 
                                    icon={theatrePng} 
                                    label="Teatro" 
                                    isActive={categoriaSeleccionada === 'teatro'} 
                                    onClick={() => { setCategoriaSeleccionada('teatro'); setFavoritesFilter(null) }} 
                                />
                                <CategoryButton 
                                    icon={footballPng} 
                                    label="Deporte" 
                                    isActive={categoriaSeleccionada === 'deporte'} 
                                    onClick={() => { setCategoriaSeleccionada('deporte'); setFavoritesFilter(null) }} 
                                />
                                <CategoryButton 
                                    icon={starBipng} 
                                    label="Favoritos" 
                                    isActive={favoritesFilter?.length > 0} 
                                    onClick={() => { setCategoriaSeleccionada(''); getFavoritesEventsFunc() }} 
                                />
                                <CategoryButton 
                                    icon={footprintsPng} 
                                    label="Eventos -18" 
                                    isActive={edad === 1} 
                                    onClick={() => { setEdad(edad === 1 ? 0 : 1); setFavoritesFilter(null) }} 
                                />
                                <CategoryButton 
                                    icon={plusPng} 
                                    label="Eventos +18" 
                                    isActive={edad === 2} 
                                    onClick={() => { setEdad(edad === 2 ? 0 : 2); setFavoritesFilter(null) }} 
                                />
                            </div>
                        </div>
                    )}
                    
                    {/* DESKTOP CATEGORIES */}
                    {width > 1375 && (
                        <div className="categories w-full mt-6">
                            <div className="w-full flex bg-gradient-to-br from-amber-500 to-yellow-500 transition-all rounded-2xl shadow-2xl overflow-hidden">
                                <DesktopCategoryButton 
                                    icon={eventsPng} 
                                    label="Todos" 
                                    isActive={categoriaSeleccionada === ''} 
                                    onClick={() => { setCategoriaSeleccionada(''); setFavoritesFilter(null) }} 
                                />
                                <DesktopCategoryButton 
                                    icon={discoPng} 
                                    label="Baile" 
                                    isActive={categoriaSeleccionada === 'baile'} 
                                    onClick={() => { setCategoriaSeleccionada('baile'); setFavoritesFilter(null) }} 
                                />
                                <DesktopCategoryButton 
                                    icon={musicPng} 
                                    label="Música" 
                                    isActive={categoriaSeleccionada === 'musica'} 
                                    onClick={() => { setCategoriaSeleccionada('musica'); setFavoritesFilter(null) }} 
                                />
                                <DesktopCategoryButton 
                                    icon={artPng} 
                                    label="Arte" 
                                    isActive={categoriaSeleccionada === 'arte'} 
                                    onClick={() => { setCategoriaSeleccionada('arte'); setFavoritesFilter(null) }} 
                                />
                                <DesktopCategoryButton 
                                    icon={theatrePng} 
                                    label="Teatro" 
                                    isActive={categoriaSeleccionada === 'teatro'} 
                                    onClick={() => { setCategoriaSeleccionada('teatro'); setFavoritesFilter(null) }} 
                                />
                                <DesktopCategoryButton 
                                    icon={footballPng} 
                                    label="Deporte" 
                                    isActive={categoriaSeleccionada === 'deporte'} 
                                    onClick={() => { setCategoriaSeleccionada('deporte'); setFavoritesFilter(null) }} 
                                />
                                <DesktopCategoryButton 
                                    icon={starBipng} 
                                    label="Favoritos" 
                                    isActive={favoritesFilter?.length > 0} 
                                    onClick={() => { setCategoriaSeleccionada(''); getFavoritesEventsFunc() }} 
                                />
                                <DesktopCategoryButton 
                                    icon={footprintsPng} 
                                    label="Eventos -18" 
                                    isActive={edad === 1} 
                                    onClick={() => { setEdad(edad === 1 ? 0 : 1); setFavoritesFilter(null) }} 
                                />
                                <DesktopCategoryButton 
                                    icon={plusPng} 
                                    label="Eventos +18" 
                                    isActive={edad === 2} 
                                    onClick={() => { setEdad(edad === 2 ? 0 : 2); setFavoritesFilter(null) }} 
                                    isLast={true}
                                />
                            </div>
                        </div>
                    )}

                    {/* EVENTS GRID */}
                    <div className="events-and-categories flex items-start mt-8">
                        <div className="events-container flex flex-wrap justify-center gap-6 w-full">
                            {isLoading ? (
                                // Loading skeletons
                                [...Array(6)].map((_, i) => (
                                    <div key={i} className="w-[300px] max-[655px]:w-full">
                                        <Skeleton height={200} className="rounded-t-xl" />
                                        <Skeleton count={3} className="mt-2" />
                                    </div>
                                ))
                            ) : filteredEvents.length === 0 ? (
                                // Empty state
                                <div className="no-events-message w-full py-20">
                                    <div className="text-6xl mb-4">🎭</div>
                                    <h3 className="text-2xl font-bold mb-2">No se encontraron eventos</h3>
                                    <p className="text-gray-400 mb-6">Intenta ajustar tus filtros de búsqueda</p>
                                    {(search || categoriaSeleccionada || edad || provinciaSeleccionada || localidadSeleccionada || fechaInicioFiltro || fechaFinFiltro) && (
                                        <button
                                            onClick={clearFilters}
                                            className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-600 to-yellow-500 text-[#111827] font-semibold hover:shadow-xl transition-all"
                                        >
                                            Limpiar filtros
                                        </button>
                                    )}
                                </div>
                            ) : (
                                filteredEvents.map((allEv) => (
                                    <div key={allEv?._id} className="primary-div bg-gradient-to-br from-gray-800 to-gray-900 w-[300px] max-[655px]:w-full relative rounded-2xl border-2 border-gray-700 hover:border-amber-500 transition-all duration-300 shadow-xl">
                                        <Link to={{ pathname: `/buy_tickets/${allEv._id}/${allEv.prodMail}` }}>
                                            <div className="overflow-hidden rounded-t-2xl relative">
                                                <FadeInImage
                                                    src={allEv.imgEvento}
                                                    alt={allEv.nombreEvento}
                                                    className="relative mx-auto w-full h-[200px] object-cover brightness-90 hover:brightness-100 transition-all duration-300"
                                                />
                                                {/* Category badge */}
                                                {allEv.categoriasEventos?.[0] && (
                                                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-gradient-to-r from-amber-600/90 to-yellow-500/90 backdrop-blur-sm text-xs font-bold text-[#111827] shadow-lg">
                                                        {allEv.categoriasEventos[0].toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                        <div className="event-desc relative rounded-b-2xl bottom-0 p-5 h-[160px]">
                                            {favoriteEventIds.includes(allEv._id) ? (
                                                <button
                                                    className="absolute right-4 top-4 p-2 rounded-full bg-amber-500/20 hover:bg-amber-500/40 transition-all"
                                                    onClick={() => saveEvent(allEv._id)}
                                                    aria-label="Quitar de favoritos"
                                                >
                                                    <img src={starBPng} alt="Favorito" className="w-6 h-6" />
                                                </button>
                                            ) : (
                                                <button
                                                    className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-700/50 transition-all"
                                                    onClick={() => saveEvent(allEv._id)}
                                                    aria-label="Agregar a favoritos"
                                                >
                                                    <img src={starPng} alt="No favorito" className="w-6 h-6" />
                                                </button>
                                            )}
                                            <Link to={{ pathname: `/buy_tickets/${allEv._id}/${allEv.prodMail}` }}>
                                                <h3 className="text-xl font-bold w-[240px] text-white hover:text-amber-400 transition-colors line-clamp-2">
                                                    {allEv.nombreEvento}
                                                </h3>
                                            </Link>
                                            <p className="text-amber-500 font-medium text-sm mt-3 mb-2 flex items-center gap-2">
                                                <span>📍</span>
                                                {`${allEv.provincia} - ${truncarConElipsis(allEv.direccion, 35)}`}
                                            </p>
                                            <label className="text-lg text-gray-300 font-semibold flex items-center gap-2">
                                                <span>🗓️</span>
                                                {formatDateB(allEv.fechaInicio)}
                                            </label>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

// Category button component for mobile
const CategoryButton = ({ icon, label, isActive, onClick }) => (
    <button
        className={`flex items-center min-w-[160px] border-2 rounded-full px-4 py-3 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl whitespace-nowrap
            ${isActive 
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white border-red-500 scale-105' 
                : 'bg-gradient-to-br from-amber-500 to-yellow-500 text-[#111827] border-amber-600 hover:scale-105'
            }`}
        onClick={onClick}
    >
        <img src={icon} alt="" loading="lazy" className="w-6 h-6" />
        <p className="ml-3">{label}</p>
    </button>
);

// Category button component for desktop
const DesktopCategoryButton = ({ icon, label, isActive, onClick, isLast }) => (
    <button
        className={`flex justify-center items-center font-semibold text-center p-4 w-full transition-all duration-300 
            ${!isLast ? 'border-r-2 border-yellow-600/30' : ''} 
            ${isActive ? 'bg-gradient-to-br from-red-600 to-red-500 text-white' : 'text-[#111827] hover:bg-gradient-to-br hover:from-amber-400 hover:to-yellow-400'}
        `}
        onClick={onClick}
    >
        <img src={icon} alt="" loading="lazy" className="w-7 h-7" />
        <p className="ml-3 text-sm font-bold">{label}</p>
    </button>
);

export default Home