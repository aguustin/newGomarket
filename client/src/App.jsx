import './App.css'
import Register from './components/register/register'
import Login from './components/login/login'
import {BrowserRouter, Routes, Route} from 'react-router'
import { UserContextProvider } from './context/userContext'
import CreateEventForm from './components/createEventForm/createEventForm'
import Home from './components/home/home'
import Nav from './components/nav/nav'
import Profile from './components/profile/profile'
import Productions from './components/productions/productions'
import EditProd from './components/editProd/editProd'

function App() {
  return (
    <>
    <BrowserRouter>
      <UserContextProvider>
        <Nav></Nav>
          <Routes>
            <Route path="/" element={<Login/>}></Route>
            <Route path="/register" element={<Register/>}></Route>
            <Route path="/home" element={<Home/>}></Route>
            <Route path="/create_event" element={<CreateEventForm/>}></Route>
            <Route path="/profile" element={<Profile/>}></Route>
            <Route path='/productions' element={<Productions/>}></Route>
            <Route path='/editar_evento/:prodId' element={<EditProd/>}></Route>
          </Routes>
      </UserContextProvider>
    </BrowserRouter>
    </>
  )
}

export default App
