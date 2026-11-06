import { useEffect, useState } from "react";
import { Link } from "react-router";
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { toast } from "../ui/toast";

//Utilidades compartidas que siguen en uso despues del rediseño (el resto paso a src/ui/).

export const EventoNoDisponible = () => (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-line bg-surface-2 text-brand-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="size-6" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>
        </div>
        <h1 className="text-xl font-semibold text-fg">Este evento no está disponible</h1>
        <p className="mt-2 max-w-sm text-[15px] text-muted">No existe o no lo creaste vos. Solo el dueño del evento puede gestionarlo.</p>
        <Link className="mt-6 inline-flex h-11 items-center rounded-xl border border-line bg-surface-2 px-5 text-[15px] font-semibold text-fg transition-colors hover:bg-surface-3" to="/productions">Ir a mis producciones</Link>
    </main>
)

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
        .then(() => toast.success('Enlace del mapa copiado'))
        .catch(err => console.error('Error al copiar el enlace:', err));
    }
  };

  return isLoaded ? (
    <div>
      <GoogleMap
        center={center}
        zoom={15}
        mapContainerStyle={{ width: '100%', height: '240px' }}
      >
        <Marker position={center} />
      </GoogleMap>
      {shareUrl && (
        <div className="flex flex-wrap gap-2 p-3">
          <button type="button" onClick={handleShare} className="inline-flex h-9 items-center rounded-lg border border-line bg-surface-2 px-3.5 text-sm font-medium text-fg transition-colors hover:bg-surface-3">Copiar ubicación</button>
          <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-lg px-3.5 text-sm font-medium text-brand-300 transition-colors hover:bg-surface-2">Abrir en Google Maps</a>
        </div>
      )}
    </div>
  ) : (
    <p className="p-4 text-sm text-muted">Cargando mapa…</p>
  );
};

export const formatearFechaParaInput = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM
}
