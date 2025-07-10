import { contactarRequest } from "../../api/userRequests"

const Contact = () => {

    const contactarFunc = async (e) => {
        e.preventDefault()
        const mailData = {
            pais: e.target.elements.pais.value,
            nombreCompleto: e.target.elements.nombreCompleto.value,
            correo: e.target.elements.correo.value,
            celular: e.target.elements.celular.value,
            nombreEvento: e.target.elements.nombreEvento.value,
            mensaje: e.target.elements.mensaje.value,
        }
        const res = await contactarRequest(mailData)
    }

    return(
        <>
            <form className="register-form h-full mt-9 mb-9 mx-auto w-[450px] p-6 rounded-lg" onSubmit={(e) => contactarFunc(e)}>
                <div className="text-center p-4">
                    <h2 className="text-4xl">Comunicate con nosotros</h2>
                </div>
                <p className="text-2xl text-center">Llena el formulario y nos pondremos en contacto contigo</p>
                <input className="p-3 mt-3 w-full" minLength="5" maxLength="30" placeholder="País" name="pais" type="text"/>
                <input className="p-3 mt-3 w-full" minLength="5" maxLength="30" placeholder="Nombre completo" name="nombreCompleto" type="text"/>
                <input className="p-3 mt-3 w-full" minLength="5" maxLength="50" placeholder="Correo electronico" name="correo" type="mail"/>
                <input className="p-3 mt-3 w-full" minLength="5" maxLength="20" placeholder="Teléfono" name="celular" type="number" />
                <input className="p-3 mt-3 w-full" minLength="5" maxLength="30" placeholder="Nombre del evento (opcional)" name="nombreEvento" type="text" />
                <textarea className="contact-textarea mt-3 w-full" rows={10} placeholder="Mensaje" name="mensaje" />
                <button className="w-full mt-3 bg-violet-900 h-[40px] rounded-lg" type="submit">Enviar</button>
            </form>
        </>
    )
}

export default Contact