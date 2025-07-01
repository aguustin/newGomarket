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
    console.log(productions)
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
                    (prod.ventasRRPP || []).map((venta) => ({
                        label: venta.nombreCategoria,
                        data: [
                            venta.vendidos,
                            venta.total,
                            venta.total / (venta.vendidos || 1),
                            0
                        ]
                    }))
                );
                break;

            case 'courtesys':
                chartLabels = ['Cortesías dadas', 'Monto', 'N/A', 'N/A'];
                chartData = productions.flatMap((prod) =>
                    (prod.rrpp || []).flatMap((rrpp) =>
                        (rrpp.ticketsCortesias || []).map((_, idx) => ({
                            label: `Cortesía ${idx + 1}`,
                            data: [1, 0, 0, 0]
                        }))
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
            type: 'bar',
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

    }, [currentView, productions]);

    return (
        <>
            {productions.map((prod) => (
                <div className="flex items-center mt-[100px] p-4" key={prod._id}>
                    <div className="flex">
                        <img className="w-[350px] h-[350px] object-cover rounded-lg" src={prod.imgEvento} alt="" />
                        <div className="p-6">
                            <h2 className="text-3xl">{prod.nombreEvento}</h2>
                            <p className="text-xl mt-2">{prod.descripcionEvento}</p>
                            <p className="mt-5">Fecha de inicio: {formatDate(prod.fechaInicio)}</p>
                            <p className="mt-3">Fecha de fin: {formatDate(prod.fechaFin)}</p>
                        </div>
                    </div>
                </div>
            ))}
            <div className="mt-8 mb-30 p-6 h-[450px]">
                <p className="text-3xl">Estadísticas:</p>
                <div className="filter-statics-button flex justify-around mt-5">
                    <button onClick={() => setCurrentView('general')} className="bg-violet-900 pl-4 pr-4 pt-2 pb-2 text-white rounded">Datos generales</button>   
                    <button onClick={() => setCurrentView('tickets')} className="bg-violet-900 pl-4 pr-4 pt-2 pb-2 text-white rounded">Tickets</button>   
                    <button onClick={() => setCurrentView('rrpp')} className="bg-violet-900 pl-4 pr-4 pt-2 pb-2 text-white rounded">Ventas RRPP</button>
                    <button onClick={() => setCurrentView('courtesys')} className="bg-violet-900 pl-4 pr-4 pt-2 pb-2 text-white rounded">Cortesías</button>
                </div>
                <canvas className="mt-6" ref={chartRef}></canvas>
            </div>
        </>
    );
};

export default Statistics;


/*import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { getOneProdRequest, getProdsRequest } from "../../api/eventRequests";
import { Chart, registerables } from 'chart.js';
import { formatDate } from "../../globalscomp/globalscomp";

// Register Chart.js components
Chart.register(...registerables);

const Statistics = () => {
    const { prodId, userId } = useParams();
    const [productions, setProductions] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [rrpp, setRRPP] = useState([]);
    const [courtesys, setCourtesys] = useState([]);
    const chartRef = useRef(null); // useRef to get canvas element
    const chartInstanceRef = useRef(null); // to store chart instance

    // Fetch data
    useEffect(() => {
        const getProds = async () => {
            try {
                if (!userId) return;
                const res = await getOneProdRequest(prodId, userId);
                setProductions(res.data);
            } catch (err) {
                console.error("Failed to fetch productions:", err);
            }
        };
        getProds();
    }, [userId]);
    console.log(productions)

    const filterByTickets = () => {
        setTickets(productions.map((p) => p.tickets))
    }

    console.log('tickets: ', tickets)
    // Create chart
    useEffect(() => {
        if (!chartRef.current) return;

        // Destroy existing chart instance before creating a new one
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }
{
    productions.map((prod) => {

        chartInstanceRef.current = new Chart(chartRef.current, {
            type: 'bar',
            data: {
                labels: ['Ventas totales', 'Monto total vendido', 'Monto de ventas esperadas', 'Devoluciones'],
                datasets: [{
                    label: ['$ '],
                    data: [prod.totalVentas, prod.totalMontoVendido, prod.montoVentas, prod.totalDevoluciones],
                    backgroundColor: [
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
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    })
}
    }, [productions]); // re-create chart when data changes

    return (
        <>
            {productions.map((prod) => 
            <div className="flex items-center mt-[100px] p-4" key={prod._id}>
                <div className="flex">
                    <img className="w-[350px] h-[350px] object-cover rounded-lg" src={prod.imgEvento} alt=""></img>
                    <div className="p-6">
                        <h2 className="text-3xl">{prod.nombreEvento}</h2>
                        <p className="text-xl mt-2">{prod.descripcionEvento}</p>
                        <p className="mt-5">Fecha de inicio: {formatDate(prod.fechaInicio)}</p>
                        <p className="mt-3">Fecha de fin: {formatDate(prod.fechaFin)}</p>
                    </div>
                </div>
            </div>)}
            <div className="mt-8 mb-30 p-6 h-[450px]">
                <p className="text-3xl">Estadisticas:</p>
                <div className="filter-statics-button flex justify-around mt-5">
                    <button onClick={() => filterByEvento()} className="bg-violet-900 pl-4 pr-4 pt-2 pb-2">Datos generales</button>   
                    <button onClick={() => filterByTickets()} className="bg-violet-900 pl-4 pr-4 pt-2 pb-2">Tickets</button>   
                    <button onClick={() => filterByRRPP()} className="bg-violet-900 pl-4 pr-4 pt-2 pb-2">Ventas RRPP</button>
                    <button onClick={() => filterByCourtesys()} className="bg-violet-900 pl-4 pr-4 pt-2 pb-2">Cortesias</button>
                </div>
                <canvas className="mt-6" ref={chartRef}></canvas>
            </div>
        </>
    );
};

export default Statistics;*/