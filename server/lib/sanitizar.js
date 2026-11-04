//Rechaza pedidos que traen operadores de MongoDB en los datos (etapa 12). Por ejemplo, un login con
//{ "mail": { "$ne": null } } podia convertirse en una consulta que encuentra a cualquier usuario.
//Solo mira las claves que empiezan con "$" (a cualquier profundidad) en body, query y params.
//Las claves con punto se permiten: Mercado Pago manda ?data.id=... en el webhook.
const PROFUNDIDAD_MAX = 20

const tieneOperador = (valor, nivel = 0) => {
  if (nivel > PROFUNDIDAD_MAX || valor === null || typeof valor !== 'object') return false
  if (Buffer.isBuffer(valor)) return false
  for (const clave of Object.keys(valor)) {
    if (clave.startsWith('$')) return true
    if (tieneOperador(valor[clave], nivel + 1)) return true
  }
  return false
}

export const sinOperadoresMongo = (req, res, next) => {
  if (tieneOperador(req.body) || tieneOperador(req.query) || tieneOperador(req.params)) {
    return res.status(400).json({ code: 'DATOS_INVALIDOS', error: 'Datos inválidos' })
  }
  next()
}
