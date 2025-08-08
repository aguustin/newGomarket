import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import UserContext from "../../context/userContext";
import { getAllExcelsRequest, sendCortesiesRequest } from "../../api/cortesieRequest";

const Cortesies = () => {
    const {session} = useContext(UserContext)
    const {prodId} = useParams()
    const [cortesies, setCortesies] = useState([])
    useEffect(() => {
        console.log(prodId, ' ', session?.userFinded?.[0]?._id)
        const getProdCortesiesFunc = async () => {
            const res = await getAllExcelsRequest(session?.userFinded?.[0]?._id, prodId)
            setCortesies(res.data)
        }
        getProdCortesiesFunc()
    }, [session])

    const handleSendCortesies = async (cortesieId) => {
            await sendCortesiesRequest({prodId, cortesieId})
    }

    return(
        <>
            <div className="productions-container h-full mb-24">
            <div className='productions relative overflow-x-auto shadow-md sm:rounded-lg'>
                <Link to={`/new_excel/${prodId}`}>Crear nueva lista de cortesias</Link>
                <table className="w-full max-h-[900px] text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-violet-900 dark:text-white">
                        <tr>
                        
                            <th scope="col" className="px-6 py-3">
                                Evento
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Fecha
                            </th>
                             <th scope="col" className="px-6 py-3">
                                Invitaciónes enviadas
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Nombre de lista
                            </th>
                            <th scope="col" className="px-6 py-3">
                            
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                       {cortesies.map((cort) => 
                       <>
                         <tr key={cort._id} className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700 border-gray-200">
                            <td className="px-6 py-4">
                                {cort.eventName}
                            </td>
                            <td className="px-6 py-4">
                                {cort.lugarEvento}
                            </td>
                            <td className="px-6 py-4">
                                {cort.courtesy}
                            </td>
                            <td className="px-6 py-4">
                                {cort.excelName}
                            </td>
                            <td className="px-6 py-4">
                                <button onClick={(e) => handleSendCortesies(cort._id)}>Enviar</button>
                                <Link to={`/get_cortesie/${cort._id}`} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Editar</Link><br></br>
                                <button onClick={(e) => deleteExcel(e)}>Eliminar</button>
                            </td>
                         </tr>
                        </> 
                    )}
                    </tbody>
                </table>
            </div>
        </div>
        </>
    )
}

export default Cortesies;