import cortesieModel from "../models/cortesiesModel.js"
import XLSX from 'xlsx';


export const getAllExcelsInfoController = async (req, res) => {
    const {prodId, userId} = req.params
    console.log(prodId, userId)
    const findExcels = await cortesieModel.find({prodId: prodId, userId: userId})
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
  const {userId, prodId, excelName, fechaCierre} = req.body
  console.log(prodId, excelName)

  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo' });
  }

  try {
    const formatedDate = formatDateB(fechaCierre)
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rawPeople = XLSX.utils.sheet_to_json(worksheet, {
      header: ['clientName', 'email'],
      range: 1
    });

    const courtesyCount = rawPeople.length;

    // Agregamos el campo courtesy a cada persona
    const peopleWithCourtesy = rawPeople.map(person => ({
      ...person
    }));

    const filter = { prodId: prodId };
    const update = {
      userId: userId,
      excelName: req.body.excelName,
      dateT: Date.now(),
      fechaCierre: formatedDate,
      people: peopleWithCourtesy,
      courtesy: courtesyCount
    };
    const options = { upsert: true, new: true }; // Crea si no existe, actualiza si existe
    const result = await cortesieModel.findOneAndUpdate(filter, update, options);
    res.json({ success: true, data: result });
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
      try {
        // 1. Generar token único
        const payload = {
          nombreCompleto: usuario.clientName,
          prodId: evento._id,
          iat: Math.floor(Date.now() / 1000),
          jti: uuidv4()
        };
        const token = jwt.sign(payload, JWT_SECRET);
        const saveToken = new tokenModel({ token });
        await saveToken.save();

        // 2. Generar QR
        const qrData = `${process.env.URL_FRONT_DEV}/ticket/validate/${token}`;l
        const qrBase64 = await generateQr(qrData);
        const qrBuffer = Buffer.from(qrBase64.split(',')[1], 'base64');

        // 3. Construir email dinámico
        const emailHtml = `
        <html>
            <head>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Poppins&display=swap');
              </style>
            </head>
            <body style="font-family: 'Poppins', sans-serif; padding:50px; text-align:center; margin:0;">
              <div style="display:flex; height:90px; background-color:#23103b; justify-content:center; align-items:center;">
                <h1 style="font-size:30px; color:white; margin:auto;">Go Ticket</h1>
              </div>
              <div style="text-align:center; padding:20px 15px 40px 15px; background-color:#1a0c2c; color:white;">
                <h3 style="font-size:20px">${usuario.clientName}, ¡Tienes una invitación!</h3>
                <p style="font-size:18px">Invitación: <strong>ticket número A</strong></p>
                <p style="font-size:18px">Escaneá este QR para acceder:</p>
                <img src="cid:qrcodeimg" alt="QR de cortesia" style="width:230px; height:230px; margin:20px 0;"/>
                
                <div>
                  <h2 style="font-size:20px">${evento.nombre}</h2>
                  <p style="font-size:18px">Fecha del evento: ${new Date(evento.eventoFechaInicio).toLocaleDateString()}</p>
                  <p style="font-size:18px">Invitación válida hasta: ${new Date(cortesiaDoc.fechaCierre).toLocaleDateString()}</p>
                  <p style="font-size:18px">${evento.direccionEvento}</p>
                </div>
              </div>
              <div style="background-color:#0c0614; color:white; padding:20px; text-align:center">
                <h3 style="text-decoration: underline; font-size:25px;">Algunos consejos:</h3>
                <p style="font-size:16px">- Recuerda presentar tu eTicket en el acceso del evento con tu teléfono.</p>
                <p style="font-size:16px">- Siempre podrás acceder a tus compras o eTickets desde nuestra web.</p>
                <p style="font-size:16px">- Recuerda llevar tus eTickets abiertos en tu celular.</p>
              </div>
              <footer style="display:flex; height:90px; background-color:#23103b; justify-content:center; align-items:center;">
                <h2 style="font-size:27px; color:white; margin:auto;">Go Ticket</h2>
              </footer>
            </body>
          </html>
        `;

        // 4. Enviar email
        await transporter.sendMail({
          from: '"GoTickets" <no-reply@gotickets.com>',
          to: usuario.email,
          subject: `Tu invitación para ${evento.nombre} - Cortesía`,
          html: emailHtml,
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