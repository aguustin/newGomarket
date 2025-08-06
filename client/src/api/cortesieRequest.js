import axios from "axios"

export const getAllExcelsRequest = ({prodId, userId}) => axios.get(`${import.meta.env.VITE_URL}/get_event_database/${prodId}/${userId}`)

export const getCortesieRequest = ({cortesieId}) => axios.get(`${import.meta.env.VITE_URL}/get_cortesie/${cortesieId}`)