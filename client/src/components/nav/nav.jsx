import { useContext, useEffect, useState } from "react"
import UserContext from "../../context/userContext"
import userPng from "../../assets/botones/user.png"
import editProfilePng from "../../assets/botones/edit-profile.png"
import exitPng from "../../assets/botones/exit.png"
import menuPng from "../../assets/images/menu.png"
import colaborationPng from "../../assets/botones/colaboration.png"
import { Link, useNavigate } from "react-router"
import goPng from "../../assets/goticketImgs/GOT SIN FONDO.png"
import userImgPng from "../../assets/user.png"

const Nav = () => {

    const {session, setSession} = useContext(UserContext)
    const [openProfileConf, setOpenProfileCong] = useState(false)
    const [width, setWidth] = useState(null)
    const [showMobileNav, setShowMobileNav] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        const mediaQuery = window.matchMedia("(min-width: 950px)");
        const handleResize = () => {
           setWidth(mediaQuery.matches ? 950 : 949);
       };
       
       handleResize(); // valor inicial
       mediaQuery.addEventListener("change", handleResize);
       return () => mediaQuery.removeEventListener("change", handleResize);
    }, [session]);
        
    if (width === null) return null;

    const logoutFunc = () => {
        localStorage.clear()
        setOpenProfileCong(false)
        setSession('')
        navigate("/")
    }

    const closeMenu = () => setShowMobileNav(false)

    return (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      {width >= 950 ? (
        <>
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 hover:opacity-80 transition-opacity">
            <img className="w-24 h-auto" src={goPng} alt="Logo" loading="lazy" />
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="flex items-center space-x-2">
            <Link 
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 transition-all duration-300" 
              to="/"
            >
              Inicio
            </Link>
            <Link 
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 transition-all duration-300" 
              to="/Contact"
            >
              Contacto
            </Link>
            <Link 
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 transition-all duration-300" 
              to={session?.userFinded?.length > 0 ? "/Create_event" : "/login"}
              onClick={closeMenu}
            >
              Crear evento
            </Link>
            {session?.userFinded?.length > 0 && (
              <Link 
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 transition-all duration-300" 
                to="/productions"
                onClick={closeMenu}
              >
                Producciones
              </Link>
            )}
          </div>

          {/* User Profile or Login */}
          <div className="flex-shrink-0 relative">
            {session?.userFinded?.length > 0 ? (
              <>
                <button 
                  className="flex items-center space-x-3 px-4 py-2 rounded-2xl hover:bg-gray-100 transition-all duration-300 group"
                  onClick={() => setOpenProfileCong(!openProfileConf)}
                >
                  <img 
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-300 group-hover:ring-purple-500 transition-all" 
                    src={session?.userFinded[0]?.imagenProductora ?? userImgPng} 
                    alt="Profile"
                  />
                  <span className="text-sm font-semibold text-gray-800 hidden xl:block">
                    {session?.userFinded[0]?.nombreCompleto}
                  </span>
                  <svg 
                    className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${openProfileConf ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {openProfileConf && (
                  <div className="absolute right-0 top-[70px] w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3">
                      <p className="text-white font-semibold text-sm truncate">
                        {session?.userFinded[0]?.nombreCompleto}
                      </p>
                      <p className="text-purple-100 text-xs truncate">
                        {session?.userFinded[0]?.mail}
                      </p>
                    </div>

                    <div className="py-2">
                      <Link 
                        to={`/see_profile/${session?.userFinded?.[0]?._id}`}
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 group"
                      >
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-purple-200 transition-colors">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium">Ver mi perfil</span>
                      </Link>

                      <Link 
                        to="/user_info"
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 group"
                      >
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium">Editar perfil</span>
                      </Link>

                      <Link 
                        to={`/get_my_rrpp_events/${session?.userFinded?.[0]?.mail}`}
                        onClick={() => setShowMobileNav(!showMobileNav)}
                        className="flex items-center px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 group"
                      >
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-orange-200 transition-colors">
                          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium">Colaboraciones</span>
                      </Link>

                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <button 
                          onClick={() => logoutFunc()}
                          className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-all duration-300 group"
                        >
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-red-200 transition-colors">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium">Cerrar sesión</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Link 
                to="/login" 
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-300 active:scale-95"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Mobile Layout */}
          <Link to="/" className="flex-shrink-0">
            <img className="w-20 h-auto" src={goPng} alt="Logo" loading="lazy" />
          </Link>

          {/* Mobile Menu Button */}
          <button 
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            onClick={() => setShowMobileNav(!showMobileNav)}
          >
            <svg 
              className="w-7 h-7 text-gray-700" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {showMobileNav ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Mobile Menu */}
          {showMobileNav && (
            <div className="absolute left-0 right-0 top-20 bg-white border-b border-gray-200 shadow-xl animate-slide-down">
              <div className="max-h-[calc(100vh-5rem)] overflow-y-auto">
                {/* User Info Header (if logged in) */}
                {session?.userFinded?.length > 0 && (
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center space-x-3">
                    <img 
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white" 
                      src={session?.userFinded[0]?.imagenProductora ?? userImgPng} 
                      alt="Profile"
                    />
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {session?.userFinded[0]?.nombreCompleto}
                      </p>
                      <p className="text-purple-100 text-xs">
                        {session?.userFinded[0]?.mail}
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation Items */}
                <div className="py-2">
                  <Link 
                    to="/" 
                    onClick={() => setShowMobileNav(!showMobileNav)}
                    className="flex items-center px-6 py-4 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 border-b border-gray-100"
                  >
                    <svg className="w-5 h-5 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="font-medium">Inicio</span>
                  </Link>

                  <Link 
                    to="/Contact" 
                    onClick={() => setShowMobileNav(!showMobileNav)}
                    className="flex items-center px-6 py-4 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 border-b border-gray-100"
                  >
                    <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">Contacto</span>
                  </Link>

                  <Link 
                    to={session?.userFinded?.length > 0 ? "/Create_event" : "/login"} 
                    onClick={() => setShowMobileNav(!showMobileNav)}
                    className="flex items-center px-6 py-4 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 border-b border-gray-100"
                  >
                    <svg className="w-5 h-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="font-medium">Crear evento</span>
                  </Link>

                  {session?.userFinded?.length > 0 && (
                    <>
                      <Link 
                        to="/productions" 
                        onClick={() => setShowMobileNav(!showMobileNav)}
                        className="flex items-center px-6 py-4 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 border-b border-gray-100"
                      >
                        <svg className="w-5 h-5 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span className="font-medium">Producciones</span>
                      </Link>

                      <Link 
                        to={`/get_my_rrpp_events/${session?.userFinded?.[0]?.mail}`} 
                        onClick={() => setShowMobileNav(!showMobileNav)}
                        className="flex items-center px-6 py-4 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 border-b border-gray-100"
                      >
                        <svg className="w-5 h-5 mr-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="font-medium">Colaboraciones</span>
                      </Link>

                      <Link 
                        to={`/see_profile/${session?.userFinded?.[0]?._id}`} 
                        onClick={() => setShowMobileNav(!showMobileNav)}
                        className="flex items-center px-6 py-4 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 border-b border-gray-100"
                      >
                        <svg className="w-5 h-5 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium">Ver mi perfil</span>
                      </Link>

                      <Link 
                        to="/user_info" 
                        onClick={() => setShowMobileNav(!showMobileNav)}
                        className="flex items-center px-6 py-4 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 border-b border-gray-100"
                      >
                        <svg className="w-5 h-5 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="font-medium">Editar perfil</span>
                      </Link>

                      <button 
                        onClick={() => logoutFunc()}
                        className="flex items-center w-full px-6 py-4 text-red-600 hover:bg-red-50 transition-all duration-300"
                      >
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="font-medium">Cerrar sesión</span>
                      </button>
                    </>
                  )}

                  {/* Login button for non-logged users */}
                  {!session?.userFinded?.length && (
                    <div className="px-6 py-4">
                      <Link 
                        to="/login"
                        onClick={() => setShowMobileNav(!showMobileNav)}
                        className="flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold shadow-md transition-all duration-300"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Iniciar sesión
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  </nav>
);
}

export default Nav