import { useContext, useState } from "react"
import UserContext from "../../context/userContext"
import logoPruebaJpg from '../../assets/LogoPrueba.jpg'
import logoutPng from "../../assets/botones/logout.png"
import { Link, useNavigate } from "react-router"

const Nav = () => {

    const {session, setSession} = useContext(UserContext)
    const [openProfileConf, setOpenProfileCong] = useState(false)
    const navigate = useNavigate()

    const logoutFunc = () => {
        localStorage.clear()
        setSession('')
        navigate("/")
    }

    return(
        <nav className="nav relative w-screen flex fixed items-center top-0 p-6 h-[80px]">
           <div className="absolute w-[760px] left-6 mx-auto flex justify-between items-center">
                <img className="w-[100px]" src={logoPruebaJpg} alt=""></img>
                <Link className="text-lg" to="/Home">Inicio</Link>
                <Link className="text-lg" to="/Contact">Contacto</Link>
                {session?.userFinded?.length > 0 ? <a className="text-lg" href="/Create_event">Crear evento</a> : <a className="text-lg" href="/">Crear evento</a>}
                {session?.userFinded?.length > 0 ? <a className="text-lg" href="/productions">Mis producciones</a> : <a className="text-lg" href="/">Mis producciones</a>}
                {session?.userFinded?.length > 0 && <a className="text-lg" href="/profile">Mi perfil</a>}
           </div>
           {session?.userFinded?.length > 0 ? 
           <button className="absolute right-9 cursor-pointer" onClick={() => setOpenProfileCong(!openProfileConf)}>{session?.userFinded[0]?.nombreCompleto}</button> : <Link to="/" className="absolute right-9" href="/">Iniciar sesion</Link>}
           {openProfileConf && <div className="settings absolute top-[80px] right-4 w-[200px]">
                <div className="link-profile flex items-center h-[60px] cursor-pointer"><Link to="/profile"><p className="ml-4 text-lg">Mi perfil</p></Link></div>
                <div className=" cursor-pointer"><button onClick={() => logoutFunc()} className="flex items-center h-[60px] text-lg cursor-pointer"><p className="ml-4">Salir</p><img className="ml-3" src={logoutPng} alt=""></img></button></div>
           </div>}
        </nav>
    )
}

export default Nav