import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { isDev, mailMode } from '../config.js';
import devMailModel from '../models/devMailModel.js';
dotenv.config();

//Punto unico de envio de mails. Los controladores usan:
//  resend.emails.send(...)            -> mismo contrato que el SDK de Resend: devuelve { data, error }, no lanza
//  createMailTransport(opts).sendMail -> mismo contrato que nodemailer: devuelve info o lanza un error
//MAIL_MODE decide que pasa detras (ver config.js). Volver a produccion = MAIL_MODE=resend (o sin definir).

//Defensa extra: bandeja/falla nunca actuan fuera de development/test, aunque alguien
//importe este modulo sin pasar por la validacion de app.js (worker, scripts)
let mode = mailMode;
if (!isDev && (mode === 'bandeja' || mode === 'falla')) {
  console.error(`[MAIL] MAIL_MODE=${mode} no se permite en produccion: se usa "off"`);
  mode = 'off';
}

const toList = (to) => (Array.isArray(to) ? to : [to]).filter(Boolean).map(String);

//En produccion no se registran destinatarios (datos personales), solo el asunto
const describe = ({ to, subject }) => (isDev ? { to: toList(to), subject } : { subject });

const toBase64 = (content) => (Buffer.isBuffer(content) ? content.toString('base64') : String(content ?? ''));

const saveToInbox = async (provider, { from, to, subject, html, text, attachments = [] }) => {
  const doc = await devMailModel.create({
    provider,
    from,
    to: toList(to),
    subject,
    html,
    text,
    attachments: attachments.map((a) => ({
      filename: a.filename,
      contentType: a.contentType,
      contentId: a.contentId ?? a.cid,   // Resend usa contentId, nodemailer usa cid
      content: toBase64(a.content)
    }))
  });
  console.log('[MAIL bandeja]', describe({ to, subject }));
  return doc._id.toString();
};

const SIMULATED_ERROR = 'Falla simulada del proveedor de mail (MAIL_MODE=falla)';

//--- Resend ---
const realResend = mode === 'resend' ? new Resend(process.env.RESEND_API_KEY) : null;

export const resend = {
  emails: {
    send: async (message) => {
      if (mode === 'resend') {
        const result = await realResend.emails.send(message);
        if (result?.error) {
          console.error('[MAIL] Resend rechazo el envio', describe(message), result.error.name, result.error.message);
        }
        return result;
      }
      if (mode === 'bandeja') {
        return { data: { id: await saveToInbox('resend', message) }, error: null };
      }
      if (mode === 'falla') {
        console.error('[MAIL falla simulada]', describe(message));
        return { data: null, error: { name: 'application_error', statusCode: 500, message: SIMULATED_ERROR } };
      }
      console.log('[MAIL desactivado]', describe(message));
      return { data: null, error: null };
    }
  }
};

//--- Gmail / nodemailer ---
export const createMailTransport = (options) => {
  if (mode === 'resend') return nodemailer.createTransport(options);
  return {
    sendMail: async (message) => {
      if (mode === 'bandeja') {
        const id = await saveToInbox('gmail', message);
        return { messageId: `<${id}@bandeja.local>`, accepted: toList(message.to), rejected: [] };
      }
      if (mode === 'falla') {
        console.error('[MAIL falla simulada]', describe(message));
        const err = new Error(SIMULATED_ERROR);
        err.code = 'ESIMULATED';
        throw err;
      }
      console.log('[MAIL desactivado]', describe(message));
      return { messageId: null, accepted: [], rejected: [] };
    }
  };
};
