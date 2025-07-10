import axios from "axios"

export const getAllUsers = () => axios.get('http://localhost:4000/getAllUsers')

export const registerUserRequest = (userData) => axios.post('http://localhost:4000/register', userData)

export const loginUserRequest = (userData) => axios.post('http://localhost:4000/login', userData)

export const recoverPassRequest = ({mail}) => axios.post('http://localhost:4000/recover_password', {mail}) 

export const contactarRequest = (mailData) => axios.post('http://localhost:4000/contactar', mailData)