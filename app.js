const http = require('http')
const express = require('express')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

app.get('/', (req, res) => {
    res.json({ title: 'RT Chat App Server', message: 'OK' })
})

io.on('connection', (socket) => {
    console.log('a user has connected')

    socket.on('chat', (payload) => {
        // Broadcast the message to the recipient
        io.emit(`chat::${payload.sender}:${payload.recipient}`, payload.message)
    })
})

server.listen(3000, () => {
    console.log('RT Chat app server listening to port 3000')
})