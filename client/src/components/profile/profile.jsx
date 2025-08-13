import { Link } from "react-router"
import noprofilePng from "../../assets/para prueba/noprofile.png"
import instagram_profile_Png from "../../assets/redes/instagram_profile.png"
import facebook_profile_Png from "../../assets/redes/facebook_profile.png"
import tiktok_profile_Png from "../../assets/redes/tiktok_profile.png"
import whatsapp_profile_Png from "../../assets/redes/whatsapp_profile.png"
import { useContext, useEffect } from "react"
import UserContext from "../../context/userContext"

const Profile = () => {
    const {session} = useContext(UserContext)

    return(
        <>
        <div className="profile-container flex h-full justify-center p-9 mt-6">
            {session?.userFinded?.map((user) => 
            <div className="profile text-center bg-[#1e1530] p-9 rounded-xl">
                <img className="mx-auto w-[150px] rounded-lg" src={noprofilePng} alt="" loading="lazy"></img>
                    <p className="text-3xl mt-1">{user.nombreCompleto}</p>
                    <p className="text-lg mt-6">Perfil: Productora</p>
                    <p className="text-lg mt-4">País: {user.pais}</p>
                    <p className="text-lg mt-4">Cantidad de eventos realizados: 26</p>
                <div className="flex justify-center items-center mt-6">
                    <Link className="ml-3" to="/"><img src={instagram_profile_Png} alt="" loading="lazy"></img></Link>
                    <Link className="ml-3" to="/"><img src={facebook_profile_Png} alt="" loading="lazy"></img></Link>
                    <Link className="ml-3" to="/"><img src={tiktok_profile_Png} alt="" loading="lazy"></img></Link>
                </div>
                <Link to={`/https://wa.me/${user.celular}`} className="w-[250px] mx-auto mt-9 flex justify-center text-2xl pt-4 pb-4 bg-green-800 rounded-xl">Contacto<img className="ml-4" src={whatsapp_profile_Png} alt="" loading="lazy"></img></Link>
            </div>)}
        </div>
        </>
    )
}

export default Profile