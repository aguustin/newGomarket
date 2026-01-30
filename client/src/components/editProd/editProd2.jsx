import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  addRRPPRequest,
  cancelarEventoRequest,
  createDiscountCodeRequest,
  createEventTicketsRequest,
  getOneProdRequest,
  getProdsRequest,
  reactivarEventoRequest,
  relateEventsRequest,
  soldOutEventRequest,
  updateEventRequest,
  updateTicketsRequest,
} from "../../api/eventRequests";
import { useRef } from "react";
import { Country, State, City } from "country-state-city";
import { nanoid } from 'nanoid';
import {
  convertirInputADateTimeLocal,
  formatDate,
  formatDateB,
  formatearFechaParaInput,
  LoadingButton,
} from "../../globalscomp/globalscomp";
import qrCodePng from "../../assets/images/qr-code.png";
import ticketPng from "../../assets/images/ticket.png";
import UserContext from "../../context/userContext";
import addedTicket from "../../assets/images/added-ticket.png";
import uploadPng from "../../assets/botones/upload.png";
import megaphonePng from "../../assets/images/megaphone.png";
import updatePng from "../../assets/images/update.png";
import calendarPng from "../../assets/images/calendar.png";
import ticketCantPng from "../../assets/images/ticket-cant.png";
import cancelPng from "../../assets/images/cancel.png";
import cancelEventPng from "../../assets/images/cancel-event.png";
import eraserPng from "../../assets/images/eraser.png";
import megaphoneBPng from "../../assets/images/megaphoneB.png";
import nextPng from "../../assets/images/next.png";
import warningBPng from "../../assets/warningB.png";
import goPng from "../../assets/goticketImgs/GOT SIN FONDO.png";

const EditProd = () => {
  const { session } = useContext(UserContext);
  const { prodId } = useParams();
  const fileRef = useRef(null);
  const fileRefBanner = useRef(null);
  const fileRefDescriptiveImg = useRef(null);
  const fileRefsB = useRef({});
  const estadoRef = useRef();
  const [closeDate, setCloseDate] = useState();
  const [prod, setProd] = useState([]);
  const [ticketData, setTicketData] = useState({});
  const [eventosEditados, setEventosEditados] = useState({});
  const [visibilidad, setVisibilidad] = useState();
  const [message, setMessage] = useState(0);
  const [dateMessage, setDateMessage] = useState(0);
  const [estado, setEstado] = useState(1);
  const [distribution, setDistribution] = useState(0);
  const [width, setWidth] = useState(null);
  const [showEventInfo, setShowEventInfo] = useState(true);
  const [openTicketId, setOpenTicketId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [loadingCreateTicket, setLoadingCreateTicket] = useState(false);
  const [showCreateTicketForm, setShowCreateTicketForm] = useState(false);
  const [showCreateDiscountForm, setShowCreateDiscountForm] = useState(false);
  const [idDiscount, setIdDiscount] = useState()
  const [eventVisibility, setEventVisibility] = useState();
  const [cities, setCities] = useState([]);
  const [localidad, setLocalidad] = useState(null);
  const [cancelAlert, setCancelAlert] = useState(false);
  const [previewBanner, setPreviewBanner] = useState(null);
  const [previewDescriptive, setPreviewDescriptive] = useState(null);
  const [othersProds, setOthersProds] = useState([]);
  const [showOthersProds, setShowOthersProds] = useState(false);
  const [relacionesLocales, setRelacionesLocales] = useState([]);
  const [changeButton, setChangeButton] = useState(false);
  const [previewPortada, setPreviewPortada] = useState(null);
  const [showSoldOutAdv, setShowSoldOutAdv] = useState(false);
  const [isSoldOut, setIsSoldOut] = useState(null);
  const [showDesc, setShowDesc] = useState(false);
  const [changeTDLayout, setChangeTDLayout] = useState(false)
  const [discounts, setDiscounts] = useState([])

  useEffect(() => {
    const userId = session?.userFinded?.[0]?._id;
    const getOneProd = async () => {
      const res = await getOneProdRequest(prodId, userId); //userId va la session del usuario
      setProd(res.data.tickets);
      setDiscounts(res.data.prodDiscount)
      const othersRes = await getProdsRequest(userId);
      setOthersProds(othersRes.data);
      setCities(
        City?.getCitiesOfState(
          res?.data[0]?.codigoPais,
          res?.data[0]?.codigoCiudad
        )
      );
    };
    getOneProd();
    console.log(prod)
    const mediaQuery = window.matchMedia("(min-width: 1290px)");
    const mediaQueryB = window.matchMedia("(min-width: 890px)");

    const handleResize = () => {
      setWidth(mediaQuery.matches ? 1290 : 1289);
      setShowEventInfo(mediaQueryB.matches ? 890 : 889);
    };
    handleResize(); // valor inicial
    mediaQuery.addEventListener("change", handleResize);

    return () => mediaQuery.removeEventListener("change", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (prod && prod[0]) {
      setIsSoldOut(prod[0]?.soldOut || false);
    }
  }, [prod]);

  useEffect(() => {
    /*if (message === 5) {
      alert("El evento se actualizó exitosamente!");
      setMessage(null); // reiniciamos para que no se vuelva a disparar
    }*/
  }, [message]);

  if (width === null) return null;


  const updateEvent = async (
    e,
    eventId,
    imgEvento,
    nombreEvento,
    descripcionEvento,
    aviso,
    eventoEdad,
    artistas,
    montoVentas,
    fechaInicio,
    fechaFin,
    tipoEvento,
    provincia,
    localidad,
    direccion,
    lugarEvento,
    bannerEvento,
    imagenDescriptiva
  ) => {
    e.preventDefault();
    setLoading(true);
    // Obtenemos los datos editados si existen
    const edited = eventosEditados[eventId] || {};

    // Parseamos las fechas para validación
    const fechaInicioFinal = new Date(edited.fechaInicio ?? fechaInicio);
    const fechaFinFinal = new Date(edited.fechaFin ?? fechaFin);
    const now = new Date();

    // Validación de fechas
    if (fechaInicioFinal < now) {
      setLoading(false);
      setDateMessage(1);
      return;
    }

    if (fechaFinFinal < fechaInicioFinal) {
      setLoading(false);
      setDateMessage(2);
      return;
    }

    // Armamos el FormData
    const formData = new FormData();

    // Imagen: si se subió una nueva, usamos esa. Si no, usamos la existente (URL).
    if (fileRef.current?.files?.[0]) {
      formData.append("imgEvento", fileRef?.current?.files[0]);
    } else {
      formData.append("imgEvento", imgEvento);
    }

    // Agregamos los campos, usando el editado o el original
    formData.append("eventId", eventId);
    formData.append("nombreEvento", edited.nombreEvento ?? nombreEvento);
    formData.append(
      "codigoPais",
      localidad.countryCode ?? cities[0]?.countryCode
    ); //cambiado ahora el 22/09/2025
    formData.append(
      "codigoCiudad",
      localidad.stateCode ?? cities[0]?.stateCode
    ); //cambiado ahora el 22/09/2025
    formData.append(
      "descripcionEvento",
      edited.descripcionEvento ?? descripcionEvento
    );
    formData.append("aviso", aviso ?? edited.aviso);
    formData.append("eventoEdad", eventoEdad ?? edited.eventoEdad ?? '');

    formData.append("artistas", edited.artistas ?? artistas);
    formData.append("montoVentas", edited.montoVentas ?? montoVentas);

    formData.append("fechaInicio", fechaInicioFinal); //.toISOString
    formData.append("fechaFin", fechaFinFinal); //.toISOString
    formData.append("provincia", edited.provincia ?? provincia);

    formData.append("tipoEvento", eventVisibility ?? tipoEvento);

    formData.append("localidad", edited.localidad ?? localidad);
    formData.append("direccion", edited.direccion ?? direccion);
    formData.append("lugarEvento", edited.lugarEvento ?? lugarEvento);

    if (fileRefBanner.current?.files?.[0]) {
      formData.append("bannerEvento", fileRefBanner.current.files[0]);
    } else {
      formData.append("bannerEvento", bannerEvento ?? null);
    }

    if (fileRefDescriptiveImg.current?.files?.[0]) {
      formData.append(
        "imagenDescriptiva",
        fileRefDescriptiveImg.current.files[0]
      );
    } else {
      formData.append("imagenDescriptiva", imagenDescriptiva ?? null);
    }

    // Enviar al backend
    try {
      const res = await updateEventRequest(formData);

      if (res.data.state > 0) {
        setLoading(false);
        setMessage(5);
      }
    } catch (error) {
      console.error("Error al actualizar evento:", error);
      setLoading(false);
    }
  };

  const editEventTicket = async (
    e,
    ticketId,
    imgTicket,
    nombreTicket,
    descripcionTicket,
    precio,
    cantidad,
    limit,
    fechaDeCierre,
    visibilidad
  ) => {
    e.preventDefault();
    setTicketLoading(true);
    const formData = new FormData();
    const fileInput = fileRefsB.current[ticketId];
    const estado = parseInt(estadoRef.current.value);

    if (fileInput?.files?.[0]) {
      formData.append("imgTicket", fileInput.files[0]);
    } else {
      formData.append("imgTicket", imgTicket);
    }

    if (estado === 3) {
      precio === 0;
    }

    const dataToUpdate = ticketData[ticketId];
    formData.append("ticketId", ticketId);
    formData.append("nombreTicket", dataToUpdate?.nombreTicket ?? nombreTicket);
    formData.append(
      "descripcionTicket",
      dataToUpdate?.descripcionTicket ?? descripcionTicket
    );
    formData.append("precio", dataToUpdate?.precio ?? precio ?? '');
    formData.append("cantidad", dataToUpdate?.cantidad ?? cantidad);
    formData.append("limit", dataToUpdate?.limit ?? limit);
    formData.append(
      "fechaDeCierre",
      dataToUpdate?.fechaDeCierre ?? fechaDeCierre
    );
    formData.append("visibilidad", dataToUpdate?.visibilidad ?? visibilidad);
    formData.append("estado", estado);
    const res = await updateTicketsRequest(formData);

    if (res.data.estado > 0) {
      setMessage(3);
      setTicketLoading(false);
      setTimeout(() => {
        setMessage(0);
      }, 4000);
    }
  };

  const handleChangeEvento = (e, id, field) => {
    const rawValue = e.target.value;
    const value =
      field === "fechaInicio" || field === "fechaFin"
        ? convertirInputADateTimeLocal(rawValue)
        : rawValue;

    setEventosEditados((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const createEventTickets = async (e) => {
    e.preventDefault();
    setLoadingCreateTicket(true);
    const estado = parseInt(estadoRef.current.value);

    const formData = new FormData();
    formData.append("prodId", prodId);
    formData.append("nombreTicket", e.target.elements.nombreTicket.value);
    formData.append(
      "descripcionTicket",
      e.target.elements.descripcionTicket.value ?? ''
    );
    formData.append(
      "precio",
      estado === 3 ? 0 : e.target.elements.precio.value
    );
    formData.append("cantidad", e.target.elements.cantidad.value);
    formData.append("fechaDeCierre", new Date(closeDate));
    formData.append("imgTicket", e.target.elements.imgTicket.files[0]);
    formData.append("visibilidad", visibilidad);
    formData.append("distribution", distribution);
    formData.append("limit", e.target.elements?.limit?.value);
    formData.append("estado", estado);
    const res = await createEventTicketsRequest(formData);
    setVisibilidad();
    if (res.data.estado > 0) {
      setMessage(2);
      setChangeButton(true);
      setLoadingCreateTicket(false);
      e.target.reset();
      setTimeout(() => {
        setMessage(0);
      }, 3000)
    }
  };

  const createDiscountCode = async (e) => {
    e.preventDefault()
    const cantidadDescuentos = e.target.elements.cantidadDescuentos.value
    const numeroDescuento = e.target.elements.numeroDescuento.value
    console.log(prodId, idDiscount, cantidadDescuentos, numeroDescuento)
    const res = await createDiscountCodeRequest({ prodId, idDiscount, cantidadDescuentos, numeroDescuento })
    console.log(res)
    if (res.data.message.length > 0) {
      alert(res.data.message)
      setLoadingCreateTicket(false);
      e.target.reset();
      setTimeout(() => {
        setMessage(0);
      }, 3000)
    }
    nanoid('')
  }

  const addRRPP = async (e) => {
    e.preventDefault();
    const rrppMail = e.target.elements.rrppMail.value;
    const nombreEvento = prod[0]?.nombreEvento;
    const eventImg = prod[0]?.imgEvento;
    const res = await addRRPPRequest({
      prodId,
      rrppMail,
      nombreEvento,
      eventImg,
    });

    if (res.data.msg === 1) {
      setMessage(1);
      setTimeout(() => setMessage(0), 3000);
    } else {
      setMessage(4);
      setTimeout(() => setMessage(0), 5000);
    }
  };

  const showTicketFunc = async (e, ticketId) => {
    e.preventDefault();
    openTicketId === ticketId
      ? setOpenTicketId(null)
      : setOpenTicketId(ticketId);
  };

  const cancelarEvento = async (prodId) => {
    await cancelarEventoRequest({ prodId });
    alert('Tu evento fue dado de baja!')
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreviewPortada(imageUrl);
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreviewBanner(imageUrl);
    }
  };

  const handleDescriptiveChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreviewDescriptive(imageUrl);
    }
  };

  const relateEvents = async (e, prodId, otherId) => {
    e.preventDefault();
    const res = await relateEventsRequest({ prodId, otherId });
    if (res.data.msg === 2) {
      setRelacionesLocales((prev) => [...prev, otherId]);
      return setMessage(6);
    }
    setRelacionesLocales((prev) => prev.filter((id) => id !== otherId));
    return setMessage(7);
  };

  const soldOutFunc = (e) => {
    setIsSoldOut(e.target.checked);
  };

  const soldOutEvent = async () => {
    if (isSoldOut !== null) {
      const res = await soldOutEventRequest({ prodId, isSoldOut });
      if (res.data.ok === 1) {
        console.log("Cambiado");
      }
    }
  };

  const reactivarEvento = async (prodId) => {
    await reactivarEventoRequest({ prodId });
    alert('Tu evento fue resubido!')
  }
  
  return (
    <div 
      className="
        min-h-screen 
        bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 
        p-4 md:p-8
      "
    >
      <div className="max-w-7xl mx-auto">
        <div 
          className="
            bg-gray-800/80 backdrop-blur-sm 
            border border-gray-700/50 
            rounded-3xl shadow-2xl 
            overflow-hidden
          "
        >
          
          {/* Title Bar */}
          <div 
            className="
              bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 
              p-8
            "
          >
            <h2 
              className="
                text-gray-900 text-center 
                text-3xl font-bold 
                tracking-tight
              "
            >
              Editar Evento
            </h2>
          </div>

          {/* Main Content */}
          <div className="p-6 md:p-8">
            
            {/* Event Header Section */}
            <div 
              className="
                grid md:grid-cols-[300px_1fr] 
                gap-8 mb-8
              "
            >
              
              {/* Event Image */}
              <div className="relative group">
                <img
                  className="
                    w-full h-64 
                    object-cover rounded-2xl 
                    shadow-lg 
                    ring-2 ring-amber-500/20 
                    transition-transform 
                    group-hover:scale-105
                  "
                  src={previewPortada ?? p.imgEvento}
                  alt="Event"
                />
                <div 
                  className="
                    absolute inset-0 
                    bg-gradient-to-t from-black/60 to-transparent 
                    rounded-2xl 
                    opacity-0 group-hover:opacity-100 
                    transition-opacity
                  " 
                />
              </div>

              {/* Event Info */}
              <div className="space-y-6">
                <div>
                  <h3 
                    className="
                      text-3xl font-bold 
                      text-gray-100 
                      mb-2
                    "
                  >
                    {mockEvent.nombreEvento}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    Puedes subir otra imagen para tu evento y cambiar su información
                  </p>
                </div>

                {/* Tip Box */}
                <div 
                  className="
                    flex items-start gap-3 
                    p-4 
                    bg-gradient-to-r from-amber-50 to-yellow-50 
                    rounded-xl 
                    border border-amber-200 
                    shadow-sm
                  "
                >
                  <div 
                    className="
                      flex-shrink-0 
                      w-8 h-8 
                      bg-amber-500 
                      rounded-full 
                      flex items-center justify-center
                    "
                  >
                    <svg 
                      className="w-5 h-5 text-white" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-900 font-medium">
                    <span className="font-bold">Consejo:</span> Un título corto + una portada llamativa mejora la búsqueda del evento
                  </p>
                </div>

                {/* Upload Button */}
                <label 
                  className="
                    inline-flex items-center gap-3 
                    px-6 py-3 
                    bg-gray-700/50 hover:bg-gray-700 
                    border border-gray-600 
                    text-gray-200 
                    rounded-xl 
                    cursor-pointer 
                    transition-all 
                    hover:shadow-lg hover:scale-105 
                    active:scale-95
                  "
                >
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                    />
                  </svg>
                  <span className="font-medium">Cargar nueva portada</span>
                  <input type="file" className="hidden" name="imgEvento" ref={fileRef} onChange={handleFileChange}/>
                </label>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button 
                    className="
                      px-5 py-2.5 
                      bg-gradient-to-r from-amber-500 to-yellow-500 
                      hover:from-amber-600 hover:to-yellow-600 
                      text-gray-900 font-semibold 
                      rounded-xl shadow-md 
                      hover:shadow-lg 
                      transition-all 
                      hover:scale-105 active:scale-95
                    "
                  >
                    Relacionar eventos
                  </button>
                  
                  <button 
                    onClick={() => setShowDesc(!showDesc)}
                    className={`
                      px-5 py-2.5 
                      ${showDesc 
                        ? 'bg-gradient-to-r from-orange-600 to-amber-500' 
                        : 'bg-gradient-to-r from-amber-600 to-yellow-500'
                      } 
                      hover:shadow-lg 
                      text-gray-900 font-semibold 
                      rounded-xl shadow-md 
                      transition-all 
                      hover:scale-105 active:scale-95
                    `}
                  >
                    {showDesc ? 'Cerrar inf. evento' : 'Editar inf. evento'}
                  </button>
                  
                  <button 
                    onClick={() => setShowSoldOutAdv(!showSoldOutAdv)}
                    className="
                      px-5 py-2.5 
                      bg-gradient-to-r from-orange-500 to-red-500 
                      hover:from-orange-600 hover:to-red-600 
                      text-gray-900 font-semibold 
                      rounded-xl shadow-md 
                      hover:shadow-lg 
                      transition-all 
                      hover:scale-105 active:scale-95
                    "
                  >
                    Marcar como Sold out
                  </button>
                </div>
              </div>
            </div>

            {/* Edit Form (conditional) */}
            {showDesc && (
              <div 
                className="
                  grid md:grid-cols-2 gap-6 
                  p-6 
                  bg-gray-900/50 
                  rounded-2xl 
                  border border-gray-700/50 
                  mt-8
                "
              >
                <div className="space-y-4">
                  <div>
                    <label 
                      className="
                        block 
                        text-sm font-medium 
                        text-gray-300 
                        mb-2
                      "
                    >
                      Nombre del evento
                    </label>
                    <input
                      type="text"
                      className="
                        w-full 
                        px-4 py-3 
                        bg-gradient-to-r from-gray-800 to-gray-900 
                        border border-amber-500/50 
                        focus:border-amber-500 
                        text-white 
                        rounded-xl 
                        focus:outline-none 
                        focus:ring-2 focus:ring-amber-500/20 
                        transition-all
                      "
                      defaultValue={mockEvent.nombreEvento}
                    />
                  </div>
                  
                  <div>
                    <label 
                      className="
                        block 
                        text-sm font-medium 
                        text-gray-300 
                        mb-2
                      "
                    >
                      Descripción
                    </label>
                    <textarea
                      className="
                        w-full 
                        px-4 py-3 
                        bg-gradient-to-r from-gray-800 to-gray-900 
                        border border-amber-500/50 
                        focus:border-amber-500 
                        text-white 
                        rounded-xl 
                        focus:outline-none 
                        focus:ring-2 focus:ring-amber-500/20 
                        transition-all 
                        min-h-[100px] 
                        resize-none
                      "
                      defaultValue={mockEvent.descripcionEvento}
                    />
                  </div>

                  <div>
                    <label 
                      className="
                        block 
                        text-sm font-medium 
                        text-gray-300 
                        mb-2
                      "
                    >
                      Edad mínima
                    </label>
                    <input
                      type="number"
                      className="
                        w-full 
                        px-4 py-3 
                        bg-gradient-to-r from-gray-800 to-gray-900 
                        border border-amber-500/50 
                        focus:border-amber-500 
                        text-white 
                        rounded-xl 
                        focus:outline-none 
                        focus:ring-2 focus:ring-amber-500/20 
                        transition-all
                      "
                      defaultValue="18"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label 
                      className="
                        block 
                        text-sm font-medium 
                        text-gray-300 
                        mb-2
                      "
                    >
                      Fecha y hora de inicio
                    </label>
                    <input
                      type="datetime-local"
                      className="
                        w-full 
                        px-4 py-3 
                        bg-amber-600 
                        text-gray-900 
                        rounded-xl 
                        focus:outline-none 
                        focus:ring-2 focus:ring-amber-500 
                        transition-all 
                        font-medium
                      "
                    />
                  </div>
                  
                  <div>
                    <label 
                      className="
                        block 
                        text-sm font-medium 
                        text-gray-300 
                        mb-2
                      "
                    >
                      Fecha y hora de fin
                    </label>
                    <input
                      type="datetime-local"
                      className="
                        w-full 
                        px-4 py-3 
                        bg-amber-600 
                        text-gray-900 
                        rounded-xl 
                        focus:outline-none 
                        focus:ring-2 focus:ring-amber-500 
                        transition-all 
                        font-medium
                      "
                    />
                  </div>

                  <div>
                    <label 
                      className="
                        block 
                        text-sm font-medium 
                        text-gray-300 
                        mb-2
                      "
                    >
                      Localidad
                    </label>
                    <select 
                      className="
                        w-full 
                        px-4 py-3 
                        bg-gradient-to-r from-gray-800 to-gray-900 
                        border border-amber-500/50 
                        focus:border-amber-500 
                        text-white 
                        rounded-xl 
                        focus:outline-none 
                        focus:ring-2 focus:ring-amber-500/20 
                        transition-all
                      "
                    >
                      <option>Buenos Aires</option>
                      <option>Córdoba</option>
                      <option>Rosario</option>
                    </select>
                  </div>
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <button 
                    className="
                      px-8 py-3 
                      bg-gradient-to-r from-amber-500 to-yellow-400 
                      hover:from-amber-600 hover:to-yellow-500 
                      text-gray-900 font-bold 
                      rounded-xl 
                      shadow-lg hover:shadow-xl 
                      transition-all 
                      hover:scale-105 active:scale-95 
                      flex items-center gap-2
                    "
                  >
                    <svg 
                      className="w-5 h-5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                      />
                    </svg>
                    Actualizar evento
                  </button>
                </div>
              </div>
            )}

            {/* Tickets Section */}
            <div className="mt-12">
              <div className="flex flex-wrap gap-3 mb-6">
                <button 
                  className="
                    px-5 py-2.5 
                    bg-gradient-to-r from-amber-500 to-yellow-500 
                    hover:from-amber-600 hover:to-yellow-600 
                    text-gray-900 font-semibold 
                    rounded-xl shadow-md 
                    hover:shadow-lg 
                    transition-all 
                    hover:scale-105 active:scale-95
                  "
                >
                  Agregar nuevo ticket +
                </button>
                <button 
                  className="
                    px-5 py-2.5 
                    bg-gradient-to-r from-orange-500 to-red-500 
                    hover:from-orange-600 hover:to-red-600 
                    text-gray-900 font-semibold 
                    rounded-xl shadow-md 
                    hover:shadow-lg 
                    transition-all 
                    hover:scale-105 active:scale-95
                  "
                >
                  Agregar código de descuento +
                </button>
              </div>

              {/* Ticket List */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className="
                      flex items-center gap-4 
                      p-4 
                      bg-gray-900/50 
                      border border-gray-700/50 
                      rounded-xl 
                      hover:border-amber-500/50 
                      transition-all
                    "
                  >
                    <div 
                      className="
                        w-16 h-16 
                        bg-gradient-to-br from-amber-500 to-yellow-500 
                        rounded-xl 
                        flex-shrink-0 
                        shadow-lg
                      " 
                    />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-200 font-semibold mb-1">
                        Ticket General
                      </p>
                      <p className="text-amber-500 font-bold mb-1">
                        $5000
                      </p>
                      <div 
                        className="
                          flex items-center gap-4 
                          text-sm text-gray-400
                        "
                      >
                        <span className="flex items-center gap-1">
                          <svg 
                            className="w-4 h-4" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                            <path 
                              fillRule="evenodd" 
                              d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" 
                              clipRule="evenodd"
                            />
                          </svg>
                          50 disponibles
                        </span>
                        <span>Cierre: 25/01/2026</span>
                      </div>
                    </div>

                    <button 
                      className="
                        px-4 py-2 
                        text-amber-500 
                        hover:text-amber-400 hover:bg-gray-800 
                        rounded-lg 
                        transition-all 
                        font-medium
                      "
                    >
                      Editar
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div 
              className="
                mt-12 pt-6 
                border-t border-gray-700/50 
                flex flex-wrap gap-3 
                justify-between items-center
              "
            >
              <div className="flex items-center gap-3">
                <input
                  type="email"
                  placeholder="email@colaborador.com"
                  className="
                    px-4 py-2.5 
                    bg-gray-900 
                    border border-gray-700 
                    text-gray-200 
                    rounded-xl 
                    focus:outline-none 
                    focus:ring-2 focus:ring-amber-500/50 
                    transition-all
                  "
                />
                <button 
                  className="
                    px-5 py-2.5 
                    bg-gradient-to-r from-amber-500 to-yellow-500 
                    hover:from-amber-600 hover:to-yellow-600 
                    text-gray-900 font-semibold 
                    rounded-xl shadow-md 
                    hover:shadow-lg 
                    transition-all 
                    hover:scale-105 active:scale-95
                  "
                >
                  Añadir Colaborador
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                <button 
                  className="
                    px-5 py-2.5 
                    bg-gradient-to-r from-amber-500 to-yellow-500 
                    text-gray-900 font-semibold 
                    rounded-xl shadow-md 
                    hover:shadow-lg 
                    transition-all 
                    hover:scale-105 active:scale-95
                  "
                >
                  Enviar Invitaciones
                </button>
                <button 
                  className="
                    px-5 py-2.5 
                    bg-red-500 hover:bg-red-600 
                    text-white font-semibold 
                    rounded-xl shadow-md 
                    hover:shadow-lg 
                    transition-all 
                    hover:scale-105 active:scale-95
                  "
                >
                  Bajar evento
                </button>
                <button 
                  className="
                    px-5 py-2.5 
                    bg-gradient-to-r from-purple-600 to-pink-600 
                    hover:from-purple-700 hover:to-pink-700 
                    text-white font-semibold 
                    rounded-xl shadow-md 
                    hover:shadow-lg 
                    transition-all 
                    hover:scale-105 active:scale-95
                  "
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sold Out Modal */}
      {showSoldOutAdv && (
        <>
          <div 
            className="
              fixed inset-0 
              bg-black/60 backdrop-blur-sm 
              z-40
            "
            onClick={() => setShowSoldOutAdv(false)}
          />
          <div 
            className="
              fixed 
              top-1/2 left-1/2 
              -translate-x-1/2 -translate-y-1/2 
              bg-gray-800 
              rounded-3xl shadow-2xl 
              border-2 border-gray-600 
              p-8 
              max-w-md w-full 
              z-50
            "
          >
            
            {/* Header */}
            <div className="flex flex-col items-center mb-6">
              <div 
                className="
                  w-20 h-20 
                  bg-gradient-to-br from-orange-100 to-red-100 
                  rounded-full 
                  flex items-center justify-center 
                  mb-4 
                  animate-pulse
                "
              >
                <svg 
                  className="w-12 h-12 text-orange-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-100">
                Sold Out
              </h3>
            </div>

            {/* Warning */}
            <div 
              className="
                bg-gray-900 
                border-l-4 border-yellow-500 
                rounded-xl 
                p-4 
                mb-6
              "
            >
              <div className="flex items-start gap-3">
                <svg 
                  className="
                    w-6 h-6 
                    text-yellow-500 
                    flex-shrink-0
                  " 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
                <p className="text-sm text-gray-300 leading-relaxed">
                  <span className="font-semibold text-yellow-500">
                    Aviso:
                  </span>{" "}
                  Si marcas el evento como Sold Out, la compra de tickets será bloqueada hasta desmarcarlo nuevamente.
                </p>
              </div>
            </div>

            {/* Toggle */}
            <div 
              className="
                bg-gray-900 
                rounded-2xl 
                p-6 
                mb-6
              "
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="
                      w-12 h-12 
                      bg-gradient-to-br from-amber-600 to-yellow-500 
                      rounded-xl 
                      flex items-center justify-center 
                      flex-shrink-0
                    "
                  >
                    <svg 
                      className="w-6 h-6 text-gray-900" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                      />
                    </svg>
                  </div>
                  <div>
                    <label 
                      className="
                        text-md font-bold 
                        text-gray-100 
                        cursor-pointer 
                        block
                      "
                    >
                      Marcar como Sold Out
                    </label>
                    <p className="text-xs text-gray-400">
                      Bloquear venta de entradas
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => setIsSoldOut(!isSoldOut)}
                  className={`
                    relative inline-block 
                    w-16 h-8 
                    rounded-full 
                    transition-all duration-300 
                    ${isSoldOut 
                      ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                      : 'bg-gray-600'
                    }
                  `}
                >
                  <span 
                    className={`
                      absolute top-1 left-1 
                      w-6 h-6 
                      bg-white 
                      rounded-full shadow-md 
                      transition-all duration-300 
                      ${isSoldOut ? 'translate-x-8' : 'translate-x-0'}
                    `} 
                  />
                </button>
              </div>
            </div>

            {/* Action Button */}
            <button 
              className="
                w-full 
                bg-gradient-to-r from-orange-500 to-red-500 
                hover:from-orange-600 hover:to-red-600 
                text-white font-bold 
                py-4 
                rounded-xl 
                shadow-lg hover:shadow-xl 
                transition-all 
                active:scale-95 
                flex items-center justify-center gap-2
              "
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
              Guardar cambios
            </button>

            <p className="text-center text-xs text-gray-400 mt-4">
              Los cambios se aplicarán inmediatamente
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default EditProd;
