import { useState } from "react"
import { contactarRequest } from "../../api/userRequests"
import { Icon } from "../../ui/icons"
import { Alert, Button, Card, Field, Input, Page, Textarea } from "../../ui/primitives"

//Contacto (rediseño). Correcciones: "Nombre del evento (opcional)" era obligatorio y, al enviar,
//la pagina se iba sola al inicio a los 3 segundos.
const MOTIVOS = [
  { icon: Icon.Ticket, titulo: 'Compré y no me llegó la entrada', texto: 'Revisá spam. Si no está, escribinos con el email que usaste al comprar.' },
  { icon: Icon.Sparkles, titulo: 'Quiero vender entradas', texto: 'Contanos de tu evento y te ayudamos a publicarlo.' },
  { icon: Icon.Shield, titulo: 'Reembolsos y cancelaciones', texto: 'Si el evento se cancela, el reembolso es automático.' }
]

const Contact = () => {
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  const contactarFunc = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const f = e.target.elements
    try {
      const res = await contactarRequest({
        pais: f.pais.value, nombreCompleto: f.nombreCompleto.value, correo: f.correo.value,
        celular: f.celular.value, nombreEvento: f.nombreEvento.value, mensaje: f.mensaje.value
      })
      if (res.data.state === 1) setEnviado(true)
      else setError('No pudimos enviar tu mensaje. Intentá de nuevo más tarde')
    } catch (err) {
      setError(err?.response?.status === 400 ? 'Revisá los datos: nombre, correo válido y mensaje son obligatorios' : 'No pudimos enviar tu mensaje. Intentá de nuevo más tarde')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Page>
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-300">Contacto</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-fg sm:text-4xl">¿En qué te podemos ayudar?</h1>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">Escribinos y te respondemos por email, normalmente dentro de las 24 horas hábiles.</p>
          <ul className="mt-10 space-y-6">
            {MOTIVOS.map(({ icon: Ico, titulo, texto }) => (
              <li key={titulo} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-brand-300"><Ico /></span>
                <div><p className="font-medium text-fg">{titulo}</p><p className="mt-0.5 text-sm text-muted">{texto}</p></div>
              </li>
            ))}
          </ul>
        </section>

        <Card className="p-6 sm:p-8">
          {enviado ? (
            <div className="py-10 text-center animate-fade-up">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-ok/12 text-ok ring-8 ring-ok/10"><Icon.CheckCircle className="size-7" /></div>
              <h2 className="mt-5 text-xl font-semibold text-fg">¡Recibimos tu mensaje!</h2>
              <p className="mt-2 text-[15px] text-muted">Te vamos a responder al email que nos dejaste.</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button to="/" variant="secondary">Volver al inicio</Button>
                <Button variant="ghost" onClick={() => setEnviado(false)}>Enviar otro mensaje</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={contactarFunc} className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre completo">{({ id }) => <Input id={id} name="nombreCompleto" autoComplete="name" minLength={3} maxLength={60} required />}</Field>
              <Field label="Email">{({ id }) => <Input id={id} type="email" name="correo" autoComplete="email" maxLength={80} required />}</Field>
              <Field label="Teléfono">{({ id }) => <Input id={id} type="tel" name="celular" autoComplete="tel" inputMode="tel" maxLength={20} required />}</Field>
              <Field label="País">{({ id }) => <Input id={id} name="pais" autoComplete="country-name" defaultValue="Argentina" maxLength={40} required />}</Field>
              <Field label="Evento" optional className="sm:col-span-2">{({ id }) => <Input id={id} name="nombreEvento" placeholder="Si tu consulta es sobre un evento" maxLength={80} />}</Field>
              <Field label="Mensaje" className="sm:col-span-2">{({ id }) => <Textarea id={id} name="mensaje" rows={6} maxLength={2000} required />}</Field>
              {error && <Alert tone="danger" className="sm:col-span-2">{error}</Alert>}
              <div className="sm:col-span-2"><Button type="submit" size="lg" block loading={loading} iconRight={Icon.ArrowRight}>Enviar mensaje</Button></div>
            </form>
          )}
        </Card>
      </div>
    </Page>
  )
}

export default Contact
