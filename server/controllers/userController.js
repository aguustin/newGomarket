import userModel from "../models/userModel.js"
import bcrypt from "bcrypt"

export const getAllUsersController = async (req, res) => {
    const getUsers = await userModel.find()
    res.send(getUsers)
}

export const registerController = async (req, res) => {
    const {nombreCompleto, mail, celular, pais, contrasenia, repetirContrasenia} = req.body
    
    const findUser = await userModel.find({mail: mail})
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

    return res.status(200).json({msj:'Usuario creado'});
}

export const loginController = async (req, res) => {
    const {mail, contrasenia} = req.body
    const userFinded = await userModel.find({mail: mail})
    if(userFinded.length > 0){
        const decryptContrasenia = await bcrypt.compare(contrasenia, userFinded[0].contrasenia)
        if(decryptContrasenia){
            return res.send(userFinded)
        }else{
            return res.status(200).json(2)
        }

    }else{
       return  res.status(200).json(3);
    }

}