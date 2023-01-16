const http = require('http')
const express = require('express')
const { Server } = require('socket.io')
const mongoose = require('mongoose')

// Routers
const THREADS_ROUTER = require('./routers/threads')

// Socket Event Handlers
const chatSocket = require('./sockets/chat')

// Server Config
const app = express()
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    next();
});
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

// Database
mongoose.set('strictQuery', true)
mongoose.connect('mongodb://127.0.0.1:27017/rt-chat-app', (error) => {
    if (error) {
        console.error(error)
    } else {
        console.log('connected to database!')
    }

})

// Routes
app.get('/', (req, res) => {
    res.json({ title: 'RT Chat App Server', message: 'OK' })
})
app.use('/threads', THREADS_ROUTER)

// Socket IO
io.on('connection', (socket) => {
    console.log('a user has connected')

    socket.on('chat', chatSocket.onChat(io))
    socket.on('chat::read', chatSocket.onChatRead)
    socket.on('chat::typing', chatSocket.onChatTyping(io))
})

server.listen(3000, () => {
    console.log('RT Chat app server listening to port 3000')
})