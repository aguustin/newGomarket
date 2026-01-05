import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  addRRPPRequest,
  cancelarEventoRequest,
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

  useEffect(() => {
    const userId = session?.userFinded?.[0]?._id;
    const getOneProd = async () => {
      const res = await getOneProdRequest(prodId, userId); //userId va la session del usuario
      setProd(res.data);
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
      /*setTimeout(() => {
                    window.location.reload(false)
                },2000)*/
    }
  };

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
      <div className="edit-event-and-tickets-container mx-12 mt-[30px] mb-20 bg-gray-800 border-[1px] border-gray-700 rounded-2xl p-5">
        <div>
          <div className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 p-6 rounded-t-lg">
            <h2 className="text-[#111827]! text-center text-2xl font-bold flex items-center justify-center">
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
                  <div className="">
                    <img
                      className="w-[250px] h-[200px] object-cover rounded-lg"
                      src={previewPortada ?? p.imgEvento}
                      alt=""
                      loading="lazy"
                    ></img>
                  </div>
                  <div className="edit-evet-desc text-left ml-4">
                    <h2 className="text-3xl text-gray-300!">
                      {p.nombreEvento}
                    </h2>
                    <p className="mt-3 text-gray-400!">
                      Puedes subir otra imagen para tu evento y cambiar su
                      información
                    </p>
                    <p className="w-[auto] flex items-center p-3 bg-[#ffdeca] mt-3 mb-3 rounded-xl text-[#111827]">
                      <img className="mr-3" src={megaphonePng} alt=""></img>{" "}
                      Consejo: Un titulo corto + una portada llamativa mejora la
                      busqueda del evento
                    </p>
                    <div className="edit-evet-img-upload top-15 right-10">
                      <label
                        htmlFor="imgEventoHtml"
                        className="flex items-center border-[1px] border-gray-300 text-gray-300! p-3 rounded-2xl"
                      >
                        <img className="mr-3" src={uploadPng} alt=""></img>
                        Cargar nueva portada
                      </label>
                      <br></br>
                      <input
                        id="imgEventoHtml"
                        className="border-none hidden"
                        type="file"
                        name="imgEvento"
                        ref={fileRef}
                        onChange={handleFileChange}
                      />
                    </div>
                    <div>
                      <button
                        className="relation-buttons bg-yellow-500 text-[#111827]! p-3 rounded-lg translate-x-auto!"
                        onClick={() => setShowOthersProds(!showOthersProds)}
                      >
                        Relacionar eventos
                      </button>
                      <button
                        className="relation-buttons bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-[#111827] ml-3 p-3 rounded-lg translate-x-auto!"
                        onClick={() => setShowSoldOutAdv(!showSoldOutAdv)}
                      >
                        Marcar como Sold out
                      </button>
                       {showDesc ? <button className="text-white!" onClick={() => setShowDesc(false)}>Cerrar desc evento</button> : <button onClick={() => setShowDesc(true)}>Mostrar desc evento</button>}
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
                      <label className="text-gray-300!">Nombre del evento:</label>
                      <br></br>
                      <input
                        type="text"
                        className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!"
                        value={
                          eventosEditados[p._id]?.nombreEvento ?? p.nombreEvento
                        }
                        onChange={(e) =>
                          handleChangeEvento(e, p._id, "nombreEvento")
                        }
                      ></input>
                    </div>
                    <div>
                      <label className="text-gray-300!">Descripcion:</label>
                      <br></br>
                      <input
                        type="textarea"
                        className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!"
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
                      <label className="text-gray-300!">Aviso importante:</label>
                      <br></br>
                      <input
                        type="textarea"
                        className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!"
                        value={eventosEditados[p._id]?.aviso ?? p.aviso}
                        onChange={(e) => handleChangeEvento(e, p._id, "aviso")}
                      ></input>
                    </div>
                    <div>
                      <label className="text-gray-300!">Edad minima:</label>
                      <br></br>
                      <input
                        type="number"
                        className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!"
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
                      <label className="text-gray-300!">Artistas que participan:</label>
                      <br></br>
                      <input
                        type="text"
                        className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!"
                        placeholder="..."
                        value={eventosEditados[p._id]?.artistas ?? p.artistas}
                        onChange={(e) =>
                          handleChangeEvento(e, p._id, "artistas")
                        }
                        name="artistas"
                      ></input>
                    </div>
                    <div>
                      <label className="text-gray-300!">Monto de ventas estimado:</label>
                      <br></br>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!"
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
                        className="text-gray-300! "
                      >
                        Banner del evento (opcional)
                      </label>
                      <input
                        id="fileUploadBanner"
                        className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!"
                        type="file"
                        name="bannerEvento"
                        onChange={handleBannerChange}
                        ref={fileRefBanner}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="fileUploadDescriptive"
                        className="text-gray-300!"
                      >
                        Imagen descriptiva (opcional)
                      </label>
                      <input
                        id="fileUploadDescriptive"
                        className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!"
                        type="file"
                        name="imagenDescriptiva"
                        onChange={handleDescriptiveChange}
                        ref={fileRefDescriptiveImg}
                      />
                    </div>
                  </div>
                  <div className="relative p-3">
                    <div>
                      <label className="text-gray-300!">Fecha y hora de inicio:</label>
                      <br></br>
                      <input
                        className="bg-amber-600! hover:from-blue-600 hover:to-purple-600 text-[#111827]!"
                        type="datetime-local"
                        value={formatearFechaParaInput(
                          eventosEditados[p._id]?.fechaInicio ?? p.fechaInicio
                        )}
                        onChange={(e) =>
                          handleChangeEvento(e, p._id, "fechaInicio")
                        }
                      ></input>
                      {dateMessage == 1 && (
                        <p className="text-red-600!">
                          La fecha de inicio no puede ser menor a la fecha
                          actual
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-gray-300!">Fecha y hora de fin:</label>
                      <br></br>
                      <input
                        className="bg-amber-600! hover:from-blue-600 hover:to-purple-600 to-pink-500 text-[#111827]!"
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
                        <label className="text-gray-300!">
                          Visibilidad del evento:{" "}
                          {p.tipoEvento === 1 ? "Publico" : "Privado"}
                        </label>
                        <br></br>
                        <select
                          className="pr-2 pl-2 rounded-lg py-4! bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!"
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
                        <label className="text-gray-300!">Localidad: {p.localidad}</label>
                        <br></br>
                        <select
                          className="pr-2 pl-2 rounded-lg py-4! bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!"
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
                      <label className="text-gray-300!">Direccion:</label>
                      <br></br>
                      <input
                        name="direccion"
                        className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!"
                        value={eventosEditados[p._id]?.direccion ?? p.direccion}
                        onChange={(e) =>
                          handleChangeEvento(e, p._id, "direccion")
                        }
                      ></input>
                    </div>
                    <div>
                      <label className="text-gray-200!">Lugar del evento:</label>
                      <br></br>
                      <input
                        type="text"
                        className="bg-gradient-to-r from-gray-800 to-gray-900 border-amber-500! text-white!"
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
                      className="absolute bg-yellow-400 right-3 bottom-[-60px] rounded-2xl p-3 text-md text-[#111827]"
                      type="submit"
                    >
                      {loading ? (
                        <LoadingButton />
                      ) : (
                        <div className="flex items-center">
                          <img src={updatePng} alt=""></img>
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
                          className="w-[120px] text-gray-300! border-amber-500!"
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
                        className="w-[120px] text-gray-300! border-amber-500!"
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
        </div>
        <div className="flex items-center">
          {/*<button className="flex items-center text-xl mt-16 bg-violet-900 pl-6 pr-6 pt-3 pb-3 rounded-lg cursor-pointer"><p>Editar tickets</p><img className="w-[15px] h-[15px] ml-3" src={downArrow} alt=""></img></button> */}
        </div>
        <div className="edit-tickets-container mt-10">
          <div className="add-ticket flex items-center mb-3">
            <button
              className="flex items-center pt-1 pb-1 pl-3 pr-3 mt-[75px]! bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-orange-600 hover:to-red-600 text-[#111827] cursor-pointer rounded-lg "
              type="button"
              onClick={() => setShowCreateTicketForm(true)}
            >
              Agregar nuevo ticket +
            </button>
          </div>
          <div className="tickets-edit-prod max-h-[432px]!">
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
                    <div className="tickets-desc-container relative w-full flex items-center justify-between mb-3 p-1! pt-2! pb-2!">
                      <img
                        className="ticket-img w-[60px] h-[60px] rounded-xl ml-1"
                        src={tick.imgTicket ?? goPng}
                        alt=""
                        loading="lazy"
                      ></img>
                      <div className="summary-event-info text-left w-full">
                        <p className="text-sm text-gray-200 ml-3">
                          {tick.nombreTicket}
                        </p>
                        <p className="text-sm text-gray-400 ml-3 ">
                          {tick.precio >= 0 ? `$${tick.precio}` : "Cortesia"}
                        </p>
                        <p className="text-sm text-gray-400 ml-3 flex items-center">
                          Cant. :
                          <img
                            className="h-[16px]! w-[16px]! ml-2 mr-1"
                            src={ticketCantPng}
                            alt=""
                          ></img>
                          {tick.cantidad ?? tick.cantidadDeCortesias}
                        </p>
                        <p className="text-sm text-amber-500 ml-3 flex flex-wrap items-center">
                          Cierre:{" "}
                          <img
                            className="h-[16px]! w-[16px]! ml-2 mr-1"
                            src={calendarPng}
                            alt=""
                          ></img>
                          {formatDate(tick.fechaDeCierre)}
                        </p>
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
                              ticketData[tick._id]?.cantidad ?? tick.cantidad
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
          </div>
        </div>
        <div className="send-back relative flex flex-wrap justify-between items-center">
          <form
            className="add-colab-form items-center mt-10 mb-6"
            onSubmit={(e) => addRRPP(e)}
          >
            <div className="flex flex-wrap items-center">
              <input
                className="h-[40px] text-sm text-gray-200!"
                type="email"
                placeholder="..."
                minLength="8"
                maxLength="60"
                name="rrppMail"
                required
              ></input>
              <button
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-orange-600 hover:to-red-600 text-white flex items-center p-2 cursor-pointer rounded-xl ml-3 text-sm text-[#111827]!"
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
              <p className="ml-2">Enviar Invitaciónes</p>
            </Link>
            <Link
              className="flex items-center mx-2 p-2 border-[1px] border-gray-600 rounded-lg text-[#111827] text-sm! min-w-[240px] mt-2! bg-gradient-to-r from-amber-500 to-yellow-500"
              to={`/cortesies/${prod[0]?._id}`}
            >
              <img src={qrCodePng} alt="" loading="lazy"></img>
              <p className="ml-2">Crear lista de invitaciónes</p>
            </Link>
            <button
              className="flex items-center justify-center mx-2 p-2 bg-red-500 text-[#111827] rounded-lg text-sm! min-w-[173px] mt-2!"
              onClick={() => setCancelAlert(true)}
            >
              <img src={cancelPng} alt="" loading="lazy"></img>
              {prod[0]?.active ?
                <p className="ml-2 ">Bajar evento</p>
                :
                <p className="ml-2">Subir evento</p>
              }
            </button>
            <Link
              className="flex items-center mx-2 p-2 bg-gradient-to-r from-purple-600 to-pink-600  text-white rounded-lg text-white! text-sm! min-w-[172px] mt-2!"
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
