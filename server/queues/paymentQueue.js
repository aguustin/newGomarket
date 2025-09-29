import Queue from 'bull'

export const paymentQueue = new Queue('procesar-pago', {
    redis: {host: '127.0.0.1', port: 6379}
})