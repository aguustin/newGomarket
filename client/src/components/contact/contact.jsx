import { useState } from "react"
import { contactarRequest } from "../../api/userRequests"
import { useNavigate } from "react-router"
import goOriginalPng from '../../assets/goticketImgs/GO ORIGINAL SIN FONDO.png'

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
     
        if(res.data.state === 1){
            setLoading(false)
            setShowMsg(true)
            setTimeout(() => navigate('/home'), 3000)
        }
    }

    return(
        <>
        <div className="pt-1 pb-1">
            <img className="h-[70px] mx-auto mt-9 " src={goOriginalPng} alt=""></img>
            <form className="bg-gray-800 h-full mt-4 mb-9 mx-auto w-[450px] rounded-lg" onSubmit={(e) => contactarFunc(e)}>
                <div className="text-center p-4">
                    <h2 className="text-3xl text-gray-200!">Comunicate con nosotros</h2>
                </div>
                <p className="text-md text-center text-gray-400!">Llena el formulario y nos pondremos en contacto contigo</p>
                <div className="p-3">
                    <input className="p-3 mx-auto mt-3 w-full border-[1px] border-gray-600 text-gray-200!" minLength="5" maxLength="30" placeholder="País" name="pais" type="text"required/>
                    <input className="p-3 mx-auto mt-3 w-full border-[1px] border-gray-600 text-gray-200!" minLength="5" maxLength="30" placeholder="Nombre completo" name="nombreCompleto" type="text"required/>
                    <input className="p-3 mx-auto mt-3 w-full border-[1px] border-gray-600 text-gray-200!" minLength="5" maxLength="50" placeholder="Correo electronico" name="correo" type="mail"required/>
                    <input className="p-3 mx-auto mt-3 w-full border-[1px] border-gray-600 text-gray-200!" minLength="5" maxLength="20" placeholder="Teléfono" name="celular" type="number" required/>
                    <input className="p-3 mx-auto mt-3 w-full border-[1px] border-gray-600 text-gray-200!" minLength="5" maxLength="30" placeholder="Nombre del evento (opcional)" name="nombreEvento" type="text" required/>
                    <textarea className="contact-textarea mt-3 w-full p-3 border-[1px] border-gray-600" rows={10} placeholder="Mensaje" name="mensaje" required/>
                    {showMsg ? <p className="text-lg text-center text-yellow-500!">Tu mensaje fue enviado con exito!</p> : <button className="w-full mt-3 bg-gradient-to-r from-amber-500 to-yellow-500 h-[40px] rounded-lg text-[#111827]!" type="submit">Enviar</button>}
                </div>
            </form>
        </div>
        </>
    )
}

export default Contact