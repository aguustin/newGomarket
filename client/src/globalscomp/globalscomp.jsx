import { useEffect, useState } from "react";
import ipassBanckground from "../assets/images/fondoB.jpeg"
import { useNavigate } from "react-router";
import timerPng from "../assets/images/timer.png"
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

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
    
    return <div className="text-center text-gray-300!">
      <p className="mb-3">Tiempo restante para la compra:</p>
      <div className="flex items-center justify-center text-yellow-500! text-2xl">
        <svg className="mr-2" fill="oklch(76.9% 0.188 70.08)" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="32px" height="32px" viewBox="0 0 70 70" enable-background="new 0 0 70 70" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M58.806,13.644l2.813-2.813l1.656,1.656c0.391,0.391,0.902,0.586,1.414,0.586s1.023-0.195,1.414-0.586 c0.781-0.781,0.781-2.047,0-2.828l-6-6c-0.781-0.781-2.047-0.781-2.828,0s-0.781,2.047,0,2.828l1.516,1.516l-2.841,2.841 C50.332,5.963,43.008,3,35,3c-7.98,0-15.281,2.943-20.892,7.792l-3.036-3.036l1.342-1.342c0.781-0.781,0.781-2.047,0-2.828 s-2.047-0.781-2.828,0l-6,6c-0.781,0.781-0.781,2.047,0,2.828C3.977,12.805,4.488,13,5,13s1.023-0.195,1.414-0.586l1.83-1.83 l3.001,3.001C6.124,19.261,3,26.772,3,35c0,17.645,14.355,32,32,32s32-14.355,32-32C67,26.8,63.896,19.313,58.806,13.644z M55.49,54.076l-1.398-1.398c-0.391-0.391-1.023-0.391-1.414,0s-0.391,1.023,0,1.414l1.398,1.398 c-4.868,4.533-11.351,7.349-18.493,7.495v-2.34c0-0.553-0.447-1-1-1s-1,0.447-1,1v2.318c-6.813-0.339-12.981-3.117-17.659-7.474 l1.398-1.398c0.391-0.391,0.391-1.023,0-1.414s-1.023-0.391-1.414,0l-1.398,1.398c-4.534-4.868-7.349-11.351-7.496-18.493h1.914 c0.553,0,1-0.447,1-1s-0.447-1-1-1H7.036c0.34-6.813,3.118-12.98,7.475-17.658l1.397,1.397c0.195,0.195,0.451,0.293,0.707,0.293 s0.512-0.098,0.707-0.293c0.391-0.391,0.391-1.023,0-1.414l-1.397-1.397c4.678-4.357,10.845-7.135,17.658-7.475v1.61 c0,0.553,0.447,1,1,1s1-0.447,1-1V7.015c7.142,0.146,13.625,2.962,18.492,7.496l-1.397,1.397c-0.391,0.391-0.391,1.023,0,1.414 c0.195,0.195,0.451,0.293,0.707,0.293s0.512-0.098,0.707-0.293l1.397-1.397c4.357,4.678,7.136,10.845,7.475,17.658h-2.035 c-0.553,0-1,0.447-1,1s0.447,1,1,1h2.057C62.839,42.726,60.023,49.208,55.49,54.076z"></path> <path d="M39.35,37.936c0.568-0.838,0.9-1.849,0.9-2.936c0-1.951-1.083-3.638-2.667-4.542v-9.951c0-1.837-1.29-3.223-3-3.223 s-3,1.386-3,3.223v10.139c0,0.122,0.029,0.236,0.069,0.345C30.5,31.954,29.75,33.384,29.75,35c0,1.021,0.305,1.967,0.812,2.774 L19.668,48.668c-0.391,0.391-0.391,1.023,0,1.414c0.195,0.195,0.451,0.293,0.707,0.293s0.512-0.098,0.707-0.293l10.845-10.845 c0.866,0.63,1.922,1.013,3.073,1.013c1.087,0,2.097-0.332,2.936-0.9l3.857,3.857c0.195,0.195,0.451,0.293,0.707,0.293 s0.512-0.098,0.707-0.293c0.391-0.391,0.391-1.023,0-1.414L39.35,37.936z M33.583,20.507c0-0.564,0.262-1.223,1-1.223 s1,0.658,1,1.223v9.302C35.389,29.787,35.2,29.75,35,29.75c-0.494,0-0.963,0.091-1.417,0.219V20.507z M31.75,35 c0-1.795,1.455-3.25,3.25-3.25s3.25,1.455,3.25,3.25c0,0.889-0.358,1.692-0.937,2.279c-0.006,0.006-0.015,0.008-0.021,0.014 s-0.008,0.015-0.014,0.021C36.692,37.892,35.889,38.25,35,38.25C33.205,38.25,31.75,36.795,31.75,35z"></path> </g> </g></svg>
       {getFormattedTime(time)}
      </div>
    </div>
}

export default function FadeInImage({ src, alt, className }) {
    const [loaded, setLoaded] = useState(false);
    
    return (
        <div className="relative">
            {/* Imagen de fondo por defecto */}
            <img
                src={ipassBanckground}
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



export const MapComponent = ({ provincia, direccion }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyCkG-UlLJza07eEo_nQylQULUjL4pc83aY',
    libraries: ['places'],
  });

  const [center, setCenter] = useState({ lat: 0, lng: 0 });
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (isLoaded) {
      const geocoder = new window.google.maps.Geocoder();

      geocoder.geocode({ address: `${provincia}, ${direccion}` }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          setCenter({ lat, lng });
          const url = `https://www.google.com/maps?q=${lat},${lng}`;
          setShareUrl(url);
        } else {
          console.error('Error en geocodificación:', status);
        }
      });
    }
  }, [isLoaded, provincia, direccion]);

  const handleShare = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => alert('Enlace copiado al portapapeles'))
        .catch(err => console.error('Error al copiar el enlace:', err));
    }
  };

  return isLoaded ? (
    <div>
      <GoogleMap
        center={center}
        zoom={15}
        mapContainerStyle={{ width: '100%', height: '200px' }}
      >
        <Marker position={center} />
      </GoogleMap>
      {shareUrl && (
        <>
          <button onClick={handleShare}>Compartir mapa</button>
          <p>
            <a href={shareUrl} target="_blank" rel="noopener noreferrer">
              Ver en Google Maps
            </a>
          </p>
        </>
      )}
    </div>
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