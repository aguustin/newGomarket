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
import {BrowserRouter, Routes, Route, useLocation} from 'react-router'
import { UserContextProvider } from './context/userContext'
import Cortesies from './components/cortesies/cortesies'
import NewCortesie from './components/newCortesie/newCortesie'
import 'react-loading-skeleton/dist/skeleton.css';
import LegalConditions from './components/conditions/legalConditions'
import MyFavoritesEvents from './components/myFavoritesEvents/myFavoritesEvents'

function AppRoutes() {
  const location = useLocation();
  const hideNavOnPaths = ['/', '/register', '/recover_password'];
  const shouldHideNav = hideNavOnPaths.includes(location.pathname);

  return (
    <>
      {!shouldHideNav && <Nav />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/recover_password" element={<RecoverPass />} />
        <Route path="/home" element={<Home />} />
        <Route path="/my_favorites_events" element={<MyFavoritesEvents />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/create_event" element={<CreateEventForm />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/productions" element={<Productions />} />
        <Route path="/editar_evento/:prodId" element={<EditProd />} />
        <Route path="/buy_tickets/:prodId/:emailHash?" element={<BuyTicket />} />
        <Route path="/editar_evento/staff/:prodId" element={<Staff />} />
        <Route path="/get_my_rrpp_events/:mail" element={<RRPPEvents />} />
        <Route path="/rrpp_get_event_free/:prodId/:mail" element={<SendFree />} />
        <Route path="/ticket/validate/:token" element={<TicketQr />} />
        <Route path="/statistics/:prodId/:userId" element={<Statistics />} />
        <Route path="/cortesies/:prodId" element={<Cortesies />} />
        <Route path="/new_excel/:prodId" element={<NewCortesie />} />
        <Route path="/conditions" element={<LegalConditions />} />
      </Routes>
      <Footer />
    </>
  );
}

function App() {

  return (
    <BrowserRouter>
      <UserContextProvider>
        <AppRoutes />
      </UserContextProvider>
    </BrowserRouter>
  );
}

export default App
