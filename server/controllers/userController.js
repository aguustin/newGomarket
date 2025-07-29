import { pass, user_mail } from "../config.js"
import userModel from "../models/userModel.js"
import bcrypt from "bcrypt"
import nodemailer from 'nodemailer'; 
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || 'kidjaskdhajsdbjadlfgkjmlkjbnsdlfgnsñlknamnczmjcf'

export const getAllUsersController = async (req, res) => {
    const getUsers = await userModel.find({})
    res.send(getUsers)
}

export const registerController = async (req, res) => {
    const {nombreCompleto, mail, celular, pais, contrasenia, repetirContrasenia} = req.body
    
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
            celular: celular,
            pais: pais,
            contrasenia: encriptContrasenia,
    })

    return res.status(200).json({msj:1});
}

export const loginController = async (req, res) => {
    const {mail, contrasenia} = req.body
    const userFinded = await userModel.find({mail: mail})

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
    const {pais, nombreCompleto, correo, celular, nombreEvento, mensaje} = req.body

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: user_mail,
            pass: pass,
        },
    });
    
    await transporter.sendMail({
        from: correo,
        to: "agustin.molee@gmail.com",
        subject: `${nombreCompleto} - ${nombreEvento} - País: ${pais}`,
        text: mensaje,
        html: `<b>${mensaje}</b>`
    });

    res.status(200).json(1)
}