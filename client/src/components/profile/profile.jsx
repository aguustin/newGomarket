import { useContext } from "react"
import { Navigate } from "react-router"
import UserContext from "../../context/userContext"

///profile era una pantalla vieja con datos de ejemplo ("26 eventos", redes que llevaban a "/").
//Ahora lleva al perfil real del usuario.
const Profile = () => {
    const { session } = useContext(UserContext)
    const id = session?.userFinded?.[0]?._id
    return <Navigate to={id ? `/see_profile/${id}` : '/'} replace />
}

export default Profile
