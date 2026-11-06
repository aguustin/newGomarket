import base from './playwright.config.js'

//Capturas para revisar el diseño (no son tests): mismos servidores aislados que los E2E (backend 4100 con
//base ipass_e2e y frontend 5174). Uso:  npx playwright test -c playwright.ux.config.js [-g "<pantalla>"]
//Las imagenes quedan en ux/capturas/ (escritorio y celular de cada pantalla).
export default {
  ...base,
  testDir: './ux',
  timeout: 480_000,
  reporter: [['line']],
  use: { ...base.use, screenshot: 'off', trace: 'off' }
}
