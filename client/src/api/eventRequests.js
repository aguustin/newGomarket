import axios from "axios";

export const getAllEventsRequest = () => axios.get('http://localhost:4000/getAllEvents')

export const createEventRequest = (formData) => axios.post('http://localhost:4000/createEvent', formData)

export const createEventTicketsRequest = (formData) => axios.post('http://localhost:4000/createEventTickets', formData)

export const updateEventRequest = (formData) => axios.post('http://localhost:4000/updateEvent', formData)

export const updateTicketsRequest = (formData) => axios.post('http://localhost:4000/updateTickets', formData)

export const getProdsRequest = (userId) => axios.get(`http://localhost:4000/my_productions/${userId}`)

export const getOneProdRequest = (prodId) => axios.get(`http://localhost:4000/get_prod/${prodId}`)

export const getEventToBuyRequest = (prodId) => axios.get(`http://localhost:4000/buy_tickets/${prodId}`)

export const buyTicketsRequest = (quantities) => axios.post('http://localhost:4000/buy', quantities)