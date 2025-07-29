import { useState } from "react";
import defaultImage from "../assets/LogoPrueba.jpg"


export default function FadeInImage({ src, alt, className }) {
    const [loaded, setLoaded] = useState(false);
    //const defaultImage = "../assets/LogoPrueba.jpg";
    
    return (
        <div className="relative">
            {/* Imagen de fondo por defecto */}
            <img
                src={defaultImage}
                alt="placeholder"
                className={`absolute top-0 left-0 w-full h-[300px] object-cover rounded-lg ${loaded ? "opacity-0" : "opacity-100"} transition-opacity duration-800`}
                />
            {/* Imagen real con fade-in */}
            <img
                src={src}
                alt={alt}
                onLoad={() => setLoaded(true)}
                className={`w-full h-[300px] object-cover rounded-lg transition-opacity duration-800 ${loaded ? "opacity-100" : "opacity-0"} ${className}`}
                />
        </div>
    );
}

export const Message = (props) => {
    return(
        <div className="msg fixed top-10 mx-auto bg-red-900">
            <p className="text-white">saddddddddddddddddddddddddddddddddddddd</p>
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

export const formatNumber = (num) => {
    let truncated = Math.floor(num * 100) / 100;
    return truncated.toString();
}