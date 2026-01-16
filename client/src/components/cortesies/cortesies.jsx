import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import UserContext from "../../context/userContext";
import { getAllExcelsRequest, getAllRRPPExcelsRequest, sendCortesiesRequest, sendRRPPLinksRequest } from "../../api/cortesieRequest";

const Cortesies = () => {
    const {session} = useContext(UserContext)
    const {prodId} = useParams()
    const [cortesies, setCortesies] = useState([])
    const [rrppExcels, setRrppExcels] = useState([])
    const [showColabs, setShowColabs] = useState(false)

    useEffect(() => {
        const getProdCortesiesFunc = async () => {
            const res = await getAllExcelsRequest(session?.userFinded?.[0]?._id, prodId)
            setCortesies(res.data)
        }
        getProdCortesiesFunc()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session])

    const getRRPPExcelFunc = async () => {
        const res = await getAllRRPPExcelsRequest(session?.userFinded?.[0]?._id, prodId)
        console.log(res.data)
        setRrppExcels(res.data)
        setShowColabs(true)
    }

    const handleSendCortesies = async (cortesieId) => {
        await sendCortesiesRequest({prodId, cortesieId})
    }

    const handleSendRRPPLinks = async (rrppListId) => {
        await sendRRPPLinksRequest({prodId, rrppListId})
    }

    return(
        <>
            <div className="mb-24">
            <div className="productions overflow-x-scroll w-screen sm:rounded-lg pl-2 pr-2 pb-10 pt-9">
            <div className="text-center pb-10 pt-6"><Link className="bg-gradient-to-r from-amber-600 to-yellow-500 p-4 rounded-lg cursor-pointer" to={`/new_excel/${prodId}`}>Crear nueva lista de cortesias</Link></div>
            <div className="flex items-center w-[400px] mb-3">
                <button className="bg-gradient-to-r from-amber-600 to-yellow-500 text-[#111827] py-2 px-3 rounded-lg " onClick={() => getRRPPExcelFunc()}>Lista RRPP</button>
                <button className="bg-gradient-to-r from-amber-600 to-yellow-500 text-[#111827] py-2 px-3 rounded-lg ml-3" onClick={() => setShowColabs(false)}>Lista invitaciones</button>
            </div>
                <table className="min-w-[850px]! w-full text-sm text-left rtl:text-right text-[#111827] dark:text-[#111827] rounded-2xl shadow-lg overflow-hidden">
                    <thead className="text-xs uppercase bg-gray-50 bg-orange-500 text-[#111827]">
                        <tr className="bg-gray-600">
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                Evento
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                Fecha
                            </th>
                             <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                {showColabs ? 'Cantidad de RRPP' : 'Invitaciónes enviadas' }
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                Nombre de lista
                            </th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                            
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {showColabs 
                        ? 
                        rrppExcels.map((rrpp) => 
                            <>
                         <tr key={rrpp._id} className="odd:bg-gray-700 even:bg-gray-800 border-b dark:border-gray-800 border-gray-600">
                            <td className="px-6 py-4 text-gray-300">
                                {rrpp.eventName}
                            </td>
                            <td className="px-6 py-4 text-gray-300">
                                {rrpp.fechaCreacion}
                            </td>
                            <td className="px-6 py-4 text-gray-300">
                                {rrpp.RRPPCount}
                            </td>
                            <td className="px-6 py-4 text-gray-300">
                                {rrpp.excelName}
                            </td>
                            <td className="px-6 py-4">
                                <button className="w-[150px] flex items-center justify-center px-3 py-2 bg-gray-800 hover:bg-gray-900 text-green-700 rounded-lg text-xs font-semibold transition-colors mb-2" onClick={() => handleSendRRPPLinks(rrpp._id)}>
                                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22 4H2V20C2 21.1046 2.89543 22 4 22H20C21.1046 22 22 21.1046 22 20V4Z" stroke="green" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M22 4L12 13L2 4" stroke="green" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    <p className="ml-2">Enviar</p>
                                </button>
                               {/* <Link to={`/get_cortesie/${cort._id}`} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Editar</Link><br></br>*/ }
                                <button className="w-[150px] flex items-center justify-center px-3 py-2 bg-gray-800 hover:bg-gray-900 text-red-700 rounded-lg text-xs font-semibold transition-colors" onClick={(e) => deleteExcel(e)}>
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
                        )


                        :
                        
                       cortesies.map((cort) => 
                       <>
                         <tr key={cort._id} className="odd:bg-gray-700 even:bg-gray-800 border-b dark:border-gray-800 border-gray-600">
                            <td className="px-6 py-4 text-gray-300">
                                {cort.eventName}
                            </td>
                            <td className="px-6 py-4 text-gray-300">
                                {cort.fechaCreacion}
                            </td>
                            <td className="px-6 py-4 text-gray-300">
                                {cort.courtesy}
                            </td>
                            <td className="px-6 py-4 text-gray-300">
                                {cort.excelName}
                            </td>
                            <td className="px-6 py-4">
                                <button className="w-[150px] flex items-center justify-center px-3 py-2 bg-gray-800 hover:bg-gray-900 text-green-700 rounded-lg text-xs font-semibold transition-colors mb-2" onClick={() => handleSendCortesies(cort._id)}>
                                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22 4H2V20C2 21.1046 2.89543 22 4 22H20C21.1046 22 22 21.1046 22 20V4Z" stroke="green" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        <path d="M22 4L12 13L2 4" stroke="green" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    <p className="ml-2">Enviar</p>
                                </button>
                               {/* <Link to={`/get_cortesie/${cort._id}`} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Editar</Link><br></br>*/ }
                                <button className="w-[150px] flex items-center justify-center px-3 py-2 bg-gray-800 hover:bg-gray-900 text-red-700 rounded-lg text-xs font-semibold transition-colors" onClick={(e) => deleteExcel(e)}>
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
                    )
                        }
                    </tbody>
                </table>
            </div>
        </div>
        </>
    )
}

export default Cortesies;