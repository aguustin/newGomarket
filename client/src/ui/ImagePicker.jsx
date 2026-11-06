import { useId } from 'react'
import { Icon } from './icons'
import { cx } from './primitives'

//Cargador de imagen con vista previa. El <input type="file"> conserva su name para los formularios existentes.
//aspect: clase de proporcion (ej. 'aspect-[11/12]'); hint: tamaño recomendado
const ImagePicker = ({ label, name, preview, onChange, hint, aspect = 'aspect-video', className, required, invalid }) => {
  const id = useId()
  return (
    <div className={className}>
      {label && <p className="mb-1.5 text-[13px] font-medium text-muted">{label}</p>}
      <label htmlFor={id}
        className={cx('group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed bg-surface-2 text-center transition-colors',
          aspect, invalid ? 'border-danger/60' : 'border-line-strong hover:border-brand-400 hover:bg-surface-3')}>
        {preview ? (
          <>
            <img src={preview} alt="" className="absolute inset-0 size-full object-cover" />
            <span className="absolute inset-x-3 bottom-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-black/60 px-3 py-2 text-xs font-medium text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
              <Icon.Upload className="size-4" />Cambiar imagen
            </span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-2 px-4 py-6">
            <span className="flex size-10 items-center justify-center rounded-xl bg-brand-500/12 text-brand-300"><Icon.Image /></span>
            <span className="text-sm font-medium text-fg">Subir imagen{required && <span className="text-danger"> *</span>}</span>
            {hint && <span className="text-xs text-subtle">{hint}</span>}
          </span>
        )}
      </label>
      <input id={id} type="file" name={name} accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onChange} />
    </div>
  )
}

export default ImagePicker
