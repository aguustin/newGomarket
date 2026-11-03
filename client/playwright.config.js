import { defineConfig, devices } from '@playwright/test'

//E2E aislados: levantan SU PROPIO backend (4100, base ipass_e2e, mails a la bandeja) y SU PROPIO
//frontend (5174). No usan los servidores de desarrollo (4000/5173) ni sus datos.
//El backend toma el resto de la configuracion de server/.env (Mongo, token sandbox de MP, etc.).
export const E2E_BACK = 'http://localhost:4100'
export const E2E_FRONT = 'http://localhost:5174'
//Mercado Pago exige back_urls https: se usa un host que no existe. Los tests siguen los links de los
//mails contra E2E_BACK conservando la ruta (ver e2e/helpers.js)
export const E2E_FAKE_PUBLIC_BACK = 'https://ipass-e2e.invalid'

const backendEnv = {
  ...process.env,
  PORT: '4100',
  APP_ENV: 'test',
  MONGO_DB_NAME: 'ipass_e2e',
  MAIL_MODE: 'bandeja',
  URL_FRONT_DEV: E2E_FRONT,
  URL_BACK_DEV: E2E_FAKE_PUBLIC_BACK
}

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.js',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: E2E_FRONT,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node app.js',
      cwd: '../server',
      url: `${E2E_BACK}/getAllEvents`,
      env: backendEnv,
      reuseExistingServer: false,
      timeout: 180_000  //el arranque de Vite puede tardar ~1 min con el equipo cargado
    },
    {
      command: 'npx vite --port 5174 --strictPort',
      url: E2E_FRONT,
      env: { ...process.env, VITE_URL: E2E_BACK, VITE_URL_FRONT: E2E_FRONT, VITE_RECAPTCHA_ENABLED: 'false' },
      reuseExistingServer: false,
      timeout: 180_000  //el arranque de Vite puede tardar ~1 min con el equipo cargado
    }
  ]
})
