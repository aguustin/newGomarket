import { useContext, useEffect, useState } from "react"
import UserContext from "../../context/userContext"
import { getProdsRequest } from "../../api/eventRequests"
import { Link } from "react-router"

const Productions = () => {

    const {session, productions, setProductions} = useContext(UserContext)
    const [showRRPPData, setShowRRPPData] = useState(false)
    const [width, setWidth] = useState(null)

    useEffect(() => {
        const getProds = async () => {
            try {
                const userId = session?.userFinded?.[0]?._id   //session?.userFinded?.[0]?._id;
                if (!userId) return; // Wait until session is ready

                const res = await getProdsRequest(userId);
                setProductions(res.data);
            } catch (err) {
                console.error("Failed to fetch productions:", err);
            }
        };
        getProds();
        const mediaQuery = window.matchMedia("(min-width: 1110px)");
        const handleResize = () => {
           setWidth(mediaQuery.matches ? 1110 : 1109);
       };
       
       handleResize(); // valor inicial
       mediaQuery.addEventListener("change", handleResize);
       
       return () => mediaQuery.removeEventListener("change", handleResize);
    }, [session]);
    
    if (width === null) return null;
    
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
        <div className="productions-container h-full mb-24">
            <div className={`productions relative overflow-x-auto shadow-md sm:rounded-lg ${width >= 1110 ? 'pl-10 pr-10 pb-10 pt-0' : 'pt-0'}`}>
                <table className="w-full max-h-[900px] text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-violet-900 dark:text-white">
                        <tr>
                            <th scope="col" className="px-6 py-3">
                                Nombre del evento
                            </th>
                            {width >= 1110 && <th scope="col" className="px-6 py-3">
                                Destino
                            </th>}
                            {width >= 1110 &&  <th scope="col" className="px-6 py-3">
                                Lugar
                            </th>}
                            {width >= 1110 && <th scope="col" className="px-6 py-3">
                                Fecha de inicio
                            </th>}
                            {width >= 1110 && <th scope="col" className="px-6 py-3">
                                Fecha de fin
                            </th>}
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
                       <>
                         <tr key={prod._id} className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700 border-gray-200">
                            <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                               {prod.nombreEvento}
                            </th>
                            {width >= 1110 && <td className="px-6 py-4">
                                {prod.paisDestino}, {prod.provincia}, {prod.localidad}
                            </td>}
                            {width >= 1110 && <td className="px-6 py-4">
                                {prod.lugarEvento}
                            </td>}
                            {width >= 1110 && <td className="px-6 py-4">
                                {formatDate(prod.fechaInicio)}
                            </td>}
                            {width >= 1110 && <td className="px-6 py-4">
                                {formatDate(prod.fechaFin)}
                            </td>}
                              <td className="px-6 py-4">
                                {prod.totalVentas || 0}
                              </td>
                              <td className="px-6 py-4">
                                {prod.totalMontoVendido || 0}
                                </td>
                            <td className="px-6 py-4">
                                <Link to={`/editar_evento/${prod._id}`} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Editar</Link><br></br>
                                <Link to={`/statistics/${prod._id}/${session?.userFinded?.[0]?._id}`}>Estadisticas</Link><br></br>
                                <button onClick={() => setShowRRPPData(showRRPPData === prod._id ? null : prod._id)}>Tus RRPP</button>
                                <button
                                    type="button"
                                    onClick={() => navigator.clipboard.writeText(`http://localhost:5173/buy_tickets/${prod._id}/${prod.prodMail}`)}
                                    className="bg-blue-600 text-white px-3 py-1 rounded w-[99px]!"
                                >
                                    Copiar link
                                </button>
                  
                            </td>
                         </tr>
                         {showRRPPData === prod._id &&
                            <tr>
                                <td colSpan={8} className="bg-violet-100 dark:bg-violet-900 p-1">
                                    <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                                        <thead className="text-xs text-white! uppercase bg-gray-50 dark:bg-violet-900 dark:text-gray-400">
                                        <tr>
                                            <th className="px-6 py-3">Mail</th>
                                            <th className="px-6 py-3">Monto total vendido</th>
                                            <th className="px-6 py-3">Entradas vendidas</th>
                                            <th className="px-6 py-3">Total por entrada</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {prod.rrpp.map((rp) => (
                                            <tr
                                            key={rp._id}
                                            className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700 border-gray-200"
                                            >
                                            <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                                {rp.mail}
                                            </td>
                                            <td className="px-6 py-4">
                                                {rp.montoTotalVendidoRRPP || 0}
                                            </td>
                                            <td className="px-6 py-4">
                                                {rp.ventasRRPP.map((ventRP) => (
                                                <span className="flex" key={ventRP.ticketId}>
                                                    <p className="mr-1">{ventRP.nombreCategoria}:</p> {ventRP.vendidos || 0}
                                                </span>
                                                ))}
                                            </td>
                                            <td className="px-6 py-4">
                                                {rp.ventasRRPP.map((ventRP) => (
                                                <span className="flex" key={ventRP.ticketId}>
                                                    <p className="mr-1">{ventRP.nombreCategoria}:</p> {ventRP.total || 0}
                                                </span>
                                                ))}
                                            </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                    </td>
                                </tr>
                             }
                        </> 
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    </>
    )
}

export default Productions