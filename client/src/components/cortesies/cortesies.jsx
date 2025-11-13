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
        console.log('cortesieId', cortesieId)
        await sendCortesiesRequest({prodId, cortesieId})
    }

    return(
        <>
            <div className="mb-24">
            <div className="productions overflow-x-scroll w-screen sm:rounded-lg pl-2 pr-2 pb-10 pt-9">
            <div className="text-center pb-10 pt-6"><Link className="bg-orange-500 p-4 rounded-lg cursor-pointer" to={`/new_excel/${prodId}`}>Crear nueva lista de cortesias</Link></div>
                <table className="min-w-[850px]! w-full text-sm text-left rtl:text-right text-[#111827] dark:text-[#111827] rounded-2xl shadow-lg overflow-hidden">
                    <thead className="text-xs uppercase bg-gray-50 bg-orange-500 text-[#111827]">
                        <tr className="bg-gradient-to-r from-orange-500 to-red-500">
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                Evento
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                Fecha
                            </th>
                             <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                Invitaciónes enviadas
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                Nombre de lista
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                            
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
                                <button className="w-[150px] flex items-center justify-center px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-semibold transition-colors mb-2" onClick={(e) => handleSendCortesies(cort._id)}>
                                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22 4H2V20C2 21.1046 2.89543 22 4 22H20C21.1046 22 22 21.1046 22 20V4Z" stroke="green" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M22 4L12 13L2 4" stroke="green" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    <p className="ml-2">Enviar</p>
                                </button>
                               {/* <Link to={`/get_cortesie/${cort._id}`} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Editar</Link><br></br>*/ }
                                <button className="w-[150px] flex items-center justify-center px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-semibold transition-colors" onClick={(e) => deleteExcel(e)}>
                                     <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="red"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                    <p className="ml-2">Eliminar</p>
                                </button>
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