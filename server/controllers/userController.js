import { pass, user_mail } from "../config.js"
import userModel from "../models/userModel.js"
import bcrypt from "bcrypt"
import nodemailer from 'nodemailer'; 
import jwt from "jsonwebtoken"
import ticketModel from "../models/ticketsModel.js";
import cloudinary from "../middleware/cloudinary.js";
import { resend } from "../lib/resendDomain.js";

const JWT_SECRET = process.env.JWT_SECRET || 'kidjaskdhajsdbjadlfgkjmlkjbnsdlfgnsñlknamnczmjcf'

export const getUserProfileController = async (req, res) => {
    const {userId} = req.body
    console.log(userId)
    const getUsers = await userModel.findById(userId)
    res.send(getUsers)
}

export const getAllUsersController = async (req, res) => {
    const getUsers = await userModel.find({})
    res.send(getUsers)
}

export const registerController = async (req, res) => {
    const {nombreCompleto, mail, dni, pais, contrasenia, repetirContrasenia} = req.body
    
    const findUser = await userModel.find({mail: mail})

    if(findUser.length > 0){
        return res.status(200).json({msj:'El usuario ya existe'})
    }
    
    if(contrasenia !== repetirContrasenia){
        return res.status(200).json({msj:'Las contraseñas no coinciden'})
    }
    
    const encriptContrasenia = await bcrypt.hash(contrasenia, 12);
    
    const secret = JWT_SECRET
 
    const token = jwt.sign({nombreCompleto, mail, dni, pais, encriptContrasenia}, secret, {expiresIn: '20m'});

    await resend.emails.send({
         from: 'GoTickets <no-reply@goticketonline.com>',
        to: [mail],
        subject: 'Verifica tu correo para completar tu registro en Go Tickets',
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
                        background-color: #f4f4f4;
                        font-family: Arial, sans-serif;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        padding: 20px;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 25px;
                        background-color: #ff6b01;
                        color: #ffffff;
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
                    <p>Gracias por registrarte en <strong>Go Tickets</strong>. Para completar tu registro y empezar a disfrutar de todos nuestros servicios, necesitamos que verifiques tu dirección de correo electrónico.</p>
                    <p>
                        <a href="https://gomarket-1-backend.onrender.com/verify_account/${token}" class="button">Verificar mi correo</a>
                    </p>
                    <p>Si no creaste una cuenta en Go Tickets, puedes ignorar este correo.</p>
                    <p>¡Bienvenido a <strong>Go Tickets</strong>!<br>El equipo de Go Tickets</p>
                </div>
            </body>
            </html>
    `,
    });

    
    return res.sendStatus(200)
    /*await userModel.create({
            nombreCompleto: nombreCompleto,
            mail: mail,
            dni: dni,
            pais: pais,
            contrasenia: encriptContrasenia,
    })

    return res.status(200).json({msj:1});*/
}

export const verifyAccountController = async (req, res) => {
    const {token} = req.params
    const decoded = jwt.verify(token, JWT_SECRET);
    const { nombreCompleto, mail, dni, pais, encriptContrasenia } = decoded;

    await userModel.create({
            nombreCompleto: nombreCompleto,
            mail: mail,
            dni: dni,
            pais: pais,
            contrasenia: encriptContrasenia
    })

    return res.redirect('https://www.goticketonline.com');
}

export const loginController = async (req, res) => {
    const {mail, contrasenia} = req.body
    const userFinded = await userModel.find({mail: mail})
    console.log(mail, contrasenia)
    if(userFinded.length > 0){
        const decryptContrasenia = await bcrypt.compare(contrasenia, userFinded[0].contrasenia)
        if(decryptContrasenia){
            return res.status(200).json({userFinded, estado: 1 })
        }else{
            return res.status(200).json({estado:2})
        }
    }else{
       return res.status(200).json({estado:3});
    }
}

export const recoverPassController = async (req, res) => {
    const {mail} = req.body

    const secret = process.env.JWT_SECRET

    const token = jwt.sign({mail:mail}, secret, {expiresIn: '20m'});

    console.log("token generated", token)

    await resend.emails.send({
        from: '"GoTickets" <no-reply@goticketonline.com>',
        to: [mail],
        subject: `Recuperar contraseña para ${mail} - Go Tickets`,
        html: `<p>Ingresa al siguiente enlace para recuperar tu contraseña </p> <a href="${process.env.URL_FRONT_DEV}/recover_password/${token}">Recuperar mi contraseña</a>`
    });  
    res.sendStatus(200)

}


export const newPasswordController = async (req, res) => {
    const {token, nuevaContrasenia} = req.body

       const decoded = jwt.verify(token, JWT_SECRET);
       const { mail } = decoded;

       const encryptPass = await bcrypt.hash(nuevaContrasenia, 12)

       await userModel.updateOne(
            {mail: mail},
            {
                $set:{
                    contrasenia: encryptPass
                }
            }
       )

       res.status(200).json(1)
}

export const contactController = async (req, res) => {
    const {pais, nombreCompleto, correo, dni, nombreEvento, mensaje} = req.body
    const transporter = nodemailer.createTransport({
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

    const getUserInfo = await userModel.findById({_id: userId})

    if(!getUserInfo){
        res.send(200).json({empty: true})
    }

    const filterFavorites = getUserInfo ? getUserInfo.favorites.map((fav) => fav.eventId) : []

    if(filterFavorites.length <= 0){
        res.send(200).json({empty: true})
    }

    const favoriteEvents = await ticketModel.find({
        _id:{$in: filterFavorites}
    })

    res.send(favoriteEvents).json({empty:false})
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
            { resource_type: 'auto', folder: 'gotickets_profiles' },
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
              
              return res.status(200).json({userFinded, estado: 1 })
    
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
        
        return res.status(200).json({userFinded, estado: 1 })
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