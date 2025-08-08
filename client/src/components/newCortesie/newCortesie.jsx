import { useContext, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { chargeExcelRequest, getCortesieRequest } from "../../api/cortesieRequest"
import UserContext from "../../context/userContext"
import excelEjPng from "../../assets/images/excelEj.png"
import { getOneProdRequest } from "../../api/eventRequests"

const NewCortesie = () => {
    const {prodId} = useParams()
    const {session} = useContext(UserContext)
    const [productions, setProductions] = useState([])
    console.log(prodId)
    const navigate = useNavigate()
    useEffect(() => {
        if(prodId.length > 0){
            const getProdFunc = async () => {
                const res = await getOneProdRequest(prodId, session?.userFinded?.[0]?._id)
                setProductions(res.data)
            }
            getProdFunc()
        }
    }, [])
   
    const handleExcelUpload = async (e) => {
        e.preventDefault()
        console.log(e.target.elements.excelFile.files[0])
        const formData = new FormData()
        formData.append('userId', session?.userFinded?.[0]?._id)
        formData.append('prodId', prodId)
        formData.append('eventName', productions?.[0]?.nombreEvento)
        formData.append('excelName', e.target.elements.excelName.value)
        formData.append('fechaCreacion', Date.now())
        formData.append('excelFile', e.target.elements.excelFile.files[0])
        const res = await chargeExcelRequest(formData)
        if(res.data.success){
            navigate(`/cortesies/${session?.userFinded?.[0]?._id}/${prodId}`)
        }
    }

    return(
        <>
            <div className="flex justify-around">
                <form onSubmit={(e) => handleExcelUpload(e)} encType="multipart/form-data">
                    <div>
                        <label>Nombre de tu lista de invitados:</label>
                        <input name="excelName" type="text"></input>
                    </div>
                    <div>
                        <label>Subir excel</label>
                        <input type="file" name="excelFile"></input>
                    </div>
                    <button type="submit">Confirmar</button>
                </form>
                <div>
                    <img src={excelEjPng} alt=""></img>
                </div>
            </div>
        </>
    )
}

export default NewCortesie