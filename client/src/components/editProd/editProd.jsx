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
  const [idDiscount ,setIdDiscount] = useState()
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
      },3000)
    }
  };

  const createDiscountCode = async (e) => {
    e.preventDefault()
    const cantidadDescuentos = e.target.elements.cantidadDescuentos.value
    const numeroDescuento = e.target.elements.numeroDescuento.value
    console.log(prodId, idDiscount, cantidadDescuentos, numeroDescuento)
    const res = await createDiscountCodeRequest({prodId, idDiscount, cantidadDescuentos, numeroDescuento})
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
    <>
      <div className="edit-event-and-tickets-container mx-12 mt-[30px] mb-20 bg-gray-800 border-[1px] border-gray-700 rounded-3xl">
        <div  className="
            bg-gray-800/80 backdrop-blur-sm 
            border border-gray-700/50 
            rounded-3xl shadow-2xl 
            overflow-hidden
          ">
          <div className="
              bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 
              p-8
            ">
            <h2 className="
                text-gray-900 text-center 
                text-3xl font-bold 
                tracking-tight
              ">
              Editar evento
            </h2>
          </div>
          {prod.map((p) => (
            <>
              <form
                className="form-edit-event mt-6"
                key={p._id}
                onSubmit={(e) => {
                  e.preventDefault();
                  updateEvent(
                    e,
                    p._id,
                    p.imgEvento,
                    p.nombreEvento,
                    p.descripcionEvento,
                    p.aviso,
                    p.eventoEdad,
                    /*p.categorias,*/ p.artistas,
                    p.montoVentas,
                    p.fechaInicio,
                    p.fechaFin,
                    p.tipoEvento,
                    p.provincia,
                    p.localidad,
                    p.direccion,
                    p.lugarEvento,
                    p.bannerEvento,
                    p.imagenDescriptiva
                  );
                }}
                encType="multipart/form-data"
              >
                <div className="edit-event-img relative w-[100%] flex flex-wrap items-start mx-auto justify-center">
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
                  <div className="edit-evet-desc text-left ml-4">
                    <h2 className="text-3xl text-gray-300!">
                      {p.nombreEvento}
                    </h2>
                    <p className="mt-3 text-gray-400!">
                      Puedes subir otra imagen para tu evento y cambiar su información
                    </p>
                    <div 
                  className="
                    flex items-start gap-3 
                    p-4 
                    bg-gray-500/50 
                    rounded-xl 
                    border border-gray-400 
                    shadow-sm
                  "
                >
                  <div 
                    className="
                      flex-shrink-0 
                      w-6 h-6 
                      bg-amber-500 
                      rounded-full 
                      flex items-center justify-center
                    "
                  >
                <img className="" src={megaphonePng} alt=""></img>{" "}
                  </div>
                  <p className="text-sm text-gray-900 font-medium">
                    <span className="font-bold">Consejo:</span> Un título corto + una portada llamativa mejora la búsqueda del evento
                  </p>
                </div>
                      
                    <label 
                  className="
                    inline-flex items-center gap-3 mt-3 
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
                    stroke="whitesmoke" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                    />
                  </svg>
                  <span className="font-medium text-gray-300">Cargar nueva portada</span>
                  <input type="file" className="hidden" name="imgEvento" ref={fileRef} onChange={handleFileChange}/>
                </label>
                    <div>
                      <button
                        className="
                      px-5 py-2.5 
                      bg-gradient-to-r from-gray-950 to-gray-900 
                      hover:from-amber-400 hover:to-yellow-400 hover:text-gray-900
                      text-gray-300 font-semibold 
                      rounded-xl shadow-md 
                      hover:shadow-lg 
                      transition-all 
                      hover:scale-105 active:scale-95
                      relation-buttons
                    "
                        onClick={() => setShowOthersProds(!showOthersProds)}
                      >
                        Relacionar eventos
                      </button>
                        <button 
                    onClick={() => setShowDesc(!showDesc)}
                    className={`
                      px-5 py-2.5 ml-3
                      ${showDesc 
                        ? 'bg-gradient-to-r from-gray-950 to-gray-900 hover:text-gray-900 hover:from-amber-400 hover:to-yellow-400 hover:text-gray-900' 
                        : 'bg-gradient-to-r from-gray-950 to-gray-900 hover:text-gray-900 hover:from-amber-400 hover:to-yellow-400 hover:text-gray-900'
                      } 
                      hover:shadow-lg 
                      text-gray-300 font-semibold 
                      rounded-xl shadow-md 
                      transition-all 
                      hover:scale-105 active:scale-95
                      relation-buttons
                    `}
                  >
                    {showDesc ? 'Cerrar inf. evento' : 'Editar inf. evento'}
                  </button>
                      <button
                        className="
                      px-5 py-2.5 ml-3
                      bg-gradient-to-r from-gray-950 to-gray-900 
                      hover:from-amber-400 hover:to-yellow-400 hover:text-gray-900
                      text-gray-300 font-semibold 
                      rounded-xl shadow-md 
                      hover:shadow-lg 
                      transition-all 
                      hover:scale-105 active:scale-95
                      relation-buttons
                    "
                        onClick={() => setShowSoldOutAdv(!showSoldOutAdv)}
                      >
                        Marcar como Sold out
                      </button>
                      {showOthersProds && (
                        <div className="mt-2 border-1 border-gray-500 rounded-xl">
                          {othersProds
                            .filter(
                              (othP) => !prod.some((p) => p._id === othP._id)
                            )
                            .map((filteredProd) => (
                              <div
                                className="bg-gray-900 border-b-1 border-gray-300 p-2 rounded-xl"
                                key={filteredProd._id}
                              >
                                <div className="flex flex-wrap text-[#111827] text-left mb-3 justify-between">
                                  <div className="flex items-center">
                                    <img
                                      className="w-20 h-20 rounded-lg"
                                      src={filteredProd.imgEvento}
                                      alt=""
                                    ></img>
                                    <div className="ml-2">
                                      <p className="text-gray-300!">{filteredProd.nombreEvento}</p>
                                      <p className="text-gray-400">
                                        Inicio:{" "}
                                        {formatDateB(filteredProd.fechaInicio)}
                                      </p>
                                      <p className="text-gray-400">
                                        Cierre:{" "}
                                        {formatDateB(filteredProd.fechaFin)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="w-[180px] h-auto">
                                    <button
                                      className="relation-buttons ml-0! w-full bg-orange-500! rounded-lg p-1 mb-3"
                                      onClick={(e) =>
                                        relateEvents(e, p._id, filteredProd._id)
                                      }
                                    >
                                      {p.eventosRelacionados.some(
                                        (er) =>
                                          String(er.idEvento) ===
                                          String(filteredProd._id)
                                      )
                                        ? "Desvincular eventos"
                                        : "Relacionar evento"}
                                    </button>
                                    <a
                                      className="bg-transparent border-1 border-gray-300! rounded-lg p-1 text-yellow-500"
                                      href={`/editar_evento/${filteredProd._id}`}
                                    >
                                      Ver evento
                                    </a>
                                  </div>
                                </div>
                              </div>
                            ))}
                          {message === 6 && (
                            <p className="bg-gray-900! text-yellow-500! mt-2">
                              Evento relacionado con exito!
                            </p>
                          )}
                        </div>
                      )}
                      {showSoldOutAdv && (
                        <>
                          <div
                            className="abc fixed w-screen h-screen top-0 bottom-0 left-0 right-0 bg-black-500"
                            onClick={() => setShowSoldOutAdv(!showSoldOutAdv)}
                          ></div>
                          <div className="add-tickets-form top-[50%]! fixed bg-gray-800! rounded-3xl shadow-2xl border-2 border-gray-600 p-8 max-w-md">
                            {/* Header con ícono de warning */}
                            <div className="flex flex-col items-center mb-6">
                              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                                <img
                                  className="w-12 h-12"
                                  src={warningBPng}
                                  alt="Warning"
                                />
                              </div>
                              <h3 className="text-2xl font-bold text-gray-300!">
                                Sold Out
                              </h3>
                            </div>

                            {/* Mensaje de aviso */}
                            <div className="bg-gray-900 border-l-4 border-yellow-500 rounded-xl p-4 mb-6">
                              <div className="flex items-start">
                                <svg
                                  className="w-6 h-6 text-yellow-500 flex-shrink-0 mr-3 mt-0.5"
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
                                  Si marcas el evento como Sold Out, la compra
                                  de tickets será bloqueada hasta desmarcarlo
                                  nuevamente.
                                </p>
                              </div>
                            </div>

                            {/* Toggle Switch Mejorado */}
                            <div className="bg-gray-900 rounded-2xl p-6 mb-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-yellow-500 rounded-xl flex items-center justify-center">
                                    <svg
                                      className="w-6 h-6 text-[#111827]"
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
                                      htmlFor="soldOutHtml"
                                      className="text-md font-bold text-gray-300 cursor-pointer block"
                                    >
                                      Marcar como Sold Out
                                    </label>
                                    <p className="text-xs text-gray-300">
                                      Bloquear venta de entradas
                                    </p>
                                  </div>
                                </div>

                                {/* Custom Toggle Switch */}
                                <label
                                  htmlFor="soldOutHtml"
                                  className="relative inline-block w-16 h-8 cursor-pointer"
                                >
                                  <input
                                    id="soldOutHtml"
                                    type="checkbox"
                                    name="soldOut"
                                    onChange={soldOutFunc}
                                    checked={isSoldOut}
                                    className="sr-only peer"
                                  />
                                  <div className="w-16 h-8 bg-gray-300 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-orange-500 peer-checked:to-red-500 transition-all duration-300 shadow-inner"></div>
                                  <div className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 peer-checked:translate-x-8"></div>
                                </label>
                              </div>
                            </div>

                            {/* Botón de guardar - Sin position: relative con transform */}
                            <button
                              type="button"
                              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-[#111827] font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 flex items-center justify-center group"
                              onClick={() => soldOutEvent()}
                            >
                              <svg
                                className="w-5 h-5 mr-2"
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

                            {/* Información adicional */}
                            <p className="text-center text-xs text-gray-300 mt-6">
                              Los cambios se aplicarán inmediatamente
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {showDesc && <div className="edit-info-event flex justify-center">
                  <div className="p-3">
                    <div>
                      <label className="
                        block 
                        text-sm font-medium 
                        text-gray-300! 
                        mb-2
                      ">Nombre del evento:</label>
                      
                      <input
                        type="text"
                        className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500/50!  text-white!"
                        value={
                          eventosEditados[p._id]?.nombreEvento ?? p.nombreEvento
                        }
                        onChange={(e) =>
                          handleChangeEvento(e, p._id, "nombreEvento")
                        }
                      ></input>
                    </div>
                    <div>
                      <label className="
                        block 
                        text-sm font-medium 
                        text-gray-300!
                        mb-2
                      ">Descripcion:</label>
                     
                      <input
                        type="textarea"
                        className="
                        w-full 
                        px-4 py-3 
                        bg-gradient-to-r from-gray-800 to-gray-900 
                        border border-amber-500/50! 
                        focus:border-amber-500 
                        text-white! 
                        rounded-xl 
                        focus:outline-none 
                        focus:ring-2 focus:ring-amber-500/20 
                        transition-all 
                        min-h-[100px] 
                        resize-none
                      "
                        value={
                          eventosEditados[p._id]?.descripcionEvento ??
                          p.descripcionEvento
                        }
                        onChange={(e) =>
                          handleChangeEvento(e, p._id, "descripcionEvento")
                        }
                      ></input>
                    </div>
                    <div>
                      <label className="block 
                        text-sm font-medium 
                        text-gray-300! 
                        mb-2
                      ">Aviso importante:</label>
                      
                      <input
                        type="textarea"
                        className="
                        w-full 
                        px-4 py-3 
                        bg-gradient-to-r from-gray-800 to-gray-900 
                        border border-amber-500/50! 
                        focus:border-amber-500 
                        text-white! 
                        rounded-xl 
                        focus:outline-none 
                        focus:ring-2 focus:ring-amber-500/20 
                        transition-all 
                        min-h-[100px] 
                        resize-none
                      "
                        value={eventosEditados[p._id]?.aviso ?? p.aviso}
                        onChange={(e) => handleChangeEvento(e, p._id, "aviso")}
                      ></input>
                    </div>
                    <div>
                      <label className="
                        block 
                        text-sm font-medium 
                        text-gray-300! 
                        mb-2
                      ">Edad minima:</label>
                     
                      <input
                        type="number"
                        className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500/50!  text-white!"
                        value={
                          eventosEditados[p._id]?.eventoEdad ?? p.eventoEdad
                        }
                        onChange={(e) =>
                          handleChangeEvento(e, p._id, "eventoEdad")
                        }
                      ></input>
                    </div>
                    {/*<div>
                                            <label>Categorias del evento:</label><br></br>
                                            <input type="text"  placeholder="..." value={eventosEditados[p._id]?.categorias ??  p.categorias} onChange={(e) => handleChangeEvento(e, p._id, 'categorias')} name="categorias"></input>
                                        </div>*/}
                    <div>
                      <label className="
                        block 
                        text-sm font-medium 
                        text-gray-300! 
                        mb-2
                      ">Artistas que participan:</label>
                     
                      <input
                        type="text"
                        className="
                        w-full 
                        px-4 py-3 
                        bg-gradient-to-r from-gray-800 to-gray-900 
                        border border-amber-500/50!
                        focus:border-amber-500 
                        text-white! 
                        rounded-xl 
                        focus:outline-none 
                        focus:ring-2 focus:ring-amber-500/20 
                        transition-all
                      "
                        placeholder="..."
                        value={eventosEditados[p._id]?.artistas ?? p.artistas}
                        onChange={(e) =>
                          handleChangeEvento(e, p._id, "artistas")
                        }
                        name="artistas"
                      ></input>
                    </div>
                    <div>
                      <label className="
                        block 
                        text-sm font-medium 
                        text-gray-300! 
                        mb-2
                      ">Monto de ventas estimado:</label>
                      
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        className="
                        w-full 
                        px-4 py-3 
                        bg-gradient-to-r from-gray-800 to-gray-900 
                        border border-amber-500/50! 
                        focus:border-amber-500 
                        text-white! 
                        rounded-xl 
                        focus:outline-none 
                        focus:ring-2 focus:ring-amber-500/20 
                        transition-all
                      "
                        value={
                          eventosEditados[p._id]?.montoVentas ?? p.montoVentas
                        }
                        onChange={(e) =>
                          handleChangeEvento(e, p._id, "montoVentas")
                        }
                        name="montoVentas"
                      ></input>
                    </div>
                    <div>
                      <label
                        htmlFor="fileUploadBanner"
                        className="block 
                        text-sm font-medium 
                        text-gray-300! 
                        mb-2
                      "
                      >
                        Banner del evento (opcional)
                      </label>
                      <input
                        id="fileUploadBanner"
                        className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500/50!  text-white!"
                        type="file"
                        name="bannerEvento"
                        onChange={handleBannerChange}
                        ref={fileRefBanner}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="fileUploadDescriptive"
                        className="block 
                        text-sm font-medium 
                        text-gray-300! 
                        mb-2
                      "
                      >
                        Imagen descriptiva (opcional)
                      </label>
                      <input
                        id="fileUploadDescriptive"
                        className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500/50!  text-white!"
                        type="file"
                        name="imagenDescriptiva"
                        onChange={handleDescriptiveChange}
                        ref={fileRefDescriptiveImg}
                      />
                    </div>
                  </div>
                  <div className="relative p-3">
                    <div>
                      <div className="flex items-center mb-2">
                        <label className="
                        block 
                        text-sm font-medium 
                        text-gray-300!
                        
                      ">Fecha y hora de inicio:</label>
                        {dateMessage == 1 && (
                          <p className="text-gray-400! ml-2  text-sm font-medium ">
                            La fecha de inicio no puede ser menor a la fecha
                            actual
                          </p>
                        )}
                      </div>
                      <input
                        className="
                        w-full 
                        px-4 py-3 
                        bg-amber-600 
                        text-gray-300! 
                        rounded-xl 
                        focus:outline-none 
                        focus:ring-2 focus:ring-amber-500 
                        transition-all 
                        font-medium
                        border-amber-500/50! 
                       
                      "
                        type="datetime-local"
                        value={formatearFechaParaInput(
                          eventosEditados[p._id]?.fechaInicio ?? p.fechaInicio
                        )}
                        onChange={(e) =>
                          handleChangeEvento(e, p._id, "fechaInicio")
                        }
                      ></input>
                    </div>
                    <div>
                      <label className="
                        block 
                        text-sm font-medium 
                        text-gray-300! 
                        mb-2
                      ">Fecha y hora de fin:</label>
                      
                      <input
                        className="
                        w-full 
                        px-4 py-3 
                        bg-amber-600 
                        text-gray-300! 
                        rounded-xl 
                        focus:outline-none 
                        focus:ring-2 focus:ring-amber-500 
                        transition-all 
                        font-medium
                        border-amber-500/50! 
                      "
                        type="datetime-local"
                        value={formatearFechaParaInput(
                          eventosEditados[p._id]?.fechaFin ?? p.fechaFin
                        )}
                        onChange={(e) =>
                          handleChangeEvento(e, p._id, "fechaFin")
                        }
                      ></input>
                      {dateMessage == 2 && (
                        <p className="text-red-600!">
                          La fecha de fin no puede ser menor a la fecha de
                          inicio
                        </p>
                      )}
                    </div>
                    <div className="prov-localidad flex items-center p-0! text-left!">
                      <div className="w-[100%]!">
                        <label className="
                        block 
                        text-sm font-medium 
                        text-gray-300! 
                        mb-2
                      ">
                          Visibilidad del evento:{" "}
                          {p.tipoEvento === 1 ? "Publico" : "Privado"}
                        </label>
                        
                        <select
                          className="
                        w-full 
                        px-4 py-3 
                        bg-gradient-to-r from-gray-800 to-gray-900 
                        border border-amber-500/50! 
                        focus:border-amber-500 
                        text-white! 
                        rounded-xl 
                        focus:outline-none 
                        focus:ring-2 focus:ring-amber-500/20 
                        transition-all
                      "
                          name="tipoEvento"
                          value={
                            eventosEditados[p._id]?.tipoEvento ??
                            eventVisibility
                          }
                          onChange={(e) => setEventVisibility(e.target.value)}
                          defaultValue="orange"
                        >
                          {p.tipoEvento === 1 ? (
                            <>
                              <option className="text-[#111827]" value={1} selected>
                                Publico
                              </option>
                              <option className="text-[#111827]" value={2}>Privado</option>
                            </>
                          ) : (
                            <>
                              <option value={1}>Publico</option>
                              <option value={2} selected>
                                Privado
                              </option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                    <div className="prov-localidad flex items-center p-0! text-left!">
                      {/* <div>
                                               <label>Provincia: {p.provincia}  </label><br></br>
                                                <select className="bg-violet-900! pr-2 pl-2 rounded-lg" name="provincia" onChange={(e) => setEventProv(e.target.value)}>
                                                    <option value="provincia" defaultValue={eventosEditados[p._id]?.provincia ??  p.provincia}>mostrar provincias</option>
                                                </select>
                                            </div>*/}
                      <div className="w-[100%]! ">
                        <label className="
                        block 
                        text-sm font-medium 
                        text-gray-300! 
                        mb-2
                      ">Localidad: {p.localidad}</label>
                      
                        <select
                          className="
                        w-full 
                        px-4 py-3 
                        bg-gradient-to-r from-gray-800 to-gray-900 
                        border border-amber-500/50! 
                        focus:border-amber-500 
                        text-white! 
                        rounded-xl 
                        focus:outline-none 
                        focus:ring-2 focus:ring-amber-500/20 
                        transition-all
                      "
                          name="localidad"
                          onChange={(e) =>
                            setLocalidad(
                              cities.find((c) => c.name === e.target.value)
                            )
                          }
                        >
                          <option className="text-[#111827]!"
                            value={
                              eventosEditados[p._id]?.localidad ?? p.localidad
                            }
                          >
                            Cambiar localidad
                          </option>
                          {cities.map((city) => (
                            <option className="text-[#111827]!" key={city.name} value={city.name}>
                              {city.name}
                            </option>
                          ))}
                        </select>
                        {/**    <select name="localidad" disabled={!selectedState} onChange={(e) => handleCityChange(cities.find((c) => c.name === e.target.value))} required>
                                                <option value=''>Elegir</option>
                                                {cities.map((city) => (
                                                    <option key={city.name} value={city.name}>{city.name}</option>
                                                ))}
                                                </select> */}
                      </div>
                    </div>
                    <div>
                      <label className="
                        block 
                        text-sm font-medium 
                        text-gray-300! 
                        mb-2
                      ">Direccion:</label>
                  
                      <input
                        name="direccion"
                        className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500/50!  text-white!"
                        value={eventosEditados[p._id]?.direccion ?? p.direccion}
                        onChange={(e) =>
                          handleChangeEvento(e, p._id, "direccion")
                        }
                      ></input>
                    </div>
                    <div>
                      <label className="
                        block 
                        text-sm font-medium 
                        text-gray-300! 
                        mb-2
                      ">Lugar del evento:</label>
                    
                      <input
                        type="text"
                        className="
                        w-full 
                        px-4 py-3 
                        bg-gradient-to-r from-gray-800 to-gray-900 
                        border border-amber-500/50! 
                        focus:border-amber-500 
                        text-white! 
                        rounded-xl 
                        focus:outline-none 
                        focus:ring-2 focus:ring-amber-500/20 
                        transition-all
                      "
                        value={
                          eventosEditados[p._id]?.lugarEvento ?? p.lugarEvento
                        }
                        onChange={(e) =>
                          handleChangeEvento(e, p._id, "lugarEvento")
                        }
                        name="lugarEvento"
                      ></input>
                    </div>
                    <div className="flex flex-wrap items-center p-0 justify-center">
                      {previewBanner && (
                        <div className="w-[50%] min-w-[180px] bg-white rounded-2xl p-1">
                          <img
                            className="w-[160px] object-cover h-[160px] rounded-2xl mx-auto mt-3"
                            src={previewBanner}
                            alt=""
                            loading="lazy"
                          ></img>
                          <div className="portal-evento text-center rounded-2xl">
                            <label
                              htmlFor="fileUpload"
                              className="flex items-center justify-center p-3 bg-[#ffdeca] mt-1 mb-3 rounded-xl text-[#111827]!"
                            >
                              Banner del evento
                            </label>
                            <input
                              id="fileUpload"
                              className="hidden"
                              type="file"
                              name="bannerEvento"
                              onChange={handleBannerChange}
                            />
                          </div>
                        </div>
                      )}
                      {previewDescriptive && (
                        <div className="w-[50%] min-w-[180px] bg-white rounded-2xl p-1">
                          <img
                            className="w-[160px] object-cover h-[160px] rounded-2xl mx-auto mt-3"
                            src={previewDescriptive}
                            alt=""
                            loading="lazy"
                          ></img>
                          <div className="portal-evento text-center rounded-2xl">
                            <label
                              htmlFor="fileUpload"
                              className="flex items-center justify-center p-3 bg-[#ffdeca] mt-1 mb-3 rounded-xl text-[#111827]!"
                            >
                              Imagen descriptiva
                            </label>
                            <input
                              id="fileUpload"
                              className="hidden"
                              type="file"
                              name="imagenDescriptiva"
                              onChange={handleDescriptiveChange}
                            />
                          </div>
                        </div>
                      )}
                    </div>
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
                      type="submit"
                    >
                      {loading ? (
                        <LoadingButton />
                      ) : (
                        <div className="flex items-center">
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
                          <p className="ml-3">Actualizar evento</p>
                        </div>
                      )}
                    </button>
                  </div>
                </div>}
              </form>
            </>
          ))}
          {showCreateTicketForm && (
            <>
              <div
                className="abc fixed w-screen h-screen top-0 bottom-0 left-0 right-0 bg-black-500"
                onClick={() => setShowCreateTicketForm(!showCreateTicketForm)}
              ></div>
              <form
                className="add-tickets-form fixed pl-4 pr-7 pb-4 rounded-xl bg-gray-800!"
                onSubmit={createEventTickets}
                encType="multipart/form-data"
              >
                <div className="mt-4">
                  <div className="flex items-center">
                    <h3 className="text-xl text-yellow-600!">Crear nuevo ticket:</h3>
                    <img
                      className="ml-5"
                      src={ticketPng}
                      alt=""
                      loading="lazy"
                    ></img>
                  </div>
                  <div className="mt-4">
                    <label className="text-gray-200!">Nombre del ticket:</label>
                    <input
                      className="text-gray-300! border-amber-500!"
                      type="text"
                      placeholder="..."
                      name="nombreTicket"
                      required
                    ></input>
                  </div>
                  <div className="mt-2">
                    <label className="text-gray-300!">Descripcion del ticket:</label>
                    <input
                      className="text-gray-300! border-amber-500!"
                      type="text"
                      placeholder="..."
                      name="descripcionTicket"
            
                    ></input>
                  </div>
                  <div className="price-qty-state flex items-center mt-3">
                    {estado !== "3" && (
                      <div>
                        <label className="text-gray-300!">Precio del ticket:</label>
                        <input
                          className="
                        w-full 
                        px-4 py-3 
                        bg-gradient-to-r from-gray-800 to-gray-900 
                        border border-amber-500/50! 
                        focus:border-amber-500 
                        text-white 
                        rounded-xl 
                        focus:outline-none 
                        focus:ring-2 focus:ring-amber-500/20 
                        transition-all
                      "
                          type="number"
                          placeholder="..."
                          name="precio"
                          required
                        ></input>
                      </div>
                    )}
                    <div className="qty">
                      <label className="text-gray-300!">Cantidad:</label>
                      <input
                        className="
                        w-full 
                        px-4 py-3 
                        bg-gradient-to-r from-gray-800 to-gray-900 
                        border border-amber-500/50! 
                        focus:border-amber-500 
                        text-white 
                        rounded-xl 
                        focus:outline-none 
                        focus:ring-2 focus:ring-amber-500/20 
                        transition-all
                      "
                        type="number"
                        min="1"
                        placeholder="..."
                        name="cantidad"
                        required
                      ></input>
                    </div>
                    <div className="est ml-3">
                      <label className="text-gray-300!">Estado:</label>
                      <br></br>
                      <select
                        className="pr-2 pl-2 rounded-lg text-gray-300! border-amber-500!"
                        name="estado"
                        onChange={(e) => setEstado(e.target.value)}
                        ref={estadoRef}
                      >
                        <option className="text-[#111827]" value={1}>Activo</option>
                        <option className="text-[#111827]" value={2}>No visible</option>
                        <option className="text-[#111827]" value={3}>Cortesia</option>
                        <option className="text-[#111827]" value={4}>Agotado</option>
                      </select>
                    </div>
                  </div>
                  {estado === "3" && (
                    <div className="est mt-3">
                      <label className="text-gray-300!">Para:</label>
                      <br></br>
                      <select
                        className="ml-1 text-gray-300! border-amber-500!"
                        name="distribution"
                        onChange={(e) => setDistribution(e.target.value)}
                      >
                        <option className="text-[#111827]" value={1}>RRPP</option>
                        <option className="text-[#111827]" value={2}>Clientes</option>
                      </select>
                    </div>
                  )}
                  <div className=" mt-2">
                    <label className="text-gray-300!">Limite a sacar por persona:</label>
                    <input
                      type="number"
                      name="limit"
                      placeholder="Ej: 3"
                      className="text-gray-300! border-amber-500!"
                    ></input>
                  </div>
                  <div className="edit-form-date mt-3">
                    <label className="text-gray-300!">Fecha y hora de fin:</label>
                    <input
                      className="text-gray-300! border-amber-500!"
                      type="datetime-local"
                      value={closeDate}
                      onChange={(e) => setCloseDate(e.target.value)}
                      required
                    ></input>
                  </div>
                  {/*<div className="flex items-center">
                                        <label>Visibilidad</label><br></br>
                                        <input type="checkbox" name="visibilidad" onChange={(e) => setVisibilidad(e.target.value)}/>
                                </div>*/}
                  <div className="mt-2">
                    <label className="text-gray-300!">Imagen del ticket</label>
                    <input className="text-gray-300! border-amber-500!" type="file" name="imgTicket"></input>
                  </div>
                </div>
                <div className="h-[80px] w-[300px] flex justify-between items-center w-full mt-5">
                  <button
                    className="bg-amber-600 p-2 rounded-xl"
                    onClick={() =>
                      changeButton
                        ? window.location.reload(false)
                        : setShowCreateTicketForm(!showCreateTicketForm)
                    }
                  >
                    {changeButton ? "Confirmar tickets" : "Cancelar"}{" "}
                  </button>
                  <button
                    className="w-[180px] bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-orange-600 hover:to-red-600 text-[#111827] rounded-xl p-2"
                    type="submit"
                  >
                    {loadingCreateTicket ? <LoadingButton /> : "Agregar ticket"}
                  </button>
                </div>
                {message == 2 && (
                  <div className="flex items-center">
                    <img className="mt-3" src={addedTicket} alt=""></img>
                    <p className="ml-2 mt-3 text-lg text-orange-500!">
                      Se agrego el nuevo ticket!
                    </p>
                  </div>
                )}
              </form>
            </>
          )}
         {showCreateDiscountForm && (
  <>
    <div
      className="abc fixed w-screen h-screen top-0 bottom-0 left-0 right-0 bg-black-500"
      onClick={() => setShowCreateDiscountForm(false)}
    ></div>

    <form
      className="add-tickets-form h-[auto]! fixed pl-4 pr-7 pb-4 rounded-xl bg-gray-800!"
      onSubmit={(e) => createDiscountCode(e)}
    >
      <div className="mt-4">
        <div className="flex items-center">
          <h3 className="text-xl text-yellow-600!">
            Crear nuevo descuento:
          </h3>
          <img
            className="ml-5"
            src={ticketPng}
            alt=""
            loading="lazy"
          />
        </div>

        <div className="mt-4">
          <label className="text-gray-200!">Generar codigo:</label>
          <div className="flex items-center">
            <input
              className="w-[140px]! text-gray-300! border-amber-500! mr-3"
              type="text"
              placeholder="..."
              value={idDiscount}
              required
              readOnly
            />
            <button
              type="button"
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-orange-600 hover:to-red-600 text-[#111827] rounded-xl p-3"
              onClick={() => setIdDiscount(nanoid(8))}
            >
              Generar
            </button>
          </div>
        </div>

        <div className="mt-2">
          <label className="text-gray-300!">
            Cantidad de descuentos:
          </label>
          <input
            className="text-gray-300! border-amber-500!"
            type="number"
            placeholder="..."
            name="cantidadDescuentos"
          />
        </div>

        <div className="mt-2">
            <label className="text-gray-300!">
              Valor del descuento:
            </label>
            <input
              className="text-gray-300! border-amber-500!"
              type="number"
              placeholder="..."
              name="numeroDescuento"
              required
            />
        </div>

        <div className="h-[80px] w-[300px] flex justify-between items-center w-full mt-1">
          <button
            type="button"
            className="bg-amber-600 p-2 rounded-xl"
            onClick={() =>
              changeButton
                ? window.location.reload(false)
                : setShowCreateDiscountForm(false)
            }
          >
            {changeButton ? "Confirmar Descuento" : "Cancelar"}
          </button>

          <button
            className="w-[180px] bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-orange-600 hover:to-red-600 text-[#111827] rounded-xl p-2"
            type="submit"
          >
            {loadingCreateTicket ? <LoadingButton /> : "Agregar Descuento"}
          </button>
        </div>

        {message === 2 && (
          <div className="flex items-center">
            <img className="mt-3" src={addedTicket} alt="" />
            <p className="ml-2 mt-3 text-lg text-orange-500!">
              ¡Se agregó el nuevo descuento!
            </p>
          </div>
        )}
      </div>
    </form>
  </>
)}

        </div>
        <div className="flex items-center">
          {/*<button className="flex items-center text-xl mt-16 bg-violet-900 pl-6 pr-6 pt-3 pb-3 rounded-lg cursor-pointer"><p>Editar tickets</p><img className="w-[15px] h-[15px] ml-3" src={downArrow} alt=""></img></button> */}
        </div>
        <div className="edit-tickets-container mt-10">
          <div className="add-ticket flex items-center mb-3 max-[780px]:w-[50vw]! mt-3">
            <button
              className="
                    max-[780px]:w-full
                    min-w-[200px]
                    px-3 py-2.5 
                    bg-gradient-to-r from-amber-500 to-yellow-500 
                    hover:from-amber-400 hover:to-yellow-500 
                    text-gray-900 font-semibold 
                    rounded-lg shadow-md 
                    hover:shadow-lg 
                    transition-all 
                    hover:scale-105 active:scale-95
                    
                  "
              type="button"
              onClick={() => setShowCreateTicketForm(true)}
            >
               <div className="flex items-center justify-center">
              <svg className="mr-3" viewBox="0 0 24 24" width={24} fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M3 10C3 8.34315 4.34315 7 6 7H14C15.6569 7 17 8.34315 17 10V18C17 19.6569 15.6569 21 14 21H6C4.34315 21 3 19.6569 3 18V10Z" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M10 14V11M10 14V17M10 14H13M10 14H7" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M7 3L18 3C19.6569 3 21 4.34315 21 6L21 17" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
                Agregar nuevo ticket
              </div>
            </button>
            <button
              className="
               max-[780px]:w-full
                min-w-[200px]
                  ml-3
                    px-3 py-2.5 
                     bg-gradient-to-r from-amber-500 to-yellow-500 
                    hover:from-amber-400 hover:to-yellow-500 
                    text-gray-900 font-semibold 
                    rounded-lg shadow-md 
                    hover:shadow-lg 
                    transition-all 
                    hover:scale-105 active:scale-95
                  "
              type="button"
              onClick={() => setShowCreateDiscountForm(true)}
            >
              <div className="flex items-center justify-center">
              <svg className="mr-3" viewBox="0 0 24 24" width={24} fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M3 10C3 8.34315 4.34315 7 6 7H14C15.6569 7 17 8.34315 17 10V18C17 19.6569 15.6569 21 14 21H6C4.34315 21 3 19.6569 3 18V10Z" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M10 14V11M10 14V17M10 14H13M10 14H7" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M7 3L18 3C19.6569 3 21 4.34315 21 6L21 17" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
              Agregar nuevo codigo de descuento

              </div>
            </button>
              <button
              className="
               max-[780px]:w-full
                min-w-[200px]
                  ml-3
                    px-3 py-2.5 
                     bg-gradient-to-r from-amber-500 to-yellow-500 
                    hover:from-amber-400 hover:to-yellow-500 
                    text-gray-900 font-semibold 
                    rounded-lg shadow-md 
                    hover:shadow-lg 
                    transition-all 
                    hover:scale-105 active:scale-95
                  "
              onClick={() => setChangeTDLayout(!changeTDLayout)}
            >
               <div className="flex items-center justify-center">
                {changeTDLayout 
                  ? 
                  <svg className="mr-3" viewBox="0 0 24 24" width={24} fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M14 11C14 10.4477 14.4477 10 15 10C15.5523 10 16 10.4477 16 11V13C16 13.5523 15.5523 14 15 14C14.4477 14 14 13.5523 14 13V11Z" stroke="#111827" stroke-width="1.5"></path> <path d="M14.0079 19.0029L13.2579 19.0007V19.0007L14.0079 19.0029ZM14.0137 17L14.7637 17.0022V17H14.0137ZM3.14958 18.8284L2.61991 19.3594H2.61991L3.14958 18.8284ZM3.14958 5.17157L2.61991 4.64058L2.61991 4.64058L3.14958 5.17157ZM2.95308 10.2537L2.58741 10.9085H2.58741L2.95308 10.2537ZM2.01058 8.98947L1.26124 8.95797L2.01058 8.98947ZM2.95308 13.7463L2.58741 13.0915L2.58741 13.0915L2.95308 13.7463ZM2.01058 15.0105L2.75992 14.979L2.01058 15.0105ZM21.0469 10.2537L21.4126 10.9085L21.0469 10.2537ZM21.9894 8.98947L22.7388 8.95797V8.95797L21.9894 8.98947ZM20.8504 5.17157L21.3801 4.64058L21.3801 4.64058L20.8504 5.17157ZM21.0469 13.7463L20.6812 14.4012V14.4012L21.0469 13.7463ZM21.9894 15.0105L22.7388 15.042V15.042L21.9894 15.0105ZM20.8504 18.8284L21.3801 19.3594L21.3801 19.3594L20.8504 18.8284ZM21.9437 14.332L22.5981 13.9656L22.5981 13.9656L21.9437 14.332ZM21.9437 9.66803L22.5981 10.0344L22.5981 10.0344L21.9437 9.66803ZM2.05634 14.332L1.4019 13.9656L1.4019 13.9656L2.05634 14.332ZM2.05634 9.66802L2.71079 9.30168L2.71078 9.30168L2.05634 9.66802ZM14.0137 7H14.7637L14.7637 6.99782L14.0137 7ZM14.0064 4.49855L13.2564 4.50073V4.50073L14.0064 4.49855ZM16.5278 4.0189L16.5471 3.26915L16.5278 4.0189ZM17.0336 19.9642L17.0653 20.7135H17.0653L17.0336 19.9642ZM13.8595 19.8541L13.3299 19.323L13.3299 19.323L13.8595 19.8541ZM14.7579 19.0051L14.7637 17.0022L13.2637 16.9978L13.2579 19.0007L14.7579 19.0051ZM15.0162 16.75C15.1574 16.75 15.2687 16.8637 15.2687 17H16.7687C16.7687 16.0317 15.9823 15.25 15.0162 15.25V16.75ZM15.0162 15.25C14.0501 15.25 13.2637 16.0317 13.2637 17H14.7637C14.7637 16.8637 14.875 16.75 15.0162 16.75V15.25ZM9.99502 4.75H13.5052V3.25H9.99502V4.75ZM13.0079 19.25H9.99502V20.75H13.0079V19.25ZM9.99502 19.25C8.08355 19.25 6.72521 19.2484 5.69469 19.1102C4.68554 18.9749 4.10384 18.721 3.67925 18.2974L2.61991 19.3594C3.3698 20.1074 4.32051 20.4393 5.4953 20.5969C6.64871 20.7516 8.12585 20.75 9.99502 20.75V19.25ZM9.99502 3.25C8.12585 3.25 6.64871 3.24841 5.4953 3.4031C4.32051 3.56066 3.3698 3.89255 2.61991 4.64058L3.67925 5.70256C4.10384 5.27902 4.68554 5.02513 5.69469 4.88979C6.72521 4.75159 8.08355 4.75 9.99502 4.75V3.25ZM2.58741 10.9085C2.97311 11.1239 3.23007 11.533 3.23007 12H4.73007C4.73007 10.9664 4.1586 10.0678 3.31876 9.59884L2.58741 10.9085ZM2.75992 9.02097C2.83795 7.16494 3.09146 6.28889 3.67925 5.70256L2.61991 4.64058C1.59036 5.66758 1.34012 7.08185 1.26124 8.95797L2.75992 9.02097ZM3.23007 12C3.23007 12.467 2.97311 12.8761 2.58741 13.0915L3.31876 14.4012C4.1586 13.9322 4.73007 13.0336 4.73007 12H3.23007ZM1.26124 15.042C1.34012 16.9182 1.59036 18.3324 2.61991 19.3594L3.67925 18.2974C3.09146 17.7111 2.83795 16.8351 2.75992 14.979L1.26124 15.042ZM20.7699 12C20.7699 11.533 21.0269 11.1239 21.4126 10.9085L20.6812 9.59884C19.8414 10.0678 19.2699 10.9664 19.2699 12H20.7699ZM22.7388 8.95797C22.6599 7.08185 22.4096 5.66758 21.3801 4.64058L20.3207 5.70256C20.9085 6.28889 21.1621 7.16494 21.2401 9.02097L22.7388 8.95797ZM21.4126 13.0915C21.0269 12.8761 20.7699 12.467 20.7699 12H19.2699C19.2699 13.0336 19.8414 13.9322 20.6812 14.4012L21.4126 13.0915ZM21.2401 14.979C21.1621 16.8351 20.9085 17.7111 20.3207 18.2974L21.3801 19.3594C22.4096 18.3324 22.6599 16.9182 22.7388 15.042L21.2401 14.979ZM20.6812 14.4012C20.9652 14.5597 21.1507 14.6636 21.2761 14.7427C21.3379 14.7817 21.3653 14.8024 21.3735 14.8093C21.388 14.8213 21.3375 14.7846 21.2892 14.6983L22.5981 13.9656C22.5153 13.8177 22.4043 13.7154 22.3304 13.6542C22.2503 13.5878 22.1613 13.5276 22.0764 13.4741C21.9087 13.3683 21.6804 13.2411 21.4126 13.0915L20.6812 14.4012ZM22.7388 15.042C22.746 14.8706 22.7541 14.6937 22.7476 14.5458C22.741 14.3959 22.7178 14.1795 22.5981 13.9656L21.2892 14.6983C21.2386 14.6079 21.2461 14.5457 21.249 14.6117C21.2503 14.6404 21.2505 14.6822 21.2488 14.7464C21.2472 14.8104 21.244 14.8847 21.2401 14.979L22.7388 15.042ZM21.4126 10.9085C21.6804 10.7589 21.9087 10.6317 22.0764 10.5259C22.1613 10.4724 22.2503 10.4122 22.3304 10.3458C22.4043 10.2846 22.5153 10.1823 22.5981 10.0344L21.2892 9.30168C21.3375 9.21543 21.388 9.17871 21.3735 9.19072C21.3653 9.19756 21.3379 9.21832 21.2761 9.25725C21.1507 9.33637 20.9652 9.44028 20.6812 9.59884L21.4126 10.9085ZM21.2401 9.02097C21.244 9.11528 21.2472 9.18961 21.2488 9.25357C21.2505 9.31779 21.2503 9.35964 21.249 9.38827C21.2461 9.45428 21.2386 9.39206 21.2892 9.30169L22.5981 10.0344C22.7178 9.82054 22.741 9.60408 22.7476 9.45419C22.7541 9.30634 22.746 9.12945 22.7388 8.95797L21.2401 9.02097ZM2.58741 13.0915C2.31959 13.2411 2.0913 13.3683 1.92358 13.4741C1.83872 13.5276 1.74971 13.5878 1.66957 13.6542C1.59566 13.7154 1.48474 13.8177 1.4019 13.9656L2.71078 14.6983C2.6625 14.7846 2.61198 14.8213 2.62648 14.8093C2.63474 14.8024 2.66215 14.7817 2.72387 14.7427C2.84929 14.6636 3.03482 14.5597 3.31876 14.4012L2.58741 13.0915ZM2.75992 14.979C2.75595 14.8847 2.75285 14.8104 2.7512 14.7464C2.74954 14.6822 2.74973 14.6404 2.75099 14.6117C2.75389 14.5457 2.76137 14.6079 2.71078 14.6983L1.4019 13.9656C1.28221 14.1795 1.25903 14.3959 1.25244 14.5458C1.24593 14.6937 1.25403 14.8706 1.26124 15.042L2.75992 14.979ZM3.31876 9.59884C3.03482 9.44028 2.84929 9.33637 2.72386 9.25725C2.66214 9.21832 2.63474 9.19756 2.62648 9.19072C2.61198 9.17871 2.66251 9.21543 2.71079 9.30168L1.4019 10.0344C1.48473 10.1823 1.59565 10.2846 1.66956 10.3458C1.74971 10.4122 1.83872 10.4724 1.92357 10.5259C2.0913 10.6317 2.31959 10.7589 2.58741 10.9085L3.31876 9.59884ZM1.26124 8.95797C1.25403 9.12945 1.24593 9.30634 1.25244 9.45419C1.25903 9.60408 1.28221 9.82054 1.4019 10.0344L2.71078 9.30168C2.76137 9.39206 2.75389 9.45428 2.75099 9.38827C2.74973 9.35964 2.74954 9.31779 2.7512 9.25357C2.75285 9.18961 2.75595 9.11528 2.75992 9.02097L1.26124 8.95797ZM14.7637 6.99782L14.7564 4.49637L13.2564 4.50073L13.2637 7.00218L14.7637 6.99782ZM15.0162 7.25C14.875 7.25 14.7637 7.13631 14.7637 7H13.2637C13.2637 7.96826 14.0501 8.75 15.0162 8.75V7.25ZM15.2687 7C15.2687 7.13631 15.1574 7.25 15.0162 7.25V8.75C15.9823 8.75 16.7687 7.96826 16.7687 7H15.2687ZM15.2687 4.51618V7H16.7687V4.51618H15.2687ZM16.5084 4.76865C18.6966 4.82509 19.6778 5.06124 20.3208 5.70256L21.3801 4.64058C20.2676 3.53084 18.6939 3.32452 16.5471 3.26915L16.5084 4.76865ZM16.7687 4.51618C16.7687 4.656 16.6534 4.77239 16.5084 4.76865L16.5471 3.26915C15.8429 3.25099 15.2687 3.81835 15.2687 4.51618H16.7687ZM13.5052 4.75C13.3698 4.75 13.2568 4.64027 13.2564 4.50073L14.7564 4.49637C14.7544 3.80569 14.1931 3.25 13.5052 3.25V4.75ZM17.0653 20.7135C18.9399 20.6343 20.353 20.384 21.3801 19.3594L20.3208 18.2974C19.7336 18.8831 18.8563 19.1365 17.002 19.2148L17.0653 20.7135ZM15.2687 17V18.9765H16.7687V17H15.2687ZM13.2579 19.0007C13.2575 19.121 13.2572 19.2136 13.255 19.2926C13.2528 19.3721 13.249 19.4192 13.245 19.4481C13.2411 19.4764 13.2396 19.4669 13.2513 19.4387C13.2654 19.4045 13.2911 19.3617 13.3299 19.323L14.389 20.3852C14.6246 20.1502 14.701 19.8709 14.7311 19.6521C14.7582 19.4548 14.7573 19.219 14.7579 19.0051L13.2579 19.0007ZM13.0079 20.75C13.2218 20.75 13.4576 20.7516 13.6549 20.7251C13.8739 20.6957 14.1534 20.6201 14.389 20.3852L13.3299 19.323C13.3687 19.2843 13.4116 19.2587 13.4458 19.2447C13.4741 19.2331 13.4836 19.2346 13.4553 19.2384C13.4264 19.2423 13.3792 19.246 13.2998 19.248C13.2208 19.25 13.1282 19.25 13.0079 19.25V20.75ZM17.002 19.2148C16.8812 19.2199 16.7889 19.2238 16.7101 19.225C16.631 19.2262 16.5849 19.2244 16.5575 19.2217C16.5309 19.2191 16.5426 19.2175 16.5734 19.2292C16.6103 19.2433 16.6536 19.2685 16.6917 19.305L15.6536 20.3878C15.8978 20.6219 16.183 20.6921 16.4108 20.7145C16.6127 20.7344 16.8518 20.7225 17.0653 20.7135L17.002 19.2148ZM15.2687 18.9765C15.2687 19.1953 15.267 19.4374 15.295 19.6397C15.3263 19.8655 15.407 20.1514 15.6536 20.3878L16.6917 19.305C16.7313 19.343 16.7584 19.3863 16.7737 19.4221C16.7863 19.4516 16.7848 19.4622 16.7808 19.4337C16.7768 19.4046 16.7729 19.3566 16.7708 19.2753C16.7687 19.1945 16.7687 19.0997 16.7687 18.9765H15.2687Z" fill="#111827"></path> </g></svg>
                  :
                  <svg  className="mr-3" viewBox="-0.5 0 25 25" width={24} fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M18 3.91992H6C3.79086 3.91992 2 5.71078 2 7.91992V17.9199C2 20.1291 3.79086 21.9199 6 21.9199H18C20.2091 21.9199 22 20.1291 22 17.9199V7.91992C22 5.71078 20.2091 3.91992 18 3.91992Z" stroke="#111827" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M7 17.9199L17 7.91992" stroke="#111827" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M8 11.9199C9.10457 11.9199 10 11.0245 10 9.91992C10 8.81535 9.10457 7.91992 8 7.91992C6.89543 7.91992 6 8.81535 6 9.91992C6 11.0245 6.89543 11.9199 8 11.9199Z" stroke="#111827" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M16 17.9199C17.1046 17.9199 18 17.0245 18 15.9199C18 14.8154 17.1046 13.9199 16 13.9199C14.8954 13.9199 14 14.8154 14 15.9199C14 17.0245 14.8954 17.9199 16 17.9199Z" stroke="#111827" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
                }
                {changeTDLayout ? 'Ver tickets' : 'Ver descuentos'}
              </div>
            </button>
          </div>
          <div className="tickets-edit-prod max-h-[432px]!">
            {changeTDLayout ? 
            (
              <>
                {discounts.map((ds) => 
                     <div
                        className="flex justify-center mx-auto text-center"
                        key={ds._id}
                      >
                        <div className="
                        mb-2
                      w-full
                      flex items-center gap-4 
                      p-4 
                      bg-gray-900/50 
                      border border-gray-700/50 
                      rounded-xl 
                      hover:border-amber-500/50 
                      transition-all
                    ">
                          <div className="summary-event-info text-left w-full flex items-center">
                            <p className="text-sm text-gray-400 ml-3 mr-2">
                              Codigo de descuento: 
                            </p>
                            <p className="text-gray-300">{ds.idDescuento}</p>
                          </div>
                          <p className="w-[150px]">Cant. {ds.cantidadDescuentos} </p>
                          <p className="w-[150px]">desc. %{ds.numeroDescuento} </p>
                          <button
                           type="button"
                           className="editProd-edit-ticket bg-gradient-to-r from-amber-500 to-yellow-400 
                      hover:from-amber-600 hover:to-yellow-500 
                      text-gray-900 font-bold py-2 px-3 rounded-lg"
                           onClick={() => {navigator.clipboard.writeText(ds.idDescuento), alert('Codigo copiado')}}
                          >
                            Copiar
                          </button>
                        </div>
                      </div>
                )}
              </>
            )
            :
            (
              <>
                {prod.map((pr) => {
                  const allTickets = [
                    ...(pr.tickets?.map((t) => ({ ...t, type: "ticket" })) || []),
                    ...(pr.cortesiaRRPP?.map((c) => ({ ...c, type: "cortesia" })) ||
                      []),
                  ];
                  return allTickets.map((tick) => (
                    <div key={tick._id}>
                      <div
                        className="flex justify-center mx-auto text-center"
                        key={tick._id}
                      >
                        <div className="
                        mb-2
                      w-full
                      flex items-center gap-4 
                      p-4 
                      bg-gray-900/50 
                      border border-gray-700/50 
                      rounded-xl 
                      hover:border-amber-500/50 
                      transition-all
                    ">
                          <img
                            className="ticket-img w-[60px] h-[60px] rounded-xl ml-1"
                            src={tick.imgTicket ?? goPng}
                            alt=""
                            loading="lazy"
                          ></img>
                          <div className="summary-event-info text-left w-full">
                            <p className="text-gray-200 font-semibold mb-1">
                              {tick.nombreTicket}
                            </p>
                            <p className="text-amber-500 font-medium mb-1">
                              {tick.precio >= 0 ? `$${tick.precio}` : "Cortesia"}
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
                          {tick.cantidad ?? tick.cantidadDeCortesias}
                        </span>
                        <span>{formatDate(tick.fechaDeCierre)}</span>
                      </div>



                       








                          </div>
                          <button
                            className="editProd-edit-ticket text-yellow-500 p-3 cursor-pointer text-md rounded-xl"
                            onClick={(e) => showTicketFunc(e, tick._id)}
                          >
                            Editar
                          </button>
                        </div>
                      </div>
                      {openTicketId === tick._id && (
                        <>
                          <div
                            className="abc fixed w-screen h-screen top-0 bottom-0 left-0 right-0 bg-black-500"
                            onClick={() => setOpenTicketId(null)}
                          ></div>
                          <div className="add-tickets-form fixed p-6 rounded-lg bg-gray-800!">
                            <div className="mt-3 mb-3">
                              <label className="text-gray-200!">Cambiar imagen del ticket:</label>
                              <br></br>
                              <input
                                type="file"
                                name="imgTicket"
                                className="border-amber-500! text-gray-400!"
                                ref={(el) => (fileRefsB.current[tick._id] = el)}
                              />
                            </div>
                            <div>
                              <label className="text-gray-200!">Nombre del ticket:</label>
                              <br></br>
                              <input
                                type="text"
                                name="nombreTicket"
                                className="border-amber-500! text-gray-400!"
                                value={
                                  ticketData[tick._id]?.nombreTicket ??
                                  tick.nombreTicket
                                }
                                onChange={(e) =>
                                  setTicketData((prev) => ({
                                    ...prev,
                                    [tick._id]: {
                                      ...prev[tick._id],
                                      nombreTicket: e.target.value,
                                    },
                                  }))
                                }
                              ></input>
                            </div>
                            <div>
                              <label className="text-gray-200!">Descripcion del ticket</label>
                              <br></br>
                              <input
                                type="text"
                                name="descripcionTicket"
                                className="border-amber-500! text-gray-400!"
                                value={
                                  ticketData[tick._id]?.descripcionTicket ??
                                  tick.descripcionTicket
                                }
                                onChange={(e) =>
                                  setTicketData((prev) => ({
                                    ...prev,
                                    [tick._id]: {
                                      ...prev[tick._id],
                                      descripcionTicket: e.target.value,
                                    },
                                  }))
                                }
                              ></input>
                            </div>
                            {Number(ticketData[tick._id]?.estado ?? tick.estado) !==
                              3 && (
                              <div>
                                <label className="text-gray-200!">Precio:</label>
                                <br />
                                <input
                                  type="number"
                                  min="1"
                                  name="precio"
                                  className="border-amber-500! text-gray-400!"
                                  value={
                                    ticketData[tick._id]?.precio ?? tick.precio
                                  }
                                  onChange={(e) =>
                                    setTicketData((prev) => ({
                                      ...prev,
                                      [tick._id]: {
                                        ...prev[tick._id],
                                        precio: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              </div>
                            )}
                            <div>
                              <label className="text-gray-200!">Cantidad:</label>
                              <br></br>
                              <input
                                type="number"
                                min="1"
                                name="cantidad"
                                className="border-amber-500! text-gray-400!"
                                value={
                                  ticketData[tick._id]?.cantidad ??
                                  (Number(ticketData[tick._id]?.estado ?? tick.estado) === 3
                                    ? tick.cantidadDeCortesias
                                    : tick.cantidad)
                                }
                                onChange={(e) =>
                                  setTicketData((prev) => ({
                                    ...prev,
                                    [tick._id]: {
                                      ...prev[tick._id],
                                      cantidad: e.target.value,
                                    },
                                  }))
                                }
                              ></input>
                            </div>
                            <div>
                              <label className="text-gray-200!">Limite:</label>
                              <br></br>
                              <input
                                type="number"
                                min="1"
                                name="limit"
                                className="border-amber-500! text-gray-400!"
                                value={ticketData[tick._id]?.limit ?? tick.limit}
                                onChange={(e) =>
                                  setTicketData((prev) => ({
                                    ...prev,
                                    [tick._id]: {
                                      ...prev[tick._id],
                                      limit: e.target.value,
                                    },
                                  }))
                                }
                              ></input>
                            </div>
                            <div className="mt-3 mb-3">
                              <label className="text-gray-200!">Estado:</label>
                              <br></br>
                              <select
                                className="rounded-lg border-amber-500! text-gray-400!"
                                name="estado"
                                ref={estadoRef}
                              >
                                <option className="text-gray-900!" value={tick.estado}>
                                  {(tick.estado === 1 && "Activo") ||
                                    (tick.estado === 2 && "No visible") ||
                                    (tick.estado === 3 && "Cortesia") ||
                                    (tick.estado === 4 && "Agotado")}
                                </option>
                                {tick.estado !== 1 && <option className="text-gray-900!" value={1}>Activo</option>}
                                {tick.estado !== 2 && <option className="text-gray-900!" value={2}>No visible</option>}
                                {tick.estado !== 4 && <option className="text-gray-900!" value={4}>Agotado</option>}
                                {/*<option className="text-gray-900!" value={3}>Cortesia</option>*/ }
                              </select>
                            </div>
                            <div className="mt-3">
                              <div className="items-center text-center">
                                <label>Fecha de cierre: </label>
                                <label>{formatDate(tick.fechaDeCierre)}</label>
                                <br></br>
                                <div className="mt-3">
                                  <label>Cambiar fecha a:</label>
                                  <br></br>
                                  <input
                                    type="datetime-local"
                                    className="border-amber-500! text-gray-400!"
                                    value={
                                      ticketData[tick._id]?.fechaDeCierre ??
                                      tick.fechaDeCierre
                                    }
                                    onChange={(e) =>
                                      setTicketData((prev) => ({
                                        ...prev,
                                        [tick._id]: {
                                          ...prev[tick._id],
                                          fechaDeCierre: e.target.value,
                                        },
                                      }))
                                    }
                                  ></input>
                                </div>
                              </div>
                            </div>
                            {message === 3 && (
                                <p className="text-center bg-gray-800! text-yellow-500! mt-3">
                                  Ticket actualizado!
                                </p>
                              )}
                            {/*  <div className="flex justify-center items-center mt-3">
                                                    <label>Visibilidad</label>
                                                    <input className="ml-2" type="checkbox" name="visibilidad" value={ticketData[tick._id]?.visibilidad ?? tick.visibilidad}  onChange={(e) =>
                                                    setTicketData(prev => ({
                                                    ...prev,
                                                    [tick._id]: {
                                                        ...prev[tick._id],
                                                        visibilidad: e.target.value
                                                        }
                                                    }))
                                                }></input>
                                                </div> */}
                            <div className="flex items-center justify-between">
                              <button
                                className="bg-amber-600 mt-5 p-3 w-[100px] rounded-lg"
                                onClick={() => setOpenTicketId(null)}
                              >
                                Cancelar
                              </button>
                              <button
                                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-orange-600 hover:to-red-600 text-[#111827] mt-5 p-3 w-[100px] rounded-lg cursor-pointer"
                                onClick={(e) =>
                                  editEventTicket(
                                    e,
                                    tick._id,
                                    tick.imgTicket,
                                    tick.nombreTicket,
                                    tick.descripcionTicket,
                                    tick.precio,
                                    tick.cantidad,
                                    tick.limit,
                                    tick.fechaDeCierre,
                                    tick.visibilidad
                                  )
                                }
                              >
                                {ticketLoading ? <LoadingButton /> : "Editar"}
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ));
                })}
              </>
          )}
          </div>
        </div>
        <div className="send-back relative flex flex-wrap justify-between items-center">
          <form
            className="add-colab-form items-center mt-10 mb-6"
            onSubmit={(e) => addRRPP(e)}
          >
            <div className="flex flex-wrap items-center">
              <input
                type="email"
                  placeholder="email@colaborador.com"
                  className="
                    ml-1
                   
                    bg-gray-900 
                    border border-amber-500! 
                    text-gray-200! 
                    rounded-xl 
                    focus:outline-none 
                    focus:ring-2 focus:ring-amber-500/50 
                    transition-all
                  "
                required
              ></input>
              <button
                className="
                    px-5 py-2
                    ml-2 
                    bg-gradient-to-r from-amber-500 to-yellow-500 
                    hover:from-amber-600 hover:to-yellow-600 
                    text-gray-900 font-semibold 
                    rounded-xl shadow-md 
                    hover:shadow-lg 
                    transition-all 
                    hover:scale-105 active:scale-95
                  "
                type="submit"
              >
                Añadir Colaborador
              </button>
            </div>
            {message == 1 && (
              <p className="text-lg mt-2 text-green-700 text-center">
                Se añadio el colaborador al evento!
              </p>
            )}
            {message == 4 && (
              <p className="text-lg mt-2 text-[#111827]! text-center">
                El colaborador ya existe!
              </p>
            )}
          </form>
          <div className="edit-prod-bottom-buttons flex flex-wrap justify-center items-center">
            <Link
              className="flex items-center mx-2 p-2 border-[1px] border-gray-600 rounded-lg text-[#111827] text-sm! min-w-[240px] mt-2! bg-gradient-to-r from-amber-500 to-yellow-500"
              to={`/editar_evento/staff/${prod[0]?._id}`}
            >
              <img src={qrCodePng} alt="" loading="lazy"></img>
              <p className="ml-2 font-bold">Enviar Invitaciónes</p>
            </Link>
            <Link
              className="flex items-center mx-2 p-2 border-[1px] border-gray-600 rounded-lg text-[#111827] text-sm! min-w-[240px] mt-2! bg-gradient-to-r from-amber-500 to-yellow-500"
              to={`/cortesies/${prod[0]?._id}`}
            >
              <img src={qrCodePng} alt="" loading="lazy"></img>
              <p className="ml-2 font-bold">Crear lista de invitaciónes</p>
            </Link>
            <button
              className="flex items-center justify-center mx-2 p-2 bg-red-500 hover:bg-red-500/70  text-[#111827] rounded-lg text-sm! min-w-[173px] mt-2!"
              onClick={() => setCancelAlert(true)}
            >
              <svg viewBox="0 0 28 28" width={24} fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M7.8 13C7.35817 13 7 13.3582 7 13.8V14.2C7 14.6418 7.35817 15 7.8 15H20.2C20.6418 15 21 14.6418 21 14.2V13.8C21 13.3582 20.6418 13 20.2 13H7.8Z" fill="#111827"></path><path clip-rule="evenodd" d="M14 1C6.82031 1 1 6.82031 1 14C1 21.1797 6.82031 27 14 27C21.1797 27 27 21.1797 27 14C27 6.82031 21.1797 1 14 1ZM3 14C3 7.9248 7.92578 3 14 3C20.0742 3 25 7.9248 25 14C25 20.0752 20.0742 25 14 25C7.92578 25 3 20.0752 3 14Z" fill="#111827" fill-rule="evenodd"></path></g></svg>
              {prod[0]?.active ?
                <p className="ml-2 font-bold">Bajar evento</p>
                :
                <p className="ml-2">Subir evento</p>
              }
            </button>
            <Link
              className="flex items-center mx-2 p-2 bg-gradient-to-r from-gray-900 to-gray-950 hover:scale-105 active:scale-95  text-white rounded-lg text-white! text-sm! min-w-[172px] mt-2! transition-all"
              to="/productions"
            >
              <img src={nextPng} alt="" loading="lazy"></img>
              <p className="ml-2">Continuar</p>
            </Link>
          </div>
        </div>
      </div>
      {cancelAlert && (
        <>
          <div className="fixed z-[3] bg-black h-screen  top-[0%] w-screen opacity-[0.5]"></div>
          <div className="cancel-alert fixed z-[4] top-[50%] w-[450px] text-center bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl">
            <div className="flex items-center justify-center bg-gradient-to-r from-amber-600 to-yellow-500 p-2 rounded-t-xl">
              <img className="megaphone" src={megaphoneBPng} alt=""></img>
              <h2 className="text-3xl text-[#111827]! ml-2">Aviso!</h2>
            </div>
            <div className="p-4">
              <p className="text-md text-gray-300">
                ¿Estas seguro de cancelar el evento? Si das de baja el evento se
                reembolsara el dinero de los tickets comprados y no se mostrara
                el evento.
              </p>
            </div>
            <div className="flex justify-center mt-1 mb-8">
              <img src={cancelEventPng} alt=""></img>
              <img className="ml-5" src={eraserPng} alt=""></img>
            </div>
            <div className="flex items-center justify-around pb-2">
              <button
                className="w-[100px] rounded-lg text-[#111827] p-2 bg-yellow-500 "
                onClick={() => setCancelAlert(false)}
              >
                Atras
              </button>
              {prod[0]?.active ? 
                <button
                  className="w-[100px] rounded-lg text-[#111827] p-2 bg-red-500"
                  onClick={() => cancelarEvento(prod[0]._id)}
                >
                  Bajar
                </button>
              :
                <button
                  className="w-[100px] rounded-lg text-[#111827] p-2 bg-red-400"
                  onClick={() => reactivarEvento(prod[0]._id)}
                >
                  Subir
                </button>
              }
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default EditProd;
