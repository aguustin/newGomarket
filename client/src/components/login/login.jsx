import { useContext, useEffect, useState } from "react"
import UserContext from "../../context/userContext"
import {Link, useNavigate} from 'react-router'
import { LoadingButton } from "../../globalscomp/globalscomp"
import { recoverPassRequest } from "../../api/userRequests"
import ReCAPTCHA from "react-google-recaptcha";
import goOriginalPng from '../../assets/goticketImgs/GO ORIGINAL SIN FONDO.png'

const Login = () => {
    const { setSession, message, loginContext} = useContext(UserContext)
    const [showMsg, setShowMsg] = useState(false)
    const [recoverPass, setRecoverPass] = useState(false)
    const [captchaStatus, setCaptchaStatus] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setSession('')
        localStorage.clear()
    }, [])

    const onSuccess = () => {
        setCaptchaStatus(true)
    }
   // let timeout = null
    let navigate = useNavigate()

    const loginUser = async (e) => {
        e.preventDefault()
        setLoading(true)

        const userData = {
            mail: e.target.elements.mail.value,
            contrasenia: e.target.elements.contrasenia.value
        }   
        const res = await loginContext(userData)
        
        if(res.data.estado === 1){
            navigate('/home')
        }else{
            setLoading(false)
            setShowMsg(true)
        }
        if(captchaStatus){ 
        }
    }
    
    const recoverPassFunc = async (e) => {
        e.preventDefault()
        const mail = e.target.elements.mail.value
        await recoverPassRequest({mail})
    }

    return(
        <>
        <div className="form-background pt-6 pb-29">
            <img className="h-[70px] mx-auto mb-5" src={goOriginalPng} alt=""></img>
            {recoverPass ?
             <form className="register-form mt-35 mb-35 mx-auto w-[450px] p-6 rounded-lg" onSubmit={(e) => recoverPassFunc(e)}>
                    <div className="text-center p-4">
                        <h3 className="text-3xl">Recuperar contraseña</h3>
                        <p className="mt-3 secondary-p">Ingresa tu email y te enviaremos un correo para que recuperes tu contraseña</p>
                    </div>
                    <input className="p-3 mt-3 w-full" type="mail" minLength="5" maxLength="30" placeholder="Ingresa tu email" name="mail" required></input>
                    <div className="flex items-center justify-center mt-6">
                        <div className="text-center">
                            {message ? <p className="text-red-600! mb-3">Las contraseñas no coinciden</p> : ''}
                            <div className="flex mt-2 items-center"> <p>O registrate haciendo click aqui: </p><Link className="text-blue-400! ml-2 underline!" to="/register"> Registrarse</Link></div>
                        </div>
                    </div>
                <div className="text-center">
                    <button className="bg-violet-900 p-4 rounded-lg mt-6 cursor-pointer" type="submit">Recuperar contraseña</button>
                </div>
                <div className="text-center mt-6">
                    <button onClick={() => setRecoverPass(false)}>Volver</button>
                </div>
            </form>
                       
             :
             
             <form className="register-form mx-auto max-w-[450px] p-6 rounded-lg" onSubmit={(e) => loginUser(e)}>
                    <div className="text-center p-4">
                        <h3 className="text-4xl font-bold">Ingresar</h3>
                        <p className="mt-3 secondary-p">Ingresa tu cuenta de Goticket y disfruta de tus eventos favoritos</p>
                    </div>
                    <input className="p-3 mt-3 w-full" type="mail" minLength="5" maxLength="30" placeholder="Ingresa tu email" name="mail" required></input>
                    <input className="p-3 mt-3 w-full" type="password" minLength="5" maxLength="30" placeholder="Tu contraseña" name="contrasenia" required></input>
                    <div className="flex items-center justify-center mt-6">
                        <div className="text-center">
                            {message ? <p className="text-red-600! mb-3">Las contraseñas no coinciden</p> : ''}
                            <div className="flex flex-wrap justify-center"><p>¿Has olvidado tu contraseña?</p><button className="secondary-p ml-2 underline!" onClick={() => setRecoverPass(true)}>Haz click aqui!</button></div>
                            <div className="flex flex-wrap justify-center mt-5 items-center"> <p>O registrate haciendo click aqui: </p><Link className="secondary-p ml-2 underline!" to="/register"> Registrarse</Link></div>
                        </div>
                    </div>
                    <div className="flex justify-center mt-5">
                     {
                      <ReCAPTCHA
                        sitekey={import.meta.env.VITE_RECAPTCHA_KEY}
                        onChange={onSuccess}
                      />
                      } 
                    </div>
                <div className="text-center">
                   {loading ? <button className="primary-button w-full h-[56px] p-4 rounded-lg mt-6 cursor-pointer"><LoadingButton/></button> : <button className="login-b w-full h-[56px] primary-button p-4 rounded-lg mt-6 cursor-pointer" type="submit">Ingresar</button>}
                </div>
            </form>  
            }
            </div>
        </>
    )
}

export default Login