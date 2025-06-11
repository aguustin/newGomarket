import axios from "axios";

export const getAllEventsRequest = () => axios.get('http://localhost:4000/getAllEvents')

export const createEventRequest = (formData) => axios.post('http://localhost:4000/createEvent', formData)

export const createEventTicketsRequest = (formData) => axios.post('http://localhost:4000/createEventTickets', formData)

export const updateEventRequest = (formData) => axios.post('http://localhost:4000/updateEvent', formData)

export const updateTicketsRequest = (formData) => axios.post('http://localhost:4000/updateTickets', formData)

export const getProdsRequest = (userId) => axios.get(`http://localhost:4000/my_productions/${userId}`)

//export const getStaffProdRequest = (prodId, userId) => axios.get((`http://localhost:4000/my_productions/${userId}`))

export const getOneProdRequest = (prodId) => axios.get(`http://localhost:4000/get_prod/${prodId}`)

export const getEventToBuyRequest = (prodId) => axios.get(`http://localhost:4000/buy_tickets/${prodId}`)

//export const buyTicketsRequest = (quantities, total, totalQuantity, mail, nombreEvento) => axios.post('http://localhost:4000/buy', {quantities, total, totalQuantity, mail, nombreEvento})

export const buyTicketsRequest = async (eventId, nombreEvento, quantities, total, totalQuantity, mail) => { 
  try {
    const response = await axios.post('http://localhost:4000/buy', {
      eventId,
      nombreEvento,
      quantities,
      total,
      totalQuantity,
      mail,
    });

    return response.data;
  } catch (error) {
    console.error("Error creando la preferencia de pago", error);
    throw error;
  }

}

export const staffQrRequest = async (sendData) => axios.post('http://localhost:4000/sendQrStaff', sendData)

export const getInfoQrRequest = (eventId, ticketId) => axios.get(`http://localhost:4000/ticket/${eventId}/${ticketId}`)