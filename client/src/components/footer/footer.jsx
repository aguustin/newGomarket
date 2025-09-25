import logoPruebaJpg from '../../assets/LogoPrueba.jpg'
import instagramPng from '../../assets/redes/instagram.png'
import twitterPng from '../../assets/redes/twitter.png'
import whatsappPng from '../../assets/redes/whatsapp.png'
import gmailPng from '../../assets/redes/gmail.png'
import { Link } from 'react-router'

const Footer = ({texto}) => {
    return(
        <footer className='pt-6 pb-6'>
            <div className='flex items-center justify-around w-[200px] text-center mx-auto mb-3'>
                <Link href="/"><img src={instagramPng} alt="" loading="lazy"></img></Link>
                <Link href="/"><img src={twitterPng} alt="" loading="lazy"></img></Link>
                <Link href="/"><img src={whatsappPng} alt="" loading="lazy"></img></Link>
                <Link href="/"><img src={gmailPng} alt="" loading="lazy"></img></Link>
            </div>
            <div className="relative bottom-0 w-screen pl-14 pr-14 text-center">
                <p className='text-sm primary-p'>Importante: Passline no se hace responsable de la calidad o satisfacción de los eventos publicados. Passline es un sistema que presta el servicio de venta de entradas online. Al usar este sitio usted acepta los términos y condiciones de la aplicación. Copyright © 2025 Passline.</p>
            <img className="w-[100px] mx-auto mt-6" src={logoPruebaJpg} alt="" loading="lazy"></img>
            </div>
        </footer>
    )
}

export default Footer