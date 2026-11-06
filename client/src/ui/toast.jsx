import { useEffect, useState } from 'react'
import { Icon } from './icons'
import { cx } from './primitives'

//Avisos no bloqueantes (reemplazan a alert()). Se pueden llamar desde cualquier lugar, incluso fuera de React:
//  toast.success('Guardado')  toast.error('No se pudo...')  toast.info('...')
//<ToastViewport /> se monta una sola vez (App.jsx).
let oyentes = new Set()
let siguienteId = 1

const emitir = (tipo, mensaje, { duracion = 4500 } = {}) => {
  const aviso = { id: siguienteId++, tipo, mensaje, duracion }
  oyentes.forEach((fn) => fn(aviso))
  return aviso.id
}

export const toast = {
  success: (m, o) => emitir('success', m, o),
  error: (m, o) => emitir('error', m, { duracion: 6500, ...o }),
  info: (m, o) => emitir('info', m, o)
}

const ESTILO = {
  success: { icono: Icon.CheckCircle, color: 'text-ok' },
  error: { icono: Icon.AlertCircle, color: 'text-danger' },
  info: { icono: Icon.Info, color: 'text-brand-300' }
}

export const ToastViewport = () => {
  const [avisos, setAvisos] = useState([])

  useEffect(() => {
    const agregar = (aviso) => {
      setAvisos((prev) => [...prev.slice(-3), aviso])
      setTimeout(() => setAvisos((prev) => prev.filter((a) => a.id !== aviso.id)), aviso.duracion)
    }
    oyentes.add(agregar)
    return () => oyentes.delete(agregar)
  }, [])

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6">
      {avisos.map((a) => {
        const { icono: Ico, color } = ESTILO[a.tipo]
        return (
          <div key={a.id} role={a.tipo === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line bg-surface-2/95 px-4 py-3.5 shadow-card backdrop-blur-xl animate-toast-in">
            <Ico className={cx('mt-0.5 size-5 shrink-0', color)} />
            <p className="flex-1 text-sm leading-relaxed text-fg">{a.mensaje}</p>
            <button type="button" aria-label="Cerrar aviso" onClick={() => setAvisos((prev) => prev.filter((x) => x.id !== a.id))}
              className="-mr-1 rounded-md p-0.5 text-subtle transition-colors hover:text-fg">
              <Icon.X className="size-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
