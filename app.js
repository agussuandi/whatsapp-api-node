const express = require('express')

const app    = express()
const server = require('http').createServer(app)
const io     = require('socket.io')(server)
const path   = require('path')

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "resources"))

const HomeController = require('./app/http/controllers/HomeController')

app.get('/', HomeController.index)

io.on('connection', socket => {
    socket.emit('CONNECTION_ID', socket.id)

    // const qrcode = require('qrcode-terminal')
    const { Client, LocalAuth } = require('whatsapp-web.js')

    const client = new Client({
        authStrategy: new LocalAuth()
    })

    client.on('qr', qr => {
        socket.emit('WHATSAPP_QR', qr)
        // qrcode.generate(qr, {small: true})
    })

    client.on('ready', () => {
        socket.emit('WHATSAPP_READY', 'Client is ready!')
    })

    client.on('message', msg => {
        if (msg.body === '!ping') {
            msg.reply('pong');
        }
        else if (msg.body === 'BILLING') {
            msg.reply('Mohon masukan nomor BILING')
        }
    })

    client.on('disconnected', reason => {
        socket.emit('WHATSAPP_DISCONNECT', `Client was logged out ${reason}`)
        console.log('Client was logged out', reason)
    })

    client.initialize()
})

server.listen(3000, () => {
    console.log(`Server running on port 3000 🚀`)
})