import { createContext, useEffect, useState } from "react"
import { loginUserRequest } from "../api/userRequests"

const UserContext = createContext()

export const UserContextProvider = ({children}) => {
    const [session, setSession] = useState([])
    const [events, setEvents] = useState([])
    const [productions, setProductions] = useState([])
    const [message, setMessage] = useState()

    useEffect(() => {
        const getSess = () => {
            setSession(JSON.parse(localStorage.getItem('session')))
        }
        getSess()
    }, [])

    const loginContext = async (userData) => {
        const res = await loginUserRequest(userData)
        console.log(res.data.estado)
        if(res.data.estado === 2 || res.data.estado === 3){
            return res.data
        }else if(res.data.estado === 1){
            console.log('entro aca')
            await localStorage.setItem('session', JSON.stringify(res.data))
        }
        const sess = JSON.parse(localStorage.getItem('session'))
        setSession(sess)
        return res
    }

    return(
        <UserContext.Provider value={{events, setEvents, session, productions, setProductions, message, setMessage, loginContext}}>{children}</UserContext.Provider>
    )
}

export default UserContext