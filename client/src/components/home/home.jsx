import { useEffect, useState } from "react"
import UserContext from "../../context/userContext"
import { getAllEventsRequest } from "../../api/eventRequests"
import { formatDateB, truncarConElipsis } from "../../globalscomp/globalscomp"
import { Link } from "react-router"
import FadeInImage from "../../globalscomp/globalscomp"
import dancingPng from "../../assets/botones/dancing.png"
import dancerPng from '../../assets/botones/dancer.png'
import theaterPng from '../../assets/botones/theater.png'
import adultsPng from '../../assets/botones/adults.png'
import musicPng from '../../assets/botones/music.png'
import dancePng from '../../assets/botones/dance.png'
import artPng from '../../assets/botones/art.png'
import Skeleton from 'react-loading-skeleton';

const Home = () => {
    const [allEvents, setAllEvents] = useState([])
    const [search, setSearch] = useState('')
    const [width, setWidth] = useState(null)
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
    const [edad, setEdad] = useState(0);  //continuar con esto para filtrar por edad

    useEffect(() => { 
        const getAllEventsFunc = async () => {
            const getEvents = await getAllEventsRequest()
            setAllEvents(getEvents.data)
        }
        getAllEventsFunc()

        const mediaQuery = window.matchMedia("(min-width: 1376px)");
        const handleResize = () => {
           setWidth(mediaQuery.matches ? 1376 : 1375);
        };
       
        handleResize(); // valor inicial
        mediaQuery.addEventListener("change", handleResize);
       
        return () => mediaQuery.removeEventListener("change", handleResize);
    },[])
    
    if (width === null) return null;

    return(
        <>
            <div className="home w-full h-full mt-[70px] p-16 pt-0 flex">
                <div className="w-[70vw] relative">
                    <div>
                        <h1>Encuentra tu evento:</h1> 
                    </div>
                    <div className="mt-10">
                        <form className="search-form flex items-center" >
                            <p className="text-xl" type="submit">Buscar evento:</p>
                            <input className="ml-3 pl-3 w-[70%] h-[50px] rounded-lg" placeholder="Escribe el titulo del evento" name="searchEvent" onChange={(e) => setSearch(e.target.value)}></input>
                        </form>
                    </div>
                    {width < 1376 &&
                        <div className="categories-container relative right-0 w-[300px] mx-6 mt-37">
                            <div className="max-h-[500px] mt-7">
                                <button className="w-full flex items-center text-left mt-5 rounded-4xl" onClick={() => setCategoriaSeleccionada("")}><img src={dancingPng} alt="" loading="lazy"></img><p className="ml-4">Todos</p></button>
                                <button className="w-full flex items-center text-left mt-5 rounded-4xl" onClick={() => setCategoriaSeleccionada("baile")} name="baile"><img src={dancerPng} alt="" loading="lazy"></img><p className="ml-4">Baile</p></button>
                                <button className="w-full flex items-center text-left mt-5 rounded-4xl" onClick={() => setCategoriaSeleccionada("musica")} name="musica"><img src={musicPng} alt="" loading="lazy"></img><p className="ml-4">Musica</p></button>
                                <button className="w-full flex items-center text-left mt-5 rounded-4xl" onClick={() => setCategoriaSeleccionada("arte")} name="arte"><img src={artPng} alt="" loading="lazy"></img><p className="ml-4">Arte</p></button>
                                <button className="w-full flex items-center text-left mt-5 rounded-4xl" onClick={() => setCategoriaSeleccionada("teatro")} name="teatro"><img src={theaterPng} alt="" loading="lazy"></img><p className="ml-4">Teatro</p></button>
                                <button className="w-full flex items-center text-left mt-5 rounded-4xl" onClick={() => setEdad(1)} name="menores"><img src={dancePng} alt="" loading="lazy"></img><p className="ml-4">Menores -18</p></button>
                                <button className="w-full flex items-center text-left mt-5 rounded-4xl" onClick={() => setEdad(2)} name="mayores"><img src={adultsPng} alt="" loading="lazy"></img><p className="ml-4">Mayores +18</p></button>
                            </div>
                        </div>
                    }
                    <div className="home-events-container flex flex-wrap justify-between max-h-[1200px]">
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
                            <div key={allEv?._id} className="event-img-container relative w-[300px] mt-8 mx-3">
                            <Link to={{ pathname: `/buy_tickets/${allEv._id}/${allEv.prodMail}` }}>
                                <FadeInImage
                                src={allEv.imgEvento}
                                alt={allEv.nombreEvento}
                                className="event-img mx-auto brightness-70"
                                />
                            </Link>
                            <div className="event-desc rounded-b-lg bottom-0 p-5">
                                <h3 className="text-2xl">{allEv.nombreEvento}</h3>
                                <p className="event-desc-text">
                                {truncarConElipsis(allEv.descripcionEvento, 80)}
                                </p>
                                <label className="text-lg">{formatDateB(allEv.fechaInicio)}</label>
                            </div>
                            </div>
                        ))}
                    </div>
                </div>
                    {width > 1375 &&
                        <div className="categories-container relative right-0 w-[300px] mx-6 mt-37">
                            <div className="max-h-[500px] mt-7">
                                <button className="w-full flex items-center text-left mt-5 rounded-4xl" onClick={() => setCategoriaSeleccionada("")}><img src={dancingPng} alt="" loading="lazy"></img><p className="ml-4">Todos</p></button>
                                <button className="w-full flex items-center text-left mt-5 rounded-4xl" onClick={() => setCategoriaSeleccionada("baile")} name="baile"><img src={dancerPng} alt="" loading="lazy"></img><p className="ml-4">Baile</p></button>
                                <button className="w-full flex items-center text-left mt-5 rounded-4xl" onClick={() => setCategoriaSeleccionada("musica")} name="musica"><img src={musicPng} alt="" loading="lazy"></img><p className="ml-4">Musica</p></button>
                                <button className="w-full flex items-center text-left mt-5 rounded-4xl" onClick={() => setCategoriaSeleccionada("arte")} name="arte"><img src={artPng} alt="" loading="lazy"></img><p className="ml-4">Arte</p></button>
                                <button className="w-full flex items-center text-left mt-5 rounded-4xl" onClick={() => setCategoriaSeleccionada("teatro")} name="teatro"><img src={theaterPng} alt="" loading="lazy"></img><p className="ml-4">Teatro</p></button>
                                <button className="w-full flex items-center text-left mt-5 rounded-4xl" onClick={() => setEdad(1)} name="menores"><img src={dancePng} alt="" loading="lazy"></img><p className="ml-4">Menores -18</p></button>
                                <button className="w-full flex items-center text-left mt-5 rounded-4xl" onClick={() => setEdad(2)} name="mayores"><img src={adultsPng} alt="" loading="lazy"></img><p className="ml-4">Mayores +18</p></button>
                            </div>
                        </div>
                    }
            </div>
        </>
    )
}

export default Home