import { useEffect, useState } from "react"
import { useSearchParams } from "react-router"
import { confirmPaymentRequest } from "../../api/eventRequests"
import { Icon } from "../../ui/icons"
import { Button, Card, Spinner, cx } from "../../ui/primitives"

//Pagina a la que vuelve Mercado Pago (back_urls). El backend consulta el estado a MP y, si esta
//aprobado y el webhook no llego, procesa el pago (QR por mail). Nunca se usa el "status" de la URL.
const ESPERA = { icon: Icon.Hourglass, tono: 'warn' }
const MESSAGES = {
    approved: { title: '¡Pago aprobado!', text: 'En unos minutos vas a recibir tus entradas por email. Revisá también la carpeta de spam.', icon: Icon.CheckCircle, tono: 'ok' },
    pending: { title: 'Pago pendiente', text: 'Mercado Pago todavía está procesando tu pago. Cuando se apruebe, te enviaremos las entradas por email.', ...ESPERA },
    in_process: { title: 'Pago en revisión', text: 'Mercado Pago está revisando tu pago. Cuando se apruebe, te enviaremos las entradas por email.', ...ESPERA },
    rejected: { title: 'Pago rechazado', text: 'No se realizó ningún cobro. Podés intentar de nuevo con otro medio de pago.', icon: Icon.XCircle, tono: 'danger' },
    cancelled: { title: 'Pago cancelado', text: 'No se realizó ningún cobro.', icon: Icon.XCircle, tono: 'danger' }
}
const FALLBACK = {
    title: 'No pudimos confirmar el estado del pago',
    text: 'Si se te cobró, vas a recibir tus entradas por email. Si no llegan, escribinos desde Contacto.',
    icon: Icon.Info, tono: 'neutral'
}
const TONOS = {
    ok: 'bg-ok/12 text-ok ring-ok/25',
    warn: 'bg-warn/12 text-warn ring-warn/25',
    danger: 'bg-danger/12 text-danger ring-danger/25',
    neutral: 'bg-surface-2 text-muted ring-line'
}

const PaymentResult = () => {
    const [searchParams] = useSearchParams()
    const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id')
    const [result, setResult] = useState(null)

    useEffect(() => {
        const getStatus = async () => {
            if (!paymentId || paymentId === 'null') {  //MP manda payment_id=null si el comprador volvio sin pagar
                setResult({ status: 'cancelled' })
                return
            }
            try {
                const res = await confirmPaymentRequest(paymentId)  //confirma y, si hace falta, procesa el pago
                setResult(res.data)
            } catch {
                setResult({ status: 'unavailable' })
            }
        }
        getStatus()
    }, [paymentId])

    if (!result) {
        return (
            <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-muted">
                <Spinner className="size-7 text-brand-400" />
                <p>Verificando tu pago…</p>
            </main>
        )
    }

    const msg = MESSAGES[result.status] || FALLBACK
    const retryLink = result.prodId && (result.status === 'rejected' || result.status === 'cancelled')
    const Ico = msg.icon

    return (
        <main className="flex flex-1 items-start justify-center px-4 pb-20 pt-12 sm:pt-20">
            <Card className="w-full max-w-md p-8 text-center animate-fade-up sm:p-10">
                <div className={cx('mx-auto flex size-16 items-center justify-center rounded-full ring-8', TONOS[msg.tono])}>
                    <Ico className="size-8" />
                </div>
                <h1 data-testid="payment-status" data-status={result.status} className="mt-6 text-2xl font-bold tracking-tight text-fg">{msg.title}</h1>
                {result.nombreEvento && <p className="mt-2 text-[15px] font-medium text-brand-200">{result.nombreEvento}</p>}
                <p className="mt-3 text-[15px] leading-relaxed text-muted">{msg.text}</p>

                {result.status === 'approved' && (
                    <div className="mt-6 flex items-start gap-3 rounded-xl border border-line bg-surface-2 p-4 text-left text-sm text-muted">
                        <Icon.Mail className="mt-0.5 size-5 shrink-0 text-brand-300" />
                        <p>Mostrá el QR del email en la puerta del evento. Cada entrada tiene su propio código.</p>
                    </div>
                )}

                <div className="mt-8 flex flex-col gap-3">
                    {retryLink && <Button to={`/buy_tickets/${result.prodId}`} size="lg" block iconRight={Icon.ArrowRight}>Intentar de nuevo</Button>}
                    <Button to="/" variant={retryLink ? 'ghost' : result.status === 'approved' ? 'primary' : 'secondary'} size="lg" block>Volver al inicio</Button>
                </div>
            </Card>
        </main>
    )
}

export default PaymentResult
