export const Message = (props) => {
    return(
        <div className="msg fixed top-10 mx-auto">
            <p className="text-white">{props.text}</p>
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