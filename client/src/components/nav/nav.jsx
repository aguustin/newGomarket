import { useContext, useEffect, useState } from "react"
import UserContext from "../../context/userContext"
import userPng from "../../assets/botones/user.png"
import editProfilePng from "../../assets/botones/edit-profile.png"
import exitPng from "../../assets/botones/exit.png"
import menuPng from "../../assets/images/menu.png"
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

    return(
        <nav className="nav relative w-full flex fixed items-center top-0 p-6 h-[70px]">
           { width >= 950 ? 
            <>
                <img className="w-[100px]" src={goPng} alt="" loading="lazy"></img>
                <div className="absolute w-[560px] right-50 left-50 mx-auto flex justify-left items-center">
                        <Link className="session-b p-4 rounded-3xl text-md primary-p" to="/Home">Inicio</Link>
                        <Link className="session-b p-4 rounded-3xl text-md primary-p" to="/Contact">Contacto</Link>
                        <Link className="session-b p-4 rounded-3xl  text-md primary-p" to={session?.userFinded?.length > 0 ? "/Create_event" : "/" } onClick={closeMenu}>Crear evento</Link>
                        <Link className="session-b p-4 rounded-3xl text-md primary-p" to={session?.userFinded?.length > 0 ? "/productions" : "/"} onClick={closeMenu}>Mis producciones</Link>
                        {/*session?.userFinded?.length > 0 ? <Link className="text-lg" to="/profile" onClick={closeMenu}>Mi perfil</Link> : ''*/}
                </div>
                {session?.userFinded?.length > 0 ? 
                <button className="session-b-img flex items-center absolute right-5 cursor-pointer pl-2 pr-2 text-[#111827] rounded-2xl" onClick={() => setOpenProfileCong(!openProfileConf)}><img className="mr-2 w-16 h-16 rounded-full object-cover border-4 border-gray-300" src={session?.userFinded[0]?.imagenProductora ?? userImgPng} alt=""></img>{session?.userFinded[0]?.nombreCompleto}</button> : <Link to="/" className="absolute right-9 primary-p">Iniciar sesion</Link>}
                {openProfileConf && <div className="logout-b bg-[#f4f4f4] absolute top-[70px] right-0 w-[210px]">
                        {/*<div className="link-profile flex items-center h-[60px] cursor-pointer"><Link to="/profile"><p className="ml-4 text-lg">Mi perfil</p></Link></div> */}
                        <Link to={`/see_profile/${session?.userFinded?.[0]?._id}`} className="flex w-full items-center h-[60px] text-lg cursor-pointer text-[#111827] hover:bg-white! transition-all duration-300"><img className="ml-3" src={userPng} alt="" loading="lazy"></img><p className="ml-4">Ver mi perfil</p></Link>
                        <Link to="/user_info" className="flex w-full items-center h-[60px] text-lg cursor-pointer text-[#111827] hover:bg-white! transition-all duration-300"><img className="ml-3" src={editProfilePng} alt="" loading="lazy"></img><p className="ml-4">Editar perfil</p></Link>
                        <button onClick={() => logoutFunc()} className=" flex w-full items-center h-[60px] text-lg cursor-pointer text-[#111827] hover:bg-white! transition-all duration-300"><img className="ml-3" src={exitPng} alt="" loading="lazy"></img><p className="ml-4">Salir</p></button>
                </div>}
            </>
            :
            <>
                
                    <img className="w-[100px]" src={goPng} alt="" loading="lazy"></img>
                    <button className="menu-b absolute right-8" onClick={() => setShowMobileNav(!showMobileNav)}><img className="w-[40px]" src={menuPng} alt="" loading="lazy"></img></button>
                    {showMobileNav && 
                    <div className="nav-mobile-options w-full absolute right-0 top-[70px] ">
                        <div className="text-center p-4 pl-10 pr-10 border-t-2 border-b-2 border-gray-300 hover:bg-white! transition-all duration-300">
                            <Link className="text-lg primary-p" to="/Home" onClick={() => setShowMobileNav(!showMobileNav)}>Inicio</Link>
                        </div>
                        <div className="text-center p-4 pl-10 pr-10 border-b-2 border-gray-300 hover:bg-white! transition-all duration-300">
                            <Link className="text-lg primary-p" to="/Contact" onClick={() => setShowMobileNav(!showMobileNav)}>Contacto</Link>
                        </div>
                        <div className="text-center p-4 pl-10 pr-10 border-b-2 border-gray-300 hover:bg-white! transition-all duration-300">
                            <Link className="text-lg primary-p" to={session?.userFinded?.length > 0 ? "/Create_event" : "/"} onClick={() => setShowMobileNav(!showMobileNav)}>Crear evento</Link>
                        </div>
                        <div className="text-center p-4 pl-10 pr-10 border-b-2 border-gray-300 hover:bg-white! transition-all duration-300">
                            <Link className="text-lg primary-p" to={session?.userFinded?.length > 0 ? "/productions" : "/"} onClick={() => setShowMobileNav(!showMobileNav)}>Mis producciones</Link> 
                        </div>
                        {session?.userFinded?.length > 0 && <div className="text-center p-4 pl-10 pr-10 border-b-1 border-gray-300 hover:bg-white! transition-all duration-300">
                            <Link to={`/see_profile/${session?.userFinded?.[0]?._id}`} onClick={() => setShowMobileNav(!showMobileNav)} className="text-lg primary-p">Ver mi perfil</Link>
                        </div> }
                        {session?.userFinded?.length > 0  && <div className="text-center p-4 pl-10 pr-10 border-b-1 border-gray-300 hover:bg-white! transition-all duration-300">
                            <Link to="/user_info" onClick={() => setShowMobileNav(!showMobileNav)} className="text-lg primary-p">Editar perfil</Link>
                        </div> }
                        {session?.userFinded?.length > 0 && <div className="text-center p-4 pl-10 pr-10 border-b-1 hover:bg-white! transition-all duration-300">
                            <button onClick={() => logoutFunc()} className="text-lg primary-p"><p>Salir</p></button>
                        </div>}
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