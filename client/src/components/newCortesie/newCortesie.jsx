import { useEffect, useState } from "react"
import { useParams } from "react-router"
import { getCortesieRequest } from "../../api/cortesieRequest"

const NewCortesie = () => {
    const {cortesieId} = useParams()
    const [cortesie, setCortesie] = useState([])

    useEffect(() => {
        const getCortesieFunc = async () => {
            const res = await getCortesieRequest()
            setCortesie(res.data)
        }

        getCortesieFunc()
    }, [])

    return(
        <>
        
        </>
    )
}

export default NewCortesie