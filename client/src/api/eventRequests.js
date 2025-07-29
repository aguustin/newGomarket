import axios from "axios";

/*export const getAllEventsRequest = () => axios.get('http://localhost:4000/getAllEvents')

export const createEventRequest = (formData) => axios.post('http://localhost:4000/createEvent', formData)

export const createEventTicketsRequest = (formData) => axios.post('http://localhost:4000/createEventTickets', formData)

export const updateEventRequest = (formData) => axios.post('http://localhost:4000/updateEvent', formData)

export const updateTicketsRequest = (formData) => axios.post('http://localhost:4000/updateTickets', formData)

export const getProdsRequest = (userId) => axios.get(`http://localhost:4000/my_productions/${userId}`)

//export const getStaffProdRequest = (prodId, userId) => axios.get((`http://localhost:4000/my_productions/${userId}`))

export const getOneProdRequest = (prodId, userId) => axios.get(`http://localhost:4000/get_prod/${prodId}/${userId}`)

export const getEventToBuyRequest = (prodId) => axios.get(`http://localhost:4000/buy_tickets/${prodId}`)

//export const buyTicketsRequest = (quantities, total, totalQuantity, mail, nombreEvento) => axios.post('http://localhost:4000/buy', {quantities, total, totalQuantity, mail, nombreEvento})

export const buyTicketsRequest = async (prodId, nombreEvento, quantities, mail, state, total, emailHash, nombreCompleto, dni) => { 
  try {
    const response = await axios.post('http://localhost:4000/buy', {
      prodId,
      nombreEvento,
      quantities,
      mail,
      state,
      total, 
      emailHash, 
      nombreCompleto,
      dni
    });

    return response.data;
  } catch (error) {
    console.error("Error creando la preferencia de pago", error);
    throw error;
  }

}

export const addRRPPRequest = async ({prodId, rrppMail, nombreEvento, eventImg}) => axios.post('http://localhost:4000/addRRPP', {prodId, rrppMail, nombreEvento, eventImg})

export const staffQrRequest = async (sendData) => axios.post('http://localhost:4000/sendQrStaff', sendData)

export const getInfoQrRequest = (eventId, ticketId) => axios.get(`http://localhost:4000/ticket/${eventId}/${ticketId}`)

export const getRRPPInfoRequest = (mail) => axios.get(`http://localhost:4000/get_my_rrpp_events/${mail}`)

export const getEventsFreesRequest = (prodId, mail) => axios.get(`http://localhost:4000/rrpp_get_event_free/${prodId}/${mail}`)

export const generateMyRRPPLinkRequest = ({prodId, rrppMail}) => axios.post('http://localhost:4000/generate_rrpp_url', {prodId, rrppMail})*/


export const getAllEventsRequest = () => axios.get(`${process.env.URL}/getAllEvents`)

export const createEventRequest = (formData) => axios.post(`${process.env.URL}/createEvent`, formData)

export const createEventTicketsRequest = (formData) => axios.post(`${process.env.URL}/createEventTickets`, formData)

export const updateEventRequest = (formData) => axios.post(`${process.env.URL}/updateEvent`, formData)

export const updateTicketsRequest = (formData) => axios.post(`${process.env.URL}/updateTickets`, formData)

export const getProdsRequest = (userId) => axios.get(`${process.env.URL}/my_productions/${userId}`)

//export const getStaffProdRequest = (prodId, userId) => axios.get((`${process.env.URL}/my_productions/${userId}`))

export const getOneProdRequest = (prodId, userId) => axios.get(`${process.env.URL}/get_prod/${prodId}/${userId}`)

export const getEventToBuyRequest = (prodId) => axios.get(`${process.env.URL}/buy_tickets/${prodId}`)

//export const buyTicketsRequest = (quantities, total, totalQuantity, mail, nombreEvento) => axios.post(`${process.env.URL}/buy`, {quantities, total, totalQuantity, mail, nombreEvento})

export const buyTicketsRequest = async (prodId, nombreEvento, quantities, mail, state, total, emailHash, nombreCompleto, dni) => { 
  try {
    const response = await axios.post(`${process.env.URL}/buy`, {
      prodId,
      nombreEvento,
      quantities,
      mail,
      state,
      total, 
      emailHash, 
      nombreCompleto,
      dni
    });

    return response.data;
  } catch (error) {
    console.error("Error creando la preferencia de pago", error);
    throw error;
  }

}

export const addRRPPRequest = async ({prodId, rrppMail, nombreEvento, eventImg}) => axios.post(`${process.env.URL}/addRRPP`, {prodId, rrppMail, nombreEvento, eventImg})

export const staffQrRequest = async (sendData) => axios.post(`${process.env.URL}/sendQrStaff`, sendData)

export const getInfoQrRequest = (eventId, ticketId) => axios.get(`${process.env.URL}/ticket/${eventId}/${ticketId}`)

export const getRRPPInfoRequest = (mail) => axios.get(`${process.env.URL}/get_my_rrpp_events/${mail}`)

export const getEventsFreesRequest = (prodId, mail) => axios.get(`${process.env.URL}/rrpp_get_event_free/${prodId}/${mail}`)

export const generateMyRRPPLinkRequest = ({prodId, rrppMail}) => axios.post(`${process.env.URL}/generate_rrpp_url`, {prodId, rrppMail})