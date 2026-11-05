import { test } from "node:test"
import assert from "node:assert/strict"
import { validateConfig } from "../config.js"

const base = {
  MONGO_URI: 'mongodb://x', JWT_SECRET: 'j', SECRET_MAIL_KEY: 's', RESEND_API_KEY: 'r',
  URL_FRONT: 'https://f', URL_BACK: 'https://b', MP_ACCESS_TOKEN_PROD: 'p',
  URL_FRONT_DEV: 'http://localhost:5173', URL_BACK_DEV: 'https://n', MP_ACCESS_TOKEN_DEV: 'd',
  CLOUD_NAME: 'c', API_KEY: 'k', API_SECRET: 'x'
}

test('produccion completa con MAIL_MODE=resend arranca sin errores', () => {
  assert.deepEqual(validateConfig({ ...base }).errors, [])
})

for (const mode of ['bandeja', 'falla']) {
  test(`produccion rechaza MAIL_MODE=${mode}`, () => {
    const { errors } = validateConfig({ ...base, MAIL_MODE: mode })
    assert.ok(errors.some((e) => e.includes(`MAIL_MODE=${mode}`)), errors.join(' | '))
  })
  test(`development permite MAIL_MODE=${mode}`, () => {
    assert.deepEqual(validateConfig({ ...base, APP_ENV: 'development', MAIL_MODE: mode }).errors, [])
  })
}

test('MAIL_MODE desconocido es un error en cualquier entorno', () => {
  assert.equal(validateConfig({ ...base, APP_ENV: 'development', MAIL_MODE: 'mailtrap' }).errors.length, 1)
})

test('APP_ENV desconocido es un error (evita un "dev" mal escrito que caiga en produccion)', () => {
  assert.ok(validateConfig({ ...base, APP_ENV: 'dev' }).errors.some((e) => e.includes('APP_ENV')))
})

test('en produccion las variables obligatorias faltantes son errores', () => {
  const { JWT_SECRET, MP_ACCESS_TOKEN_PROD, ...sinSecretos } = base
  const { errors } = validateConfig(sinSecretos)
  assert.ok(errors.includes('Falta la variable JWT_SECRET'))
  assert.ok(errors.includes('Falta la variable MP_ACCESS_TOKEN_PROD'))
})

test('en development las faltantes solo avisan y no se exige la clave de Resend si no se usa', () => {
  const { RESEND_API_KEY, URL_BACK_DEV, ...resto } = base
  const { errors, warnings } = validateConfig({ ...resto, APP_ENV: 'development', MAIL_MODE: 'bandeja' })
  assert.deepEqual(errors, [])
  assert.ok(warnings.includes('Falta la variable URL_BACK_DEV'))
  assert.ok(!warnings.some((w) => w.includes('RESEND_API_KEY')))
})

test('produccion con MAIL_MODE=resend exige RESEND_API_KEY', () => {
  const { RESEND_API_KEY, ...resto } = base
  assert.ok(validateConfig(resto).errors.includes('Falta la variable RESEND_API_KEY'))
})

test('WEBHOOK_FIRMA: valor desconocido es error; estricto exige WEBHOOK_SECRET_KEY', () => {
  const base = { APP_ENV: 'development', MONGO_URI: 'x', JWT_SECRET: 'x', SECRET_MAIL_KEY: 'x', MAIL_MODE: 'bandeja' }
  assert.ok(validateConfig({ ...base, WEBHOOK_FIRMA: 'quizas' }).errors.some((e) => e.includes('WEBHOOK_FIRMA')))
  assert.ok(validateConfig({ ...base, WEBHOOK_FIRMA: 'estricto' }).errors.some((e) => e.includes('WEBHOOK_SECRET_KEY')))
  assert.equal(validateConfig({ ...base, WEBHOOK_FIRMA: 'estricto', WEBHOOK_SECRET_KEY: 's' }).errors.length, 0)
  assert.equal(validateConfig(base).errors.length, 0, 'por defecto: registrar')
})
