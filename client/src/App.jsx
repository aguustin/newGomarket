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
import {BrowserRouter, Routes, Route, useLocation, matchPath, Navigate} from 'react-router'
import { leerSesion } from './api/http'
import { UserContextProvider } from './context/userContext'
import Cortesies from './components/cortesies/cortesies'
import NewCortesie from './components/newCortesie/newCortesie'
import 'react-loading-skeleton/dist/skeleton.css';
import LegalConditions from './components/conditions/legalConditions'
import MyFavoritesEvents from './components/myFavoritesEvents/myFavoritesEvents'
import UserInfo from './components/userInfo/userInfo'
import ProfileCards from './components/seeProfile/seeProfile'
import BuyersList from './components/buyersList/buyersList'
import PaymentResult from './components/paymentResult/paymentResult'


//Paginas que necesitan sesion: sin sesion se va al login y, al ingresar, se vuelve a la pagina pedida
function ConSesion({ children }) {
  const location = useLocation();
  if (leerSesion()?.token) return children;
  const next = encodeURIComponent(location.pathname + location.search);
  return <Navigate to={`/login?sesion=requerida&next=${next}`} replace />;
}

function AppRoutes() {
  const location = useLocation();
  const hideNavOnPaths = ['/login', '/register', '/recover_password', '/recover_password/:token'];
  const shouldHideNav = hideNavOnPaths.some(path =>
  matchPath({ path, end: true }, location.pathname)
);

  return (
    <>
      {!shouldHideNav && <Nav />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/recover_password/:token" element={<RecoverPass />} />
        <Route path="/see_profile/:userId" element={<ProfileCards />} />
        <Route path="/user_info" element={<ConSesion><UserInfo/></ConSesion>} />
        <Route path="/my_favorites_events" element={<ConSesion><MyFavoritesEvents /></ConSesion>} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/create_event" element={<ConSesion><CreateEventForm /></ConSesion>} />
        <Route path="/profile" element={<ConSesion><Profile /></ConSesion>} />
        <Route path="/productions" element={<ConSesion><Productions /></ConSesion>} />
        <Route path="/editar_evento/:prodId" element={<ConSesion><EditProd /></ConSesion>} />
        <Route path="/buy_tickets/:prodId/:emailHash?" element={<BuyTicket />} />
        <Route path="/editar_evento/staff/:prodId" element={<ConSesion><Staff /></ConSesion>} />
        <Route path="/get_my_rrpp_events/:mail" element={<ConSesion><RRPPEvents /></ConSesion>} />
        <Route path="/get_buyers/:prodId" element={<ConSesion><BuyersList/></ConSesion>} />
        <Route path="/rrpp_get_event_free/:prodId/:mail" element={<ConSesion><SendFree /></ConSesion>} />
        <Route path="/ticket/validate/:token" element={<TicketQr />} />
        <Route path="/payment_result" element={<PaymentResult />} />
        <Route path="/statistics/:prodId/:userId" element={<ConSesion><Statistics /></ConSesion>} />
        <Route path="/cortesies/:prodId" element={<ConSesion><Cortesies /></ConSesion>} />
        <Route path="/new_excel/:prodId" element={<ConSesion><NewCortesie /></ConSesion>} />
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
