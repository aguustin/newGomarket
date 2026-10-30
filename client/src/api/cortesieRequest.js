import axios from "axios"

export const getAllExcelsRequest = (userId, prodId) => axios.get(`${import.meta.env.VITE_URL}/get_event_cortesies/${userId}/${prodId}`)

export const getAllRRPPExcelsRequest = (userId, prodId) => axios.get(`${import.meta.env.VITE_URL}/get_rrpp_event_excels/${userId}/${prodId}`)

export const getCortesieRequest = ({cortesieId}) => axios.get(`${import.meta.env.VITE_URL}/get_cortesie/${cortesieId}`)

export const chargeExcelRequest = (formData) => axios.post(`${import.meta.env.VITE_URL}/charge_excel`, formData)

export const chargeRRPPExcelRequest = (formData) => axios.post(`${import.meta.env.VITE_URL}/charge_rrpp_excel`, formData)

export const sendCortesiesRequest = ({prodId, cortesieId}) => axios.post(`${import.meta.env.VITE_URL}/send_cortesies`, {prodId, cortesieId})

export const sendRRPPLinksRequest = ({prodId, rrppListId}) => axios.post(`${import.meta.env.VITE_URL}/send_rrpp_cortesies`, {prodId, rrppListId})

export const deleteCortesieRequest = ({userId, cortesieId}) => axios.delete(`${import.meta.env.VITE_URL}/delete_cortesie/${userId}/${cortesieId}`)

export const deleteRRPPExcelRequest = ({userId, rrppListId}) => axios.delete(`${import.meta.env.VITE_URL}/delete_rrpp_excel/${userId}/${rrppListId}`)