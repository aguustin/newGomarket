import { forwardRef, useId, useState } from 'react'
import { Link } from 'react-router'
import { Icon } from './icons'

//Componentes base del sistema de diseño. Toda pantalla nueva o rediseñada usa estos en vez de clases sueltas.
export const cx = (...c) => c.filter(Boolean).join(' ')

/* ---------- Spinner ---------- */
export const Spinner = ({ className = 'size-4' }) => (
  <svg className={cx('animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>
)

/* ---------- Button ----------
   variant: primary (accion principal, una por pantalla) | secondary | ghost | danger | subtle
   size: sm | md | lg. Con `to` se renderiza como Link; con `href`, como <a>. */
const VARIANTES = {
  primary: 'bg-brand-500 text-white hover:bg-brand-400 active:bg-brand-600 shadow-glow disabled:shadow-none',
  secondary: 'bg-surface-2 text-fg border border-line hover:border-line-strong hover:bg-surface-3',
  ghost: 'text-muted hover:text-fg hover:bg-surface-2',
  danger: 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20',
  subtle: 'bg-brand-500/12 text-brand-300 hover:bg-brand-500/20'
}
const TAMANOS = {
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-[15px] gap-2 rounded-xl',
  lg: 'h-13 px-6 text-base gap-2.5 rounded-xl'
}

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, icon: IconoIzq, iconRight: IconoDer, block, to, href, className, children, type = 'button', ...props },
  ref
) {
  const clases = cx(
    'inline-flex items-center justify-center font-semibold whitespace-nowrap select-none',
    'transition-[background-color,border-color,color,box-shadow,transform] duration-200 active:scale-[0.98]',
    'disabled:opacity-50 disabled:pointer-events-none',
    VARIANTES[variant], TAMANOS[size], block && 'w-full', className
  )
  const contenido = (
    <>
      {loading ? <Spinner className={size === 'sm' ? 'size-3.5' : 'size-4'} /> : IconoIzq && <IconoIzq className={size === 'sm' ? 'size-4' : 'size-[18px]'} />}
      {children}
      {IconoDer && !loading && <IconoDer className={size === 'sm' ? 'size-4' : 'size-[18px]'} />}
    </>
  )
  if (to) return <Link ref={ref} to={to} className={clases} {...props}>{contenido}</Link>
  if (href) return <a ref={ref} href={href} className={clases} {...props}>{contenido}</a>
  return <button ref={ref} type={type} className={clases} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>{contenido}</button>
})

export const IconButton = forwardRef(function IconButton({ label, icon: Ico, className, active, ...props }, ref) {
  return (
    <button ref={ref} type="button" aria-label={label} title={label}
      className={cx('inline-flex size-10 items-center justify-center rounded-full transition-colors duration-200',
        active ? 'text-brand-300 bg-brand-500/15' : 'text-muted hover:text-fg hover:bg-surface-3', className)} {...props}>
      <Ico className="size-5" />
    </button>
  )
})

/* ---------- Campos ---------- */
const campoBase = cx(
  'w-full rounded-xl border bg-surface-2 text-fg placeholder:text-subtle',
  'transition-[border-color,box-shadow] duration-200 outline-none focus-visible:outline-none',
  'focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15',
  'disabled:opacity-50 disabled:cursor-not-allowed'
)

//Envoltorio con etiqueta, ayuda y error. El id lo genera solo y lo pasa al hijo via render prop
export const Field = ({ label, hint, error, children, className, optional }) => {
  const id = useId()
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-[13px] font-medium text-muted">
          {label}{optional && <span className="text-subtle font-normal"> (opcional)</span>}
        </label>
      )}
      {children({ id, invalid: Boolean(error), describedBy: error || hint ? `${id}-msg` : undefined })}
      {(error || hint) && (
        <p id={`${id}-msg`} className={cx('text-xs', error ? 'text-danger' : 'text-subtle')}>{error || hint}</p>
      )}
    </div>
  )
}

export const Input = forwardRef(function Input({ icon: Ico, invalid, className, inputClassName, size = 'md', ...props }, ref) {
  return (
    <div className={cx('relative', className)}>
      {Ico && <Ico className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-[18px] -translate-y-1/2 text-subtle" />}
      <input ref={ref} aria-invalid={invalid || undefined}
        className={cx(campoBase, size === 'lg' ? 'h-13 text-base' : 'h-11 text-[15px]', Ico ? 'pl-10.5 pr-3.5' : 'px-3.5',
          invalid ? 'border-danger/60' : 'border-line hover:border-line-strong', inputClassName)} {...props} />
    </div>
  )
})

export const Select = forwardRef(function Select({ icon: Ico, invalid, className, children, ...props }, ref) {
  return (
    <div className={cx('relative', className)}>
      {Ico && <Ico className="pointer-events-none absolute left-3.5 top-1/2 z-10 size-[18px] -translate-y-1/2 text-subtle" />}
      <select ref={ref} aria-invalid={invalid || undefined}
        className={cx(campoBase, 'h-11 appearance-none pr-10 text-[15px]', Ico ? 'pl-10.5' : 'pl-3.5',
          invalid ? 'border-danger/60' : 'border-line hover:border-line-strong')} {...props}>
        {children}
      </select>
      <Icon.ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
    </div>
  )
})

export const Textarea = forwardRef(function Textarea({ invalid, className, ...props }, ref) {
  return <textarea ref={ref} aria-invalid={invalid || undefined}
    className={cx(campoBase, 'min-h-28 px-3.5 py-3 text-[15px]', invalid ? 'border-danger/60' : 'border-line hover:border-line-strong', className)} {...props} />
})

/* ---------- Superficies ---------- */
export const Card = ({ as: Tag = 'div', className, children, ...props }) => (
  <Tag className={cx('rounded-2xl border border-line bg-surface shadow-card', className)} {...props}>{children}</Tag>
)

const TONOS_BADGE = {
  neutral: 'bg-white/8 text-muted border-white/10',
  brand: 'bg-brand-500/15 text-brand-200 border-brand-400/25',
  ok: 'bg-ok/12 text-ok border-ok/25',
  danger: 'bg-danger/12 text-danger border-danger/25',
  warn: 'bg-warn/12 text-warn border-warn/25',
  glass: 'bg-black/45 text-white border-white/15 backdrop-blur-md'
}
export const Badge = ({ tone = 'neutral', icon: Ico, className, children }) => (
  <span className={cx('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold', TONOS_BADGE[tone], className)}>
    {Ico && <Ico className="size-3.5" />}{children}
  </span>
)

export const EmptyState = ({ icon: Ico = Icon.Search, title, description, action, className }) => (
  <div className={cx('mx-auto flex max-w-md flex-col items-center px-6 py-16 text-center', className)}>
    <div className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-line bg-surface-2 text-brand-300">
      <Ico className="size-6" />
    </div>
    <h3 className="text-lg font-semibold text-fg">{title}</h3>
    {description && <p className="mt-1.5 text-[15px] text-muted">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
)

//Contenedor de pagina: ancho maximo y margenes consistentes
export const Page = ({ className, children, narrow }) => (
  <main className={cx('mx-auto w-full flex-1 px-4 pb-20 pt-8 sm:px-6 lg:px-8', narrow ? 'max-w-3xl' : 'max-w-7xl', className)}>{children}</main>
)

export const PageHeader = ({ eyebrow, title, description, actions, className }) => (
  <header className={cx('mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
    <div>
      {eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-300">{eyebrow}</p>}
      <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-[15px] text-muted">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
  </header>
)

export const Skeleton = ({ className }) => <div className={cx('animate-pulse rounded-lg bg-surface-3/70', className)} />

/* ---------- Contraseña con boton mostrar/ocultar ---------- */
export const PasswordInput = forwardRef(function PasswordInput({ className, ...props }, ref) {
  const [visible, setVisible] = useState(false)
  return (
    <div className={cx('relative', className)}>
      <Input ref={ref} type={visible ? 'text' : 'password'} icon={Icon.Lock} inputClassName="pr-11" {...props} />
      <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={visible}
        className="absolute right-1.5 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-surface-3 hover:text-fg">
        {visible ? <Icon.EyeOff className="size-[18px]" /> : <Icon.Eye className="size-[18px]" />}
      </button>
    </div>
  )
})

/* ---------- Aviso en linea (info / ok / warn / danger) ---------- */
const TONOS_ALERTA = {
  info: { clase: 'border-brand-400/25 bg-brand-500/10 text-brand-200', icono: Icon.Info },
  ok: { clase: 'border-ok/25 bg-ok/10 text-ok', icono: Icon.CheckCircle },
  warn: { clase: 'border-warn/25 bg-warn/10 text-warn', icono: Icon.AlertCircle },
  danger: { clase: 'border-danger/25 bg-danger/10 text-danger', icono: Icon.AlertCircle }
}
export const Alert = ({ tone = 'info', className, children }) => {
  const { clase, icono: Ico } = TONOS_ALERTA[tone]
  return (
    <div role={tone === 'danger' || tone === 'warn' ? 'alert' : 'status'} className={cx('flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm animate-fade-in', clase, className)}>
      <Ico className="mt-0.5 size-[18px] shrink-0" />
      <div className="leading-relaxed">{children}</div>
    </div>
  )
}
