import logoPruebaJpg from '../../assets/LogoPrueba.jpg'
import instagramPng from '../../assets/redes/instagram.png'
import gmailPng from '../../assets/redes/gmail.png'

const Footer = () => {
    return(
        <footer className="relative bottom-0 h-[150px] flex justify-between items-center w-screen p-14">
            <img className='w-[100px]' src={logoPruebaJpg} alt="" loading="lazy"></img>
            <p className='text-xl'>Derechos reservados por @GoTicket</p>
            <div className='flex items-center w-[100px]'>
                <a href="/"><img src={instagramPng} alt="" loading="lazy"></img></a>
                <a href="/"><img className='gmail-img mt-2 ml-10' src={gmailPng} alt="" loading="lazy"></img></a>
            </div>
        </footer>
    )
}

export default Footer