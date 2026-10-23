import { Resend } from 'resend';
import dotenv from 'dotenv';
import { isDev, mailEnabled } from '../config.js';
dotenv.config();

//Con MAIL_ENABLED=false no se envia nada: se muestra en consola a quien iba y el asunto.
//En desarrollo tambien los links del mail (verificacion, recuperar contraseña, etc.)
const resendDisabled = {
  emails: {
    send: async ({ to, subject, html = '' }) => {
      const info = { to, subject };
      if (isDev) {
        info.links = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
      }
      console.log('[MAIL DESACTIVADO]', info);
      return { data: null, error: null };
    }
  }
};

export const resend = mailEnabled ? new Resend(process.env.RESEND_API_KEY) : resendDisabled;
