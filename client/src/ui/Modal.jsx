import { useEffect, useId } from 'react'
import { Icon } from './icons'
import { cx } from './primitives'

//Dialogo modal reutilizable: cierra con Escape, con el fondo o con la X. Bloquea el scroll de la pagina.
//En celular se abre como hoja desde abajo.
const Modal = ({ open, onClose, title, description, children, footer, size = 'md', tone }) => {
  const tituloId = useId()
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = anterior }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby={tituloId}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={cx('relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-card animate-toast-in sm:rounded-2xl',
        size === 'sm' ? 'sm:max-w-md' : size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg')}>
        <div className="flex items-start gap-4 border-b border-line px-5 py-4 sm:px-6">
          {tone === 'danger' && <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-danger/12 text-danger"><Icon.AlertCircle /></span>}
          <div className="min-w-0 flex-1">
            <h2 id={tituloId} className="text-lg font-semibold text-fg">{title}</h2>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="-mr-2 flex size-9 shrink-0 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-surface-2 hover:text-fg">
            <Icon.X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end sm:px-6">{footer}</div>}
      </div>
    </div>
  )
}

export const Switch = ({ checked, onChange, label, description, disabled }) => {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <label htmlFor={id} className="font-medium text-fg">{label}</label>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      <button id={id} type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
        className={cx('relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50', checked ? 'bg-brand-500' : 'bg-surface-3')}>
        <span className={cx('absolute left-1 top-1 size-5 rounded-full bg-white shadow transition-transform duration-200', checked && 'translate-x-5')} />
      </button>
    </div>
  )
}

export default Modal
