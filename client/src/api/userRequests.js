import axios from "axios"

export const getAllUsers = () => axios.get('http://127.0.0.1:4000/getAllUsers')

export const registerUserRequest = (userData) => axios.post('http://127.0.0.1:4000/register', userData)

export const loginUserRequest = (userData) => axios.post('http://127.0.0.1:4000/login', userData)