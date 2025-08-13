import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { getOneProdRequest } from "../../api/eventRequests";
import { Chart, registerables } from 'chart.js';
import { formatDate } from "../../globalscomp/globalscomp";

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
                chartData = productions.flatMap((prod) =>
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
                chartData = productions.flatMap((prod) =>
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
                chartData = productions.flatMap((prod) =>
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
                chartData = productions.map((prod) => ({
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
        <div className="statistics w-[100vw] mt-6">
            {productions.map((prod) => (
                <div className="statistics-event-info mx-auto relative flex items-center p-4" key={prod._id}>
                    <div className="flex flex-wrap mx-auto">
                        <img className="w-[350px] h-[350px] object-cover rounded-lg" src={prod.imgEvento} alt="" loading="lazy"/>
                        <div className="flex flex-wrap items-center">
                        <div className="info p-6 w-[340px]">
                            <h2 className="text-3xl">{prod.nombreEvento}</h2>
                            <p className="text-xl mt-2">{prod.descripcionEvento}</p>
                            <p className="mt-5">Fecha de inicio: {formatDate(prod.fechaInicio)}</p>
                            <p className="mt-3">Fecha de fin: {formatDate(prod.fechaFin)}</p>
                            <p className="mt-3">país:{prod.paisDestino}, provincia: {prod.provincia}</p>
                        </div>
                        <div className="info p-6 w-[340px]">
                            <h2 className="text-3xl">Datos generales</h2>
                            <p className="text-xl mt-2">Categorias: {prod.categorias}</p>
                            <p className="mt-5">Edad minima del evento: {prod.eventoEdad || 'Sin especificar'}</p>
                            <p className="mt-3">Monto esperado: {prod.montoVentas}</p>
                            <p className="mt-3">Total vendido: {prod.totalMontoVendido}</p>
                        </div>
                        </div>
                    </div>
                    <select className="change-statistics absolute bottom-0 right-5 mt-11 bg-violet-900! p-3 mr-6" name="graph" onChange={(e) => setGraphic(e.target.value)}>
                        <option value={'bar'}>Grafico de Barras</option>
                        <option value={'line'}>Grafico Linear</option>
                        <option value={'pie'}>Grafico Circular</option>
                    </select>
                </div>
            ))}
            <div className="statistics-categories mt-8 mb-60 p-6 h-[550px]">
                <p className="text-3xl">Estadísticas:</p>
                <div className="filter-statics-button flex justify-around mt-5">
                    <button onClick={() => setCurrentView('general')} className="bg-violet-900 pl-4 pr-4 pt-2 pb-2 text-white rounded">Datos generales</button>   
                    <button onClick={() => setCurrentView('tickets')} className="bg-violet-900 pl-4 pr-4 pt-2 pb-2 text-white rounded">Tickets</button>   
                    <button onClick={() => setCurrentView('rrpp')} className="bg-violet-900 pl-4 pr-4 pt-2 pb-2 text-white rounded">Ventas RRPP</button>
                    <button onClick={() => setCurrentView('courtesys')} className="bg-violet-900 pl-4 pr-4 pt-2 pb-2 text-white rounded">Cortesías</button>
                </div>
                <canvas className="canvas mt-6" ref={chartRef}></canvas>
            </div>
        </div>
    );
};

export default Statistics;