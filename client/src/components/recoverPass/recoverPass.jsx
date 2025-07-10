import { Message } from "../../globalscomp/globalscomp"

const RecoverPass = () => {
    return(
           <>
                   {/*showMsg && <Message text={message}/>*/}
                   <form className="register-form h-full mt-42 mb-38 mx-auto w-[450px] p-6 rounded-lg" onSubmit={(e) => loginUser(e)}>
                           <div className="text-center p-4">
                               <h3 className="text-3xl">Escribe tu nueva contraseña</h3>
                           </div>
                           <input className="p-3 mt-3 w-full" type="password" minLength="5" maxLength="30" placeholder="Nueva contraseña" name="nuevaContrasenia" required></input>
                           <input className="p-3 mt-3 w-full" type="password" minLength="5" maxLength="30" placeholder="Repetir contraseña" name="repetirNuevaContrasenia" required></input>
                       <div className="text-center">
                           <button className="bg-violet-900 p-4 rounded-lg mt-6 cursor-pointer" type="submit">Recuperar contraseña</button>
                       </div>
                   </form>
               </>
    )
}

export default RecoverPass