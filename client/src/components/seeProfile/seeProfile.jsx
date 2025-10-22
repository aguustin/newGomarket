import { useContext, useEffect, useState } from 'react';
import userPng from "../../assets/user.png"
import { Link, useParams } from 'react-router';

import { getUserProfileRequest } from '../../api/userRequests';
import UserContext from '../../context/userContext';

const ProfileCards = () => {

  const {userId} = useParams()
  const {session} = useContext(UserContext)
  const [profile, setProfile] = useState([])

  useEffect(() => {
    const getUserProfileFunc = async () => {
        const res = await getUserProfileRequest({userId})
        setProfile(res.data)
        return;
    }

    getUserProfileFunc()
  },[])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Perfiles
          </h1>
          <p className="text-lg text-gray-600">
            {userId === session?.userFinded?.[0]?._id ? 'Gestiona tu información personal o de tu productora' : `Perfil - ${profile?.[0]?.nombreCompleto ?? profile?.[0]?.nombreTitularProductora}`}
          </p>
        </div>

           {profile.map((pr) => 
           <div className="flex justify-center mb-6">
              <div className="relative">
                <img 
                  src={pr.imagenProductora ?? userPng} 
                  alt="Perfil"
                  className="w-42 h-42 rounded-full object-cover border-4 border-gray-300"
                />
              </div>
            </div>)}

        {/* Profile Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-start">
          {/* Perfil Particular */}
          <div className="relative bg-white rounded-3xl p-8 pb-20 border-2 border-gray-200 hover:border-indigo-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-3 rounded-xl">
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Particular</h2>
              </div>
              <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-semibold">
                Personal
              </span>
            </div>

            {/* Profile Image */}

            {/* Profile Info */}
            <div className="space-y-4">
              {profile.map((pr) =>  
                <>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                  
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 mb-1">Nombre</p>
                      <p className="text-gray-900 font-semibold">{pr.nombreCompleto}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                  
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 mb-1">Email</p>
                      <p className="text-gray-900 font-semibold break-all">{pr.mail}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 mb-1">Teléfono</p>
                      <p className="text-gray-900 font-semibold">{pr.telefono}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                  
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 mb-1">País</p>
                      <p className="text-gray-900 font-semibold">{pr.pais}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                  
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 mb-1">Titular</p>
                      <p className="text-gray-900 font-semibold">{pr.nombreTitular}</p>
                    </div>
                  </div>
                </div>
                </>
                )}
            </div>

            {/* Action Button */}
            {userId === session?.userFinded?.[0]?._id && <Link to={'/user_info'} className="absolute w-[86.5%]! text-center bottom-4 bg-orange-500 hover:bg-indigo-800 text-white! font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105">
              Editar Perfil
            </Link>}
          </div>

          {/* Perfil Productora */}
          <div className="relative bg-white rounded-3xl p-8 pb-20 border-2 border-gray-200 hover:border-indigo-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-pink-100 p-3 rounded-xl">
                 
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Productora</h2>
              </div>
              <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-semibold">
                Empresa
              </span>
            </div>

            {/* Profile Image */}

            {/* Profile Info */}
            <div className="space-y-4">
              {profile.map((pr) => 
                <>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 mb-1">Nombre</p>
                        <p className="text-gray-900 font-semibold">{pr.nombreProductora}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 mb-1">Email</p>
                        <p className="text-gray-900 font-semibold break-all">{pr.mailProductora}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 mb-1">Teléfono</p>
                        <p className="text-gray-900 font-semibold">{pr.telefonoProductora}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                    
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 mb-1">Domicilio</p>
                        <p className="text-gray-900 font-semibold">{pr.domicilioProductora}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                    
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 mb-1">País</p>
                        <p className="text-gray-900 font-semibold">{pr.paisProductora}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                    
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 mb-1">Titular</p>
                        <p className="text-gray-900 font-semibold">{pr.nombreTitularProductora}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Action Button */}
            {userId === session?.userFinded?.[0]?._id && <Link to={'/user_info'} className="absolute w-[86.5%]! text-center bottom-4 bg-orange-500 hover:bg-indigo-800 text-white! font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105">
              Editar Perfil
            </Link>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCards;