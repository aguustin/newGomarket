import { Link } from 'react-router'
import logoSvg from '../assets/goticketImgs/IPSg.svg'
import { Icon } from './icons'

//Estructura de las pantallas de cuenta (ingresar, registrarse, recuperar contraseña).
//Escritorio: panel de marca a la izquierda + formulario. Celular: solo el formulario.
const BENEFICIOS = [
  { icon: Icon.QrCode, titulo: 'Tus entradas al instante', texto: 'Recibís el QR por email apenas se aprueba el pago.' },
  { icon: Icon.Shield, titulo: 'Pago seguro', texto: 'Cobramos con Mercado Pago. Nunca vemos los datos de tu tarjeta.' },
  { icon: Icon.Sparkles, titulo: 'Creá y vendé tus eventos', texto: 'Entradas, descuentos, RRPP y estadísticas en un solo lugar.' }
]

const AuthLayout = ({ title, subtitle, children, footer }) => (
  <main className="-mt-16 grid min-h-screen flex-1 lg:grid-cols-[1.05fr_1fr]">{/* sin barra superior: ocupa el espacio que el body reserva para ella */}
    {/* Panel de marca */}
    <aside className="relative hidden overflow-hidden border-r border-line lg:flex lg:flex-col lg:justify-between lg:p-12">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_10%,rgb(118_99_247/0.28),transparent_60%),radial-gradient(60%_50%_at_90%_90%,rgb(118_99_247/0.14),transparent_60%)]" />
      <div aria-hidden="true" className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      <Link to="/" className="relative" aria-label="Ipass, inicio">
        <img src={logoSvg} alt="Ipass" className="h-8 w-[76px] object-contain object-left" />
      </Link>
      <div className="relative max-w-md">
        <h2 className="text-4xl font-bold leading-[1.15] tracking-tight text-fg">Las mejores noches empiezan con una entrada.</h2>
        <ul className="mt-10 space-y-6">
          {BENEFICIOS.map(({ icon: Ico, titulo, texto }) => (
            <li key={titulo} className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-brand-400/25 bg-brand-500/12 text-brand-300"><Ico /></span>
              <div>
                <p className="font-semibold text-fg">{titulo}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="relative text-xs text-subtle">© {new Date().getFullYear()} Ipass · Argentina</p>
    </aside>

    {/* Formulario */}
    <section className="flex flex-col px-5 py-8 sm:px-8 lg:justify-center lg:py-12">
      <Link to="/" className="mb-10 inline-flex items-center gap-2 self-start text-sm text-muted transition-colors hover:text-fg lg:hidden">
        <img src={logoSvg} alt="Ipass" className="h-7 w-[66px] object-contain object-left" />
      </Link>
      <div className="mx-auto w-full max-w-[400px] animate-fade-up">
        <h1 className="text-[1.75rem] font-bold tracking-tight text-fg">{title}</h1>
        {subtitle && <p className="mt-2 text-[15px] leading-relaxed text-muted">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-8 border-t border-line pt-6 text-center text-sm text-muted">{footer}</div>}
      </div>
    </section>
  </main>
)

export default AuthLayout
