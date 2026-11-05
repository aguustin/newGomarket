import multer from "multer"

//Subida de archivos validada (etapa 13). Antes se aceptaba cualquier archivo de cualquier tamaño.
//  - imagenes: JPG, PNG o WebP de hasta 5 MB
//  - Excel: .xlsx de hasta 2 MB (las filas se limitan en el controlador: MAX_FILAS_EXCEL)
//El tipo se comprueba por los primeros bytes del archivo, no solo por lo que dice el navegador.
//Si algo no cumple responde 400 { code, message } y no llega al controlador.
const MB = 1024 * 1024
export const MAX_FILAS_EXCEL = 2000

const firmas = {
  imagen: [
    (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,                                        //JPG
    (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,                       //PNG
    (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' //WebP
  ],
  excel: [(b) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04]                 //.xlsx (zip)
}
const TIPOS = {
  imagen: { mimes: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 5 * MB, texto: 'una imagen JPG, PNG o WebP de hasta 5 MB' },
  excel: {
    mimes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'application/octet-stream', 'application/zip'],
    maxBytes: 2 * MB, texto: 'un archivo Excel .xlsx de hasta 2 MB'
  }
}

const rechazo = (res, tipo) => res.status(400).json({ code: 'ARCHIVO_INVALIDO', message: `El archivo debe ser ${TIPOS[tipo].texto}` })

const archivosDe = (req) => [req.file, ...Object.values(req.files ?? {}).flat()].filter(Boolean)

//campos: 'nombre' (un archivo) o [{ name, maxCount }] (varios campos)
const subida = (tipo, campos) => {
  const { mimes, maxBytes } = TIPOS[tipo]
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxBytes, files: 5 },
    fileFilter: (req, file, cb) => {
      const err = new Error('tipo'); err.code = 'TIPO_INVALIDO'
      if (!mimes.includes(file.mimetype)) return cb(err)
      if (tipo === 'excel' && !/\.xlsx$/i.test(file.originalname)) return cb(err)
      cb(null, true)
    }
  })
  const mw = typeof campos === 'string' ? upload.single(campos) : upload.fields(campos)
  return (req, res, next) => mw(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError || err.code === 'TIPO_INVALIDO') return rechazo(res, tipo)
      return next(err)
    }
    const valido = archivosDe(req).every((f) => f.buffer?.length >= 4 && firmas[tipo].some((ok) => ok(f.buffer)))
    return valido ? next() : rechazo(res, tipo)
  })
}

export const subirImagen = (campo) => subida('imagen', campo)
export const subirImagenes = (campos) => subida('imagen', campos)
export const subirExcel = (campo) => subida('excel', campo)
