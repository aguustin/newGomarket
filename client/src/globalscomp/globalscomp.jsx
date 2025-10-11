import { useEffect, useState } from "react";
import defaultImage from "../assets/LogoPrueba.jpg"
import { useNavigate } from "react-router";
import timerPng from "../assets/images/timer.png"
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

export const Timer = ({duration}) => {
    const [time, setTime] = useState(duration)
    const navigation = useNavigate()

    useEffect(() => {
        setTimeout(() => {
            setTime(time - 1000)
        }, 1000)
        if(time === 0){
            navigation('/home')
        }
    }, [time])

    const getFormattedTime = (miliseconds) => {
        let total_seconds = parseInt(Math.floor(miliseconds / 1000))
        let total_minutes = parseInt(Math.floor(total_seconds / 60))

        let seconds = parseInt(total_seconds % 60)
        let minutes = parseInt(total_minutes % 60)

        return `${minutes}:${seconds}`
    }
    
    return <div className="text-center mt-6 text-orange-600! text-4xl flex items-center justify-center"><img src={timerPng} alt="" className="mr-2"></img>{getFormattedTime(time)}</div>
}

export default function FadeInImage({ src, alt, className }) {
    const [loaded, setLoaded] = useState(false);
    //const defaultImage = "../assets/LogoPrueba.jpg";
    
    return (
        <div className="relative">
            {/* Imagen de fondo por defecto */}
            <img
                src={defaultImage}
                alt="placeholder"
                className={`absolute top-0 left-0 w-full h-[240px]! object-cover object-top ${loaded ? "opacity-0" : "opacity-100"} transition-opacity duration-800`}
                loading="lazy"/>
            {/* Imagen real con fade-in */}
            <img
                src={src}
                alt={alt}
                onLoad={() => setLoaded(true)}
                className={`w-full h-[240px]! object-cover object-top transition-opacity duration-800 ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
                loading="lazy"/>
        </div>
    );
}

export const Message = (props) => {
    return(
        <div className="msg fixed top-10 mx-auto bg-red-900">
            <p className="text-white"></p>
        </div>
    )
}

export const truncarConElipsis = (texto, limite = 100) => {
  if (texto.length <= limite) return texto; // No se trunca, no hay elipsis
  return texto.slice(0, limite).trim() + '...';
}

export const formatDate = (isoString) => {
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${year}/${month}/${day}  ${hours}:${minutes}`;
};

export const formatDateB = (isoString) => {
  const date = new Date(isoString);

  const day = date.getDate(); // sin ceros al inicio
  const monthNames = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${year}, ${hours}:${minutes}`;
};



export const MapComponent = ({provincia, direccion}) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyCkG-UlLJza07eEo_nQylQULUjL4pc83aY',
    libraries: ['places'],
  });

  const [center, setCenter] = useState({ lat: 0, lng: 0 });

  useEffect(() => {
    if (isLoaded) {
      const geocoder = new window.google.maps.Geocoder();

      geocoder.geocode({ address: `${provincia}, ${direccion}`}, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          setCenter({
            lat: location.lat(),
            lng: location.lng()
          });
        } else {
          console.error('Error en geocodificación:', status);
        }
      });
    }
  }, [isLoaded]);

  return isLoaded ? (
    <GoogleMap
      center={center}
      zoom={12}
      mapContainerStyle={{ width: '100%', height: '200px' }}
    />
  ) : (
    <p>Cargando mapa...</p>
  );
};

export const formatearFechaParaInput = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
}

export const convertirInputADateTimeLocal = (inputString) => {
    return new Date(inputString).toISOString(); // Devuelve algo como "2025-08-22T14:30:00.000Z"
}

export const formatNumber = (num) => {
    let truncated = Math.floor(num * 100) / 100;
    return truncated.toString();
}


export const LoadingDiv = () => {
    <div className="mx-auto flex justify-center fixed h-screen" role="status">
        <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-violet-400 fill-blue-900" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
        </svg>
        <span className="sr-only">Loading...</span>
        <p className="text-xl text-violet-600! mt-3">Actualizando datos del evento!</p>   
    </div>
}

export const LoadingButton = () => {
    return(
        <div className="mx-auto flex justify-center w-full" role="status">
            <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-white-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
            </svg>
            <span className="sr-only">Loading...</span>
        </div>
    )
}

export const CrearTicketForm = () => {
    return(
        <>
        </>
    )
}