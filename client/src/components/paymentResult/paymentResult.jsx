import { useEffect, useState } from "react"
import { Link, useSearchParams } from "react-router"
import { confirmPaymentRequest } from "../../api/eventRequests"

//Pagina a la que vuelve Mercado Pago (back_urls). El backend consulta el estado a MP y, si esta
//aprobado y el webhook no llego, procesa el pago (QR por mail). Nunca se usa el "status" de la URL.
const MESSAGES = {
    approved: {
        title: '¡Pago aprobado!',
        text: 'En unos minutos vas a recibir tus entradas por email. Revisá también la carpeta de spam.',
        color: 'text-green-400'
    },
    pending: {
        title: 'Pago pendiente',
        text: 'Mercado Pago todavía está procesando tu pago. Cuando se apruebe, te enviaremos las entradas por email.',
        color: 'text-yellow-500'
    },
    in_process: {
        title: 'Pago en revisión',
        text: 'Mercado Pago está revisando tu pago. Cuando se apruebe, te enviaremos las entradas por email.',
        color: 'text-yellow-500'
    },
    rejected: {
        title: 'Pago rechazado',
        text: 'No se realizó ningún cobro. Podés intentar de nuevo con otro medio de pago.',
        color: 'text-red-400'
    },
    cancelled: {
        title: 'Pago cancelado',
        text: 'No se realizó ningún cobro.',
        color: 'text-red-400'
    }
}

const FALLBACK = {
    title: 'No pudimos confirmar el estado del pago',
    text: 'Si se te cobró, vas a recibir tus entradas por email. Si no llegan, escribinos desde Contacto.',
    color: 'text-gray-300'
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
        return <p className="text-center text-gray-300 mt-[120px] h-screen">Verificando tu pago...</p>
    }

    const msg = MESSAGES[result.status] || FALLBACK
    const retryLink = result.prodId && (result.status === 'rejected' || result.status === 'cancelled')

    return (
        <div className="min-h-screen flex justify-center px-4 pt-[110px]">
            <div className="max-w-xl w-full h-fit bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden text-center">
                <div className="bg-gradient-to-r from-amber-600 to-yellow-500 p-6">
                    <h2 className="text-[#111827]! text-2xl font-bold">Resultado de tu compra</h2>
                </div>
                <div className="p-8">
                    <h3 data-testid="payment-status" data-status={result.status} className={`text-3xl font-bold mb-4 ${msg.color}`}>{msg.title}</h3>
                    {result.nombreEvento && <p className="text-gray-200! mb-3">Evento: {result.nombreEvento}</p>}
                    <p className="text-gray-300! mb-8">{msg.text}</p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {retryLink && <Link className="bg-gradient-to-r from-amber-500 to-yellow-500 text-[#111827]! px-5 py-2 rounded-xl" to={`/buy_tickets/${result.prodId}`}>Intentar de nuevo</Link>}
                        <Link className="bg-gray-700 text-gray-200! px-5 py-2 rounded-xl" to="/">Volver al inicio</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PaymentResult
