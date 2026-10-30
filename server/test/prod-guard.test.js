import { test } from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

//Arranca el servidor real como en produccion pero con un modo de prueba activado:
//debe negarse a arrancar. MONGO_URI apunta a un puerto cerrado por si la proteccion fallara.
const appPath = fileURLToPath(new URL('../app.js', import.meta.url))

for (const mode of ['bandeja', 'falla']) {
  test(`el servidor no arranca en produccion con MAIL_MODE=${mode}`, () => {
    const r = spawnSync(process.execPath, [appPath], {
      env: { ...process.env, APP_ENV: 'production', MAIL_MODE: mode, MONGO_URI: 'mongodb://127.0.0.1:1/nada', PORT: '0' },
      encoding: 'utf8',
      timeout: 20000
    })
    assert.notEqual(r.status, 0, 'el servidor arranco y no debia')
    assert.match(r.stderr, new RegExp(`\\[CONFIG\\] Error: MAIL_MODE=${mode} es solo para desarrollo`))
    assert.doesNotMatch(r.stdout, /Database connected/)
  })
}
