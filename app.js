const dotenv = require('dotenv')
const http = require('http')
const express = require('express')
const { Server } = require('socket.io')
const mongoose = require('mongoose')
const _ = require('lodash')

dotenv.config()

const ENVIRONMENT = _.get(process.env, 'NODE_ENV', 'development')

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
let dbConnectionStr = 'mongodb://127.0.0.1:27017/rt-chat-app'
if (ENVIRONMENT === 'production') {
    const DB_CLUSTER = _.get(process.env, 'DB_CLUSTER')
    const DB_NAME = _.get(process.env, 'DB_NAME')
    const DB_USERNAME = _.get(process.env, 'DB_USERNAME')
    const DB_PASSWORD = _.get(process.env, 'DB_PASSWORD')
    dbConnectionStr = `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@${DB_CLUSTER}.fcosuu8.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`
}
console.log(dbConnectionStr)
mongoose.set('strictQuery', true)
mongoose.connect(dbConnectionStr, (error) => {
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
    console.log(`[${ENVIRONMENT}] RT Chat app server listening to port 3000`)
})