import { pass, user_mail } from "../config.js"
import userModel from "../models/userModel.js"
import bcrypt from "bcrypt"
import nodemailer from 'nodemailer'; 
import jwt from "jsonwebtoken"
import ticketModel from "../models/ticketsModel.js";
import { Console } from "console";
import cloudinary from "../middleware/cloudinary.js";

const JWT_SECRET = process.env.JWT_SECRET || 'kidjaskdhajsdbjadlfgkjmlkjbnsdlfgnsñlknamnczmjcf'

export const getAllUsersController = async (req, res) => {
    const getUsers = await userModel.find({})
    res.send(getUsers)
}

export const registerController = async (req, res) => {
    const {nombreCompleto, mail, dni, pais, contrasenia, repetirContrasenia} = req.body
    
    const findUser = await userModel.find({mail: mail})
    console.log(nombreCompleto, contrasenia)
    console.log(findUser)
    if(findUser.length > 0){
        return res.status(200).json({msj:'El usuario ya existe'})
    }

    if(contrasenia !== repetirContrasenia){
        return res.status(200).json({msj:'Las contraseñas no coinciden'})
    }

    const encriptContrasenia = await bcrypt.hash(contrasenia, 12);

    await userModel.create({
            nombreCompleto: nombreCompleto,
            mail: mail,
            dni: dni,
            pais: pais,
            contrasenia: encriptContrasenia,
    })

    return res.status(200).json({msj:1});
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
            return res.status(200).json(2)
        }

    }else{
       return  res.status(200).json(3);
    }
}

export const recoverPassController = async (req, res) => {
    const {mail} = req.body

    const secret = process.env.JWT_SECRET

    const token = jwt.sign(mail, secret, {expiresIn: '300'});

    console.log("token generated", token)

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: user_mail,
            pass: pass,
        },
    });
    
    await transporter.sendMail({
        from: '"GoTickets" <no-reply@gotickets.com>',
        to: mail,
        subject: `Recuperar contraseña para ${mail} - Gotickets`,
        text: `Ingresa al siguiente enlace para recuperar tu contraseña <a href="https://newgomarket.onrender.com/recover_password/${token}" />`,
        html: `<p>Ingresa al siguiente enlace para recuperar tu contraseña </p> <a href="https://newgomarket.onrender.com/recover_password/${token}" />`
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
    const {nombre, dni, domicilio, cuit, dataA, dataB, dataC, cbu, dataD, nombreTitular, tipo} = req.body


    const buildData = (imgUrl) => {
    if (tipo === 1) {  // SI EL ESTADO ES DIFERENTE DE 3 (DE CORTESIA) SE LE AGREGA EL ESTADO PARA DIFERENCIAR LOS TICKETS NORMALES A LOS DE CORTESIA
      return {
          
      };
    } else {  
      return {  //SE CREA EL TICKET DE CORTESIA (SIN PRECIO)
          nombreTicket,
          descripcionTicket,
          cantidadDeCortesias: cantidad,
          entregados: 0,
          fechaDeCierre: fechaDeCierre,
          imgTicket: imgUrl,
          estado: estadoToInt,
          distribution: distributionToInt,
          limit: limitToInt || 30
      };
    }
  };
    
    cloudinary.uploader.upload_stream(
        { resource_type: 'auto', folder: 'GoTicketsT' },
        async (error, result) => {
          if (error) {
            console.log(error);
            return res.status(204).json({ error: 'Error uploading to Cloudinary' });
          }
          
          const imagenProductora = buildData(result.secure_url);
          
          console.log(imagenProductora)
          await ticketModel.updateOne(
            { _id: prodId },
            { $set: updatePayload }
          );
    
          return res.status(200).json({ url: result.secure_url, estado: 1 });
        }
      ).end(req.file.buffer); 
}