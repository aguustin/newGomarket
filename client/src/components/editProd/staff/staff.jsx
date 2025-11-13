import { useEffect } from "react"
import { useParams } from "react-router"
import { getOneProdRequest, staffQrRequest } from "../../../api/eventRequests"
import { useState } from "react"
import { formatDate } from "../../../globalscomp/globalscomp"
import { useContext } from "react"
import UserContext from "../../../context/userContext"
import checkWhitePng from "../../../assets/images/check-white.png"
import calendarPng from "../../../assets/images/calendar.png"

const Staff = () => {
    const {session} = useContext(UserContext)
    const {prodId} = useParams()
    const [producction, setProducction] = useState([])
    const [quantities, setQuantities] = useState({});
    const [quantity, setQuantity] = useState(0)
    const [totalQuantity, setTotalQuantity] = useState(0)
    const [showMsg, setShowMsg] = useState(0)

    useEffect(() => {
        const obtainUserProd = async () => {
            const userId = session?.userFinded?.[0]?._id
            const res = await getOneProdRequest(prodId, userId)  //despues reemplazar el valor por userId de la session
            setProducction(res.data)
        }
        obtainUserProd()
    },[])
  
      const restQuantity = (e, ticketId) => {
        e.preventDefault()
        setQuantities(prev => {
            const current = prev[ticketId] || 0;
            if (current > 0) {
                setTotalQuantity(totalQuantity - 1)
                return {
                    ...prev,
                    [ticketId]: current - 1
                };
            }
            return prev
        });
    };

    const addQuantity = (e, ticketId) => {
        e.preventDefault()
        if(quantity < 20){
            setTotalQuantity(totalQuantity + 1)
            setQuantities(prev => ({
                ...prev,
                [ticketId]: (prev[ticketId] || 0) + 1, 
            }));
        }
    }

    const addStaff = async (e) => {
        e.preventDefault()
        
        if(quantities.length <= 0){
            setShowMsg(2)
        }else{
            const mail = e.target.elements.emailStaff.value
            const sendData = {
                prodId, 
                quantities, 
                mail
            }
            const res = await staffQrRequest(sendData)
            
            if(res.data.state === 2){
                setShowMsg(3)
            }else{
                setShowMsg(1)
                setTimeout(() => {
                    setShowMsg(0)
                }, 3000);    
            }
        }
    }

   return (
  <>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <form onSubmit={(e) => addStaff(e)} className="max-w-6xl mx-auto">
        {producction.map((p) => (
          <div key={p._id} className="bg-white rounded-3xl shadow-xl overflow-hidden">
            {/* Header con degradado */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
              <h2 className="text-3xl font-bold text-white!">Confirmar detalles del evento</h2>
            </div>

            {/* Contenido principal */}
            <div className="p-8">
              {/* Sección de información del evento */}
              <div className="grid md:grid-cols-2 gap-8 mb-10">
                {/* Imagen del evento */}
                <div className="relative group">
                  <div className="overflow-hidden rounded-2xl shadow-lg">
                    <img 
                      className="w-full h-[280px] object-cover transition-transform" 
                      src={p.imgEvento} 
                      alt="Evento" 
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Información del evento */}
                <div className="flex flex-col justify-center space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{p.nombreEvento}</h3>
                    <div className="h-1 w-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"></div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Fecha de inicio</p>
                        <p className="text-gray-800 font-semibold">{formatDate(p.fechaInicio)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Fecha de cierre</p>
                        <p className="text-gray-800 font-semibold">{formatDate(p.fechaFin)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Campo de email mejorado */}
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Enviar invitaciones a:
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <input 
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none" 
                        type="email" 
                        name="emailStaff" 
                        placeholder="Ej: JohnDoe@gmail.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección de tickets */}
              <div className="border-t-2 border-gray-100 pt-8">
                <h3 className="text-xl text-gray-800 mb-6 flex items-center">
                  Cortesías disponibles
                </h3>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {p.cortesiaRRPP.map((tck) => (
                    <div 
                      key={tck._id} 
                      className="bg-gradient-to-r from-gray-50 to-white border-2 border-gray-100 rounded-2xl p-5 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        {/* Imagen y nombre del ticket */}
                        <div className="flex items-center space-x-4 min-w-[200px]">
                          <div className="relative">
                            <img 
                              className="w-16 h-16 rounded-xl object-cover shadow-md" 
                              src={tck.imgTicket} 
                              alt="Ticket" 
                              loading="lazy"
                            />
                          </div>
                          <div>
                            <p className="text-gray-800 text-lg">{tck.nombreTicket}</p>
                            <p className="text-sm text-gray-500">Tipo de entrada</p>
                          </div>
                        </div>

                        {/* Información adicional */}
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <p className="text-xs text-gray-500 font-medium">Total disponible</p>
                            <p className="text-lg text-gray-800">{tck.cantidadDeCortesias}</p>
                          </div>

                          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
                            <img className="h-5 w-5" src={calendarPng} alt="" />
                            <p className="text-sm text-gray-600 font-medium">{formatDate(p.fechaInicio)}</p>
                          </div>
                        </div>

                        {/* Controles de cantidad */}
                        <div className="flex items-center space-x-3 bg-white rounded-xl p-1 border-1 border-gray-200 shadow-sm">
                          <button 
                            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg  text-gray-700 transition-all active:scale-95" 
                            onClick={(e) => restQuantity(e, tck._id)}
                          >
                            -
                          </button>
                          <div className="w-14 text-center">
                            <p className="text-md text-gray-800">{quantities[tck._id] || 0}</p>
                          </div>
                          <button 
                            className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg  text-white transition-all active:scale-95 shadow-md" 
                            onClick={(e) => addQuantity(e, tck._id)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón de confirmación y mensajes */}
              <div className="mt-8 text-center space-y-4">
                <button 
                  className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95" 
                  type="submit"
                >
                
                  <span className="text-white font-bold text-lg">Confirmar invitaciones</span>
                </button>

                {/* Mensajes de estado */}
                {(showMsg === 3) && (
                  <div className="animate-fade-in bg-green-50 border-2 border-green-200 rounded-xl p-4 inline-block">
                    <p className="text-green-700 font-semibold flex items-center">
                      ¡Invitaciones enviadas exitosamente!
                    </p>
                  </div>
                )}
                
                {showMsg === 2 && (
                  <div className="animate-fade-in bg-orange-50 border-2 border-orange-200 rounded-xl p-4 inline-block">
                    <p className="text-orange-600 font-semibold flex items-center">
                      <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Falta agregar invitaciones
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </form>
    </div>
  </>
);
}

export default Staff