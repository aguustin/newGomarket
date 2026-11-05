import { createContext, useEffect, useState } from "react"
import { loginUserRequest } from "../api/userRequests"
import { leerSesion } from "../api/http"

const UserContext = createContext()

export const UserContextProvider = ({children}) => {
    const [session, setSession] = useState([])
    const [events, setEvents] = useState([])
    const [productions, setProductions] = useState([])
    const [message, setMessage] = useState()

    useEffect(() => {
        const getSess = () => {
            const guardada = leerSesion()
            //Sesiones de antes del login con token: no sirven para el backend, hay que volver a ingresar
            if (guardada && !guardada.token) {
                localStorage.removeItem('session')
                setSession(null)
                return
            }
            setSession(guardada)
        }
        getSess()
    }, [])

    const loginContext = async (userData) => {
        const res = await loginUserRequest(userData)
        if(res.data.estado === 2 || res.data.estado === 3 || res.data.estado === 4){  //4 = captcha rechazado
            return res.data
        }else if(res.data.estado === 1){
            await localStorage.setItem('session', JSON.stringify(res.data))
        }
        const sess = JSON.parse(localStorage.getItem('session'))
        setSession(sess)
        return res
    }

    return(
        <UserContext.Provider value={{events, setEvents, session, setSession, productions, setProductions, message, setMessage, loginContext}}>{children}</UserContext.Provider>
    )
}

export default UserContext