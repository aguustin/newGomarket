import axios from "axios"

export const getUserProfileRequest = (userId) => axios.post(`${import.meta.env.VITE_URL}/get_profile`, userId)

export const registerUserRequest = (userData) => axios.post(`${import.meta.env.VITE_URL}/register`, userData)

export const loginUserRequest = (userData) => axios.post(`${import.meta.env.VITE_URL}/login`, userData)

export const recoverPassRequest = ({mail}) => axios.post(`${import.meta.env.VITE_URL}/recover_password`, {mail})

export const confirmNewPassRequest = ({token, nuevaContrasenia}) => axios.post(`${import.meta.env.VITE_URL}/new_password`, {token, nuevaContrasenia})

export const contactarRequest = (mailData) => axios.post(`${import.meta.env.VITE_URL}/contactar`, mailData)

export const saveEventRequest = (data) => axios.post(`${import.meta.env.VITE_URL}/save_event`, data)

export const createSellerProfileRequest = (formData) => axios.post(`${import.meta.env.VITE_URL}/create_seller_profile`, formData)

export const getFavoritesEventsRequest = (userId) => axios.post(`${import.meta.env.VITE_URL}/get_favorites`, {userId})