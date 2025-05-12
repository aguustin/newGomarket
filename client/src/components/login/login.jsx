const Login = () => {

    const loginUser = () => {
        const userData = {
            mail: e.target.elements.mail.value,
            contrasenia: e.target.elements.contrasenia.value
        }

        
    }


    return(
           <>
            <form onSubmit={() => loginUser()}>
                 <div>
                    <label>Correo electrónico</label>
                    <input type="mail" placeholder="..." name="mail"></input>
                </div>
                 <div>
                    <label>Ingresa tu contraseña</label>
                    <input type="text" placeholder="..." name="contrasenia"></input>
                </div>
            
                <div>
                    <button type="submit">Ingresar</button>
                </div>
            </form>
        </>
    )
}

export default Login