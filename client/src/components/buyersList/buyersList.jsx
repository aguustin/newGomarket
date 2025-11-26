import { useContext } from "react";
import { useEffect } from "react";
import { useState } from "react";
import UserContext from "../../context/userContext";
import { useParams } from "react-router";
import { getBuyersRequest } from "../../api/eventRequests";
import { formatDate } from "../../globalscomp/globalscomp";

const BuyersList = () => { 
    const {session} = useContext(UserContext)
    const {prodId} = useParams()
    const [buyers, setBuyers] = useState([])
    const [width, setWidth] = useState(null)

       useEffect(() => {
            const getBuyers = async () => {
                try {
                    const userId = session?.userFinded?.[0]?._id   //session?.userFinded?.[0]?._id;
                    if (!userId) return; // Wait until session is ready
    
                    const res = await getBuyersRequest(prodId);
                    setBuyers(res.data);
                } catch (err) {
                    console.error("Failed to fetch buyers:", err);
                }
            };
            getBuyers();
            const mediaQuery = window.matchMedia("(min-width: 1110px)");
            const handleResize = () => {
               setWidth(mediaQuery.matches ? 1110 : 1109);
            };
           
           handleResize(); // valor inicial
           mediaQuery.addEventListener("change", handleResize);
           
           return () => mediaQuery.removeEventListener("change", handleResize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [session]);

return (
  <>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-[1400px] mx-auto">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white!">Tus Compradores</h1>
                <p className="text-white!">Monitorea tus compradores</p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 text-center">
                  <p className="text-white/80 text-sm font-medium">Total Compradores</p>
                  <p className="text-white text-2xl font-bold">{buyers?.length || 0}</p>
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
                    Nombre
                  </th>
                  {width >= 1110 && (
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Email
                    </th>
                  )}
                  {width >= 1110 && (
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      DNI
                    </th>
                  )}
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                    telefono
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                    Fecha de compra
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {buyers.map((buyer) => (
                  <>
                    {/* Fila principal del evento */}
                    <tr 
                      key={buyer._id} 
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-3">
                         
                          <div>
                            <p className="text-sm font-bold text-gray-900">{buyer.nombreCompleto}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </p>
                          </div>
                        </div>
                      </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center space-x-2 text-sm text-gray-700">
                            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">{buyer.email}</span>
                          </div>
                        </td>
                      <td className="px-6 py-5 text-center">
                        <div className="inline-flex items-center justify-center text-blue-800 px-4 py-2">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                          </svg>
                          <span className="font-bold text-lg">{buyer.dni || 0}</span>
                        </div>
                            <td className="px-6 py-5">
                          <div className="flex items-center space-x-2 text-sm text-gray-700">
                            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">{buyer.telefono}</span>
                          </div>
                        </td>
                      </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center space-x-2 text-sm text-gray-700">
                            <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">{formatDate(buyer.fechaCompra)}</span>
                          </div>
                        </td>
                    </tr>
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mensaje si no hay producciones */}
          {(!buyers || buyers.length === 0) && (
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-4">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No hay compradores aun</h3>
              <p className="text-gray-600">Aqui se mostraran los usuarios que hayan comprado tickets de este evento</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </>
);
}

export default BuyersList