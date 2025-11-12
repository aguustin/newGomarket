import instagramPng from '../../assets/redes/instagram.png'
import twitterPng from '../../assets/redes/twitter.png'
import whatsappPng from '../../assets/redes/whatsapp.png'
import gmailPng from '../../assets/redes/gmail.png'
import { Link } from 'react-router'
import goPng from "../../assets/goticketImgs/GOT SIN FONDO.png"

const Footer = () => {
    return(
        <footer className='pt-6 '>
            <div className='flex items-center justify-around w-[200px] text-center mx-auto mb-3'>
                <Link href="/"><img src={instagramPng} alt="" loading="lazy"></img></Link>
                <Link href="/"><img src={twitterPng} alt="" loading="lazy"></img></Link>
                <Link href="/"><img src={whatsappPng} alt="" loading="lazy"></img></Link>
                <Link href="/"><img src={gmailPng} alt="" loading="lazy"></img></Link>
            </div>
            <div className="relative bottom-0 w-screen pl-14 pr-14 text-center">
                <p className='text-sm primary-p'>Importante: Go Ticket no se hace responsable de la calidad o satisfacción de los eventos publicados. Go Ticket es un sistema que presta el servicio de venta de entradas online. Al usar este sitio usted acepta los términos y condiciones de la aplicación. Copyright © 2025 Go Ticket. <Link className='text-blue-500! underline!' to={"/conditions"}>Terminos y condiciones.</Link></p>
                <div>
                    <table className='text-[#111827] mx-auto mt-6 mb-6 items-start'>
                        <thead>
                            <tr className='text-left'>
                                <th scope="col" className='px-6 '>GO TICKET</th>
                                <th scope="col" className='px-6'>TU EVENTO</th>
                                <th scope="col" className='px-6'>LEGAL</th>
                                <th scope="col" className='px-6'>CONTACTO</th>
                            </tr>
                        </thead>
                        <tbody className='text-left'>
                            <tr className='align-top'>
                                <td scope='row' className='px-6' >
                                    <Link to={'/'} className='mt-3'><p>Sobre Go Ticket</p></Link>
                                    <Link to={'/'} className='mt-3'><p>Preguntas frecuentes</p></Link>
                                </td>
                                 <td scope='row' className='px-6'>
                                    <Link to={'/'} className='mt-3'><p>¿Eres productor?</p></Link>
                                    <Link to={'/'} className='mt-3'><p>Crear evento</p></Link>
                                </td>
                                <td scope='row' className='px-6'>
                                    <Link to={'/'} className='mt-3'><p>Terminos y condiciones</p></Link>
                                </td>
                                <td scope='row' className='px-6'>
                                    <Link to={'/'} className='mt-3'><p>Atencion al cliente: 222-222-222</p></Link>
                                    <Link to={'/'} className='mt-3'><p>Consultas: goticketarg@gmail.com</p></Link>
                                    <Link to={'/'} className='mt-3'><p>Horario de atencion: Lunes a Domingo de 8:00hs a 00:00hs</p></Link>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <img className="w-[100px] mx-auto mt-1" src={goPng} alt="" loading="lazy"></img>
            </div>
        </footer>
    )
}

export default Footer