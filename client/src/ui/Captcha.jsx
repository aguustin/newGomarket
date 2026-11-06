import ReCAPTCHA from "react-google-recaptcha"

// reCAPTCHA activable por entorno: VITE_RECAPTCHA_ENABLED=false lo apaga (por ejemplo, en local
// mientras la clave no es válida). Sin la variable, sigue activo como siempre.
// El token de la casilla lo verifica el servidor (RECAPTCHA_SECRET) y sirve una sola vez: se reinicia tras cada intento.
export const CAPTCHA_ENABLED = import.meta.env.VITE_RECAPTCHA_ENABLED !== "false"

const Captcha = ({ captchaRef, onChange, onExpired }) => CAPTCHA_ENABLED && (
    <div className="flex justify-center overflow-hidden rounded-xl">
        <ReCAPTCHA ref={captchaRef} sitekey={import.meta.env.VITE_RECAPTCHA_KEY} theme="dark" onChange={onChange} onExpired={onExpired} />
    </div>
)

export default Captcha
