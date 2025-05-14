import { useContext, useState } from "react"
import UserContext from "../../context/userContext"

const Nav = () => {

    const {session} = useContext(UserContext)
    const [openProfileConf, setOpenProfileCong] = useState(false)

    return(
        <nav className="nav w-full fixed items-center top-0 bg-slate-900  p-6">
           {session?.userFinded?.length > 0 ? <button onClick={() => setOpenProfileCong(!openProfileConf)}>{session?.userFinded[0]?.nombreCompleto}</button> : <a href="/">Iniciar sesion</a>}
           {openProfileConf && <div>
                <li>
                    <a href="/profile">Mis perfil</a>
                </li>
           </div> }
        </nav>
    )
}

export default Nav