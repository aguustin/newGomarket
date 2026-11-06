import { useContext, useEffect, useRef, useState } from "react"
import { Link, useNavigate } from 'react-router'
import UserContext from "../../context/userContext"
import { recoverPassRequest } from "../../api/userRequests"
import AuthLayout from "../../ui/AuthLayout"
import { Icon } from "../../ui/icons"
import { Alert, Button, Field, Input, PasswordInput } from "../../ui/primitives"
import Captcha, { CAPTCHA_ENABLED } from "../../ui/Captcha"

//Mensaje de entrada segun la URL (llega desde http.js, la verificacion del mail, etc.)
const avisoInicial = () => {
    const q = new URLSearchParams(window.location.search)
    if (q.get('sesion') === 'vencida') return { tone: 'warn', text: 'Tu sesión venció. Ingresá de nuevo' }
    if (q.get('sesion') === 'requerida') return { tone: 'info', text: 'Iniciá sesión para continuar' }
    if (q.get('verificacion') === 'ok') return { tone: 'ok', text: 'Cuenta verificada. Ya podés ingresar' }
    if (q.get('verificacion') === 'vencida') return { tone: 'warn', text: 'El link de verificación venció o no es válido. Registrate de nuevo para recibir otro' }
    return null
}

const Login = () => {
    const { setSession, loginContext } = useContext(UserContext)
    const [aviso, setAviso] = useState(avisoInicial)
    const [recoverPass, setRecoverPass] = useState(false)
    const [captchaToken, setCaptchaToken] = useState(null)
    const captchaRef = useRef(null)
    const reiniciarCaptcha = () => { captchaRef.current?.reset(); setCaptchaToken(null) }
    const [loading, setLoading] = useState(false)
    const [mailRecupero, setMailRecupero] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        setSession('')
        localStorage.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    //?next=/ruta: volver a donde estaba (por ejemplo, el QR que el organizador escaneo en la puerta).
    //Solo rutas internas: nunca otro sitio
    const destinoDespuesDelLogin = () => {
        const next = new URLSearchParams(window.location.search).get('next')
        return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/login') ? next : '/'
    }

    const loginUser = async (e) => {
        e.preventDefault()
        if (CAPTCHA_ENABLED && !captchaToken) {
            setAviso({ tone: 'warn', text: 'Marcá la casilla "No soy un robot" para continuar' })
            return
        }
        setLoading(true)
        setAviso(null)
        try {
            const res = await loginContext({
                mail: e.target.elements.mail.value.trim(),
                contrasenia: e.target.elements.contrasenia.value,
                captcha: captchaToken
            })
            if (res.data?.estado === 1) {
                navigate(destinoDespuesDelLogin())
                return
            }
            if (CAPTCHA_ENABLED) reiniciarCaptcha()
            if (res.estado === 4) setAviso({ tone: 'warn', text: res.msj })
            if (res.estado === 2) setAviso({ tone: 'danger', text: 'La contraseña es incorrecta' })
            if (res.estado === 3) setAviso({ tone: 'danger', text: 'El email es incorrecto' })
        } catch {
            if (CAPTCHA_ENABLED) reiniciarCaptcha()
            setAviso({ tone: 'danger', text: 'No pudimos conectarnos. Revisá tu conexión e intentá de nuevo' })
        } finally {
            setLoading(false)
        }
    }

    const recoverPassFunc = async (e) => {
        e.preventDefault()
        setLoading(true)
        setAviso(null)
        const mail = e.target.elements.mail.value.trim()
        try {
            const res = await recoverPassRequest({ mail })
            if (res.data.ok) {
                setMailRecupero(mail)
            } else {
                setAviso({ tone: 'danger', text: 'No pudimos enviar el correo. Intentá de nuevo más tarde' })
            }
        } catch {
            setAviso({ tone: 'danger', text: 'No pudimos enviar el correo. Intentá de nuevo más tarde' })
        } finally {
            setLoading(false)
        }
    }

    const irA = (modoRecupero) => { setRecoverPass(modoRecupero); setAviso(null); setMailRecupero('') }

    if (recoverPass) {
        return (
            <AuthLayout
                title={mailRecupero ? 'Revisá tu email' : 'Recuperar contraseña'}
                subtitle={mailRecupero ? null : 'Ingresá el email de tu cuenta y te enviamos un enlace para crear una contraseña nueva.'}
                footer={<button type="button" onClick={() => irA(false)} className="inline-flex items-center gap-1.5 font-medium text-fg hover:text-brand-300"><Icon.ArrowLeft className="size-4" />Volver a ingresar</button>}>
                {mailRecupero ? (
                    <Alert tone="ok">
                        Se envió un correo electronico a <strong className="font-semibold">{mailRecupero}</strong> con el enlace para recuperar tu contraseña. Si no lo ves, revisá la carpeta de spam. El enlace vence en 20 minutos.
                    </Alert>
                ) : (
                    <form onSubmit={recoverPassFunc} className="space-y-5">
                        <Field label="Email">{({ id }) => <Input id={id} icon={Icon.Mail} type="email" name="mail" autoComplete="email" placeholder="tu@email.com" minLength={5} maxLength={50} required autoFocus />}</Field>
                        {aviso && <Alert tone={aviso.tone}>{aviso.text}</Alert>}
                        <Button type="submit" size="lg" block loading={loading}>Enviar enlace</Button>
                    </form>
                )}
            </AuthLayout>
        )
    }

    return (
        <AuthLayout title="Ingresá a tu cuenta" subtitle="Comprá entradas, guardá favoritos y gestioná tus eventos."
            footer={<>¿No tenés cuenta? <Link to="/register" className="font-semibold text-brand-300 hover:text-brand-200">Creá una gratis</Link></>}>
            <form onSubmit={loginUser} className="space-y-5">
                {aviso && <Alert tone={aviso.tone}>{aviso.text}</Alert>}
                <Field label="Email">{({ id }) => <Input id={id} icon={Icon.Mail} type="email" name="mail" autoComplete="email" placeholder="tu@email.com" minLength={5} maxLength={50} required />}</Field>
                <div>
                    <div className="mb-1.5 flex items-center justify-between">
                        <label htmlFor="login-pass" className="text-[13px] font-medium text-muted">Contraseña</label>
                        <button type="button" onClick={() => irA(true)} className="text-[13px] font-medium text-brand-300 hover:text-brand-200">¿Olvidaste tu contraseña?</button>
                    </div>
                    <PasswordInput id="login-pass" name="contrasenia" autoComplete="current-password" placeholder="Tu contraseña" minLength={5} maxLength={30} required />
                </div>
                <Captcha captchaRef={captchaRef} onChange={setCaptchaToken} onExpired={() => setCaptchaToken(null)} />
                <Button type="submit" size="lg" block loading={loading}>Ingresar</Button>
            </form>
        </AuthLayout>
    )
}

export default Login
