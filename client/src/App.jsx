import './App.css'
import Register from './components/register/register'
import Login from './components/login/login'
import {BrowserRouter, Routes, Route} from 'react-router'
import { UserContextProvider } from './context/userContext'
import CreateEventForm from './components/createEventForm/createEventForm'
function App() {

  return (
    <>
    <BrowserRouter>
      <UserContextProvider>
          <Routes>
            <Route path="/" element={<Login/>}></Route>
            <Route path="/register" element={<Register/>}></Route>
            <Route path="/create_event" element={<CreateEventForm/>}></Route>
          </Routes>
      </UserContextProvider>
    </BrowserRouter>
    </>
  )
}

export default App
