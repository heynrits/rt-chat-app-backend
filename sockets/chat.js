const Message = require("../models/message")
const Thread = require("../models/thread")

// A new message is sent
const onChat = (io) => (
    async (payload) => {
        const { sender, recipient } = payload
        let thread = await Thread.findOne({ participants: { $all: [sender, recipient] } })
        if (thread) { // update thread timestamp
            thread.unread = [recipient]
            thread.updatedAt = Date.now()
        } else { // new thread
            thread = new Thread({
                participants: [sender, recipient],
                unread: [recipient],
            })
        }
        await thread.save()
        const msg = new Message({ ...payload, thread: thread._id })
        await msg.save()
        // Broadcast the message to the recipient
        io.emit(`chat::${payload.sender}:${payload.recipient}`, payload.message)
        io.emit(`new message:${recipient}`)
        // Signal sent to the listener in "new message" screen
        io.emit(`chat init::${sender}:${recipient}`, thread._id)
        // Notify sender the success of sending the message
        io.emit(`chat:sent::${sender}:${recipient}`)
    }
)

// A user reads/opens a thread
const onChatRead = async ({ user, threadId }) => {
    await Thread.findOneAndUpdate(
        { _id: threadId },
        { $pull: { unread: user } },
        { timestamps: false }
    )
}

// A user is typing in a thread
const onChatTyping = (io) => (
    ({ threadId, sender, recipient }) => {
        io.emit(`chat:typing::${threadId}:${sender}`)
    }
)

module.exports = {
    onChat,
    onChatRead,
    onChatTyping
}