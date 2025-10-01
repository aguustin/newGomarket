/*import { resend } from "../lib/resendDomain.js";

const run = async () => {
  try {
    const domainsList = await resend.domains.list();

    // Validamos que data existe y es un array
    if (Array.isArray(domainsList.data)) {
      const existing = domainsList.data.find(
        (d) => d.name === 'goticketonline.com'
      );

      if (existing) {
        console.log('✅ El dominio ya existe en Resend:', existing);
        return;
      }
    }

    // Si no existe, crearlo
    const newDomain = await resend.domains.create({ name: 'goticketonline.com' });
    console.log('✅ Dominio creado en Resend:', newDomain);
  } catch (err) {
    console.error('❌ Error verificando o creando el dominio:', err);
  }
};

run();*/
