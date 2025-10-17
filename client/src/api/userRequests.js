import axios from "axios"

/*export const getAllUsers = () => axios.get('http://localhost:4000/getAllUsers')

export const registerUserRequest = (userData) => axios.post('http://localhost:4000/register', userData)

export const loginUserRequest = (userData) => axios.post('http://localhost:4000/login', userData)

export const recoverPassRequest = ({mail}) => axios.post('http://localhost:4000/recover_password', {mail})

export const confirmNewPassRequest = ({token, nuevaContrasenia}) => axios.post('http://localhost:4000/new_password', {token, nuevaContrasenia})

export const contactarRequest = (mailData) => axios.post('http://localhost:4000/contactar', mailData)*/

export const getUserProfileRequest = ({userId}) => axios.post(`${import.meta.env.VITE_URL}/get_profile`, {userId})

export const getAllUsers = () => axios.get(`${import.meta.env.VITE_URL}/getAllUsers`)

export const registerUserRequest = (userData) => axios.post(`${import.meta.env.VITE_URL}/register`, userData)

export const loginUserRequest = (userData) => axios.post(`${import.meta.env.VITE_URL}/login`, userData)

export const recoverPassRequest = ({mail}) => axios.post(`${import.meta.env.VITE_URL}/recover_password`, {mail})

export const confirmNewPassRequest = ({token, nuevaContrasenia}) => axios.post(`${import.meta.env.VITE_URL}/new_password`, {token, nuevaContrasenia})

export const contactarRequest = (mailData) => axios.post(`${import.meta.env.VITE_URL}/contactar`, mailData)

export const saveEventRequest = (data) => axios.post(`${import.meta.env.VITE_URL}/save_event`, data)

export const obtainMySaveEventsRequest = (userId) => axios.post(`${import.meta.env.VITE_URL}/obtain_saved_events`, userId)

export const createSellerProfileRequest = (formData) => axios.post(`${import.meta.env.VITE_URL}/create_seller_profile`, formData)