import mongoose from "mongoose";

const ticketSchema = mongoose.Schema({
    userId: {String}, 
    paisDestino: {String},
    tipoEvento: {String},
    eventoEdad: {String},
    consumoDeCarta: {String},
    nombreEvento:{String},
    efectivo: {Number}, /*(es si hay entradas en efectivo o no hay),*/
    linkEvento: {String},
    categorías:[{
        nombreCategoria:{String},
        vendidos: {Number},
        devoluciones: {Number},
        cortesías: {Number},
        valorUnidad: {Number},
        montoVendido: {Number},
        montoDevoluciones: {Number},
        montoDescuento: {Number},
        montoTotal: {Number}
    }],
    Artistas: {String},
    descripcionEvento: {String},
    fechaInicio: {Date},
    fechaFin: {Date},
    provincia: {String},
    localidad: {String},
    dirección: {String},
    lugarEvento: {String},
    imgEvento: {String},
    tickets:[{
            nombreTicket: {String},
            descripcionTicket: {String},
            precio: {Number},
            cantidad: {Number},
            fechaDeCierre: {Date},
            imgTicket: {String}
    }],
    rrpp:[{
        nombre: {String},
        ticketsVenta:[{
            idTicket: {String},
            categoriaTicket: {String},
            cantidad: {Number},
            vendidos: {Number}
        }],
        ticketsCortesia:[{
            idTicket: {String},
            categoriaTicket:{String},
            cantidad: {Number},
            entregados: {Number},
        }]
    }],
    totalVentas: {Number},
    totalDevoluciones:{ Number},
    totalCortesias: {Number},
    totalMontoVentido: {Number},
    totalMontoDevoluciones:{Number},
    totalMontoDescuento: {Number},
    montoTotal: {Number}

})

export default mongoose.model('ticketsModel', ticketSchema)