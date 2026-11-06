import { useState } from 'react'
import { Icon } from './icons'
import { cx } from './primitives'

//Imagen con aparicion suave, fondo mientras carga y reemplazo si falla (sin tamaños fijos: los define className)
const SmartImage = ({ src, alt = '', className, imgClassName, eager }) => {
  const [estado, setEstado] = useState(src ? 'cargando' : 'error')

  return (
    <div className={cx('relative overflow-hidden bg-surface-2', className)}>
      {estado !== 'listo' && (
        <div className={cx('absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-900/60 via-surface-2 to-surface-2', estado === 'cargando' && 'animate-pulse')}>
          {estado === 'error' && <Icon.Ticket className="size-8 text-brand-400/50" />}
        </div>
      )}
      {src && estado !== 'error' && (
        <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async"
          onLoad={() => setEstado('listo')} onError={() => setEstado('error')}
          className={cx('size-full object-cover transition-opacity duration-500', estado === 'listo' ? 'opacity-100' : 'opacity-0', imgClassName)} />
      )}
    </div>
  )
}

export default SmartImage
