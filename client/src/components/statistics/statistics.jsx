import { useEffect, useState } from "react"
import { useParams } from "react-router"
import { getProdsRequest } from "../../api/eventRequests"

const Statistics = () => {

    const {userId} = useParams()
    const [productions, setProductions] = useState([])

    console.log(userId)
            useEffect(() => {
                const getProds = async () => {
                    try {
                        if (!userId) return; // Wait until session is ready
        
                        const res = await getProdsRequest(userId);
                        setProductions(res.data);
                    } catch (err) {
                        console.error("Failed to fetch productions:", err);
                    }
                };
        
                getProds();
            }, [/*session*/]);
     console.log(productions)

    return (
        <>
        </>
    )
}

export default Statistics