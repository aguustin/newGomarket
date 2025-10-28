import { useState } from "react";
import { confirmNewPassRequest } from "../../api/userRequests";
import { Message } from "../../globalscomp/globalscomp"
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

const RecoverPass = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams();
    const { token } = useParams();
    const [message, setMessage] = useState(false)
    const [error, setError] = useState(false)

    const confirmNewPass = async (e) => {
        e.preventDefault()
        const nuevaContrasenia = e.target.elements.nuevaContrasenia.value
        const repetirNuevaContrasenia = e.target.elements.repetirNuevaContrasenia.value

        if(nuevaContrasenia === repetirNuevaContrasenia){
            console.log(token, ' ', nuevaContrasenia)
            setError(false)
            const res = await confirmNewPassRequest({token, nuevaContrasenia})
            if(res === 1){
                setMessage(true)
                setTimeout(() => {
                    navigate('/')
                },3000)
            }
        }else{
            setError(true)
        }

    }

    return(
           <>
                   
                   <form className="register-form h-full mt-42 mb-38 mx-auto w-[450px] p-6 rounded-lg" onSubmit={(e) => confirmNewPass(e)}>
                    {message ?
                    <>
                        <div className="text-center p-4">
                            <h3 className="text-3xl">Escribe tu nueva contraseña</h3>
                        </div>
                        <div>
                           <p className="text-2xl text-violet-400!">Tu contraseña fue actualizada con exito!</p>
                        </div>
                        <div className="text-center">
                           <Link className="bg-violet-900 p-4 rounded-lg mt-6 cursor-pointer" to='/'>Volver a ingresar</Link>
                        </div>
                    </>  
                    : 
                    <>
                        <div className="text-center p-4">
                            <h3 className="text-3xl">Escribe tu nueva contraseña</h3>
                        </div>
                           <input className="p-3 mt-3 w-full" type="password" minLength="5" maxLength="30" placeholder="Nueva contraseña" name="nuevaContrasenia" required></input>
                           <input className="p-3 mt-3 w-full" type="password" minLength="5" maxLength="30" placeholder="Repetir contraseña" name="repetirNuevaContrasenia" required></input>
                        <div className="text-center">
                            {error && <p className="mt-3 text-red-600! text-xl">Las contraseñas no coinciden!</p>}
                           <button className="bg-violet-900 p-4 rounded-lg mt-6 cursor-pointer" type="submit">Recuperar contraseña</button>
                        </div>
                    </>  
                    }
                   </form>
               </>
    )
}

export default RecoverPass