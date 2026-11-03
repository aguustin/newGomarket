import axios from "axios"

//Unico lugar que maneja la sesion en los pedidos al backend:
//  - agrega "Authorization: Bearer <token>" a todo pedido a VITE_URL (nunca a otros dominios)
//  - si el backend responde 401 (sin sesion o sesion vencida), borra la sesion y lleva al login
//Se importa una vez en main.jsx; las funciones de src/api siguen usando axios igual que antes.
const API = import.meta.env.VITE_URL

export const leerSesion = () => {
    try {
        return JSON.parse(localStorage.getItem('session'))
    } catch {
        return null
    }
}

axios.interceptors.request.use((config) => {
    const token = leerSesion()?.token
    if (token && API && String(config.url ?? '').startsWith(API)) {
        config.headers = config.headers ?? {}
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        const { status, data } = error?.response ?? {}
        const esDelBackend = String(error?.config?.url ?? '').startsWith(API)
        if (esDelBackend && status === 401 && ['NO_AUTENTICADO', 'SESION_VENCIDA'].includes(data?.code)) {
            localStorage.removeItem('session')
            if (!window.location.pathname.startsWith('/login')) {
                const motivo = data.code === 'SESION_VENCIDA' ? 'vencida' : 'requerida'
                window.location.assign(`/login?sesion=${motivo}`)
            }
        }
        return Promise.reject(error)
    }
)
