import axios from "axios"

export const getAllExcelsRequest = (userId, prodId) => axios.get(`${import.meta.env.VITE_URL}/get_event_cortesies/${userId}/${prodId}`)

export const getCortesieRequest = ({cortesieId}) => axios.get(`${import.meta.env.VITE_URL}/get_cortesie/${cortesieId}`)

export const chargeExcelRequest = (formData) => axios.post(`${import.meta.env.VITE_URL}/charge_excel`, formData)

export const sendCortesiesRequest = ({prodId, cortesieId}) => axios.post(`${import.meta.env.VITE_URL}/send_cortesies`, {prodId, cortesieId})