const express = require('express')

const app    = express()
const server = require('http').createServer(app)
const io     = require('socket.io')(server)
const path   = require('path')
const fs     = require('fs')

const { Client, Location, LocalAuth } = require('whatsapp-web.js')

app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "resources"))

const HomeController = require('./app/http/controllers/HomeController')

app.get('/', HomeController.index)

const createSession = id => {
    console.log(`Create session: ${id}`)
    
    const client = new Client({
        restartOnAuthFail: true,
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ],
        },
        authStrategy: new LocalAuth({
            clientId: id
        })
    })

    client.on('qr', qr => {
        io.emit('WHATSAPP_QR', qr)
    })

    client.on('ready', () => {
        io.emit('WHATSAPP_READY', 'Client is ready!')
    })

    client.on('message', msg => {
        if (msg.body === '!ping') {
            msg.reply('pong');
        }
        else if (msg.body === 'BILLING') {
            msg.reply('Mohon masukan nomor BILING')
        } else if (msg.body === '!location') {
            msg.reply(new Location(37.422, -122.084, 'Googleplex\nGoogle Headquarters'))
        } else if (msg.location) {
            msg.reply(msg.location)
        }
        else {
            msg.reply(`Keyword *${msg.body}* tidak diketahui`)
        }
    })

    client.on('message_create', msg => {
        // Fired on all message creations, including your own
        if (!msg.fromMe) {
            // do stuff here
            io.emit('WHATSAPP_MESSAGE_CREATE', msg)
        }
    })

    client.on('message_revoke_everyone', async (after, before) => {
        // Fired whenever a message is deleted by anyone (including you)
        console.log(after) // message after it was deleted.
        if (before) {
            console.log(before) // message before it was deleted.
        }
    })

    client.on('disconnected', reason => {
        io.emit('WHATSAPP_DISCONNECT', `Client was logged out ${reason}`)
        console.log('Client was logged out', reason)
    })

    client.initialize()
}

const init = socket => {
    const fullPath = path.join(__dirname, '.wwebjs_auth')
    
    if (socket) {
        // createSession('ARTHURXAVIER')
    } else {
        if (fs.existsSync(fullPath)) {
            fs.readdir(fullPath, (error, files) => {
                if (error) console.log(error)
                files.forEach(file => {
                    const identityId = 'AGUSSUANDI'
                    if (file === `session-${identityId}`) {
                        createSession(identityId)
                    }
                })
            })
        }
    }
}

init()

io.on('connection', socket => {
    init(socket)
    socket.emit('CONNECTION_ID', socket.id)
    socket.on('CREATE_SESSION', data => {
        createSession(data)
    })
})

server.listen(3000, () => {
    console.log(`Server running on port 3000 🚀`)
})