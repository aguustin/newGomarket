import { createContext, useEffect, useState } from "react"
import { loginUserRequest } from "../api/userRequests"

const UserContext = createContext()

export const UserContextProvider = ({children}) => {
    const [session, setSession] = useState([])

    useEffect(() => {
        const getSess = () => {
            setSession(localStorage.getItem('session'))
        }
        getSess()
    }, [])

    const loginContext = async (userData) => {
        const res = await loginUserRequest(userData)
        if(res.data === 1 || res.data === 2){
            return res.data
        }else if(res.length > 0){
            await localStorage.setItem('session', res.data)
        }
        setSession(localStorage.getItem('session'))
    }

    return(
        <UserContext.Provider value={{loginContext}}>{children}</UserContext.Provider>
    )
}

export default UserContext