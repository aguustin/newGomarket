import axios from "axios";

export const getAllEventsRequest = () => axios.get('http://localhost:4000/getAllEvents')

export const createEventRequest = (formData) => axios.post('http://localhost:4000/createEvent', formData)

export const updateEventTicketsRequest = (formData) => axios.post('http://localhost:4000/updateEventTickets', formData)

export const getProdsRequest = (userId) => axios.get(`http://localhost:4000/my_productions/${userId}`)

export const getOneProdRequest = (prodId) => axios.get(`http://localhost:4000/get_prod/${prodId}`)