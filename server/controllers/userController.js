import { pass, user_mail, urlFront, urlBack } from "../config.js"
import crypto from "node:crypto"
import { isValidObjectId } from "mongoose"
import userModel from "../models/userModel.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import ticketModel from "../models/ticketsModel.js";
import cloudinary from "../middleware/cloudinary.js";
import { resend, createMailTransport } from "../lib/resendDomain.js";
import { firmarSesion, sinDatosPrivados } from "../lib/auth.js";

import { jwtSecret as JWT_SECRET } from "../lib/secretos.js"
import registroPendienteModel from "../models/registroPendienteModel.js"

//Los mails de las cuentas no distinguen mayusculas: se guardan en minusculas y se buscan sin distinguirlas
//(las cuentas viejas pueden tener mayusculas guardadas)
const normalizarMail = (mail) => String(mail).trim().toLowerCase()
const SIN_MAYUSCULAS = { locale: 'en', strength: 2 }
const buscarUsuarioPorMail = (mail, proyeccion) => userModel.findOne({ mail: normalizarMail(mail) }, proyeccion).collation(SIN_MAYUSCULAS)
const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex')
const VERIFICACION_HORAS = 24

//Perfil publico (pagina de la productora): nunca incluye la contraseña
export const getUserProfileController = async (req, res) => {
    const {userId} = req.body
    if(!isValidObjectId(userId)) return res.send([])
    const getUsers = await userModel.find({_id:userId}, {contrasenia: 0}).lean()
    res.send(getUsers)
}

//Cerrado: devolvia todos los usuarios con sus datos bancarios y contraseñas. Ningun componente lo usa
export const getAllUsersController = async (req, res) => {
    res.status(410).json({ message: 'Este recurso ya no está disponible' })
}

export const registerController = async (req, res) => {
    const {nombreCompleto, mail, dni, pais, contrasenia, repetirContrasenia} = req.body
    if (![mail, contrasenia, nombreCompleto].every((v) => typeof v === 'string' && v.trim())) {
        return res.status(400).json({ code: 'DATOS_INVALIDOS', msj: 'Completá todos los datos' })
    }

    const mailNormal = normalizarMail(mail)
    if(await buscarUsuarioPorMail(mailNormal, { _id: 1 }).lean()){
        return res.status(200).json({msj:'El usuario ya existe'})
    }
    
    if(contrasenia !== repetirContrasenia){
        return res.status(200).json({msj:'Las contraseñas no coinciden'})
    }
    
    const encriptContrasenia = await bcrypt.hash(contrasenia, 12);

    //El link lleva solo un codigo al azar; los datos quedan guardados hasta que se verifique (o venza).
    //Registrarse de nuevo con el mismo mail reemplaza el codigo: el link anterior deja de servir
    const codigo = crypto.randomBytes(32).toString('hex')
    await registroPendienteModel.findOneAndUpdate(
        { mail: mailNormal },
        { $set: { codigoHash: sha256(codigo), nombreCompleto: nombreCompleto.trim(), dni, pais, contrasenia: encriptContrasenia,
            expiraEn: new Date(Date.now() + VERIFICACION_HORAS * 3600 * 1000) }, $unset: { usadoEn: 1 } },
        { upsert: true }
    )

    const { error: mailError } = await resend.emails.send({
        from: 'Ipass <no-reply@ipassi.com>',
        to: [mailNormal],
        subject: 'Verifica tu correo para completar tu registro en Ipasss',
        html: `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        background-color: oklch(21% 0.034 264.665);
                        font-family: Arial, sans-serif;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: oklch(21% 0.034 264.665);
                        padding: 20px;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 25px;
                        background-color: oklch(79.5% 0.184 86.047);
                        color: #111827;
                        text-decoration: none;
                        border-radius: 5px;
                        margin-top: 20px;
                    }
                    @media only screen and (max-width: 600px) {
                        .container {
                            width: 90% !important;
                            padding: 15px !important;
                        }
                        .button {
                            width: 100% !important;
                            text-align: center;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <p>Gracias por registrarte en <strong>Ipasss</strong>. Para completar tu registro y empezar a disfrutar de todos nuestros servicios, necesitamos que verifiques tu dirección de correo electrónico.</p>
                    <p>
                        <a href="${urlBack}/verify_account/${codigo}" class="button">Verificar mi correo</a>
                    </p>
                    <p>Si no creaste una cuenta en Ipasss, puedes ignorar este correo.</p>
                    <p>¡Bienvenido a <strong>Ipasss</strong>!<br>El equipo de Ipasss</p>
                </div>
            </body>
            </html>
    `,
    });

    if(mailError){  //sin mail no hay forma de verificar: avisar en vez de responder exito
        return res.status(200).json({msj:'No pudimos enviar el correo de verificación. Intentá de nuevo más tarde'})
    }

    //return res.sendStatus(200)
    /*await userModel.create({
            nombreCompleto: nombreCompleto,
            mail: mail,
            dni: dni,
            pais: pais,
            contrasenia: encriptContrasenia,
    })*/

    return res.status(200).json({msj:1});
}

export const verifyAccountController = async (req, res) => {
    const vencido = () => res.redirect(`${urlFront}/login?verificacion=vencida`)  //pedir otro registrandose de nuevo
    const { token: codigo } = req.params
    if (!/^[a-f0-9]{64}$/.test(String(codigo))) return vencido()

    const pendiente = await registroPendienteModel.findOne({ codigoHash: sha256(codigo), expiraEn: { $gt: new Date() } }).lean()
    if (!pendiente) return vencido()

    //Si ya verifico antes (o abrio el link dos veces) no se duplica la cuenta
    if (!(await buscarUsuarioPorMail(pendiente.mail, { _id: 1 }).lean())) {
        try {
            await userModel.create({
                nombreCompleto: pendiente.nombreCompleto, mail: pendiente.mail, dni: pendiente.dni, pais: pendiente.pais,
                contrasenia: pendiente.contrasenia, comisionServicio: 15
            })
        } catch (err) {
            if (err?.code !== 11000) throw err
        }
    }
    return res.redirect(`${urlFront}/login?verificacion=ok`);
}

export const loginController = async (req, res) => {
    const {mail, contrasenia} = req.body
    if (typeof mail !== 'string' || typeof contrasenia !== 'string') return res.status(400).json({ code: 'DATOS_INVALIDOS' })
    const encontrado = await buscarUsuarioPorMail(mail)
    const userFinded = encontrado ? [encontrado] : []
   
    if(userFinded.length > 0){
        const decryptContrasenia = userFinded[0].contrasenia ? await bcrypt.compare(contrasenia, userFinded[0].contrasenia) : false
        if(decryptContrasenia){
            //Misma forma que antes (userFinded es un array) mas el token de sesion; sin la contraseña
            return res.status(200).json({userFinded: userFinded.map(sinDatosPrivados), estado: 1, token: firmarSesion(userFinded[0]) })
        }else{
            return res.status(200).json({estado:2})
        }
    }else{
       return res.status(200).json({estado:3});
    }
}

//El link de recuperacion sirve una sola vez: lleva una huella de la contraseña actual (no la contraseña).
//Al cambiarla, la huella ya no coincide y el link queda invalido. typ evita usar otros tokens (verificacion, QR)
const huellaContrasenia = (hash) => crypto.createHash('sha256').update(String(hash)).digest('hex').slice(0, 16)

export const recoverPassController = async (req, res) => {
    const {mail} = req.body
    if (typeof mail !== 'string' || !mail) return res.status(200).json({ok:true})

    const usuario = await buscarUsuarioPorMail(mail, { mail: 1, contrasenia: 1 }).lean()
    //Mismo resultado exista o no la cuenta: no se revela que mails estan registrados
    if (!usuario?.contrasenia) return res.status(200).json({ok:true})

    const token = jwt.sign({ mail: usuario.mail, typ: 'recupero', pv: huellaContrasenia(usuario.contrasenia) }, JWT_SECRET, {expiresIn: '20m'});

    const { error: mailError } = await resend.emails.send({
        from: '"Ipass" <no-reply@ipassi.com>',
        to: [usuario.mail],
        subject: `Recuperar contraseña para ${usuario.mail} - Ipasss`,
        html: `<p>Ingresa al siguiente enlace para recuperar tu contraseña </p> <a href="${urlFront}/recover_password/${token}">Recuperar mi contraseña</a>`
    });
    if(mailError){
        return res.status(200).json({ok:false})
    }
    res.status(200).json({ok:true})

}


export const newPasswordController = async (req, res) => {
    const {token, nuevaContrasenia} = req.body

       let decoded
       try {
           decoded = jwt.verify(token, JWT_SECRET);
       } catch {
           return res.status(200).json({ code: 'LINK_VENCIDO' })  //vencido (20 min) o invalido: pedir uno nuevo
       }
       const { mail, typ, pv } = decoded;
       if (!mail || typeof mail !== 'string' || typ !== 'recupero') return res.status(200).json({ code: 'LINK_VENCIDO' })
       if (typeof nuevaContrasenia !== 'string' || nuevaContrasenia.length < 5) return res.status(400).json({ code: 'CONTRASENIA_INVALIDA' })

       const usuario = await buscarUsuarioPorMail(mail, { contrasenia: 1 }).lean()
       if (!usuario || huellaContrasenia(usuario.contrasenia) !== pv) return res.status(200).json({ code: 'LINK_VENCIDO' })  //ya se uso

       const encryptPass = await bcrypt.hash(nuevaContrasenia, 12)

       const cambio = await userModel.updateOne(
            {_id: usuario._id, contrasenia: usuario.contrasenia},  //si dos pedidos llegan a la vez, solo uno cambia
            {
                $set:{
                    contrasenia: encryptPass
                }
            }
       )

       if (!cambio.modifiedCount) return res.status(200).json({ code: 'LINK_VENCIDO' })

       res.status(200).json(1)
}

export const contactController = async (req, res) => {
    const {pais, nombreCompleto, correo, dni, nombreEvento, mensaje} = req.body
    const transporter = createMailTransport({
        service: 'gmail',
        auth: {
            user: user_mail,
            pass: pass
        },
    });
    
    await transporter.sendMail({
        from: correo,
        to: "agustin.molee@gmail.com",
        subject: `${nombreCompleto} - ${nombreEvento} - País: ${pais}`,
        text: mensaje,
        html: `<b>${mensaje}</b>`
    });

    res.status(200).json({state:1})
}

export const saveEventsController = async (req, res) => {
    const {userId, eventId} = req.body
    const getUserInfo = await userModel.findById({_id: userId})

    if(getUserInfo){
        const filterFavorites = getUserInfo.favorites.some((fav) => fav.eventId === eventId)
        
        if(filterFavorites){
            
            await userModel.updateOne(
                {_id: userId},
                { $pull: { favorites: { eventId: eventId } } }
            )
           return res.status(200).json({done: 2})
        }
        await userModel.updateOne(
            {_id: userId},
            {
                $addToSet: {
                    favorites: {eventId: eventId} 
                }
            }
        )
    
        return res.status(200).json({done: 1})
    }
}

export const getMySavedEventsController = async (req, res) => {
    const {userId} = req.body

    //Duplicado de getFavoritesEventsController (el que usa Home); se conserva devolviendo un array
    if(!isValidObjectId(userId)){
        return res.status(200).json([])
    }

    const getUserInfo = await userModel.findById(userId, {favorites: 1}).lean()

    const filterFavorites = getUserInfo ? getUserInfo.favorites.map((fav) => fav.eventId) : []

    if(filterFavorites.length <= 0){
        return res.status(200).json([])
    }

    const favoriteEvents = await ticketModel.find({
        _id:{$in: filterFavorites}
    })

    return res.status(200).json(favoriteEvents)
}

export const createSellerController = async (req, res) => {
    const {userId, dataA, dataB, dataC, dataD, dataE, dataF, dataG, dataH, dataI, dataJ, dataK, dataL, dataM, dataN, imgProductora} = req.body
    console.log(dataA,'' , dataB, '' ,dataC, '' ,dataD, '' ,dataE, '' ,dataF,'' , dataG,'' , dataH,'' , dataI,'' , dataJ,'' , dataK,'' , dataL,'' , dataM,'' , dataN)
    const tipoNumber = Number(req.body.tipo)
    const buildData = (imgUrl) => {
    if (tipoNumber === 1) {  
      return {
          nombreCompleto: dataA,
          dni:  dataB,
          domicilio:  dataC,
          cuit:  dataD,
          mail:  dataE,
          telefono:  dataF,
          pais:  dataG,
          cbu:  dataH,
          alias:  dataI,
          nombreTitular: dataJ, 
          imagenProductora: imgUrl
      };
     
    } else {  
      return {
          nombreProductora: dataA,
          dniRepresentante: dataB,
          domicilioProductora: dataC,
          mailProductora: dataD,
          cuitProductora: dataE,
          telefonoProductora: dataF,
          paisProductora: dataG,
          cbuProductora: dataH,
          aliasProductora: dataI,
          nombreTitularProductora: dataJ,
          razonSocial: dataK,
          numeroCuenta: dataL,
          nombreBanco: dataM,
          codigoInternacional: dataN,
          imagenProductora: imgUrl 
      };
    }
  };
    if(req.file){
        cloudinary.uploader.upload_stream(
            { resource_type: 'image', folder: 'gotickets_profiles' },
            async (error, result) => {
              if (error) {
                console.log(error);
                return res.status(204).json({ error: 'Error uploading to Cloudinary' });
              }
              
              const userData = buildData(result.secure_url);
              
              await userModel.updateOne(
                { _id: userId },
                { $set: userData }
              );
              const userFinded = await userModel.find({_id: userId})
              
              return res.status(200).json({userFinded: userFinded.map(sinDatosPrivados), estado: 1 })
    
            }
          ).end(req.file.buffer); 
    }else{
        if(imgProductora && imgProductora.length > 0){
            const userData = buildData(imgProductora);
            await userModel.updateOne(
                { _id: userId },
                { $set: userData }
        );
        }else{
            const userData = buildData(null);
            await userModel.updateOne(
                { _id: userId },
                { $set: userData }
            );
        }
        const userFinded = await userModel.find({_id: userId})
        
        return res.status(200).json({userFinded: userFinded.map(sinDatosPrivados), estado: 1 })
    }
}

export const getFavoritesEventsController = async (req, res) => {
    const {userId} = req.body

    const user = await userModel.findById({_id: userId})

     if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const favoriteEventIds = user.favorites.map(fav => fav.eventId);

    if (favoriteEventIds.length === 0) {
      return res.status(200).json({ favorites: [] });
    }

    const favoriteEvents = user.favorites.map((fvE) => fvE.eventId)

    const getFavoritesEvents = await ticketModel.find(
        {_id: {$in: favoriteEvents  } }
    )

    return res.status(200).json({favorites: getFavoritesEvents})
}