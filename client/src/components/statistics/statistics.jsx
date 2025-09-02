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
            type: graphic.toString(), /*'bar'*/
            data: {
                labels: chartLabels,
                datasets: chartData.map((item) => ({
                    label: item.label,
                    data: item.data,
                     backgroundColor:  [
                        'rgba(240, 3, 54, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(255, 14, 14, 0.2)',
                        'rgba(255, 159, 64, 0.2)'
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
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

    }, [currentView, productions, graphic]);

    return (
        <div className="statistics w-[96vw] mx-auto mt-6 mb-6 bg-white rounded-2xl">
            {productions.map((prod) => (
                <div className="statistics-event-info mx-auto relative flex items-center p-4" key={prod._id}>
                    <div className="flex flex-wrap items-center">
                        <img className="w-[250px] h-[200px] object-cover rounded-lg" src={prod.imgEvento} alt="" loading="lazy"/>
                        <div className="ml-4">
                            <h2 className="text-3xl text-[#111827]">{prod.nombreEvento}</h2>
                            <div>
                                <p className="mt-3 secondary-p">{prod.paisDestino}, {prod.provincia}</p>
                                <div className="flex flex-wrap items-center">
                                    <p className="mt-3 secondary-p flex items-center"><img className="mr-2" src={calendaryPng} alt=""></img>{formatDate(prod.fechaInicio)}</p>
                                    <p className="mt-3 ml-6 secondary-p flex items-center"><img className="mr-2" src={calendaryPng} alt=""></img>{formatDate(prod.fechaFin)}</p>
                                </div>
                            </div>
                            <div className="flex items-center mt-4">
                                <div className="info p-3 pr-12 border-[1px] rounded-2xl">
                                    <p className="secondary-p">Monto esperado</p>
                                    <p className="text-[#111827] text-2xl">${prod.montoVentas}</p>
                                    <p className="secondary-p">Total vendido</p>
                                    <p className="text-[#111827] text-2xl">${prod.totalMontoVendido}</p>
                                </div>
                                <div className="info ml-3 p-3 pr-12 rounded-2xl">
                                    <p className="secondary-p">Tickets vendidos</p>
                                    <p className="text-[#111827] text-2xl">{prod.totalVentas}</p>
                                     <p className="flex items-center p-3 bg-[#ffdeca] mt-3 mb-3 rounded-xl text-[#111827]"><img className="mr-2" src={checkPng} alt=""></img> Compras confirmadas</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-[#EC4899]! p-3 ml-6 flex items-center rounded-2xl cursor-pointer">
                            <img src={statisticsPng} alt="" className="cursor-pointer"></img>
                            <select className="ml-3 bg-[#EC4899]! cursor-pointer" name="graph" onChange={(e) => setGraphic(e.target.value)}>
                                <option value={'bar'}>Grafico de Barras</option>
                                <option value={'line'}>Grafico Linear</option>
                                <option value={'pie'}>Grafico Circular</option>
                            </select>
                        </div>
                    </div>
                </div>
            ))}
            <div className="statistics-categories mb-60 p-6 h-[550px]">
                <p className="text-3xl">Estadísticas:</p>
                <div className="filter-statics-button flex justify-start mt-5">
                    <button onClick={() => setCurrentView('general')} className="flex items-center p-3 text-[#111827] rounded-xl"><img className="mr-2" src={folderPng} alt=""></img> Datos generales</button>   
                    <button onClick={() => setCurrentView('tickets')} className="flex items-center p-3 ml-2 text-[#111827] rounded-xl"><img className="mr-2" src={ticketSelledPng} alt=""></img> Tickets vendidos</button>   
                    <button onClick={() => setCurrentView('courtesys')} className="flex items-center p-3 ml-2 text-[#111827] rounded-xl"><img className="mr-2" src={invitationPng} alt=""></img> Cortesías entregadas</button>
                    <button onClick={() => setCurrentView('rrpp')} className="flex items-center p-3 ml-2 text-[#111827] rounded-xl"><img className="mr-2" src={coinPng} alt=""></img> Ventas RRPP</button>
                </div>
                <canvas className="canvas mt-6" ref={chartRef}></canvas>
            </div>
        </div>
    );
};

export default Statistics;