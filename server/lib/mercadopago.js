import axios from "axios";
import crypto from "node:crypto";
import { mpAccessToken } from "../config.js";

//Cliente minimo de la API de Mercado Pago (etapa 13). Reemplaza al SDK `mercadopago` v1, que arrastraba
//vulnerabilidades (request, form-data, qs, tough-cookie). Mismos endpoints y misma forma que usaba el codigo:
//  preferences.create(preferencia)  -> { body, status }   POST /checkout/preferences
//  payment.findById(id)             -> { body, status }   GET  /v1/payments/:id
//  payment.search({ qs })           -> { body, status }   GET  /v1/payments/search
//Los errores lanzan un Error con status (HTTP de MP; 0 si no hubo respuesta), message y cause (respuesta de MP),
//igual que el SDK, para que respondMpError siga funcionando sin cambios.
//Los reembolsos van aparte (lib/reembolsos.js), con su propia clave de idempotencia.
const API = 'https://api.mercadopago.com'
const TIMEOUT_MS = 30000

const errorDeMP = (err) => {
  const status = err?.response?.status ?? 0
  const datos = err?.response?.data
  const e = new Error(datos?.message || err?.message || 'Error de Mercado Pago')
  e.status = status
  e.cause = datos ?? err?.code
  return e
}

const pedir = async (config) => {
  try {
    const res = await axios.request({
      baseURL: API,
      timeout: TIMEOUT_MS,
      ...config,
      headers: { Authorization: `Bearer ${mpAccessToken}`, 'Content-Type': 'application/json', ...config.headers }
    })
    return { body: res.data, status: res.status }
  } catch (err) {
    throw errorDeMP(err)
  }
}

const mercadopago = {
  preferences: {
    //Cada llamada es una preferencia nueva: la clave solo evita duplicados si la red reintenta el mismo pedido
    create: (preferencia) => pedir({ method: 'post', url: '/checkout/preferences', data: preferencia, headers: { 'X-Idempotency-Key': crypto.randomUUID() } })
  },
  payment: {
    findById: (id) => pedir({ method: 'get', url: `/v1/payments/${encodeURIComponent(String(id))}` }),
    search: ({ qs = {} } = {}) => pedir({ method: 'get', url: '/v1/payments/search', params: qs })
  }
}

export default mercadopago;
