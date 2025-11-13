import { useContext, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { chargeExcelRequest, getCortesieRequest } from "../../api/cortesieRequest"
import UserContext from "../../context/userContext"
import excelEjPng from "../../assets/images/excelEj.png"
import { getOneProdRequest } from "../../api/eventRequests"
import { formatDateB } from "../../globalscomp/globalscomp"
import uploadPng from "../../assets/images/upload.png"

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
        <div className="new-cortesie-container relative mx-12 mt-[30px] bg-white border-[1px] border-gray-200 rounded-2xl p-5 mb-8">
            <h2 className="text-3xl">Crear Lista</h2>
            <div className="new-cortesie flex flex-wrap items-center justify-between mt-5 mb-10 bg-[#f0efef] rounded-2xl p-9">
                <div>
                    <h2 className="text-2xl underline mb-3">Pasos para crear tu lista:</h2>
                    <p className="text-lg flex items-center"><p className="flex items-center justify-center bg-white border-[1px] border-gray-300 rounded-[200px] w-[40px] h-[40px] mr-3 mt-1 secondary-p">1</p> Crear un archivo excel</p>
                    <p className="text-lg flex items-center"><p className="flex items-center justify-center bg-white border-[1px] border-gray-300 rounded-[200px] w-[40px] h-[40px] mr-3 mt-1 secondary-p">2</p> En la columna 'A' ingresar los nombres y en la columna 'B' los emails</p>
                    <p className="text-lg flex items-center"><p className="flex items-center justify-center bg-white border-[1px] border-gray-300 rounded-[200px] w-[40px] h-[40px] mr-3 mt-1 secondary-p">3</p> Una vez terminado guardar los cambios hechos en el arhivo excel</p>
                    <p className="text-lg flex items-center"><p className="flex items-center justify-center bg-white border-[1px] border-gray-300 rounded-[200px] w-[40px] h-[40px] mr-3 mt-1 secondary-p">4</p> Tocar la opcion 'Subir excel' buscar el archivo y seleccionarlo</p>
                    <p className="text-lg flex items-center"><p className="flex items-center justify-center bg-white border-[1px] border-gray-300 rounded-[200px] w-[40px] h-[40px] mr-3 mt-1 secondary-p">5</p> Confirmar la operación</p><br></br>
                </div>
                <div>
                    <img className="rounded-xl" src={excelEjPng} alt="" loading="lazy"></img>
                </div>
            </div>
                        <form className="upload-excel-form relative flex items-center" onSubmit={(e) => handleExcelUpload(e)} encType="multipart/form-data">
                            <div className="w-[50%] mx-2">
                                <label className="text-lg">Nombre de tu lista: </label><br></br>
                                <input className="h-[40px] w-full" name="excelName" type="text" required></input>
                            </div>
                            <div className="w-[50%] mx-2">
                                <label className="text-lg">Cargar lista: </label><br></br>
                                <label htmlFor="excelFileHtml" className="w-full flex items-center border-[1px] border-gray-300 p-2 primary-p rounded-2xl"><img className="mr-2" src={uploadPng} alt=""></img>Subir excel</label>
                                <input id="excelFileHtml" className="hidden" type="file" name="excelFile" required></input>
                            </div>
                            <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl mt-5 pt-3 pb-3 pl-8 pr-8 cursor-pointer" type="submit">Confirmar</button>
                        </form>
        </div>
        </>
    )
}

export default NewCortesie