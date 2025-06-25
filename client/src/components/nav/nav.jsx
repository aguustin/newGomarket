import { useContext, useState } from "react"
import UserContext from "../../context/userContext"

const Nav = () => {

    const {session} = useContext(UserContext)
    const [openProfileConf, setOpenProfileCong] = useState(false)

    return(
        <nav className="nav w-full flex fixed items-center top-0 bg-slate-900 p-6">
           {/*openProfileConf &&*/ 
           <div className="w-[40vw] mx-auto flex justify-between">
                    <a className="text-lg" href="/Home">Inicio</a>
                    <a className="text-lg" href="/Create_event">Crea tu evento</a>
                    <a className="text-lg" href="/productions">Mis producciones</a>
                    <a className="text-lg" href="/profile">Mi perfil</a>
           </div> }
           {session?.userFinded?.length <= 0 ? 
           <button onClick={() => setOpenProfileCong(!openProfileConf)}>{session?.userFinded[0]?.nombreCompleto}</button> : <a href="/">Iniciar sesion</a>}
        </nav>
    )
}

export default Nav