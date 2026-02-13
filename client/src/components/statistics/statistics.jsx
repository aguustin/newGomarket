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
    const [graphic, setGraphic] = useState('bar');
    const [productions, setProductions] = useState({
        tickets: [],
        prodDiscount: []
    });
    const [currentView, setCurrentView] = useState('general');
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    
    const currencyFormatter = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
    });
    
    useEffect(() => {
        const getProds = async () => {
            try {
                const res = await getOneProdRequest(prodId, userId);
                setProductions(res.data);
                setGraphic('bar');
            } catch (err) {
                console.error("Failed to fetch productions:", err);
            }
        };
        getProds();
    }, [prodId, userId]);
    
    // Chart generation logic remains the same...
    useEffect(() => {
        if (!chartRef.current || productions?.tickets.length === 0) return;

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        let chartLabels = [];
        let chartData = [];

        switch (currentView) {
            case 'rrpp':
                chartLabels = ['Vendidos RRPP', 'Total vendido', 'Promedio por venta', 'Devoluciones'];
                chartData = productions?.tickets?.flatMap((prod) =>
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
                chartData = productions?.tickets?.flatMap((prod) =>
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
                chartData = productions?.tickets?.flatMap((prod) =>
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

            default:
                chartLabels = ['Ventas totales', 'Monto vendido', 'Monto esperado', 'Devoluciones'];
                chartData = productions?.tickets?.map((prod) => ({
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
                    backgroundColor: [
                        'rgba(251, 146, 60, 0.3)',
                        'rgba(245, 105, 11, 0.3)',
                        'rgba(144, 234, 8, 0.3)',
                        'rgba(68, 239, 108, 0.3)',
                        'rgba(22, 101, 249, 0.3)',
                        'rgba(86, 77, 252, 0.3)'
                    ],
                    borderColor: [
                        'rgba(251, 146, 60, 1)',
                        'rgba(245, 158, 11, 1)',
                        'rgba(234, 179, 8, 1)',
                        'rgba(239, 68, 68, 1)',
                        'rgba(249, 115, 22, 1)',
                        'rgba(252, 211, 77, 1)'
                    ],
                    borderWidth: 2
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Estadísticas: ${currentView.charAt(0).toUpperCase() + currentView.slice(1)}`,
                        color: '#f59e0b',
                        font: {
                            size: 18,
                            weight: 'bold'
                        }
                    },
                    legend: {
                        labels: {
                            color: '#e5e7eb',
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(75, 85, 99, 0.3)'
                        },
                        ticks: {
                            color: '#d1d5db'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(75, 85, 99, 0.3)'
                        },
                        ticks: {
                            color: '#d1d5db'
                        }
                    }
                }
            }
        });

    }, [currentView, productions?.tickets, graphic]);
   
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500  p-8
              rounded-3xl shadow-2xl mb-8">
                    <div className="flex items-center justify-center gap-4">
                        <svg className="w-8 h-8 text-gray-900!" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <h2 className="text-gray-900! text-3xl font-bold">Tus Estadísticas</h2>
                    </div>
                </div>

                {/* Event Info */}
                {productions?.tickets.map((prod) => (
                    <div key={prod._id} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6 mb-8 border border-gray-700">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Event Image */}
                            <div className="lg:col-span-3">
                                <img 
                                    className="w-full h-64 lg:h-full object-cover rounded-xl shadow-lg" 
                                    src={prod.imgEvento} 
                                    alt={prod.nombreEvento}
                                    loading="lazy"
                                />
                            </div>

                            {/* Event Details */}
                            <div className="lg:col-span-6 space-y-4">
                                <h2 className="text-3xl md:text-4xl font-bold text-amber-400! bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
                                    {prod.nombreEvento}
                                </h2>
                                
                                <p className="text-gray-300 text-lg">
                                    {prod.paisDestino}, {prod.provincia}
                                </p>
                                
                                <div className="flex flex-wrap gap-4">
                                    <div className="flex items-center gap-2 bg-gray-900/50 px-4 py-2 rounded-lg">
                                        <img className="w-5 h-5" src={calendaryPng} alt="" />
                                        <span className="text-gray-300">{formatDate(prod.fechaInicio)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-gray-900/50 px-4 py-2 rounded-lg">
                                        <img className="w-5 h-5" src={calendaryPng} alt="" />
                                        <span className="text-gray-300">{formatDate(prod.fechaFin)}</span>
                                    </div>
                                </div>

                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700 rounded-xl p-5">
                                        <p className="text-gray-400 text-sm mb-1">Monto esperado</p>
                                        <p className="text-amber-500 text-2xl font-bold mb-3">${prod.montoVentas}</p>
                                        <p className="text-gray-400 text-sm mb-1">Total vendido</p>
                                        <p className="text-orange-500 text-2xl font-bold">{currencyFormatter.format(prod.totalMontoVendido)}</p>
                                    </div>
                                    
                                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700 rounded-xl p-5">
                                        <p className="text-gray-400 text-sm mb-1">Compras totales</p>
                                        <p className="text-amber-500 text-2xl font-bold mb-3">{prod.totalVentas}</p>
                                        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                                            <img className="w-5 h-5" src={checkPng} alt="" />
                                            <span className="text-green-400 text-sm font-semibold">Compras confirmadas</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Graph Type Selector */}
                            <div className="lg:col-span-3 flex lg:flex-col gap-3">
                                <div className="flex-1 bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-amber-500/30 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <img src={statisticsPng} alt="" className="w-8 h-8" />
                                        <span className="text-gray-200 font-semibold">Tipo de gráfico</span>
                                    </div>
                                    <select 
                                        className="w-full px-4 py-3 bg-gray-900 border-2 border-gray-700 focus:border-amber-500 text-white! rounded-xl focus:outline-none focus:ring-4 focus:ring-amber-500/20 transition-all cursor-pointer"
                                        name="graph" 
                                        value={graphic}
                                        onChange={(e) => setGraphic(e.target.value)}
                                    >
                                        <option value="bar">📊 Barras</option>
                                        <option value="line">📈 Líneas</option>
                                        <option value="pie">🥧 Circular</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Chart Section */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl p-6 border border-gray-700">
                    <h3 className="text-2xl font-bold text-amber-400! bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 mb-6">
                        Estadísticas Detalladas
                    </h3>
                    
                    {/* Filter Buttons */}
                    <div className="flex flex-wrap gap-3 mb-8">
                        <button 
                            onClick={() => setCurrentView('general')}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                                currentView === 'general' 
                                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white! shadow-lg' 
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            <img className="w-5 h-5" src={folderPng} alt="" />
                            <span className="text-sm md:text-base">Datos generales</span>
                        </button>
                        
                        <button 
                            onClick={() => setCurrentView('tickets')}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                                currentView === 'tickets' 
                                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white! shadow-lg' 
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            <img className="w-5 h-5" src={ticketSelledPng} alt="" />
                            <span className="text-sm md:text-base">Tickets vendidos</span>
                        </button>
                        
                        <button 
                            onClick={() => setCurrentView('courtesys')}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                                currentView === 'courtesys' 
                                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white! shadow-lg' 
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            <img className="w-5 h-5" src={invitationPng} alt="" />
                            <span className="text-sm md:text-base">Cortesías</span>
                        </button>
                        
                        <button 
                            onClick={() => setCurrentView('rrpp')}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                                currentView === 'rrpp' 
                                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white! shadow-lg' 
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                        >
                            <img className="w-5 h-5" src={coinPng} alt="" />
                            <span className="text-sm md:text-base">Ventas RRPP</span>
                        </button>
                    </div>

                    {/* Chart Canvas */}
                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                        <div className="h-96 md:h-[500px]">
                            <canvas ref={chartRef}></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Statistics;