import { test, before, after, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { loadApp, closeDb, resetDb } from "./helpers.js"

//Etapa 11: script de rotacion de SECRET_MAIL_KEY, contra la base de test
const run = promisify(execFile)
const SCRIPT = path.resolve(import.meta.dirname, "../scripts/rotarSecretMailKey.js")
const BACKUPS = path.resolve(import.meta.dirname, "../backups")
const NUEVA = "clave-nueva-de-mails-para-test-0123456789"
let ticketModel, encrypt, viejaKey, base

before(async () => {
  await loadApp({ mailMode: "bandeja" })
  ticketModel = (await import("../models/ticketsModel.js")).default
  ;({ encrypt } = await import("../controllers/eventController.js"))
  viejaKey = process.env.SECRET_MAIL_KEY
  base = process.env.MONGO_DB_NAME
})
after(async () => {
  for (const f of fs.existsSync(BACKUPS) ? fs.readdirSync(BACKUPS) : []) if (f.includes(`-${base}-`)) fs.rmSync(path.join(BACKUPS, f))
  await closeDb()
})
beforeEach(resetDb)

const descifrar = (valor, secreto) => {
  const [iv, c] = valor.split(":")
  const d = crypto.createDecipheriv("aes-256-cbc", crypto.createHash("sha256").update(secreto).digest(), Buffer.from(iv, "hex"))
  return d.update(c, "hex", "utf8") + d.final("utf8")
}
const script = (...args) => run(process.execPath, [SCRIPT, ...args], {
  cwd: path.resolve(import.meta.dirname, ".."),
  env: { ...process.env, SECRET_MAIL_KEY_ANTERIOR: viejaKey, SECRET_MAIL_KEY: NUEVA }
}).then((r) => ({ code: 0, ...r }), (e) => ({ code: e.code, stdout: e.stdout, stderr: e.stderr }))

const sembrar = () => ticketModel.create({
  nombreEvento: "Con mails", prodMail: encrypt("prod@x.com"),
  rrpp: [{ mail: "a@x.com", mailEncriptado: encrypt("a@x.com"), mailHash: "h1" }, { mail: "b@x.com", mailHash: "h2" }]
})

test("CRITICO: simular no escribe; aplicar exige confirmar la base, recifra todo y se puede repetir", async () => {
  const ev = await sembrar()
  const antes = await ticketModel.findById(ev._id).lean()

  const sim = await script()
  assert.equal(sim.code, 0, sim.stderr)
  assert.match(sim.stdout, /mails a recifrar: 2/)
  assert.deepEqual(await ticketModel.findById(ev._id).lean(), antes, "la simulacion no cambia nada")

  const sinConfirmar = await script("--aplicar")
  assert.equal(sinConfirmar.code, 1)
  assert.match(sinConfirmar.stderr, /confirmar la base/)
  assert.equal(await script("--aplicar", "--base", "otra").then((r) => r.code), 1)

  const ok = await script("--aplicar", "--base", base)
  assert.equal(ok.code, 0, ok.stderr)
  const despues = await ticketModel.findById(ev._id).lean()
  assert.equal(descifrar(despues.prodMail, NUEVA), "prod@x.com")
  assert.equal(descifrar(despues.rrpp[0].mailEncriptado, NUEVA), "a@x.com")
  assert.equal(despues.rrpp[0].mailHash, "h1", "los links de RRPP (mailHash) no cambian")
  assert.equal(despues.rrpp[1].mailEncriptado, undefined)

  const backup = fs.readdirSync(BACKUPS).find((f) => f.includes(`-${base}-`))
  assert.ok(backup, "deja backup de los valores originales")
  assert.equal(JSON.parse(fs.readFileSync(path.join(BACKUPS, backup), "utf8"))[0].original.prodMail, antes.prodMail)

  const otraVez = await script("--aplicar", "--base", base)
  assert.match(otraVez.stdout, /mails a recifrar: 0 \| ya con la clave nueva: 2/)
  assert.equal((await ticketModel.findById(ev._id).lean()).prodMail, despues.prodMail)
})

test("CRITICO: si hay un mail que no se puede descifrar con ninguna clave, no aplica nada", async () => {
  const ev = await sembrar()
  await ticketModel.create({ nombreEvento: "Roto", prodMail: "00112233445566778899aabbccddeeff:deadbeef" })
  const antes = await ticketModel.findById(ev._id).lean()
  const r = await script("--aplicar", "--base", base)
  assert.equal(r.code, 1)
  assert.match(r.stderr, /Roto/)
  assert.deepEqual(await ticketModel.findById(ev._id).lean(), antes)
})
