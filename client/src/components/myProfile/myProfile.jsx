import React, { useState } from 'react';
import checkWhitePng from "../../assets/images/check-white.png"
import { Link } from 'react-router';

const ProfileCards = () => {
  const [profiles] = useState({
    particular: {
      nombre: "María González",
      email: "maria.gonzalez@email.com",
      telefono: "+54 261 123-4567",
      pais: "Argentina",
      titular: "María Alejandra González",
      imagen: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"
    },
    productora: {
      nombre: "Eventos Premium SRL",
      email: "contacto@eventospremium.com",
      telefono: "+54 261 987-6543",
      domicilio: "Av. San Martín 1234, Mendoza",
      pais: "Argentina",
      titular: "Carlos Roberto Fernández",
      imagen: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&h=400&fit=crop"
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Perfiles de Usuario
          </h1>
          <p className="text-lg text-gray-600">
            Gestiona tu información personal o de tu productora
          </p>
        </div>

        {/* Profile Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-start">
          {/* Perfil Particular */}
          <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 hover:border-indigo-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
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
            <div className="flex justify-center mb-6">
              <div className="relative">
                <img 
                  src={checkWhitePng} 
                  alt="Perfil"
                  className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100"
                />
                <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-2 rounded-full">
                  
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                 
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">Nombre</p>
                    <p className="text-gray-900 font-semibold">{profiles.particular.nombre}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">Email</p>
                    <p className="text-gray-900 font-semibold break-all">{profiles.particular.email}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">Teléfono</p>
                    <p className="text-gray-900 font-semibold">{profiles.particular.telefono}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">País</p>
                    <p className="text-gray-900 font-semibold">{profiles.particular.pais}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                 
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">Titular</p>
                    <p className="text-gray-900 font-semibold">{profiles.particular.titular}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <Link to={'/user_info'} className="w-full mt-6 bg-orange-500 hover:bg-indigo-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105">
              Editar Perfil
            </Link>
          </div>

          {/* Perfil Productora */}
          <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 hover:border-pink-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
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
            <div className="flex justify-center mb-6">
              <div className="relative">
                <img 
                  src={checkWhitePng} 
                  alt="Productora"
                  className="w-32 h-32 rounded-full object-cover border-4 border-pink-100"
                />
                <div className="absolute -bottom-2 -right-2 bg-pink-600 text-white p-2 rounded-full">
                  
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">Nombre</p>
                    <p className="text-gray-900 font-semibold">{profiles.productora.nombre}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">Email</p>
                    <p className="text-gray-900 font-semibold break-all">{profiles.productora.email}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">Teléfono</p>
                    <p className="text-gray-900 font-semibold">{profiles.productora.telefono}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                 
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">Domicilio</p>
                    <p className="text-gray-900 font-semibold">{profiles.productora.domicilio}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">País</p>
                    <p className="text-gray-900 font-semibold">{profiles.productora.pais}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                 
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 mb-1">Titular</p>
                    <p className="text-gray-900 font-semibold">{profiles.productora.titular}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <Link to={'/user_info'} className="w-full mt-6 bg-orange-500 hover:bg-pink-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105">
              Editar Perfil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCards;