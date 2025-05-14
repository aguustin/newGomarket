import { useContext, useState } from "react"
import UserContext from "../../context/userContext"
import {useNavigate} from 'react-router'
import { Message } from "../../globalscomp/globalscomp"

const Login = () => {
    const {session, message, setMessage, loginContext} = useContext(UserContext)
    const [showMsg, setShowMsg] = useState(false)

    let timeout = null
    let navigate = useNavigate()

    const loginUser = async (e) => {
        e.preventDefault()

        const userData = {
            mail: e.target.elements.mail.value,
            contrasenia: e.target.elements.contrasenia.value
        }   
        const res = await loginContext(userData)
        console.log('eseaes', res.data.estado)
        if(res.data.estado === 1){
            navigate('/home')
        }else{
             setShowMsg(true)
             setMessage('Las credenciales son incorrectas')
             timeout = setTimeout(() => setShowMsg(false) , 3000);
        }
            
    }

    console.log(showMsg)


    return(
           <>
            {showMsg && <Message text={message}/>}
            <form onSubmit={(e) => loginUser(e)}>
                 <div>
                    <label>Correo electrónico</label>
                    <input type="mail" placeholder="..." name="mail"></input>
                </div>
                 <div>
                    <label>Ingresa tu contraseña</label>
                    <input type="password" placeholder="..." name="contrasenia"></input>
                </div>
            
                <div>
                    <button type="submit">Ingresar</button>
                </div>
            </form>
        </>
    )
}

export default Login