const http = require('http')
const express = require('express')
const { Server } = require('socket.io')
const mongoose = require('mongoose')
const Message = require('./models/message')
const Thread = require('./models/thread')

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

mongoose.set('strictQuery', true)
mongoose.connect('mongodb://127.0.0.1:27017/rt-chat-app', (error) => {
    if (error) {
        console.error(error)
    } else {
        console.log('connected to database!')
    }

})

app.get('/', (req, res) => {
    res.json({ title: 'RT Chat App Server', message: 'OK' })
})

app.get('/threads', async (req, res) => {
    const { user } = req.query

    let threads = await Thread.find({ participants: { $in: [user] } }).sort({ updatedAt: -1 })

    threads = await Promise.all(threads.map( async (t) => {
        const recipient = t.participants.filter((p) => p !== user)[0]
        const lastMessage = await Message.findOne({ thread: t._id }).sort({ createdAt: -1 })

        return {
            _id: t._id,
            recipient,
            lastMessage,
        }
    }))

    res.json(threads)
})

io.on('connection', (socket) => {
    console.log('a user has connected')

    socket.on('chat', async (payload) => {
        const { sender, recipient } = payload
        let thread = await Thread.findOne({ participants: { $all: [sender, recipient] } })
        if (thread) { // update thread timestamp
            thread.updatedAt = Date.now()
            await thread.save()
        } else { // new thread
            thread = new Thread({ participants: [sender, recipient]})
            await thread.save()
        }
        const msg = new Message({...payload, thread: thread._id })
        await msg.save()
        // Broadcast the message to the recipient
        io.emit(`chat::${payload.sender}:${payload.recipient}`, payload.message)
        io.emit(`new message:${recipient}`)
    })
})

server.listen(3000, () => {
    console.log('RT Chat app server listening to port 3000')
})