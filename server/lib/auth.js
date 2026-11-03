import jwt from "jsonwebtoken";
import { isValidObjectId } from "mongoose";
import userModel from "../models/userModel.js";

//Sesion de usuario: JWT firmado, enviado por el frontend en "Authorization: Bearer <token>".
//JWT_SECRET tambien firma los QR, la recuperacion de contraseña y la verificacion de cuenta: por eso
//la sesion lleva typ:'sesion' y el middleware rechaza cualquier otro token aunque la firma sea valida.
const JWT_SECRET = process.env.JWT_SECRET || 'kidjaskdhajsdbjadlfgkjmlkjbnsdlfgnsñlknamnczmjcf'
export const SESION_DURACION = '7d'
const TIPO_SESION = 'sesion'

//Campos que nunca salen del servidor
const CAMPOS_PRIVADOS = ['contrasenia']

export const sinDatosPrivados = (user) => {
  if (!user) return user
  const plano = typeof user.toObject === 'function' ? user.toObject() : { ...user }
  for (const campo of CAMPOS_PRIVADOS) delete plano[campo]
  return plano
}

export const firmarSesion = (user) =>
  jwt.sign({ sub: String(user._id), typ: TIPO_SESION }, JWT_SECRET, { expiresIn: SESION_DURACION })

const noAutenticado = (res, code, error) => res.status(401).json({ code, error })

//Exige una sesion valida. Deja el usuario (sin contraseña) en req.user
export const requireAuth = async (req, res, next) => {
  const [tipo, token] = String(req.headers.authorization || '').split(' ')
  if (tipo !== 'Bearer' || !token) return noAutenticado(res, 'NO_AUTENTICADO', 'Iniciá sesión para continuar')

  let payload
  try {
    payload = jwt.verify(token, JWT_SECRET)
  } catch (err) {
    if (err.name === 'TokenExpiredError') return noAutenticado(res, 'SESION_VENCIDA', 'Tu sesión venció. Iniciá sesión de nuevo')
    return noAutenticado(res, 'NO_AUTENTICADO', 'Iniciá sesión para continuar')
  }
  if (payload.typ !== TIPO_SESION || !isValidObjectId(payload.sub)) {
    return noAutenticado(res, 'NO_AUTENTICADO', 'Iniciá sesión para continuar')
  }

  try {
    const user = await userModel.findById(payload.sub, { contrasenia: 0 }).lean()
    if (!user) return noAutenticado(res, 'NO_AUTENTICADO', 'Iniciá sesión para continuar')
    req.user = user
    return next()
  } catch (err) {
    return next(err)
  }
}

//Para rutas que reciben "quien soy" (userId o mail): solo se acepta el mismo usuario de la sesion.
//Se usa DESPUES de requireAuth (y de multer en las rutas con archivos, para que el body ya este armado).
const prohibido = (res) => res.status(403).json({ code: 'OTRO_USUARIO', error: 'No podés operar en nombre de otro usuario' })

export const mismoUserId = (obtener) => (req, res, next) =>
  String(obtener(req) ?? '') === String(req.user._id) ? next() : prohibido(res)

export const mismoMail = (obtener) => (req, res, next) =>
  String(obtener(req) ?? '').trim().toLowerCase() === String(req.user.mail ?? '').trim().toLowerCase() ? next() : prohibido(res)
