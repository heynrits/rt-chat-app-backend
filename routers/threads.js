const express = require('express')
const threadService = require('../services/threads')

const router = new express.Router()

router.get('/', async (req, res) => {
    try {
        const threads = await threadService.getAllThreads(req)
        res.json(threads)
    } catch (error) {
        console.log('Error - get threads list', error)
        res.status(400).json({ error })
    }
})

router.get('/:threadId', async (req, res) => {
    try {
        const thread = await threadService.getThread(req)
        if (thread === null) {
            return res.status(404).json({
                message: 'Thread not found.'
            })
        }
        if (thread === undefined) {
            return res.status(400).json({
                message: 'Cannot access the thread'
            })
        }
        res.json(thread)
    } catch (error) {
        console.log('Error - get one thread', error)
        res.status(400).json({ error })
    }
})

module.exports = router