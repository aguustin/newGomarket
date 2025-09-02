import { useState } from "react"
import { contactarRequest } from "../../api/userRequests"
import { useNavigate } from "react-router"

const Contact = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [showMsg, setShowMsg] = useState(false)

    const contactarFunc = async (e) => {
        e.preventDefault()
        setLoading(true)
        const mailData = {
            pais: e.target.elements.pais.value,
            nombreCompleto: e.target.elements.nombreCompleto.value,
            correo: e.target.elements.correo.value,
            celular: e.target.elements.celular.value,
            nombreEvento: e.target.elements.nombreEvento.value,
            mensaje: e.target.elements.mensaje.value,
        }
        const res = await contactarRequest(mailData)
        console.log(res)
        if(res.data.state === 1){
            setLoading(false)
            setShowMsg(true)
            setTimeout(() => navigate('/home'), 3000)
        }
    }

    return(
        <>
            <form className="register-form h-full mt-9 mb-9 mx-auto w-[450px] p-6 rounded-lg" onSubmit={(e) => contactarFunc(e)}>
                <div className="text-center p-4">
                    <h2 className="text-4xl">Comunicate con nosotros</h2>
                </div>
                <p className="text-2xl text-center secondary-p">Llena el formulario y nos pondremos en contacto contigo</p>
                <input className="p-3 mt-3 w-full" minLength="5" maxLength="30" placeholder="País" name="pais" type="text"required/>
                <input className="p-3 mt-3 w-full" minLength="5" maxLength="30" placeholder="Nombre completo" name="nombreCompleto" type="text"required/>
                <input className="p-3 mt-3 w-full" minLength="5" maxLength="50" placeholder="Correo electronico" name="correo" type="mail"required/>
                <input className="p-3 mt-3 w-full" minLength="5" maxLength="20" placeholder="Teléfono" name="celular" type="number" required/>
                <input className="p-3 mt-3 w-full" minLength="5" maxLength="30" placeholder="Nombre del evento (opcional)" name="nombreEvento" type="text" required/>
                <textarea className="contact-textarea mt-3 w-full p-3" rows={10} placeholder="Mensaje" name="mensaje" required/>
                {showMsg ? <p className="text-lg text-center">Tu mensaje fue enviado con exito!</p> : <button className="w-full mt-3 primary-button h-[40px] rounded-lg" type="submit">Enviar</button>}
            </form>
        </>
    )
}

export default Contact