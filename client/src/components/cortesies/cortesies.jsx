import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import UserContext from "../../context/userContext";
import { getAllExcelsRequest, sendCortesiesRequest } from "../../api/cortesieRequest";
import { formatDateB } from "../../globalscomp/globalscomp";

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
            <div className="mb-24">
            <div className="productions overflow-x-scroll w-screen sm:rounded-lg pl-2 pr-2 pb-10 pt-9">
            <div className="text-center pb-10 pt-6"><Link className="bg-orange-500 p-4 rounded-lg cursor-pointer" to={`/new_excel/${prodId}`}>Crear nueva lista de cortesias</Link></div>
                <table className="min-w-[790px] w-full text-sm text-left rtl:text-right text-[#111827] dark:text-[#111827]">
                    <thead className="text-xs uppercase bg-gray-50 bg-orange-500 text-[#111827]">
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
                         <tr key={cort._id} className="odd:bg-white even:bg-gray-200 border-b dark:border-gray-300 border-gray-300">
                            <td className="px-6 py-4">
                                {cort.eventName}
                            </td>
                            <td className="px-6 py-4">
                                {cort.fechaCreacion}
                            </td>
                            <td className="px-6 py-4">
                                {cort.courtesy}
                            </td>
                            <td className="px-6 py-4">
                                {cort.excelName}
                            </td>
                            <td className="px-6 py-4">
                                <button onClick={(e) => handleSendCortesies(cort._id)}>Enviar</button><br></br>
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