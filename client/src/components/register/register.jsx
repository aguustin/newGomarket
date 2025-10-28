import { useState } from "react"
import { registerUserRequest } from "../../api/userRequests"
import {Link, useNavigate} from 'react-router';
import ReCAPTCHA from "react-google-recaptcha";
import { LoadingButton } from "../../globalscomp/globalscomp";
import goOriginalPng from '../../assets/goticketImgs/GO ORIGINAL SIN FONDO.png'

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
            
        }
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
                        setShowMsgB('Verifica tu correo electronico confirmar tu registro!')
                        navigate('/login')
                    }, 3000)
                }else{
                    setLoading(false)
                    setShowMsg(res.data.msj)
                }
            }
            //hasta aca llega el if
            setLoading(false)
    }

    return(
        <>
        <div className="form-background pt-1 pb-1">
             <img className="h-[70px] mx-auto mt-2" src={goOriginalPng} alt=""></img>
            <form className="register-form mt-6 mb-10 mx-auto w-[450px] p-6 rounded-lg" onSubmit={(e) => registerUser(e)}>
                <div className="text-center p-4">
                    <h3 className="text-4xl font-bold">Registrate</h3>
                    <p className="mt-3 secondary-p">Registra tu cuenta de Goticket y disfruta de tus eventos favoritos</p>
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
                        {showMsg?.length > 0 && <p className="text-red-600! mb-3 text-center text-xl!">{showMsg}</p>}
                        {showMsgB?.length > 0 && <p className="text-green-600! mb-3 text-center text-xl!">{showMsgB}</p>}
                        <div className="flex justify-center mt-4 mb-5">
                            {
                            <ReCAPTCHA
                                sitekey={import.meta.env.VITE_RECAPTCHA_KEY}
                                onChange={onSuccess}
                            />
                            } 
                        </div>
                        
                        <div className="flex items-center max-[650px]:block"><p>O ingresa haciendo click aqui: </p><Link className="text-blue-400! ml-2 underline!" to="/login">Ingresar</Link></div>
                    </div>
                </div>
                    {loading ? <button className="primary-button w-full h-[56px] p-4 rounded-lg mt-6 cursor-pointer"><LoadingButton/></button> : <button className="primary-button w-full p-4 rounded-lg mt-6 cursor-pointer" type="submit">Registrarme</button>}
                </div>
            </form>
            </div>
        </>
    )
}

export default Register