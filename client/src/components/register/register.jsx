import { registerUserRequest } from "../../api/userRequests"

const Register = () => {
 
    const registerUser = async () => {
        e.preventDefault()
        const userData = {
            nombreCompleto: e.target.elements.nombreCompleto.value,
            mail: e.target.elements.mail.value,
            celular: e.target.elements.celular.value,
            pais: e.target.elements.pais.value,
            contrasenia: e.target.elements.contrasenia.value,
            repetirContrasenia: e.target.elements.repetirContrasenia.value
        }

        const res = await registerUserRequest(userData)

        if(res.data === 1){
            console.log('bien registrado')
        }else{
            console.log(res.data.msj)
        }
    }

    return(
        <>
            <form onSubmit={() => registerUser()}>
                <div>
                    <label>Nombre completo</label>
                    <input type="text" placeholder="..." name="nombreCompleto"></input>
                </div>
                 <div>
                    <label>Correo electrónico</label>
                    <input type="mail" placeholder="..." name="mail"></input>
                </div>
                 <div>
                    <label>Teléfono</label>
                    <input type="number" placeholder="..." name="celular"></input>
                </div>
                 <div>
                    <label>Tu País</label>
                    <input type="text" placeholder="..." name="pais"></input>
                </div>
                 <div>
                    <label>Ingresa tu contraseña</label>
                    <input type="text" placeholder="..." name="contrasenia"></input>
                </div>
                 <div>
                    <label>Repite tu contraseña</label>
                    <input type="text" placeholder="..." name="repetirContrasenia"></input>
                </div>
                <div>
                    <button type="submit">Registrarme</button>
                </div>
            </form>
        </>
    )
}

export default Register