const _ = require('lodash')
const Message = require("../models/message")
const Thread = require("../models/thread")

const getAllThreads = async (req) => {
    try {
        const { user } = req.query

        let threads = await Thread.find({ participants: { $in: [user] } }).sort({ updatedAt: -1 })

        threads = await Promise.all(threads.map(async (t) => {
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

        return threads
    } catch (e) {
        throw e
    }
}

const getThread = async (req) => {
    try {
        let { user, page } = req.query
        const { threadId } = req.params

        page = _.max([parseInt(page), 1])
        const pageLimit = 20
        const offset = (page-1)*pageLimit;

        const thread = await Thread.findById(threadId)

        if (!thread) {
            return null
        }

        if (!thread.participants.includes(user)) {
            return undefined
        }

        const recipient = thread.participants.filter(p => p !== user)[0]
        const messages = await Message.find({ thread: thread._id })
                                        .skip(offset)
                                        .limit(pageLimit)
                                        .sort({ createdAt: -1 })

        const totalMessages = await Message.count({ thread: thread._id })
        const hasNext = totalMessages > offset+pageLimit

        return {
            _id: threadId,
            recipient,
            messages,
            hasNext
        }
    } catch (e) {
        throw e
    }
}

module.exports = {
    getAllThreads,
    getThread
}