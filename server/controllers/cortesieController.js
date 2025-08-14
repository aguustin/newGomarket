import { formatDateB } from "../lib/dates.js";
import XLSX from 'xlsx';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import ticketModel from "../models/ticketsModel.js";
import cortesieModel from "../models/cortesiesModel.js"
import jwt from 'jsonwebtoken';
import tokenModel from "../models/tokenModel.js";

export const getAllExcelsInfoController = async (req, res) => {
    const {userId, prodId} = req.params
    console.log(req.params)
    const findExcels = await cortesieModel.find({prodId: prodId, userId: userId})
    console.log('exceell', findExcels)
    res.send(findExcels)
}

export const getProdCortesiesController = async (req, res) => {
  const {cortesieId} = req.params
  const findExcels = await cortesieModel.find({_id: cortesieId})
  res.send(findExcels)
}

export const deleteCortesiesController = async (req, res) => {
  const {cortesieId} = req.params
  await cortesieModel.deleteOne({_id: cortesieId})
  res.sendStatus(200)
}

export const editCortesiesController = async (req, res) => {
  res.sendStatus(200)
}

export const chargeExcelController = async (req, res) => {
  const {userId, prodId, eventName, excelName, fechaCreacion} = req.body
  console.log(Date.now())
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }

  try {
    const formatedDate = formatDateB(Date.now())
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rawPeople = XLSX.utils.sheet_to_json(worksheet, {
      header: ['clientName', 'email'],
      range: 1
    });
    console.log(formatedDate)
    const courtesyCount = rawPeople.length;

    // Agregamos el campo courtesy a cada persona
    const peopleWithCourtesy = rawPeople.map(person => ({
      ...person
    }));

   const newCourtesyDoc = await cortesieModel.create({
      prodId,
      userId,
      eventName: eventName,
      excelName,
      fechaCreacion: formatedDate,
      people: peopleWithCourtesy,
      courtesy: courtesyCount
    });

    res.json({ success: true, data: newCourtesyDoc });
  } catch (error) { 
    console.error('Error al procesar el Excel:', error);
    res.status(500).json({ error: 'Error al leer el archivo Excel' });
  }
}

async function generateQr(data) {
  return await QRCode.toDataURL(data);  // Devuelve el QR en base64
}

export const sendCortesiesController = async (req, res) => {
  const { prodId, cortesieId } = req.body;
 
  try {
    const evento = await ticketModel.findById(prodId);
    const cortesiaDoc = await cortesieModel.findById(cortesieId);
    const usuarios = cortesiaDoc.people;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.USER_MAIL, pass: process.env.PASS }
    });

    for (const usuario of usuarios) {
      if (usuario.status === 'sent') {
        console.log(`Correo ya enviado a ${usuario.email}, se omite.`);
        continue;
      }
      try {
        // 1. Generar token único
        const payload = {
          nombreCompleto: usuario.clientName,
          prodId: evento._id,
          iat: Math.floor(Date.now() / 1000),
          jti: uuidv4()
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET);
        const saveToken = new tokenModel({ token });
        await saveToken.save();

        // 2. Generar QR
        const qrData = `${process.env.URL_FRONT}/ticket/validate/${token}`;
        const qrBase64 = await generateQr(qrData);
        const qrBuffer = Buffer.from(qrBase64.split(',')[1], 'base64');

        const messageId = `<${uuidv4()}@gotickets.com>`

        const randomTips = [
          'Presentá este QR sin necesidad de imprimir.',
          'Mostrá tu entrada directamente desde tu celular.',
          'Si tenés dudas, nuestro staff podrá ayudarte en la entrada.'
        ];
        const randomTip = randomTips[Math.floor(Math.random() * randomTips.length)];
        // 3. Construir email dinámico
        const emailHtml = `
        <html>
            <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Poppins&display=swap');
              </style>
            </head>
            <body style="font-family: 'Poppins', sans-serif; padding:3px; text-align:center; margin:0; -webkit-text-size-adjust: 100%;">
              <div style="display:flex; height:90px; background-color:#23103b; justify-content:center; align-items:center;">
                <h1 style="font-size:30px; color:white; margin:auto;">Go Ticket</h1>
              </div>
              <div style="text-align:center; padding:20px 15px 40px 15px; background-color:#1d0b0c; color:white;">
                <h3 style="font-size:20px">${usuario.clientName}, ¡Tienes una invitación!</h3>
                <p style="font-size:18px">Invitación: <strong>ticket número A</strong></p>
                <p style="font-size:18px">Escaneá este QR para acceder:</p>
                <img src=${evento.imgEvento} alt="" style="width:230px; height:230px; margin:20px 0;">
                <img src="cid:qrcodeimg" alt="QR de cortesia" style="width:230px; height:230px; margin:20px 0;"/>
                <div>
                  <h2 style="font-size:20px">${evento.nombreEvento}</h2>
                  <p style="font-size:18px">Fecha del evento: ${new Date(evento.fechaInicio).toLocaleDateString()}</p>
                  <p style="font-size:18px">Invitación válida hasta: ${new Date(evento.fechaFin).toLocaleDateString()}</p>
                  <p style="font-size:18px">${evento.direccion}</p>
                </div>
                  <p style="display:none">ID único: ${uuidv4()}</p>
              </div>
              <div style="background-color:#1c0b13; color:white; padding:20px; text-align:center">
                <h3 style="text-decoration: underline; font-size:25px;">Algunos consejos:</h3>
                <p style="font-size:16px">- Recuerda presentar tu eTicket en el acceso del evento con tu teléfono.</p>
                <p style="font-size:16px">- Siempre podrás acceder a tus compras o eTickets desde nuestra web.</p>
                <p style="font-size:16px">- Recuerda llevar tus eTickets abiertos en tu celular.</p>
                <p style="font-size:16px"> -${randomTip}</p>
              </div>
              <footer style="display:flex; height:90px; background-color:#23103b; justify-content:center; align-items:center;">
                <h2 style="font-size:27px; color:white; margin:auto;">Go Ticket</h2>
              </footer>
            </body>
          </html>
        `;
        console.log(usuario.email)
        // 4. Enviar email
        await transporter.sendMail({
          from: `"GoTickets para ${usuario.clientName}" - <no-reply@gotickets.com>`,
          to: usuario.email,
          subject: `Tu invitación a ${evento.nombreEvento} - Cortesía para ${usuario.clientName} - Ref ${uuidv4().split('-')[0]}`,
          html: emailHtml,
          messageId: messageId,
          attachments: [
            {
              filename: 'qrcode.png',
              content: qrBuffer,
              cid: 'qrcodeimg'
            }
          ]
        });
        // 5. Actualizar estado en la base
        usuario.qrCode = qrBase64;
        usuario.status = 'sent';

        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (error) {
        usuario.status = 'error';
        console.error(`Error al enviar a ${usuario.email}:`, error);
      }
    }

    // Guardar cambios en cortesieModel
    await cortesiaDoc.save();

    res.json({ success: true, message: "Correos enviados" });
  } catch (error) {
    console.error('Error en el envío de cortesías:', error);
    res.status(500).json({ error: 'Error al enviar correos' });
  }
};