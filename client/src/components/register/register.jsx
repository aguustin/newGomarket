import { useState } from "react"
import { registerUserRequest } from "../../api/userRequests"
import {Link, useNavigate} from 'react-router';
import ReCAPTCHA from "react-google-recaptcha";
import { LoadingButton } from "../../globalscomp/globalscomp";
import goOriginalPng from '../../assets/goticketImgs/IPS.svg'

const Register = () => {
    const navigate = useNavigate() 
    const [showMsg, setShowMsg] = useState()
    const [showMsgB, setShowMsgB] = useState()
    const [captchaStatus, setCaptchaStatus] = useState(false)
    const [loading, setLoading] = useState(false)
    
     const onSuccess = () => {
        setCaptchaStatus(true)
    }

    const registerUser = async (e) => {
        e.preventDefault()
        setLoading(true)
         if(captchaStatus){ 
             if(e.target.elements.contrasenia.value !== e.target.elements.repetirContrasenia.value){
                 setShowMsg('Las contraseñas no coinciden')
             }else{
                 const userData = {
                     nombreCompleto: e.target.elements.nombreCompleto.value,
                     mail: e.target.elements.mail.value,
                     dni: e.target.elements.dni.value,
                     pais: e.target.elements.pais.value,
                     contrasenia: e.target.elements.contrasenia.value,
                     repetirContrasenia: e.target.elements.repetirContrasenia.value
                 }
                 const res = await registerUserRequest(userData)
                 
                 if(res.data.msj === 1){
                     setTimeout(() => { // Set the timeout
                         setShowMsg('')
                         setShowMsgB('Verifica tu correo electronico para confirmar tu registro!')
                         navigate('/login')
                     }, 3000)
                 }else{
                     setLoading(false)
                     setShowMsg(res.data.msj)
                 }
             }
         }else{
            setShowMsg('Por favor, marca la casilla antes de continuar')
         }
        //hasta aca llega el if
        setLoading(false)
    }

    return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4">
      {/* Logo */}
      <div className="absolute top-5">
        <Link to="/">
          <img 
            className="h-16 transition-transform hover:scale-110" 
            src={goOriginalPng} 
            alt="GoTicket Logo"
          />
        </Link>
      </div>

      {/* Formulario de Registro */}
      <form 
        className="w-full max-w-md rounded-2xl shadow-2xl p-8 animate-slideIn  bg-gray-900"
        onSubmit={registerUser}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-amber-600 to-yellow-500 rounded-full mb-4">
            <svg className="w-8 h-8 text-[#111827]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h3 className="text-4xl font-bold text-gray-300!">Regístrate</h3>
          <p className="mt-3 text-gray-400">
            Crea tu cuenta de Ipass y disfruta de tus eventos favoritos
          </p>
        </div>

        <div className="space-y-4">
          {/* Nombre completo */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <input 
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-600 rounded-xl transition-all outline-none text-gray-100!"
              minLength="5" 
              maxLength="50" 
              type="text" 
              placeholder="Nombre completo" 
              name="nombreCompleto" 
              required 
            />
          </div>

          {/* Email */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <input 
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-600 rounded-xl text-gray-100! transition-all outline-none"
              minLength="5" 
              maxLength="50" 
              type="email" 
              placeholder="tu@email.com" 
              name="mail" 
              required 
            />
          </div>

          {/* DNI */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
            <input 
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-600 rounded-xl text-gray-100! transition-all outline-none"
              minLength="5" 
              maxLength="15" 
              type="text" 
              placeholder="Número de DNI" 
              name="dni" 
              required 
            />
          </div>

          {/* País */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <input 
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-600 rounded-xl text-gray-100! transition-all outline-none"
              minLength="3" 
              maxLength="30" 
              type="text" 
              placeholder="Tu país" 
              name="pais" 
              required 
            />
          </div>

          {/* Contraseña */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input 
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-600 rounded-xl text-gray-100! transition-all outline-none"
              minLength="6" 
              maxLength="30" 
              type="password" 
              placeholder="Ingresa una contraseña" 
              name="contrasenia"
              required 
            />
          </div>

          {/* Repetir contraseña */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <input 
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-600 rounded-xl text-gray-100! transition-all outline-none"
              minLength="6" 
              maxLength="30" 
              type="password" 
              placeholder="Repite la contraseña" 
              name="repetirContrasenia" 
              required 
            />
          </div>

          {/* Mensajes de error/éxito */}
          {showMsg?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm text-center font-medium">{showMsg}</p>
            </div>
          )}

          {showMsgB?.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3">
              <p className="text-green-600 text-sm text-center font-medium">{showMsgB}</p>
            </div>
          )}

          {/* Link a login */}
          <div className="text-center text-sm text-gray-300">
            <span>¿Ya tienes cuenta? </span>
            <Link 
              className="text-orange-600 hover:text-red-600 font-semibold underline transition-colors" 
              to="/login"
            >
              Inicia sesión aquí
            </Link>
          </div>
        </div>

        {/* ReCAPTCHA */}
        <div className="flex justify-center my-6">
          <ReCAPTCHA
            sitekey={import.meta.env.VITE_RECAPTCHA_KEY}
            onChange={onSuccess}
          />
        </div>

        {/* Botón de submit */}
        <div className="mt-6">
          {loading ? (
            <button 
              className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold flex items-center justify-center"
              disabled
            >
              <LoadingButton />
            </button>
          ) : (
            <button 
              className="w-full h-14 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-500 text-[#111827] rounded-xl font-semibold transition-all transform hover:scale-[1.02] hover:shadow-xl"
              type="submit"
            >
              Registrarme
            </button>
          )}
        </div>
      </form>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Register