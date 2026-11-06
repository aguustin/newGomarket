import './App.css'
import { lazy, Suspense } from 'react'
//Etapa 13: cada pagina se descarga recien cuando se abre (la portada, la barra y el pie van en el paquete inicial)
import Home from './components/home/home'
import Nav from './components/nav/nav'
import Footer from './components/footer/footer'
import {BrowserRouter, Routes, Route, useLocation, matchPath, Navigate} from 'react-router'
import { leerSesion } from './api/http'
import { UserContextProvider } from './context/userContext'
import 'react-loading-skeleton/dist/skeleton.css';
import { ToastViewport } from './ui/toast'

const Register = lazy(() => import('./components/register/register'))
const Login = lazy(() => import('./components/login/login'))
const CreateEventForm = lazy(() => import('./components/createEventForm/createEventForm'))
const Profile = lazy(() => import('./components/profile/profile'))
const Productions = lazy(() => import('./components/productions/productions'))
const EditProd = lazy(() => import('./components/editProd/editProd'))
const BuyTicket = lazy(() => import('./components/buyTicket/buyTicket'))
const TicketQr = lazy(() => import('./components/ticketqr/ticketqr'))
const Staff = lazy(() => import('./components/editProd/staff/staff'))
const SendFree = lazy(() => import('./components/sendFree/sendFree'))
const RRPPEvents = lazy(() => import('./components/rrppEvents/rrppEvents'))
const Statistics = lazy(() => import('./components/statistics/statistics'))
const Contact = lazy(() => import('./components/contact/contact'))
const RecoverPass = lazy(() => import('./components/recoverPass/recoverPass'))
const Cortesies = lazy(() => import('./components/cortesies/cortesies'))
const NewCortesie = lazy(() => import('./components/newCortesie/newCortesie'))
const LegalConditions = lazy(() => import('./components/conditions/legalConditions'))
const MyFavoritesEvents = lazy(() => import('./components/myFavoritesEvents/myFavoritesEvents'))
const UserInfo = lazy(() => import('./components/userInfo/userInfo'))
const ProfileCards = lazy(() => import('./components/seeProfile/seeProfile'))
const BuyersList = lazy(() => import('./components/buyersList/buyersList'))
const PaymentResult = lazy(() => import('./components/paymentResult/paymentResult'))

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
      <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
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
      </Suspense>
      {!shouldHideNav && <Footer />}
      <ToastViewport />
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
