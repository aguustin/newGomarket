import { useContext, useEffect, useState } from "react"
import UserContext from "../../context/userContext"
import { getAllEventsRequest } from "../../api/eventRequests"
import { formatDate, formatDateB, truncarConElipsis } from "../../globalscomp/globalscomp"
import { Link } from "react-router"
import FadeInImage from "../../globalscomp/globalscomp"
import dancerPng from '../../assets/botones/dancer.png'
import theaterPng from '../../assets/botones/theater.png'
import adultsPng from '../../assets/botones/adults.png'
import musicPng from '../../assets/botones/music.png'
import dancePng from '../../assets/botones/dance.png'

const Home = () => {
    const {session, events} = useContext(UserContext)
    const [allEvents, setAllEvents] = useState([])
    const [search, setSearch] = useState('')

    useEffect(() => { 
       const getAllEventsFunc = async () => {
            const getEvents = await getAllEventsRequest()
            setAllEvents(getEvents.data)
        }
        getAllEventsFunc()
    },[])


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
                    <div className="home-events-container flex flex-wrap justify-between">
                        {allEvents.filter((allEv) => {
                            //return search.toLowerCase() === '' ? allEv : allEv.nombreEvento.toLowerCase().includes(search.toLowerCase());
                            const matchesSearch =
                            search.toLowerCase() === '' ||
                            allEv.nombreEvento.toLowerCase().includes(search.toLowerCase());

                            const matchesType = allEv.tipoEvento === 1;

                            return matchesSearch && matchesType;
                        }).map((allEv) =>(
                            <div key={allEv?._id} className="relative w-[300px] mt-8">
                                <Link to={{ pathname: `/buy_tickets/${allEv._id}/${allEv.prodMail}` }}>
                                    <FadeInImage
                                        src={allEv.imgEvento}
                                        alt={allEv.nombreEvento}
                                        className="h-[300px] brightness-70"
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
                    <div className="categories-container relative right-0 w-[300px] mx-6 mt-37">
                        <div className="max-h-[500px] mt-7">
                            <button className="w-full flex items-center text-left mt-5 rounded-4xl" onClick={() => filterEventsByCategories()} value={1} name="categoriaA"><img src={dancerPng} alt=""></img><p className="ml-4">Baile</p></button>
                            <button className="w-full flex items-center text-left mt-5 rounded-4xl" onClick={() => filterEventsByCategories()} value={2} name="musica"><img src={musicPng} alt=""></img><p className="ml-4">Musica</p></button>
                            <button className="w-full flex items-center text-left mt-5 rounded-4xl" onClick={() => filterEventsByCategories()} value={3} name="arte"><img src={theaterPng} alt=""></img><p className="ml-4">Arte</p></button>
                            <button className="w-full flex items-center text-left mt-5 rounded-4xl" onClick={() => filterEventsByCategories()} value={4} name="mayores"><img src={adultsPng} alt=""></img><p className="ml-4">Mayores +18</p></button>
                            <button className="w-full flex items-center text-left mt-5 rounded-4xl" onClick={() => filterEventsByCategories()} value={5} name="menores"><img src={dancePng} alt=""></img><p className="ml-4">Menores -18</p></button>
                        </div>
                    </div>
            </div>
        </>
    )
}

export default Home