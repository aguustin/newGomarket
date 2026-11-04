import jwt from "jsonwebtoken";
import "../config.js"; //carga el .env antes de leer las variables

//Unico lugar donde se leen las claves de firma y cifrado. NO hay valores por defecto en el codigo:
//si faltan, validateConfig no deja arrancar el servidor (ver lib/checkConfig.js).
//
//JWT_SECRET firma sesiones, QR de entradas, recuperacion de contraseña y verificacion de cuenta.
//JWT_SECRET_ANTERIOR (opcional) sirve para rotar JWT_SECRET sin romper las entradas ya vendidas:
//se usa SOLO para LEER QR emitidos antes del cambio (y esos QR igual tienen que estar guardados en la base).
//Nunca firma nada nuevo y no sirve para sesiones: al rotar, todos vuelven a iniciar sesion.
export const jwtSecret = process.env.JWT_SECRET
export const jwtSecretAnterior = process.env.JWT_SECRET_ANTERIOR || null

//SECRET_MAIL_KEY cifra los mails de productores y RRPP guardados en los eventos.
//Para rotarla hay que volver a cifrar lo guardado: ver scripts/rotarSecretMailKey.js
export const secretMailKey = process.env.SECRET_MAIL_KEY

//Verifica el token de un QR con la clave actual y, si no coincide, con la anterior (rotacion). Lanza si ninguna sirve
export const verificarTokenQR = (token) => {
  try {
    return jwt.verify(token, jwtSecret)
  } catch (err) {
    if (!jwtSecretAnterior || err?.name !== 'JsonWebTokenError') throw err
    return jwt.verify(token, jwtSecretAnterior)
  }
}
