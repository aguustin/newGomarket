import { Link } from 'react-router'
import logoSvg from '../../assets/goticketImgs/IPSg.svg'

//Pie de pagina (rediseño): marca, accesos por tipo de usuario y aviso legal.
//Antes tenia telefono/mail/redes de ejemplo que llevaban a "/": se reemplazan por el formulario de contacto.
const COLUMNAS = [
  { titulo: 'Explorar', links: [{ to: '/', label: 'Eventos' }, { to: '/my_favorites_events', label: 'Mis favoritos' }] },
  { titulo: 'Productores', links: [{ to: '/create_event', label: 'Crear evento' }, { to: '/productions', label: 'Mis producciones' }] },
  { titulo: 'Ayuda', links: [{ to: '/contact', label: 'Contacto' }, { to: '/conditions', label: 'Términos y condiciones' }] }
]

const Footer = () => (
  <footer className="mt-auto border-t border-line bg-surface/40">
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <img src={logoSvg} alt="Ipass" className="h-7 w-[66px] object-contain object-left" />
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Entradas para los mejores eventos de Argentina. Comprá en minutos y recibí tu QR por email.
          </p>
        </div>
        {COLUMNAS.map(({ titulo, links }) => (
          <div key={titulo}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-subtle">{titulo}</h2>
            <ul className="mt-4 space-y-2.5">
              {links.map(({ to, label }) => (
                <li key={to}><Link to={to} className="text-sm text-muted transition-colors hover:text-fg">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 text-xs leading-relaxed text-subtle md:flex-row md:items-start md:justify-between">
        <p className="max-w-3xl">
          Ipass presta el servicio de venta de entradas online y no se hace responsable de la calidad de los eventos publicados.
          Al usar este sitio aceptás los <Link to="/conditions" className="text-muted underline decoration-line-strong underline-offset-2 hover:text-fg">términos y condiciones</Link>.
        </p>
        <p className="shrink-0">© {new Date().getFullYear()} Ipass · Argentina</p>
      </div>
    </div>
  </footer>
)

export default Footer
