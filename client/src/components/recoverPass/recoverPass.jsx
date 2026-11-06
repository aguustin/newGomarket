import { useState } from "react"
import { useParams } from 'react-router'
import { confirmNewPassRequest } from "../../api/userRequests"
import AuthLayout from "../../ui/AuthLayout"
import { Icon } from "../../ui/icons"
import { Alert, Button, Field, PasswordInput } from "../../ui/primitives"

//Crear contraseña nueva desde el link del email (rediseño). El link sirve una sola vez y vence a los 20 minutos.
const RecoverPass = () => {
    const { token } = useParams()
    const [estado, setEstado] = useState('form')  // form | ok | vencido
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const confirmNewPass = async (e) => {
        e.preventDefault()
        const nuevaContrasenia = e.target.elements.nuevaContrasenia.value
        if (nuevaContrasenia !== e.target.elements.repetirNuevaContrasenia.value) return setError('Las contraseñas no coinciden')
        setError('')
        setLoading(true)
        try {
            const res = await confirmNewPassRequest({ token, nuevaContrasenia })
            if (res.data?.code === 'LINK_VENCIDO') setEstado('vencido')
            else if (res.data === 1) setEstado('ok')  //axios devuelve la respuesta completa: el valor del backend esta en data
            else setError('No pudimos actualizar la contraseña. Intentá de nuevo')
        } catch {
            setError('No pudimos actualizar la contraseña. Revisá tu conexión e intentá de nuevo')
        } finally {
            setLoading(false)
        }
    }

    if (estado === 'ok') {
        return (
            <AuthLayout title="¡Listo!" subtitle={null}>
                <Alert tone="ok">Tu contraseña fue actualizada con exito! Ya podés ingresar con la nueva.</Alert>
                <Button to="/login" size="lg" block className="mt-6">Ir a ingresar</Button>
            </AuthLayout>
        )
    }
    if (estado === 'vencido') {
        return (
            <AuthLayout title="El enlace venció" subtitle={null}>
                <Alert tone="warn">El link venció o no es válido. Pedí uno nuevo desde "¿Olvidaste tu contraseña?".</Alert>
                <Button to="/login" size="lg" block className="mt-6" icon={Icon.ArrowLeft}>Volver a ingresar</Button>
            </AuthLayout>
        )
    }

    return (
        <AuthLayout title="Creá una contraseña nueva" subtitle="Elegí una contraseña que no uses en otros sitios.">
            <form onSubmit={confirmNewPass} className="space-y-4">
                <Field label="Nueva contraseña" hint="Mínimo 5 caracteres">{({ id }) => <PasswordInput id={id} name="nuevaContrasenia" autoComplete="new-password" minLength={5} maxLength={30} required autoFocus />}</Field>
                <Field label="Repetir contraseña">{({ id }) => <PasswordInput id={id} name="repetirNuevaContrasenia" autoComplete="new-password" minLength={5} maxLength={30} required />}</Field>
                {error && <Alert tone="danger">{error}</Alert>}
                <Button type="submit" size="lg" block loading={loading}>Guardar contraseña</Button>
            </form>
        </AuthLayout>
    )
}

export default RecoverPass
