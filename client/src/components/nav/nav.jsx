import { useContext, useEffect, useRef, useState } from "react"
import { Link, NavLink, useLocation, useNavigate } from "react-router"
import UserContext from "../../context/userContext"
import logoSvg from "../../assets/goticketImgs/IPSg.svg"
import { Icon } from "../../ui/icons"
import { Button, cx } from "../../ui/primitives"

//Barra superior (rediseño): links principales, accion "Crear evento" y menu de cuenta.
//En celular todo pasa a un panel desplegable.
const linkClase = ({ isActive }) => cx(
  'relative rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200',
  isActive ? 'text-fg' : 'text-muted hover:text-fg'
)

const Avatar = ({ usuario, className = 'size-8' }) => (
  usuario?.imagenProductora
    ? <img src={usuario.imagenProductora} alt="" className={cx('rounded-full object-cover ring-1 ring-white/10', className)} />
    : <span className={cx('flex items-center justify-center rounded-full bg-brand-500/20 text-sm font-semibold text-brand-200 ring-1 ring-brand-400/30', className)}>
        {(usuario?.nombreCompleto || '?').trim().charAt(0).toUpperCase()}
      </span>
)

const Nav = () => {
  const { session, setSession } = useContext(UserContext)
  const usuario = session?.userFinded?.[0]
  const logueado = Boolean(usuario)
  const [menuCuenta, setMenuCuenta] = useState(false)
  const [menuMovil, setMenuMovil] = useState(false)
  const cuentaRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  //Cerrar menus al cambiar de pagina, con Escape o con un clic afuera
  useEffect(() => { setMenuCuenta(false); setMenuMovil(false) }, [location.pathname])
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setMenuCuenta(false); setMenuMovil(false) } }
    const onClick = (e) => { if (cuentaRef.current && !cuentaRef.current.contains(e.target)) setMenuCuenta(false) }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick) }
  }, [])
  //Sin scroll del fondo con el menu movil abierto
  useEffect(() => {
    document.body.style.overflow = menuMovil ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuMovil])

  const cerrarSesion = () => {
    localStorage.clear()
    setMenuCuenta(false)
    setMenuMovil(false)
    setSession('')
    navigate('/')
  }

  const crearEventoHref = logueado ? '/create_event' : '/login'
  const itemsCuenta = logueado ? [
    { to: `/see_profile/${usuario._id}`, label: 'Ver mi perfil', icon: Icon.User },
    { to: '/user_info', label: 'Editar perfil', icon: Icon.Edit },
    { to: '/my_favorites_events', label: 'Mis favoritos', icon: Icon.Heart },
    { to: `/get_my_rrpp_events/${usuario.mail}`, label: 'Colaboraciones (RRPP)', icon: Icon.Users }
  ] : []

  return (
    <>
    <nav className="fixed inset-x-0 top-0 z-50 h-16 border-b border-line/70 bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center transition-opacity hover:opacity-85" aria-label="Ipass, inicio">
          <img src={logoSvg} alt="Ipass" className="h-7 w-[66px] object-contain object-left" />
        </Link>

        {/* Escritorio */}
        <div className="hidden flex-1 items-center gap-1 md:flex md:pl-6">
          <NavLink to="/" end className={linkClase}>Eventos</NavLink>
          {logueado && <NavLink to="/productions" className={linkClase}>Mis producciones</NavLink>}
          <NavLink to="/contact" className={linkClase}>Contacto</NavLink>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button to={crearEventoHref} size="sm" variant={logueado ? 'primary' : 'secondary'} icon={Icon.Plus}>Crear evento</Button>
          {logueado ? (
            <div className="relative" ref={cuentaRef}>
              <button type="button" onClick={() => setMenuCuenta((v) => !v)} aria-expanded={menuCuenta} aria-haspopup="menu"
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2.5 transition-colors hover:bg-surface-2">
                <Avatar usuario={usuario} />
                <span className="max-w-36 truncate text-sm font-medium text-fg">{usuario.nombreCompleto?.split(' ')[0]}</span>
                <Icon.ChevronDown className={cx('size-4 text-subtle transition-transform duration-200', menuCuenta && 'rotate-180')} />
              </button>
              {menuCuenta && (
                <div role="menu" className="absolute right-0 top-[calc(100%+8px)] w-64 overflow-hidden rounded-2xl border border-line bg-surface-2/95 p-1.5 shadow-card backdrop-blur-xl animate-fade-in">
                  <div className="flex items-center gap-3 px-3 py-3">
                    <Avatar usuario={usuario} className="size-9" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-fg">{usuario.nombreCompleto}</p>
                      <p className="truncate text-xs text-muted">{usuario.mail}</p>
                    </div>
                  </div>
                  <div className="my-1 h-px bg-line" />
                  {itemsCuenta.map(({ to, label, icon: Ico }) => (
                    <Link key={to} to={to} role="menuitem" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface-3 hover:text-fg">
                      <Ico className="size-[18px]" />{label}
                    </Link>
                  ))}
                  <div className="my-1 h-px bg-line" />
                  <button type="button" role="menuitem" onClick={cerrarSesion} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-danger/10 hover:text-danger">
                    <Icon.LogOut className="size-[18px]" />Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button to="/login" size="sm" variant="primary">Ingresar</Button>
          )}
        </div>

        {/* Celular */}
        <button type="button" className="-mr-2 flex size-10 shrink-0 items-center justify-center rounded-xl text-fg transition-colors hover:bg-surface-2 md:hidden"
          onClick={() => setMenuMovil((v) => !v)} aria-expanded={menuMovil} aria-label={menuMovil ? 'Cerrar menú' : 'Abrir menú'}>
          {menuMovil ? <Icon.X className="size-6" /> : <Icon.Menu className="size-6" />}
        </button>
      </div>
    </nav>

      {menuMovil && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-50 overflow-y-auto border-t border-line bg-canvas px-4 pb-10 pt-4 animate-fade-in md:hidden">
          {logueado && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
              <Avatar usuario={usuario} className="size-11" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-fg">{usuario.nombreCompleto}</p>
                <p className="truncate text-sm text-muted">{usuario.mail}</p>
              </div>
            </div>
          )}
          <div className="flex flex-col">
            {[
              { to: '/', label: 'Eventos', icon: Icon.Ticket },
              ...(logueado ? [{ to: '/productions', label: 'Mis producciones', icon: Icon.Sparkles }] : []),
              ...itemsCuenta,
              { to: '/contact', label: 'Contacto', icon: Icon.Mail }
            ].map(({ to, label, icon: Ico }) => (
              <Link key={to} to={to} className="flex items-center gap-3.5 rounded-xl px-3 py-3.5 text-[15px] font-medium text-fg transition-colors active:bg-surface-2">
                <Ico className="size-5 text-muted" />{label}
                <Icon.ChevronRight className="ml-auto size-4 text-subtle" />
              </Link>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <Button to={crearEventoHref} block size="lg" icon={Icon.Plus}>Crear evento</Button>
            {logueado
              ? <Button variant="ghost" block onClick={cerrarSesion} icon={Icon.LogOut}>Cerrar sesión</Button>
              : <Button to="/login" variant="secondary" block size="lg">Ingresar</Button>}
          </div>
        </div>
      )}
    </>
  )
}

export default Nav
