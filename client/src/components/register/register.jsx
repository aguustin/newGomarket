import { useState } from "react"
import { registerUserRequest } from "../../api/userRequests"
import {Link, useNavigate} from 'react-router';
import ReCAPTCHA from "react-google-recaptcha";

const Register = () => {
    const navigate = useNavigate() 
    const [showMsg, setShowMsg] = useState(false)
    const [captchaStatus, setCaptchaStatus] = useState(false)

     const onSuccess = () => {
        setCaptchaStatus(true)
    }

    const registerUser = async (e) => {
        e.preventDefault()
        if(captchaStatus){
            if(e.target.elements.contrasenia.value !== e.target.elements.repetirContrasenia.value){
                setShowMsg(true)
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
                        navigate('/')
                    }, 3000)
                }else{
                    console.log(res.data.msj)
                }
            }
        }
    }

    return(
        <>
            <form className="register-form mt-22 mb-22 mx-auto w-[450px] p-6 rounded-lg" onSubmit={(e) => registerUser(e)}>
                <div className="text-center p-4">
                    <h3 className="text-5xl">Registrate</h3>
                    <p className="mt-3">Registra tu cuenta de Goticket y disfruta de tus eventos favoritos</p>
                </div>
                    <input className="p-3 mt-3 w-full" minLength="5" maxLength="30" type="text" placeholder="Nombre completo" name="nombreCompleto" required></input>
                    <input className="p-3 mt-3 w-full" minLength="5" maxLength="30" type="mail" placeholder="Tu email" name="mail" required></input>
                    <input className="p-3 mt-3 w-full" minLength="5" maxLength="30" type="number" placeholder="DNI" name="dni" required></input>
                    <input className="p-3 mt-3 w-full" minLength="5" maxLength="30" type="text" placeholder="Tu pais" name="pais" required></input>
                    <input className="p-3 mt-3 w-full" minLength="5" maxLength="30" type="password" placeholder="Ingresa una contraseña" name="contrasenia" required></input>
                    <input className="p-3 mt-3 w-full" minLength="5" maxLength="30" type="password" placeholder="Repite la contraseña" name="repetirContrasenia" required></input>
                <div className="text-center">
                <div className="flex items-center justify-center mt-6">
                    <div>
                        {showMsg ? <p className="text-red-600! mb-3">Las contraseñas no coinciden</p> : ''}
                        <div className="flex justify-center mt-4 mb-5">
                            {
                            <ReCAPTCHA
                                sitekey={import.meta.env.VITE_RECAPTCHA_KEY}
                                onChange={onSuccess}
                            />
                            } 
                        </div>
                        <div className="flex items-center"><p>O ingresa haciendo click aqui: </p><Link className="text-blue-400! ml-2 underline!" to="/">Ingresar</Link></div>
                    </div>
                </div>
                    <button className="bg-violet-900 p-4 rounded-lg mt-6 cursor-pointer" type="submit">Registrarme</button>
                </div>
            </form>
        </>
    )
}

export default Register