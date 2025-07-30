import './App.css'
import Register from './components/register/register'
import Login from './components/login/login'
import CreateEventForm from './components/createEventForm/createEventForm'
import Home from './components/home/home'
import Nav from './components/nav/nav'
import Footer from './components/footer/footer'
import Profile from './components/profile/profile'
import Productions from './components/productions/productions'
import EditProd from './components/editProd/editProd'
import BuyTicket from './components/buyTicket/buyTicket'
import TicketQr from './components/ticketqr/ticketqr'
import Staff from './components/editProd/staff/staff'
import SendFree from './components/sendFree/sendFree'
import RRPPEvents from './components/rrppEvents/rrppEvents'
import Statistics from './components/statistics/statistics'
import Contact from './components/contact/contact'
import RecoverPass from './components/recoverPass/recoverPass'
import {BrowserRouter, Routes, Route} from 'react-router'
import { UserContextProvider } from './context/userContext'

function App() {
  return (
    <>
    <BrowserRouter>
      <UserContextProvider>
        <Nav></Nav>
          <Routes>
            <Route path="/" element={<Login/>}></Route>
            <Route path="/register" element={<Register/>}></Route>
            <Route path="/recover_password" element={<RecoverPass/>}></Route>
            <Route path="/home" element={<Home/>}></Route>
            <Route path="/contact" element={<Contact/>}></Route>
            <Route path="/create_event" element={<CreateEventForm/>}></Route>
            <Route path="/profile" element={<Profile/>}></Route>
            <Route path='/productions' element={<Productions/>}></Route>
            <Route path='/editar_evento/:prodId' element={<EditProd/>}></Route>
            <Route path='/buy_tickets/:prodId/:emailHash?' element={<BuyTicket/>}></Route>
            <Route path='/editar_evento/staff/:prodId' element={<Staff/>}></Route>
            <Route path='/get_my_rrpp_events/:mail' element={<RRPPEvents/>}></Route>
            <Route path='/rrpp_get_event_free/:prodId/:mail' element={<SendFree/>}></Route>
            <Route path='/ticket/validate/:token' element={<TicketQr/>}></Route>
            <Route path='/statistics/:prodId/:userId' element={<Statistics/>}></Route>
          </Routes>
          <Footer></Footer>
      </UserContextProvider>
    </BrowserRouter>
    </>
  )
}

export default App
