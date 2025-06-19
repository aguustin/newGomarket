import logoPruebaJpg from '../../assets/LogoPrueba.jpg'
import instagramPng from '../../assets/redes/instagram.png'
import redesPng from '../../assets/redes/mail.png'

const Footer = () => {
    return(
        <footer className="relative bottom-0 mt-1 h-[200px] flex justify-between w-screen p-14">
            <img src={logoPruebaJpg} alt=""></img>
            <p className='text-xl mt-5'>Derechos reservados por @GoTicket</p>
            <div className='flex items-center justify-between w-[200px]'>
                <a href="/"><img src={instagramPng} alt=""></img></a>
                <a href="/"><img src={redesPng} alt=""></img></a>
            </div>
        </footer>
    )
}

export default Footer