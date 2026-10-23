import mercadopago from 'mercadopago';
import { mpAccessToken } from "../config.js";

mercadopago.configure({
  access_token: mpAccessToken,
});

export default mercadopago;