import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
    userId: {type: String}, 
    numeroEvento:{type: Number},
    paisDestino: {type: String},
    tipoEvento: {type: String},
    eventoEdad: {type: String},
    consumoDeCarta: {type: String},
    nombreEvento:{type: String},
    montoVentas:{type: Number},
    efectivo: {type: Number}, /*(es si hay entradas en efectivo o no hay),*/
    linkEvento: {type: String},
    categorías:[{
        nombreCategoria:{type: String},
        vendidos: {type: Number},
        devoluciones: {type: Number},
        cortesías: {type: Number},
        valorUnidad: {type: Number},
        montoVendido: {type: Number},
        montoDevoluciones: {type: Number},
        montoDescuento: {type: Number},
        montoTotal: {type: Number}
    }],
    artistas: {type: String},
    descripcionEvento: {type: String},
    categorias: {type: String},
    fechaInicio: {type: Date},
    fechaFin: {type: Date},
    provincia: {type: String},
    localidad: {type: String},
    direccion: {type: String},
    lugarEvento: {type: String},
    imgEvento: {type: String},
    linkVideo:{type:String},
    tickets:[{
            nombreTicket: {type: String},
            descripcionTicket: {type: String},
            precio: {type: Number},
            cantidad: {type: Number},
            ventas:{type:Number},
            fechaDeCierre: {type: Date},
            imgTicket: {type: String},
            visibilidad:{type: String},
    }],
    cortesiaRRPP:[{
            nombreTicket: {type: String},
            descripcionTicket: {type: String},
            cantidadDeCortesias: {type: Number},
            entregados: {type: Number},
            fechaDeCierre: {type: Date},
            imgTicket: {type: String}
    }],
    rrpp:[{
        nombre: {type: String},
        mail:{type: String},
        linkDePago: {type:String},
        linkHash: {type: String},
        ventasRRPP:[{
            ticketId: {type: String},
            nombreCategoria:{type: String},
            vendidos: {type: Number},
            total: {type: Number}
        }],
        ticketsCortesias:[{
            ticketIdCortesia: {type: String},
            cantidadDeCortesias: {type:Number}
        }],
        montoTotalVendidoRRPP: {type: Number}
    }],
    totalVentas: {type: Number},
    totalDevoluciones:{ type: Number},
    totalCortesias: {type: Number},
    totalMontoVendido: {type: Number},
    totalMontoDescuento: {type: Number},
    montoTotal: {type: Number}
})

const ticketModel =  mongoose.model('ticketsModel', ticketSchema)

export default ticketModel