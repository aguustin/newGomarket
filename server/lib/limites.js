import rateLimit from "express-rate-limit";
import { appEnv } from "../config.js";

//Limite de pedidos por IP contra fuerza bruta y abuso (etapa 12).
//Generosos a proposito: en la puerta de un evento muchos celulares pueden salir por la misma IP (wifi del lugar).
//En los tests (APP_ENV=test) estan apagados salvo RATE_LIMIT_TEST=1, para que no se crucen entre si.
const activo = () => appEnv !== 'test' || process.env.RATE_LIMIT_TEST === '1'

const limite = (minutos, max, error) => rateLimit({
  windowMs: minutos * 60 * 1000,
  limit: max,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => !activo(),
  handler: (req, res) => res.status(429).json({ code: 'DEMASIADOS_INTENTOS', error })
})

const ESPERA = 'Demasiados intentos. Esperá unos minutos y volvé a probar'

export const limites = {
  login: limite(15, 20, ESPERA),
  registro: limite(60, 10, ESPERA),
  recuperar: limite(15, 5, ESPERA),          //cada pedido manda un mail
  nuevaContrasenia: limite(15, 10, ESPERA),
  contacto: limite(60, 5, ESPERA),           //cada pedido manda un mail
  compra: limite(10, 30, 'Demasiados intentos de compra. Esperá unos minutos y volvé a probar'),
  descuento: limite(10, 30, ESPERA),         //evita probar codigos de descuento al azar
  general: limite(1, 600, 'Demasiados pedidos. Esperá un momento')
}
