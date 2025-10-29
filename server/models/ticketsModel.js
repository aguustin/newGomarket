import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
    identificadorEventos: {type: String},
    userId: {type: String},
    prodMail: {type: String}, 
    numeroEvento:{type: Number},
    codigoPais:{type: String},
    codigoCiudad:{type: String},
    paisDestino: {type: String},
    tipoMoneda: {type: String},
    tipoEvento: {type: Number},
    eventoEdad: {type: Number},
    consumoDeCarta: {type: String},
    nombreEvento:{type: String},
    montoVentas:{type: Number},
    porcentajeRRPP:{type: Number},
    efectivo: {type: Number}, /*(es si hay entradas en efectivo o no hay),*/
    linkEvento: {type: String},
    categorias:[{
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
    aviso: {type: String},
    categoriasEventos: [String],
    fechaInicio: {type: Date},
    fechaFin: {type: Date},
    provincia: {type: String},
    localidad: {type: String},
    direccion: {type: String},
    lugarEvento: {type: String},
    imgEvento: {type: String},
    bannerEvento: {type: String},
    imagenDescriptiva: {type: String},
    linkVideo:{type:String},
    eventosRelacionados:[{
        idEvento: {type: String},
    }],
    tickets:[{
        nombreTicket: {type: String},
        descripcionTicket: {type: String},
        precio: {type: Number},
        cantidad: {type: Number},
        ventas:{type:Number},
        fechaDeCierre: {type: Date},
        visibilidad:{type: String},
        estado:{type:Number},
        imgTicket: {type: String},
        limit:{type: Number}
    }],
    cortesiaRRPP:[{
        nombreTicket: {type: String},
        descripcionTicket: {type: String},
        cantidadDeCortesias: {type: Number},
        entregados: {type: Number},
        fechaDeCierre: {type: Date},
        imgTicket: {type: String},
        estado: {type: Number},
        distribution: {type: Number},
        email:{type: String},
        limit:{type: Number}
    }],
    rrpp:[{
        nombre: {type: String},
        mail:{type: String},
        mailEncriptado: {type:String},
        mailHash: {type: String},
        linkDePago: {type:String},
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
        montoCorrespondienteRRPP: {type: Number},
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