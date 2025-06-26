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
            <form className="register-form mt-22 mb-6 mx-auto w-[450px] p-6 rounded-lg" onSubmit={() => registerUser()}>
                <div className="text-center p-4">
                    <h3 className="text-5xl">Registrate</h3>
                    <p className="mt-3">Registra tu cuenta de Goticket y disfruta de tus eventos favoritos</p>
                </div>
                    <input className="p-3 mt-3 w-full" type="text" placeholder="Nombre completo" name="nombreCompleto"></input>
                    <input className="p-3 mt-3 w-full" type="mail" placeholder="Tu email" name="mail"></input>
                    <input className="p-3 mt-3 w-full" type="number" placeholder="Celular" name="celular"></input>
                    <input className="p-3 mt-3 w-full" type="text" placeholder="Tu pais" name="pais"></input>
                    <input className="p-3 mt-3 w-full" type="text" placeholder="Ingresa una contraseña" name="contrasenia"></input>
                    <input className="p-3 mt-3 w-full" type="text" placeholder="Repite la contraseña" name="repetirContrasenia"></input>
                <div className="text-center">
                <div className="flex items-center justify-center mt-6">
                        <p>O ingresa haciendo click aqui: </p><a className="text-blue-400! ml-2 underline!" href="/">Ingresar</a>
                </div>
                    <button className="bg-violet-900 p-4 rounded-lg mt-6 cursor-pointer" type="submit">Registrarme</button>
                </div>
            </form>
        </>
    )
}

export default Register