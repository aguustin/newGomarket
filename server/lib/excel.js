import ExcelJS from 'exceljs'

//Lectura de los Excel que suben los usuarios (cortesias y RRPP). Etapa 13: reemplaza a la libreria `xlsx`,
//que tenia vulnerabilidades sin arreglo publicado. Devuelve lo mismo que daba XLSX.utils.sheet_to_json
//con { header: claves, range: 1 }: primera hoja, sin la fila de encabezado, sin filas vacias, y cada fila
//como objeto { [clave]: valor } (las celdas vacias no aparecen).
//Las celdas con link (mails que Excel convierte en hipervinculo), formulas o texto con formato dan su texto.

const valorDeCelda = (v) => {
  if (v === null || v === undefined || v === '') return undefined
  if (v instanceof Date) return v
  if (typeof v !== 'object') return v
  if ('result' in v) return valorDeCelda(v.result)                          //formula
  if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join('') //texto con formato
  if ('text' in v) return valorDeCelda(typeof v.text === 'object' ? v.text?.richText?.map((t) => t.text).join('') : v.text) //hipervinculo
  if ('error' in v) return undefined
  return String(v)
}

//Lanza un error si el archivo no es un .xlsx valido (el controlador responde el mismo error que antes)
export const leerFilasExcel = async (buffer, claves, { maxFilas = Infinity } = {}) => {
  const libro = new ExcelJS.Workbook()
  await libro.xlsx.load(buffer)
  const hoja = libro.worksheets[0]
  if (!hoja) return []

  const filas = []
  for (let n = 2; n <= hoja.rowCount; n++) {
    const fila = hoja.getRow(n)
    const obj = {}
    claves.forEach((clave, i) => {
      const valor = valorDeCelda(fila.getCell(i + 1).value)
      if (valor !== undefined) obj[clave] = valor
    })
    if (Object.keys(obj).length === 0) continue
    filas.push(obj)
    if (filas.length > maxFilas) break //alcanza para saber que se paso del limite
  }
  return filas
}
