import { useContext, useEffect, useState } from "react"
import UserContext from "../../context/userContext"
import logoPruebaJpg from '../../assets/LogoPrueba.jpg'
import logoutPng from "../../assets/botones/logout.png"
import menuPng from "../../assets/images/menu.png"
import { Link, useNavigate } from "react-router"
import goPng from "../../assets/goticketImgs/GOT SIN FONDO.png"

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

    return(
        <nav className="nav relative w-full flex fixed items-center top-0 p-6 h-[80px]">
           { width >= 950 ? 
            <>
                <img className="w-[100px]" src={goPng} alt="" loading="lazy"></img>
                <div className="absolute w-[560px] right-50 left-50 mx-auto flex justify-between items-center">
                        <Link className="text-lg primary-p" to="/Home">Inicio</Link>
                        <Link className="text-lg primary-p" to="/Contact">Contacto</Link>
                        {session?.userFinded?.length > 0 ? <Link className="text-lg primary-p" to="/Create_event" onClick={closeMenu}>Crear evento</Link> : <Link className="text-lg" to="/" onClick={closeMenu}>Crear evento</Link>}
                        {session?.userFinded?.length > 0 ? <Link className="text-lg primary-p" to="/productions" onClick={closeMenu}>Mis producciones</Link> : <Link className="text-lg" to="/" onClick={closeMenu}>Mis producciones</Link>}
                        {/*session?.userFinded?.length > 0 ? <Link className="text-lg" to="/profile" onClick={closeMenu}>Mi perfil</Link> : ''*/}
                </div>
                {session?.userFinded?.length > 0 ? 
                <button className="session-b absolute right-9 cursor-pointer p-4 text-[#111827] rounded-3xl" onClick={() => setOpenProfileCong(!openProfileConf)}>{session?.userFinded[0]?.nombreCompleto}</button> : <Link to="/" className="absolute right-9 primary-p">Iniciar sesion</Link>}
                {openProfileConf && <div className="logout-b bg-white absolute top-[80px] right-0 w-[200px]">
                        {/*<div className="link-profile flex items-center h-[60px] cursor-pointer"><Link to="/profile"><p className="ml-4 text-lg">Mi perfil</p></Link></div> */}
                        <button onClick={() => logoutFunc()} className=" border-b-[1px] border-gray-300! flex w-full items-center h-[60px] text-lg cursor-pointer text-[#111827]"><img className="ml-3" src={logoutPng} alt="" loading="lazy"></img><p className="ml-4">Favoritos</p></button>
                       <button onClick={() => logoutFunc()} className=" flex w-full items-center h-[60px] text-lg cursor-pointer text-[#111827]"><img className="ml-3" src={logoutPng} alt="" loading="lazy"></img><p className="ml-4">Salir</p></button>
                </div>}
            </>
            :
            <>
                
                    <img className="w-[100px]" src={goPng} alt="" loading="lazy"></img>
                    <button className="menu-b absolute right-8" onClick={() => setShowMobileNav(!showMobileNav)}><img className="w-[40px]" src={menuPng} alt="" loading="lazy"></img></button>
                    {showMobileNav && 
                    <div className="nav-mobile-options w-full absolute right-0 top-[80px] ">
                        <div className="text-center p-4 pl-10 pr-10 border-t-2 border-b-2 border-gray-300">
                            <Link className="text-lg primary-p" to="/Home" onClick={() => setShowMobileNav(!showMobileNav)}>Inicio</Link>
                        </div>
                        <div className="text-center p-4 pl-10 pr-10 border-b-2 border-gray-300">
                            <Link className="text-lg primary-p" to="/Contact" onClick={() => setShowMobileNav(!showMobileNav)}>Contacto</Link>
                        </div>
                        <div className="text-center p-4 pl-10 pr-10 border-b-2 border-gray-300">
                            {session?.userFinded?.length > 0 ? <Link className="text-lg primary-p" to="/Create_event" onClick={() => setShowMobileNav(!showMobileNav)}>Crear evento</Link> : <Link className="text-lg" to="/">Crear evento</Link>}
                        </div>
                        <div className="text-center p-4 pl-10 pr-10 border-b-1">
                            {session?.userFinded?.length > 0 ? <Link className="text-lg primary-p" to="/productions" onClick={() => setShowMobileNav(!showMobileNav)}>Mis producciones</Link> : <Link className="text-lg" to="/">Mis producciones</Link>}
                        </div>
                        {/*<div className="text-center p-4">
                            {session?.userFinded?.length > 0 && <Link className="text-lg pl-10 pr-10" to="/profile">Mi perfil</Link>}
                        </div> */ }
                    </div>}
                
            </>
            }
        </nav>
    )
}

export default Nav