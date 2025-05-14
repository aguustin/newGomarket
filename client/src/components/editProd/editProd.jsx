import { useEffect, useState } from "react"
import { useParams } from "react-router"
import { getOneProdRequest } from "../../api/eventRequests"

const EditProd = () => {
    const prodId = useParams()
    const [prod, setProd] = useState([])

    console.log(prodId.prodId)

    useEffect(() => {
        const getOneProd = async () => {
            const res = await getOneProdRequest(prodId.prodId)
            setProd(res.data)
        }
        getOneProd()
    }, [])
    console.log(prod)
    return(
        <>
        </>
    )
}

export default EditProd