import { useContext, useEffect, useState } from "react"
import UserContext from "../../context/userContext"
import {useNavigate} from 'react-router'
import { Message } from "../../globalscomp/globalscomp"

const Login = () => {
    const {session, setSession, message, setMessage, loginContext} = useContext(UserContext)
    const [showMsg, setShowMsg] = useState(false)

    useEffect(() => {
        setSession('')
        localStorage.clear()
    }, [])
   // let timeout = null
    let navigate = useNavigate()

    const loginUser = async (e) => {
        e.preventDefault()

        const userData = {
            mail: e.target.elements.mail.value,
            contrasenia: e.target.elements.contrasenia.value
        }   
        const res = await loginContext(userData)
        //console.log('eseaes', res.data.estado)
        if(res.data.estado === 1){
            navigate('/home')
        }else{
             setShowMsg(true)
             /*setMessage('Las credenciales son incorrectas')
             timeout = setTimeout(() => setShowMsg(false) , 3000);*/
        }
            
    }
    console.log(showMsg)

    return(
        <>
            {showMsg && <Message text={message}/>}
            <form className="register-form h-full mt-42 mb-38 mx-auto w-[450px] p-6 rounded-lg" onSubmit={(e) => loginUser(e)}>
                    <div className="text-center p-4">
                        <h3 className="text-5xl">Ingresar</h3>
                        <p className="mt-3">Ingresa tu cuenta de Goticket y disfruta de tus eventos favoritos</p>
                    </div>
                    <input className="p-3 mt-3 w-full" type="mail" minLength="5" maxLength="30" placeholder="Ingresa tu email" name="mail" required></input>
                    <input className="p-3 mt-3 w-full" type="password" minLength="5" maxLength="30" placeholder="Tu contraseña" name="contrasenia" required></input>
                    <div className="flex items-center justify-center mt-6">
                        <div className="text-center">
                            {message ? <p className="text-red-600! mb-3">Las contraseñas no coinciden</p> : ''}
                            <div className="flex items-center"> <p>O registrate haciendo click aqui: </p><a className="text-blue-400! ml-2 underline!" href="/register"> Registrarse</a></div>
                        </div>
                    </div>
                <div className="text-center">
                    <button className="bg-violet-900 p-4 rounded-lg mt-6 cursor-pointer" type="submit">Ingresar</button>
                </div>
            </form>
        </>
    )
}

export default Login