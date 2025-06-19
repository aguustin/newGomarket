import { useContext, useEffect, useState } from "react"
import UserContext from "../../context/userContext"
import { getAllEventsRequest } from "../../api/eventRequests"
import eventoJpg from '../../assets/imgpruebaEventos.jpg'
import Footer from "../footer/footer"

const Home = () => {
    const {session, events} = useContext(UserContext)
    const [allEvents, setAllEvents] = useState([])

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

    return(
        <>
            <div className="w-full h-full mt-[90px] p-16 flex">
                <div className="w-[74vw]">
                    <div>
                        <h1>Encuentra tu evento:</h1>
                    </div>
                    <div className="mt-10">
                        <form className="search-form flex" onSubmit={(e) => searchEvent(e)}>
                            <input className="pl-3 w-[800px] rounded-lg" placeholder="Escribe el titulo del evento" name="searchEvent"></input>
                            <button className="ml-6" type="submit">Buscar evento</button>
                        </form>
                    </div>
                    <div className="home-events-container flex flex-wrap justify-between">
                        <div className="relative w-[320px] mt-8">
                            <img className="object-cover h-[500px] rounded-lg brightness-70" src={eventoJpg} alt=""></img>
                            <div className="absolute bottom-0 p-5">
                                <h3 className="text-3xl">Titulo del evento</h3>
                                <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sint labore eos natus voluptatem deserunt...</p>
                                <label className="text-xl">May 25, 2025</label>
                            </div>
                        </div>
                              <div className="relative w-[320px] mt-8">
                            <img className="object-cover h-[500px] rounded-lg brightness-70" src={eventoJpg} alt=""></img>
                            <div className="absolute bottom-0 p-5">
                                <h3 className="text-3xl">Titulo del evento</h3>
                                <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sint labore eos natus voluptatem deserunt...</p>
                                <label className="text-xl">May 25, 2025</label>
                            </div>
                        </div>
                            <div className="relative w-[320px] mt-8">
                            <img className="object-cover h-[500px] rounded-lg brightness-70" src={eventoJpg} alt=""></img>
                            <div className="absolute bottom-0 p-5">
                                <h3 className="text-3xl">Titulo del evento</h3>
                                <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sint labore eos natus voluptatem deserunt...</p>
                                <label className="text-xl">May 25, 2025</label>
                            </div>
                        </div>
                            <div className="relative w-[320px] mt-8">
                            <img className="object-cover h-[500px] rounded-lg brightness-70" src={eventoJpg} alt=""></img>
                            <div className="absolute bottom-0 p-5">
                                <h3 className="text-3xl">Titulo del evento</h3>
                                <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sint labore eos natus voluptatem deserunt...</p>
                                <label className="text-xl">May 25, 2025</label>
                            </div>
                        </div>
                            <div className="relative w-[320px] mt-8">
                            <img className="object-cover h-[500px] rounded-lg brightness-70" src={eventoJpg} alt=""></img>
                            <div className="absolute bottom-0 p-5">
                                <h3 className="text-3xl">Titulo del evento</h3>
                                <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sint labore eos natus voluptatem deserunt...</p>
                                <label className="text-xl">May 25, 2025</label>
                            </div>
                        </div>
                            <div className="relative w-[320px] mt-8">
                            <img className="object-cover h-[500px] rounded-lg brightness-70" src={eventoJpg} alt=""></img>
                            <div className="absolute bottom-0 p-5">
                                <h3 className="text-3xl">Titulo del evento</h3>
                                <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sint labore eos natus voluptatem deserunt...</p>
                                <label className="text-xl">May 25, 2025</label>
                            </div>
                        </div>
                            <div className="relative w-[320px] mt-8">
                            <img className="object-cover h-[500px] rounded-lg brightness-70" src={eventoJpg} alt=""></img>
                            <div className="absolute bottom-0 p-5">
                                <h3 className="text-3xl">Titulo del evento</h3>
                                <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sint labore eos natus voluptatem deserunt...</p>
                                <label className="text-xl">May 25, 2025</label>
                            </div>
                        </div>
                            <div className="relative w-[320px] mt-8">
                            <img className="object-cover h-[500px] rounded-lg brightness-70" src={eventoJpg} alt=""></img>
                            <div className="absolute bottom-0 p-5">
                                <h3 className="text-3xl">Titulo del evento</h3>
                                <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sint labore eos natus voluptatem deserunt...</p>
                                <label className="text-xl">May 25, 2025</label>
                            </div>
                        </div>
                            <div className="relative w-[320px] mt-8">
                            <img className="object-cover h-[500px] rounded-lg brightness-70" src={eventoJpg} alt=""></img>
                            <div className="absolute bottom-0 p-5">
                                <h3 className="text-3xl">Titulo del evento</h3>
                                <p>Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sint labore eos natus voluptatem deserunt...</p>
                                <label className="text-xl">May 25, 2025</label>
                            </div>
                        </div>
                    </div>
                </div>
                    <div className="categories-container w-[370px] mx-6 mt-24">
                        <h2 className="text-3xl">Categorias:</h2>
                        <div className="max-h-[500px] mt-7">
                            <button className="w-full text-left mt-3" onClick={() => filterEventsByCategories()} value={1} name="categoriaA">Baile</button>
                            <button className="w-full text-left mt-3" onClick={() => filterEventsByCategories()} value={1} name="categoriaA">Musica</button>
                            <button className="w-full text-left mt-3" onClick={() => filterEventsByCategories()} value={1} name="categoriaA">Arte</button>
                            <button className="w-full text-left mt-3" onClick={() => filterEventsByCategories()} value={1} name="categoriaA">Mayores +18</button>
                            <button className="w-full text-left mt-3" onClick={() => filterEventsByCategories()} value={1} name="categoriaA">Menores -18</button>
                        </div>
                    </div>
            </div>
        </>
    )
}

export default Home