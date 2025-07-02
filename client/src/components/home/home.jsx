import { useContext, useEffect, useState } from "react"
import UserContext from "../../context/userContext"
import { getAllEventsRequest } from "../../api/eventRequests"
import eventoJpg from '../../assets/imgpruebaEventos.jpg'
import Footer from "../footer/footer"
import { formatDate, truncarConElipsis } from "../../globalscomp/globalscomp"

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

    const searchEvent = (e) => {
        e.preventDefault()
        const eventToSearch =  e.target.elements.searchEvent.value
    }
    console.log(search)
    return(
        <>
            <div className="w-full h-full mt-[90px] p-16 flex">
                <div className="w-[74vw]">
                    <div>
                        <h1>Encuentra tu evento:</h1>
                    </div>
                    <div className="mt-10">
                        <form className="search-form flex items-center" >
                            <input className="pl-3 w-[800px] h-[50px] rounded-lg" placeholder="Escribe el titulo del evento" name="searchEvent" onChange={(e) => setSearch(e.target.value)}></input>
                            <p className="ml-6 text-xl" type="submit">Buscar evento</p>
                        </form>
                    </div>
                    <div className="home-events-container flex flex-wrap justify-between">
                        {allEvents.filter((allEv) => {
                            return search.toLowerCase() === '' ? allEv : allEv.nombreEvento.toLowerCase().includes(search)
                        }).map((allEv) => 
                        <div key={allEv?._id} className="relative w-[320px] mt-8">
                            <img className="object-cover h-[500px] rounded-lg brightness-70" src={allEv.imgEvento} alt=""></img>
                            <div className="absolute bottom-0 p-5">
                                <h3 className="text-3xl">{allEv.nombreEvento}</h3>
                                <p className="event-desc">{truncarConElipsis(allEv.descripcionEvento, 80)}</p>
                                <label className="text-xl">{formatDate(allEv.fechaInicio)}</label>
                            </div>
                        </div>)}
                    </div>
                </div>
                    <div className="categories-container w-[370px] mx-6 mt-24">
                        <h2 className="text-3xl">Categorias:</h2>
                        <div className="max-h-[500px] mt-7">
                            <button className="w-full text-left mt-3" onClick={() => filterEventsByCategories()} value={1} name="categoriaA">Baile</button>
                            <button className="w-full text-left mt-3" onClick={() => filterEventsByCategories()} value={2} name="musica">Musica</button>
                            <button className="w-full text-left mt-3" onClick={() => filterEventsByCategories()} value={3} name="arte">Arte</button>
                            <button className="w-full text-left mt-3" onClick={() => filterEventsByCategories()} value={4} name="mayores">Mayores +18</button>
                            <button className="w-full text-left mt-3" onClick={() => filterEventsByCategories()} value={5} name="menores">Menores -18</button>
                        </div>
                    </div>
            </div>
        </>
    )
}

export default Home