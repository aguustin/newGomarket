import { useContext, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { chargeExcelRequest, getCortesieRequest } from "../../api/cortesieRequest"
import UserContext from "../../context/userContext"
import excelEjPng from "../../assets/images/excelEj.png"
import { getOneProdRequest } from "../../api/eventRequests"
import { formatDateB } from "../../globalscomp/globalscomp"

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
        const date = Date.now()
        console.log(date)
        const formData = new FormData()
        formData.append('userId', session?.userFinded?.[0]?._id)
        formData.append('prodId', prodId)
        formData.append('eventName', productions?.[0]?.nombreEvento)
        formData.append('excelName', e.target.elements.excelName.value)
        formData.append('fechaCreacion', date)
        formData.append('excelFile', e.target.elements.excelFile.files[0])
        const res = await chargeExcelRequest(formData)
        if(res.data.success){
            navigate(`/cortesies/${prodId}`)
        }
    }

    return(
        <>
            <div className="new-cortesie flex flex-wrap min-h-[675px] justify-around pt-20 mb-10">
                    <div>
                        <h2 className="text-3xl underline">Pasos para crear tu lista:</h2>
                        <p className="text-lg">1- Crear un archivo excel</p>
                        <p className="text-lg">2- En la columna 'A' ingresar los nombres y en la columna 'B' los emails</p>
                        <p className="text-lg">3- Una vez terminado guardar los cambios hechos en el arhivo excel</p>
                        <p className="text-lg">4- Tocar la opcion 'Subir excel' buscar el archivo y seleccionarlo</p>
                        <p className="text-lg">5- Confirmar la operación</p><br></br>
                        <form className="relative" onSubmit={(e) => handleExcelUpload(e)} encType="multipart/form-data">
                            <h3 className="text-2xl text-violet-600!">Crear lista:</h3>
                            <div>
                                <label className="text-lg">Nombre de tu lista de invitados: </label>
                                <input name="excelName" type="text" required></input>
                            </div>
                            <div>
                                <label className="text-lg">Subir excel: </label>
                                <input type="file" name="excelFile" required></input>
                            </div>
                            <button className="absolute top-30 right-0 bg-violet-900 pt-3 pb-3 pl-8 pr-8 rounded-lg cursor-pointer" type="submit">Confirmar</button>
                        </form>
                    </div>
                <div>
                    <img src={excelEjPng} alt="" loading="lazy"></img>
                </div>
            </div>
        </>
    )
}

export default NewCortesie