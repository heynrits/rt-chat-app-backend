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
        const unread = t.unread.includes(user)

        return {
            _id: t._id,
            recipient,
            lastMessage,
            unread,
        }
    }))

    res.json(threads)
})

app.get('/threads/:threadId/', async (req, res) => {
    const { user } = req.query
    const { threadId } = req.params

    const thread = await Thread.findById(threadId)

    if (!thread) {
        return res.status(404).json({
            message: 'Thread not found.'
        })
    }

    if (!thread.participants.includes(user)) {
        return res.status(400).json({
            message: 'Cannot access the thread'
        })
    }

    const recipient = thread.participants.filter(p => p !== user)[0]
    const messages = await Message.find({ thread: thread._id })

    res.json({
        _id: threadId,
        recipient,
        messages
    })
})

io.on('connection', (socket) => {
    console.log('a user has connected')

    socket.on('chat', async (payload) => {
        let newThread = false
        const { sender, recipient } = payload
        let thread = await Thread.findOne({ participants: { $all: [sender, recipient] } })
        if (thread) { // update thread timestamp
            thread.unread = [recipient]
            thread.updatedAt = Date.now()
        } else { // new thread
            newThread = true
            thread = new Thread({
                participants: [sender, recipient],
                unread: [recipient],
            })
        }
        await thread.save()
        const msg = new Message({...payload, thread: thread._id })
        await msg.save()
        // Broadcast the message to the recipient
        io.emit(`chat::${payload.sender}:${payload.recipient}`, payload.message)
        io.emit(`new message:${recipient}`)

        if (newThread) {
            io.emit(`chat init::${sender}:${recipient}`, thread._id)
        }
    })

    // User reads/opens a thread
    socket.on('chat::read', async ({ user, threadId }) => {
        await Thread.findOneAndUpdate(
            { _id: threadId},
            { $pull: { unread: user }},
            { timestamps: false }
        )
    })
})

server.listen(3000, () => {
    console.log('RT Chat app server listening to port 3000')
})