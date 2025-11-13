import { useContext, useEffect, useState } from "react"
import UserContext from "../../context/userContext"
import { descargarCompradoresRequest, getProdsRequest } from "../../api/eventRequests"
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

    const descargarCompradores = async (prodId, nombreEvento) => {
        const res = await descargarCompradoresRequest({prodId, nombreEvento})

        if(res.data.succes === 1){
            console.log('data')
        }else{
            console.log('data B')
        }
    }

return (
  <>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white!">Tus Producciones</h1>
                <p className="text-white!">Gestiona y monitorea tus eventos</p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 text-center">
                  <p className="text-white/80 text-sm font-medium">Total Eventos</p>
                  <p className="text-white text-2xl font-bold">{productions?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla con scroll horizontal para pantallas pequeñas */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              {/* Header de la tabla */}
              <thead>
                <tr className="bg-gradient-to-r from-orange-500 to-red-500">
                  <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                    Evento
                  </th>
                  {width >= 1110 && (
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Fecha Inicio
                    </th>
                  )}
                  {width >= 1110 && (
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Fecha Fin
                    </th>
                  )}
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                    Entradas Vendidas
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                    Ganancias
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {productions.map((prod) => (
                  <>
                    {/* Fila principal del evento */}
                    <tr 
                      key={prod._id} 
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      {/* Columna Evento */}
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-3">
                         
                          <div>
                            <p className="text-sm font-bold text-gray-900">{prod.nombreEvento}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {prod.provincia}, {prod.localidad}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Fechas */}
                      {width >= 1110 && (
                        <td className="px-6 py-5">
                          <div className="flex items-center space-x-2 text-sm text-gray-700">
                            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">{formatDate(prod.fechaInicio)}</span>
                          </div>
                        </td>
                      )}
                      
                      {width >= 1110 && (
                        <td className="px-6 py-5">
                          <div className="flex items-center space-x-2 text-sm text-gray-700">
                            <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">{formatDate(prod.fechaFin)}</span>
                          </div>
                        </td>
                      )}

                      {/* Entradas Vendidas */}
                      <td className="px-6 py-5 text-center">
                        <div className="inline-flex items-center justify-center text-blue-800 px-4 py-2">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                          </svg>
                          <span className="font-bold text-lg">{prod.totalVentas || 0}</span>
                        </div>
                      </td>

                      {/* Ganancias */}
                      <td className="px-6 py-5 text-center">
                        <div className="inline-flex items-center justify-center text-green-800 px-4 py-2">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-bold text-lg">${prod.totalMontoVendido || 0}</span>
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-5">
                        <div className="flex flex-col space-y-2">
                          <Link 
                            to={`/editar_evento/${prod._id}`} 
                            className="flex items-center justify-center px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                          </Link>
                          
                          <Link 
                            to={`/statistics/${prod._id}/${session?.userFinded?.[0]?._id}`} 
                            className="flex items-center justify-center px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Estadísticas
                          </Link>
                          
                          <button 
                            onClick={() => setShowRRPPData(showRRPPData === prod._id ? null : prod._id)} 
                            className="flex items-center justify-center px-3 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {showRRPPData === prod._id ? 'Ocultar' : 'Ver'} RRPP
                          </button>
                          
                          <button 
                            onClick={() => descargarCompradores(prod._id, prod.nombreEvento)} 
                            className="flex items-center justify-center px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Lista compradores
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`${import.meta.env.VITE_URL_FRONT}/buy_tickets/${prod._id}/${prod.prodMail}`);
                              alert('LINK COPIADO!');
                            }}
                            className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg text-xs font-semibold transition-all shadow-md hover:shadow-lg"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copiar link
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Tabla expandible de RRPP */}
                    {showRRPPData === prod._id && (
                      <tr>
                        <td colSpan={6} className="bg-gradient-to-r from-gray-200 to-gray-100 p-6">
                          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
                              <h3 className="text-lg font-bold text-white! flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="white" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Datos de RRPP
                              </h3>
                            </div>
                            
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-orange-100">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-orange-900 uppercase">
                                      Mail
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-orange-900 uppercase">
                                      Monto Total
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-orange-900 uppercase">
                                      Entradas Vendidas
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-orange-900 uppercase">
                                      Total por Entrada
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {prod.rrpp.map((rp) => (
                                    <tr key={rp._id} className="hover:bg-gray-50 transition-colors">
                                      <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">
                                              {rp.mail.charAt(0).toUpperCase()}
                                            </span>
                                          </div>
                                          <span className="text-sm text-gray-700 font-medium">{rp.mail}</span>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4">
                                        <span className="inline-flex items-center text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                                          ${rp.montoTotalVendidoRRPP || 0}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4">
                                        <div className="space-y-1">
                                          {rp.ventasRRPP.map((ventRP) => (
                                            <div key={ventRP.ticketId} className="flex items-center text-sm">
                                              <span className="font-semibold text-gray-700 mr-2">{ventRP.nombreCategoria}:</span>
                                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">
                                                {ventRP.vendidos || 0}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4">
                                        <div className="space-y-1">
                                          {rp.ventasRRPP.map((ventRP) => (
                                            <div key={ventRP.ticketId} className="flex items-center text-sm">
                                              <span className="font-semibold text-gray-700 mr-2">{ventRP.nombreCategoria}:</span>
                                              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-bold">
                                                ${ventRP.total || 0}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mensaje si no hay producciones */}
          {(!productions || productions.length === 0) && (
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-4">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No hay producciones</h3>
              <p className="text-gray-600">Comienza creando tu primer evento</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </>
);
}

export default Productions