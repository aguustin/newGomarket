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
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [session]);
console.log(buyers)
return (
  <>
    <div className="min-h-screen to-pink-50 py-8 px-4">
      <div className="max-w-[1400px] mx-auto">
        <div className="bg-gray-800 rounded-3xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-amber-600 to-yellow-500 p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#111827]!">Tus Compradores</h1>
                <p className="text-[#111827]!">Monitorea tus compradores</p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 text-center">
                  <p className="text-[#111827]! text-sm font-medium">Total Compradores</p>
                  <p className="text-[#111827]! text-2xl font-bold">{buyers?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla con scroll horizontal para pantallas pequeñas */}
          <div className="ab overflow-x-auto!">
            <table className="w-full min-w-[1000px]">
  {/* Header de la tabla */}
  <thead>
    <tr className="bg-gray-900">
      <th className="px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
        Nombre
      </th>
  
        <th className="px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
          Email
        </th>

        <th className="px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
          DNI
        </th>
      
      <th className="px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
        Teléfono
      </th>
      <th className="px-6 py-4 text-left text-xs font-bold text-gray-200 uppercase tracking-wider">
        Fecha de compra
      </th>
    </tr>
  </thead>

  <tbody className="bg-gray-900! divide-y divide-gray-200">
    {buyers.map((buyer) => (
      <tr 
        key={buyer._id} 
        className="hover:bg-gray-50 transition-colors duration-150"
      >
        {/* Nombre */}
        <td className="px-6 py-5">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="text-sm font-bold text-gray-900">{buyer.nombreCompleto}</p>
          </div>
        </td>

       
          <td className="px-6 py-5">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-300">{buyer.email}</span>
            </div>
          </td>

      
          <td className="px-6 py-5">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
              <span className="text-sm font-medium text-gray-900">{buyer.dni || '—'}</span>
            </div>
          </td>
        

        {/* Teléfono */}
        <td className="px-6 py-5">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="text-sm text-gray-300">{buyer.telefono}</span>
          </div>
        </td>

        {/* Fecha de compra */}
        <td className="px-6 py-5">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-gray-300">{formatDate(buyer.fechaCompra)}</span>
          </div>
        </td>
      </tr>
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
              <h3 className="text-xl font-bold text-gray-400! mb-2">No hay compradores aun</h3>
              <p className="text-gray-300">Aqui se mostraran los usuarios que hayan comprado tickets de este evento</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </>
);
}

export default BuyersList