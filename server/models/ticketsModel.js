import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
    userId: {type: String}, 
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
            isActive: {type:Boolean}
    }],
    rrpp:[{
        nombre: {type: String},
        mail:{type: String},
        linkDePago: {type:String},
        categoriaRRPP:[{
            nombreCategoria:{type: String},
            vendidos: {type: Number},
        }],
        montoTotalVendidoRRPP: {type: Number}
    }],
    totalVentas: {type: Number},
    totalDevoluciones:{ type: Number},
    totalCortesias: {type: Number},
    totalMontoVendido: {type: Number},
    totalMontoDevoluciones:{type: Number},
    totalMontoDescuento: {type: Number},
    montoTotal: {type: Number}

})

const ticketModel =  mongoose.model('ticketsModel', ticketSchema)

export default ticketModel