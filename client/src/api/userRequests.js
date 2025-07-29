import axios from "axios"

/*export const getAllUsers = () => axios.get('http://localhost:4000/getAllUsers')

export const registerUserRequest = (userData) => axios.post('http://localhost:4000/register', userData)

export const loginUserRequest = (userData) => axios.post('http://localhost:4000/login', userData)

export const recoverPassRequest = ({mail}) => axios.post('http://localhost:4000/recover_password', {mail})

export const confirmNewPassRequest = ({token, nuevaContrasenia}) => axios.post('http://localhost:4000/new_password', {token, nuevaContrasenia})

export const contactarRequest = (mailData) => axios.post('http://localhost:4000/contactar', mailData)*/


export const getAllUsers = () => axios.get(`${process.env.URL}/getAllUsers`)

export const registerUserRequest = (userData) => axios.post(`${process.env.URL}/register`, userData)

export const loginUserRequest = (userData) => axios.post(`${process.env.URL}/login`, userData)

export const recoverPassRequest = ({mail}) => axios.post(`${process.env.URL}/recover_password`, {mail})

export const confirmNewPassRequest = ({token, nuevaContrasenia}) => axios.post(`${process.env.URL}/new_password`, {token, nuevaContrasenia})

export const contactarRequest = (mailData) => axios.post(`${process.env.URL}/contactar`, mailData)