import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router";
import UserContext from "../../context/userContext";
import { getAllExcelsRequest } from "../../api/cortesieRequest";

const Cortesies = () => {
    const {session} = useContext(UserContext)
    const {prodId} = useParams()
    const [cortesies, setCortesies] = useState([])

    useEffect(() => {
        getProdCortesiesFunc = async () => {
            const res = await getAllExcelsRequest(prodId, session?.userFinded?.[0]?._id)
            setCortesies(res.data)
        }
    }, [])

    return(
        <>
             <div className="productions-container h-full mb-24">
            <div className={`productions relative overflow-x-auto shadow-md sm:rounded-lg ${width >= 1110 ? 'pl-10 pr-10 pb-10 pt-0' : 'pt-0'}`}>
                <table className="w-full max-h-[900px] text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-violet-900 dark:text-white">
                        <tr>
                             <th scope="col" className="px-6 py-3">

                            </th>
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
                        </tr>
                    </thead>
                    <tbody>
                       {cortesies.map((cort) => 
                       <>
                         <tr key={cort._id} className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700 border-gray-200">
                            <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                               {}
                            </th>
                            <td className="px-6 py-4">
                                {cort.nombreEvento}
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