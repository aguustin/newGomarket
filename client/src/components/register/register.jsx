import { useRef, useState } from "react"
import { Link } from 'react-router'
import { registerUserRequest } from "../../api/userRequests"
import AuthLayout from "../../ui/AuthLayout"
import Captcha, { CAPTCHA_ENABLED } from "../../ui/Captcha"
import { Icon } from "../../ui/icons"
import { Alert, Button, Field, Input, PasswordInput } from "../../ui/primitives"

//Registro (rediseño). Al registrarse se manda un mail de verificacion: la cuenta se crea al abrir el link.
const Register = () => {
    const [error, setError] = useState('')
    const [mailEnviado, setMailEnviado] = useState('')
    const [captchaToken, setCaptchaToken] = useState(null)
    const captchaRef = useRef(null)
    const [loading, setLoading] = useState(false)

    const registerUser = async (e) => {
        e.preventDefault()
        setError('')
        const f = e.target.elements
        if (CAPTCHA_ENABLED && !captchaToken) return setError('Marcá la casilla "No soy un robot" para continuar')
        if (f.contrasenia.value !== f.repetirContrasenia.value) return setError('Las contraseñas no coinciden')

        setLoading(true)
        try {
            const mail = f.mail.value.trim()
            const res = await registerUserRequest({
                nombreCompleto: f.nombreCompleto.value.trim(),
                mail,
                dni: f.dni.value.trim(),
                pais: f.pais.value.trim(),
                contrasenia: f.contrasenia.value,
                repetirContrasenia: f.repetirContrasenia.value,
                captcha: captchaToken
            })
            if (res.data.msj === 1) setMailEnviado(mail)
            else setError(res.data.msj)
        } catch {
            setError('No pudimos crear tu cuenta. Revisá tu conexión e intentá de nuevo')
        } finally {
            if (CAPTCHA_ENABLED) { captchaRef.current?.reset(); setCaptchaToken(null) }  //el token ya se uso
            setLoading(false)
        }
    }

    if (mailEnviado) {
        return (
            <AuthLayout title="Revisá tu email" subtitle={null}>
                <div className="flex size-14 items-center justify-center rounded-2xl border border-brand-400/25 bg-brand-500/12 text-brand-300"><Icon.Mail className="size-6" /></div>
                <p className="mt-5 text-[15px] leading-relaxed text-muted">
                    Te enviamos un enlace a <strong className="font-semibold text-fg">{mailEnviado}</strong> para confirmar tu cuenta. Abrilo desde tu email y después ingresá.
                </p>
                <p className="mt-3 text-sm text-subtle">¿No llegó? Revisá la carpeta de spam. El enlace vence en 24 horas.</p>
                <div className="mt-8 flex flex-col gap-3">
                    <Button to="/login" size="lg" block>Ir a ingresar</Button>
                    <Button variant="ghost" block onClick={() => setMailEnviado('')}>Usar otro email</Button>
                </div>
            </AuthLayout>
        )
    }

    return (
        <AuthLayout title="Creá tu cuenta" subtitle="Es gratis. Con tu cuenta podés guardar eventos y publicar los tuyos."
            footer={<>¿Ya tenés cuenta? <Link to="/login" className="font-semibold text-brand-300 hover:text-brand-200">Ingresá</Link></>}>
            <form onSubmit={registerUser} className="space-y-4">
                <Field label="Nombre completo">{({ id }) => <Input id={id} icon={Icon.User} name="nombreCompleto" autoComplete="name" placeholder="Nombre y apellido" minLength={5} maxLength={50} required />}</Field>
                <Field label="Email">{({ id }) => <Input id={id} icon={Icon.Mail} type="email" name="mail" autoComplete="email" placeholder="tu@email.com" minLength={5} maxLength={50} required />}</Field>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="DNI">{({ id }) => <Input id={id} name="dni" inputMode="numeric" placeholder="Sin puntos" minLength={5} maxLength={15} required />}</Field>
                    <Field label="País">{({ id }) => <Input id={id} name="pais" autoComplete="country-name" defaultValue="Argentina" minLength={3} maxLength={30} required />}</Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Contraseña" hint="Mínimo 6 caracteres">{({ id }) => <PasswordInput id={id} name="contrasenia" autoComplete="new-password" minLength={6} maxLength={30} required />}</Field>
                    <Field label="Repetir contraseña">{({ id }) => <PasswordInput id={id} name="repetirContrasenia" autoComplete="new-password" minLength={6} maxLength={30} required />}</Field>
                </div>
                <Captcha captchaRef={captchaRef} onChange={setCaptchaToken} onExpired={() => setCaptchaToken(null)} />
                {error && <Alert tone="danger">{error}</Alert>}
                <Button type="submit" size="lg" block loading={loading}>Registrarme</Button>
                <p className="text-center text-xs leading-relaxed text-subtle">
                    Al registrarte aceptás los <Link to="/conditions" className="text-muted underline underline-offset-2 hover:text-fg">términos y condiciones</Link>.
                </p>
            </form>
        </AuthLayout>
    )
}

export default Register
