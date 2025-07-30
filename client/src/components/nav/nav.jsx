import { useContext, useEffect, useState } from "react"
import UserContext from "../../context/userContext"
import logoPruebaJpg from '../../assets/LogoPrueba.jpg'
import logoutPng from "../../assets/botones/logout.png"
import menuPng from "../../assets/images/menu.png"
import { Link, useNavigate } from "react-router"

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
        setSession('')
        navigate("/")
    }

    return(
        <nav className="nav relative w-screen flex fixed items-center top-0 p-6 h-[80px]">
           { width >= 950 ? 
            <>
                <div className="absolute w-[760px] left-6 mx-auto flex justify-between items-center">
                        <img className="w-[100px]" src={logoPruebaJpg} alt=""></img>
                        <Link className="text-lg" to="/Home">Inicio</Link>
                        <Link className="text-lg" to="/Contact">Contacto</Link>
                        {session?.userFinded?.length > 0 ? <Link className="text-lg" to="/Create_event">Crear evento</Link> : <Link className="text-lg" to="/">Crear evento</Link>}
                        {session?.userFinded?.length > 0 ? <Link className="text-lg" to="/productions">Mis producciones</Link> : <Link className="text-lg" to="/">Mis producciones</Link>}
                        {session?.userFinded?.length > 0 && <Link className="text-lg" to="/profile">Mi perfil</Link>}
                </div>
                {session?.userFinded?.length > 0 ? 
                <button className="absolute right-9 cursor-pointer" onClick={() => setOpenProfileCong(!openProfileConf)}>{session?.userFinded[0]?.nombreCompleto}</button> : <Link to="/" className="absolute right-9">Iniciar sesion</Link>}
                {openProfileConf && <div className="settings absolute top-[80px] right-4 w-[200px]">
                        <div className="link-profile flex items-center h-[60px] cursor-pointer"><Link to="/profile"><p className="ml-4 text-lg">Mi perfil</p></Link></div>
                        <div className=" cursor-pointer"><button onClick={() => logoutFunc()} className="flex items-center h-[60px] text-lg cursor-pointer"><p className="ml-4">Salir</p><img className="ml-3" src={logoutPng} alt=""></img></button></div>
                </div>}
            </>
            :
            <>
                
                    <img className="w-[100px]" src={logoPruebaJpg} alt=""></img>
                    <button className="absolute right-8" onClick={() => setShowMobileNav(!showMobileNav)}><img className="w-[40px]" src={menuPng} alt=""></img></button>
                    {showMobileNav && 
                    <div className="nav-mobile-options absolute right-0 top-[80px] ">
                        <div className="text-center p-4 border-b-1">
                            <Link className="text-lg" to="/Home">Inicio</Link>
                        </div>
                        <div className="text-center p-4 border-b-1">
                            <Link className="text-lg" to="/Contact">Contacto</Link>
                        </div>
                        <div className="text-center p-4 border-b-1">
                            {session?.userFinded?.length > 0 ? <Link className="text-lg" to="/Create_event">Crear evento</Link> : <Link className="text-lg" to="/">Crear evento</Link>}
                        </div>
                        <div className="text-center p-4 border-b-1">
                            {session?.userFinded?.length > 0 ? <Link className="text-lg" to="/productions">Mis producciones</Link> : <Link className="text-lg" to="/">Mis producciones</Link>}
                        </div>
                        <div className="text-center p-4">
                            {session?.userFinded?.length > 0 && <Link className="text-lg" to="/profile">Mi perfil</Link>}
                        </div>
                    </div>}
                
            </>
            }
        </nav>
    )
}

export default Nav