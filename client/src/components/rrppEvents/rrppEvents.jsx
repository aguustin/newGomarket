import { useContext, useEffect } from "react"
import { generateMyRRPPLinkRequest, getRRPPInfoRequest } from "../../api/eventRequests"
import { useState } from "react"
import { redirect, useNavigate } from "react-router"
import CryptoJS from 'crypto-js';
import { formatDate } from "../../globalscomp/globalscomp";
import UserContext from "../../context/userContext";
import spacePng from "../../assets/space.png"
import calendarPng from "../../assets/images/calendar.png"

const RRPPEvents = () => {
    const {session} = useContext(UserContext)
    const [rrppEvents, setEvents] = useState([])
    const nav = useNavigate()
    
    useEffect(() => {
        const getRRPPInfo = async () => {
            const res = await getRRPPInfoRequest(session?.userFinded?.[0]?.mail) //meter mail de la session
            setEvents(res.data)
        }
        getRRPPInfo()
    }, [session])
    console.log(rrppEvents)
    /*const buildUrl = (prodId, mail, imgEvento) => {
        const secretKey = "skulldiver"
        const imgUrl = imgEvento
        const encryptedUrl = CryptoJS.AES.encrypt(imgUrl, secretKey).toString()
        console.log(prodId, ' ', mail)
        nav(`/rrpp_get_event_free/${prodId}/${mail}`) ///${encryptedUrl}
    }*/
   
    const generateMyRRPPLink = async (prodId, rrppMail) => {
       const res = await generateMyRRPPLinkRequest({prodId, rrppMail})
       if(res.data.message.length > 0){
            window.location.reload()
       }
      // getRRPPInfo()
    }
    return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 py-12 px-4">
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-left mb-12 bg-gradient-to-r from-purple-600 to-pink-600 p-6 overflow-hidden rounded-t-xl">
        <h1 className="text-3xl font-bold text-white!">
          Mis Colaboraciones
        </h1>
        <p className="text-white">Gestiona tus eventos y links de pago</p>
      </div>

      {/* Grid de eventos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {rrppEvents?.map((rpe, i) => {
          const rrppCoincidente = rpe.rrpp.find(linkP => linkP.mail === session?.userFinded?.[0]?.mail);
          
          if (rrppCoincidente) {
            return (
              <div 
                key={rpe._id} 
                className="group bg-white rounded-3xl shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:cursor"
              >
                {/* Imagen del evento */}
                <div className="relative overflow-hidden h-[280px]">
                  <img 
                    className="w-full h-full object-cover transition-transform" 
                    src={rpe.imgEvento} 
                    alt={rpe.nombreEvento} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                  
                  {/* Badge de evento activo 
                  <div className="absolute top-4 right-4">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                      Activo
                    </span>
                  </div>*/}

                  {/* Título sobre la imagen */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-2xl font-bold text-white drop-shadow-lg text-white!">
                      {rpe.nombreEvento}
                    </h2>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-6 space-y-4">
                  {/* Fechas */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium">Inicio</p>
                        <p className="text-gray-800 font-semibold">{formatDate(rpe.fechaInicio)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 bg-gradient-to-r from-pink-50 to-purple-50 p-3 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 font-medium">Cierre</p>
                        <p className="text-gray-800 font-semibold">{formatDate(rpe.fechaFin)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Link de pago */}
                  {rrppCoincidente && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-100">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-semibold text-gray-700 flex items-center">
                          Tu link de pago
                        </p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
                        <p className="text-sm text-gray-600 break-all font-mono">
                          {rrppCoincidente.linkDePago}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(rrppCoincidente.linkDePago)}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copiar link
                      </button>
                    </div>
                  )}

                  {/* Botón generar link */}
                  <button
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center group"
                    onClick={() => generateMyRRPPLink(rpe._id, session?.userFinded?.[0]?.mail)}
                  >
                    Generar mi link de pago
                  </button>
                </div>
              </div>
            );
          }
        })}
      </div>

      {/* Estado vacío - Mostrar solo si no hay eventos */}
      {!rrppEvents?.some(rpe => rpe.rrpp.find(linkP => linkP.mail === session?.userFinded?.[0]?.mail)) && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="bg-white rounded-3xl p-12 shadow-xl text-center max-w-md">
            <div className="mb-6">
              <img className="mx-auto w-48 h-48 opacity-80" src={spacePng} alt="" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Sin colaboraciones activas
            </h3>
            <p className="text-gray-600 text-lg">
              No tienes eventos asignados por el momento. 
              <br />¡Mantente atento a nuevas oportunidades!
            </p>
            <div className="mt-8">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 px-6 py-3 rounded-full">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-purple-700">Revisa tu email para nuevas invitaciones</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
}

export default RRPPEvents