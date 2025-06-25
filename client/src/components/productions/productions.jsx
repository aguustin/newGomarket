import { useContext, useEffect } from "react"
import UserContext from "../../context/userContext"
import { getProdsRequest } from "../../api/eventRequests"

const Productions = () => {

    const {session, productions, setProductions} = useContext(UserContext)
    //console.log(session.userFinded[0]?._id)
    useEffect(() => {
        const getProds = async () => {
            try {
                const userId =   "682230196086949adb9b9c77"   //session?.userFinded?.[0]?._id;
                if (!userId) return; // Wait until session is ready

                const res = await getProdsRequest(userId);
                setProductions(res.data);
            } catch (err) {
                console.error("Failed to fetch productions:", err);
            }
        };

        getProds();
    }, [session]);
    
    const formatDate = (isoString) => {
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${year}/${month}/${day}  ${hours}:${minutes}`;
    };

return(
        <>
        <div className="h-screen">
            <div className="productions relative overflow-x-auto shadow-md sm:rounded-lg p-10">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-violet-900 dark:text-white">
                        <tr>
                            <th scope="col" className="px-6 py-3">
                                Nombre del evento
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Destino
                            </th>
                             <th scope="col" className="px-6 py-3">
                                Lugar
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Fecha de inicio
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Fecha de fin
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Entradas Vendidas
                            </th>
                            <th scope="col" className="px-6 py-3">
                                Ganancias totales
                            </th>
                             <th scope="col" className="px-6 py-3">
                    
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                       {productions.map((prod) => 
                         <tr key={prod._id} className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700 border-gray-200">
                            <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                               {prod.nombreEvento}
                            </th>
                            <td className="px-6 py-4">
                                {prod.paisDestino}, {prod.provincia}, {prod.localidad}
                            </td>
                            <td className="px-6 py-4">
                                {prod.lugarEvento}
                            </td>
                            <td className="px-6 py-4">
                                {formatDate(prod.fechaInicio)}
                            </td>
                             <td className="px-6 py-4">
                                {formatDate(prod.fechaFin)}
                            </td>
                              <td className="px-6 py-4">
                                {prod.totalVentas || 0}
                            </td>
                              <td className="px-6 py-4">
                                {prod.totalMontoVendido || 0}
                            </td>
                            <td className="px-6 py-4">
                                <a href={`/editar_evento/${prod._id}`} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Edit</a>
                            </td>
                        </tr>)}
                    </tbody>
                </table>
            </div>

        </div>

        </>
    )
}

export default Productions