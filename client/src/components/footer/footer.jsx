import instagramPng from '../../assets/redes/instagram.png'
import twitterPng from '../../assets/redes/twitter.png'
import whatsappPng from '../../assets/redes/whatsapp.png'
import gmailPng from '../../assets/redes/gmail.png'
import { Link } from 'react-router'
import goPng from "../../assets/goticketImgs/GOT SIN FONDO.png"

const Footer = () => {
 return (
  <footer className="w-screen! bg-gradient-to-br from-gray-100 to-gray-300 text-white mt-20">
    {/* Main Footer Content */}
    <div className="footer-container mx-auto px-6 py-12">
      {/* Social Media Section */}
     

      {/* Links Grid */}
      <div className="grid sm:grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-8 mb-3">
        {/* GO TICKET Column */}
        <div className='footer-columns mx-auto w-full'>
          <h4 className="text-lg text-gray-900 font-bold mb-4 flex items-center mx-auto!">
            <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full mr-3"></div>
            GO TICKET
          </h4>
          <div className="space-y-3">
            <Link 
              to="/" 
              className="block text-gray-900 hover:text-white hover:translate-x-2 transition-all duration-300 text-sm"
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Sobre Go Ticket
              </div>
            </Link>
            <Link 
              to="/" 
              className="block text-gray-900 hover:text-white hover:translate-x-2 transition-all duration-300 text-sm"
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Preguntas frecuentes
              </div>
            </Link>
          </div>
        </div>

        {/* TU EVENTO Column */}
        <div className='footer-columns mx-auto'>
          <h4 className="text-lg text-gray-900 font-bold mb-4 flex items-center">
            <div className="w-1 h-6 bg-gradient-to-b from-pink-500 to-orange-500 rounded-full mr-3"></div>
            TU EVENTO
          </h4>
          <div className="space-y-3">
            <Link 
              to="/" 
              className="block text-gray-900 hover:text-white hover:translate-x-2 transition-all duration-300 text-sm"
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                ¿Eres productor?
              </div>
            </Link>
            <Link 
              to="/" 
              className="block text-gray-900 hover:text-white hover:translate-x-2 transition-all duration-300 text-sm"
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Crear evento
              </div>
            </Link>
          </div>
        </div>

        {/* LEGAL Column */}
        <div className='footer-columns mx-auto'>
          <h4 className="text-lg text-gray-900 font-bold mb-4 flex items-center">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full mr-3"></div>
            LEGAL
          </h4>
          <div className="space-y-3">
            <Link 
              to="/conditions" 
              className="block text-gray-900 hover:text-white hover:translate-x-2 transition-all duration-300 text-sm"
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Términos y condiciones
              </div>
            </Link>
            <Link 
              to="/" 
              className="block text-gray-900 hover:text-white hover:translate-x-2 transition-all duration-300 text-sm"
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Política de privacidad
              </div>
            </Link>
          </div>
        </div>

        {/* CONTACTO Column */}
        <div className='footer-columns mx-auto'>
          <h4 className="text-lg text-gray-900 font-bold mb-4 flex items-center">
            <div className="w-1 h-6 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full mr-3"></div>
            CONTACTO
          </h4>
          <div className="space-y-3">
            <div className="flex items-start text-sm text-gray-900">
              <svg className="w-5 h-5 mr-2 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>222-222-222</span>
            </div>
            <div className="flex items-start text-sm text-gray-900">
              <svg className="w-5 h-5 mr-2 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>goticketarg@gmail.com</span>
            </div>
            <div className="flex items-start text-sm text-gray-900">
              <svg className="w-5 h-5 mr-2 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Lun-Dom 8:00hs - 00:00hs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      
      <div className="border-t border-white/10  mb-2">
        <div className='flex items-center justify-around w-[200px] text-center mx-auto mb-3'>
                <Link href="/"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="2" y="2" width="20" height="20" rx="5"></rect>
  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
</svg>
</Link>
                <Link href="/"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#111827">
  <path d="M18.244 2H21l-6.482 7.41L22 22h-6.813l-4.45-5.833L5.56 22H3l7.063-8.074L2 2h6.873l4.03 5.348L18.244 2zm-2.42 18h1.963L8.24 4h-2.01l9.594 16z"/>
</svg>
</Link>
                <Link href="/"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#111827">
  <path d="M12.04 2C6.58 2 2.1 6.26 2.1 11.59c0 2.04.64 3.93 1.73 5.52L2 22l4.96-1.57c1.52.83 3.25 1.3 5.08 1.3 5.46 0 9.94-4.26 9.94-9.59C22 6.26 17.5 2 12.04 2zm0 17.3c-1.57 0-3.02-.45-4.23-1.23l-.3-.19-2.94.93.96-2.8-.2-.29a7.4 7.4 0 0 1-1.28-4.1c0-4.07 3.38-7.37 7.55-7.37 4.16 0 7.55 3.3 7.55 7.37 0 4.06-3.39 7.37-7.55 7.37zm4.11-5.52c-.22-.12-1.3-.64-1.5-.71-.2-.07-.35-.11-.5.11-.15.22-.57.71-.7.85-.13.15-.26.16-.48.04-.22-.11-.93-.34-1.78-1.09-.66-.59-1.1-1.31-1.23-1.53-.13-.22-.01-.34.1-.45.1-.1.22-.26.34-.39.11-.13.15-.22.22-.37.07-.15.04-.28-.02-.4-.07-.11-.5-1.2-.68-1.64-.18-.44-.36-.38-.5-.38h-.43c-.15 0-.4.05-.61.28-.22.22-.8.78-.8 1.9 0 1.11.82 2.18.94 2.33.11.15 1.61 2.55 3.98 3.47.56.21.99.33 1.33.42.56.18 1.06.15 1.46.09.45-.07 1.3-.53 1.49-1.03.19-.49.19-.9.13-.99-.05-.09-.2-.15-.41-.26z"/>
</svg>
</Link>
                <Link href="/"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#111827">
  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
</svg>
</Link>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 sm:py-0">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-yellow-400 flex-shrink-0 mr-3 mt-0.5 sm:mt-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-center text-gray-900 leading-relaxed sm:mt-3">
              <span className="font-semibold text-gray-900">Importante:</span> Go Ticket no se hace responsable de la calidad o satisfacción de los eventos publicados. Go Ticket es un sistema que presta el servicio de venta de entradas online. Al usar este sitio usted acepta los{' '}
              <Link to="/conditions" className="text-purple-400 hover:text-purple-300 underline font-medium transition-colors">
                términos y condiciones
              </Link>{' '}
              de la aplicación.
            </p>
          </div>
        </div>
      </div>

      {/* Logo and Copyright */}
      <div className="text-center border-t border-white/10">
        <div className=" flex flex-col items-center space-y-4">
          <img 
            className="w-32 h-auto opacity-90 hover:opacity-100 transition-opacity" 
            src={goPng} 
            alt="Go Ticket Logo" 
            loading="lazy"
          />
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            
            <span>Copyright © 2025 Go Ticket. Todos los derechos reservados.</span>
          </div>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Argentina
            </span>
            <span>•</span>
            <span>Hecho por el equipo de Go Market</span>
          </div>
        </div>
      </div>
    </div>

    {/* Bottom gradient bar */}
    <div className="h-1 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600"></div>
  </footer>
);
}

export default Footer