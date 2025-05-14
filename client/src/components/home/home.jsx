import { useContext, useEffect } from "react"
import UserContext from "../../context/userContext"

const Home = () => {
    const {session, events} = useContext(UserContext)

    return(
        <>
            <div>

            </div>
        </>
    )
}

export default Home