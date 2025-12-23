import { useContext, useEffect, useState } from "react"
import UserContext from "../../context/userContext"
import {Link, useNavigate} from 'react-router'
import { LoadingButton } from "../../globalscomp/globalscomp"
import { recoverPassRequest } from "../../api/userRequests"
import ReCAPTCHA from "react-google-recaptcha";
import goOriginalPng from '../../assets/goticketImgs/GO ORIGINAL SIN FONDO.png'

const Login = () => {
    const { setSession, message, loginContext} = useContext(UserContext)
    const [showMsg, setShowMsg] = useState('')
    const [recoverPass, setRecoverPass] = useState(false)
    const [captchaStatus, setCaptchaStatus] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setSession('')
        localStorage.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const onSuccess = () => {
        setCaptchaStatus(true)
    }
   // let timeout = null
    let navigate = useNavigate()

    const loginUser = async (e) => {
        e.preventDefault()
        setLoading(true)
        
        if(captchaStatus){ 
            setShowMsg('ok')
            const userData = {
              mail: e.target.elements.mail.value,
              contrasenia: e.target.elements.contrasenia.value
            }   
            const res = await loginContext(userData)
            
            if(res.data?.estado === 1){
              navigate('/')
            }
            if(res.estado === 2){
              setLoading(false)
              setShowMsg('La contraseña es incorrecta')
              setTimeout(() => {
                setShowMsg('')
              }, 3000)
            }
            if(res.estado === 3){
              setLoading(false)
              setShowMsg('El email es incorrecto')
              setTimeout(() => {
                setShowMsg('')
              }, 3000)
            }
          }else{
              setShowMsg('Por favor, marca la casilla antes de continuar')
          }
            
            //hasta aca el if else
        setLoading(false)
    }


    const recoverPassFunc = async (e) => {
        e.preventDefault()
        setLoading(true)
        const mail = e.target.elements.mail.value
        const res = await recoverPassRequest({mail})

        if(res.data.ok){
            setLoading(false)
            setShowMsg('Se envió un correo electronico a tu email para recuperar tu contraseña')
            setTimeout(() => {
                setShowMsg('')
            }, 3000)
        }
    }

    return (
    <div className="min-h-screen flex items-center justify-center  py-12 px-4 ">
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

      {/* Formulario de Recuperación */}
      {recoverPass ? (
        <form 
          className="w-full max-w-md rounded-2xl shadow-2xl p-8 animate-slideIn bg-gray-900"
          onSubmit={recoverPassFunc}
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-gradient-to-r from-amber-600 to-yellow-500">
              <svg className="w-8 h-8 text-[#111827]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-200!">Recuperar contraseña</h3>
            <p className="mt-3 text-gray-400">
              Ingresa tu email y te enviaremos un correo para que recuperes tu contraseña
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input 
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-600 rounded-xl focus:border-gray-300 transition-all outline-none text-white!"
                type="email" 
                minLength="5" 
                maxLength="50" 
                placeholder="tu@email.com" 
                name="mail" 
                required 
              />
            </div>

            {message && (
              <p className="text-red-600 text-sm text-center">
                Las contraseñas no coinciden
              </p>
            )}

            {showMsg && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="text-green-700 text-sm text-center">{showMsg}</p>
              </div>
            )}

            <div className="text-center text-sm text-gray-600">
              <span>¿No tienes cuenta? </span>
              <Link 
                className="text-orange-600 hover:text-red-600 font-semibold underline transition-colors" 
                to="/register"
              >
                Regístrate aquí
              </Link>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {loading ? (
              <button 
                className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold flex items-center justify-center"
                disabled
              >
                <LoadingButton />
              </button>
            ) : (
              <button 
                className="w-full h-14 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-yellow-400 hover:to-yellow-400 text-[#111827] rounded-xl font-semibold transition-all transform hover:scale-[1.02] hover:shadow-xl"
                type="submit"
              >
                Recuperar contraseña
              </button>
            )}

            <button 
              type="button"
              onClick={() => setRecoverPass(false)}
              className="w-full h-12 border-2 border-gray-300 text-gray-200! hover:border-orange-500 hover:text-orange-600 rounded-xl font-semibold transition-all"
            >
              Volver
            </button>
          </div>
        </form>
      ) : (
        /* Formulario de Login */
        <form 
          className="w-full max-w-md bg-gray-900 rounded-2xl shadow-2xl p-8 animate-slideIn"
          onSubmit={loginUser}
        >
          <div className="text-center mb-8">
            <h3 className="text-4xl font-bold text-gray-200!">Bienvenido</h3>
            <p className="mt-3 text-gray-400">
              Ingresa a tu cuenta y disfruta de tus eventos favoritos
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input 
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-600 focus:border-gray-300 rounded-xl text-white! transition-all outline-none"
                type="email" 
                minLength="5" 
                maxLength="50" 
                placeholder="tu@email.com" 
                name="mail" 
                required 
              />
            </div>

            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input 
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-600 focus:border-gray-300 rounded-xl transition-all outline-none text-white!"
                type="password" 
                minLength="5" 
                maxLength="30" 
                placeholder="Tu contraseña" 
                name="contrasenia" 
                required 
              />
            </div>

            {showMsg && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-red-600 text-sm text-center">{showMsg}</p>
              </div>
            )}

            {message && (
              <p className="text-red-600 text-sm text-center">
                Las contraseñas no coinciden
              </p>
            )}

            <div className="text-center space-y-2">
              <div className="text-sm text-gray-600">
                <span>¿Olvidaste tu contraseña? </span>
                <button 
                  type="button"
                  className="text-orange-600 hover:text-red-600 font-semibold underline transition-colors"
                  onClick={() => setRecoverPass(true)}
                >
                  Haz click aquí
                </button>
              </div>
              <div className="text-sm text-gray-600">
                <span>¿No tienes cuenta? </span>
                <Link 
                  className="text-orange-600 hover:text-red-600 font-semibold underline transition-colors" 
                  to="/register"
                >
                  Regístrate aquí
                </Link>
              </div>
            </div>
          </div>

          <div className="flex justify-center my-6">
            <ReCAPTCHA
              sitekey={import.meta.env.VITE_RECAPTCHA_KEY}
              onChange={onSuccess}
            />
          </div>

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
                className="w-full h-14 bg-gradient-to-r from-amber-600 to-yellow-500 text-[#111827] hover:from-yellow-400 to-yellow-400  rounded-xl font-semibold transition-all transform hover:scale-[1.02] hover:shadow-xl"
                type="submit"
              >
                Ingresar
              </button>
            )}
          </div>
        </form>
      )}

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

export default Login