import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { getOneProdRequest } from "../../api/eventRequests";
import { Chart, registerables } from 'chart.js';
import { formatDate } from "../../globalscomp/globalscomp";
import checkPng from '../../assets/images/check.png'
import statisticsPng from '../../assets/images/statistics.png'
import folderPng from '../../assets/images/folder.png'
import ticketSelledPng from '../../assets/images/ticket-selled.png'
import invitationPng from '../../assets/images/invitation.png'
import coinPng from '../../assets/images/coin.png'
import calendaryPng from '../../assets/images/calendar.png'

Chart.register(...registerables);

const Statistics = () => {
    const { prodId, userId } = useParams();
    const [graphic, setGraphic] = useState()
    const [productions, setProductions] = useState([]);
    const [currentView, setCurrentView] = useState('general'); // 'general', 'tickets', 'rrpp', 'courtesys'
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const currencyFormatter = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
    });
    useEffect(() => {
        const getProds = async () => {
            try {
                if (!userId) return;
                const res = await getOneProdRequest(prodId, userId);
                setProductions(res.data); // Aseguramos que sea un array
                setGraphic('bar')
            } catch (err) {
                console.error("Failed to fetch productions:", err);
            }
        };
        getProds();
    }, [userId]);
    
    // Generar el gráfico dinámicamente
    useEffect(() => {
        if (!chartRef.current || productions.length === 0) return;

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        let chartLabels = [];
        let chartData = [];

        switch (currentView) {
            case 'rrpp':
                chartLabels = ['Vendidos RRPP', 'Total vendido', 'Promedio por venta', 'Devoluciones'];
                chartData = productions?.flatMap((prod) =>
                    (prod.rrpp || []).flatMap((pdr) => 
                        (pdr.ventasRRPP || []).map((pdrVent) => ({
                            label: pdrVent.nombreCategoria,
                            data: [
                                pdrVent.vendidos,
                                pdrVent.total,
                                pdrVent.total / (pdrVent.vendidos || 1),
                                0
                            ]
                        }))
                    )
                );
                break;

            case 'courtesys':
                chartLabels = ['Nombre cortesía', 'Cantidad de cortesías', 'Cortesías entregadas'];
                chartData = productions?.flatMap((prod) =>
                    (prod.rrpp || []).flatMap((rrpp) =>
                        (rrpp.ticketsCortesias || []).flatMap((rtc) => 
                        (rtc.cortesiaRRPP || []).map((ctrp) => ({
                            label: `Tickets de Cortesía`,
                            data: [
                                ctrp.nombreTicket,
                                ctrp.cantidadCortesias,
                                ctrp.entregados
                            ]
                        }))
                        )
                    )
                );
                break;

            case 'tickets':
                chartLabels = ['Tickets vendidos', 'Cantidad sobrante', 'Monto por ticket'];
                chartData = productions?.flatMap((prod) =>
                    (prod.tickets || []).map((ticket) => ({
                        label: ticket.nombreTicket,
                        data: [
                            ticket.ventas || 0,
                            ticket.cantidad || 0,
                            (ticket.ventas || 0) * (ticket.precio || 0),
                        ]
                    }))
                );
                break;

            default: // 'general'
                chartLabels = ['Ventas totales', 'Monto vendido', 'Monto esperado', 'Devoluciones'];
                chartData = productions?.map((prod) => ({
                    label: prod.nombreEvento,
                    data: [
                        prod.totalVentas || 0,
                        prod.totalMontoVendido || 0,
                        prod.montoVentas || 0,
                        prod.totalDevoluciones || 0
                    ]
                }));
                break;
        }

        chartInstanceRef.current = new Chart(chartRef.current, {
            type: graphic.toString(), 
            data: {
                labels: chartLabels,
                datasets: chartData.map((item) => ({
                    label: item.label,
                    data: item.data,
                     backgroundColor:  [
                        'rgba(240, 3, 54, 0.3)',
                        'rgba(54, 162, 235, 0.3)',
                        'rgba(255, 206, 86, 0.3)',
                        'rgba(75, 192, 192, 0.3)',
                        'rgba(255, 14, 14, 0.3)',
                        'rgba(255, 159, 64, 0.3)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                    
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Estadísticas: ${currentView.toUpperCase()}`
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(138, 138, 138, 0.7)' // líneas verticales
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(138, 138, 138, 0.7)' // líneas horizontales
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.8)' // color de los números
                        }
                    }
                }
            }
        });

    }, [currentView, productions, graphic]);

    return (
        <div className="statistics w-[96vw] mx-auto mt-6 mb-6 bg-white rounded-2xl bg-gray-800! border-gray-600!">
            <div className="w-full bg-gradient-to-r from-amber-600 to-yellow-500 p-6 rounded-t-lg">
                    <h2 className="text-[#111827]! text-center text-2xl font-bold flex items-center justify-center">
                        Tus estadisticas
                    </h2>
                </div>
            {productions.map((prod) => (
                <div className="statistics-event-info mx-auto relative flex items-center p-4" key={prod._id}>
                    <div className="flex flex-wrap items-center">
                        <img className="w-[250px] h-[200px] object-cover rounded-lg" src={prod.imgEvento} alt="" loading="lazy"/>
                        <div className="ml-4">
                            <h2 className="statistic-even-name text-3xl text-gray-200!">{prod.nombreEvento}</h2>
                            <div className="statistic-event-desc">
                                <p className="mt-3 text-gray-300">{prod.paisDestino}, {prod.provincia}</p>
                                <div className="flex flex-wrap items-center">
                                    <p className="mt-3 text-gray-400 flex items-center"><img className="mr-2" src={calendaryPng} alt=""></img>{formatDate(prod.fechaInicio)}</p>
                                    <p className="mt-3 ml-6 text-gray-400 flex items-center"><img className="mr-2" src={calendaryPng} alt=""></img>{formatDate(prod.fechaFin)}</p>
                                </div>
                            </div>
                            <div className="info-container flex items-center mt-4">
                                <div className="info p-3 pr-12 border-[1px] rounded-2xl border-gray-600!">
                                    <p className="text-gray-400">Monto esperado</p>
                                    <p className="text-amber-500 text-xl">${prod.montoVentas}</p>
                                    <p className="text-gray-400">Total vendido</p>
                                    <p className="text-amber-500 text-xl">{currencyFormatter.format(prod.totalMontoVendido)}</p>
                                </div>
                                <div className="info ml-3 p-3 pr-12 rounded-2xl border-gray-600!">
                                    <p className="text-gray-400">Tickets vendidos</p>
                                    <p className="text-amber-500 text-xl">{prod.totalVentas}</p>
                                     <p className="flex items-center p-3 bg-gray-900 mt-3 mb-3 rounded-xl text-gray-400"><img className="mr-2" src={checkPng} alt=""></img> Compras confirmadas</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-3 ml-6 flex items-center rounded-xl cursor-pointer bg-gray-900!">
                            <img src={statisticsPng} alt="" className="cursor-pointer"></img>
                            <select className="ml-3 cursor-pointer text-[#111827]! bg-gray-900! text-gray-300!" name="graph" onChange={(e) => setGraphic(e.target.value)}>
                                <option className="text-gray-300!" value={'bar'}>Grafico de Barras</option>
                                <option className="text-gray-300!" value={'line'}>Grafico Linear</option>
                                <option className="text-gray-300!" value={'pie'}>Grafico Circular</option>
                            </select>
                        </div>
                    </div>
                </div>
            ))}
            <div className="statistics-categories mb-60 p-6 h-[550px]">
                <p className="text-3xl">Estadísticas:</p>
                <div className="filter-statics-button flex justify-start mt-5">
                    <button onClick={() => setCurrentView('general')} className="flex items-center p-3 text-[#111827] rounded-xl bg-gradient-to-t from-amber-600 to-yellow-500 border-gray-600! hover:from-yellow-500 to-yellow-500 hover:scale-105 transition-all"><img className="mr-2" src={folderPng} alt=""></img> Datos generales</button>   
                    <button onClick={() => setCurrentView('tickets')} className="flex items-center p-3 ml-2 text-[#111827] rounded-xl bg-gradient-to-t from-amber-600 to-yellow-500 border-gray-600! hover:from-yellow-500 to-yellow-500 hover:scale-105 transition-all"><img className="mr-2" src={ticketSelledPng} alt=""></img> Tickets vendidos</button>   
                    <button onClick={() => setCurrentView('courtesys')} className="flex items-center p-3 ml-2 text-[#111827] rounded-xl bg-gradient-to-t from-amber-600 to-yellow-500 border-gray-600! hover:from-yellow-500 to-yellow-500 hover:scale-105 transition-all"><img className="mr-2" src={invitationPng} alt=""></img> Cortesías entregadas</button>
                    <button onClick={() => setCurrentView('rrpp')} className="flex items-center p-3 ml-2 text-[#111827] rounded-xl bg-gradient-to-t from-amber-600 to-yellow-500 border-gray-600! hover:from-yellow-500 to-yellow-500 hover:scale-105 transition-all"><img className="mr-2" src={coinPng} alt=""></img> Ventas RRPP</button>
                </div>
                <canvas className="canvas mt-6" ref={chartRef}></canvas>
            </div>
        </div>
    );
};

export default Statistics;