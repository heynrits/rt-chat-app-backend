const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    participants: [String], // username
    unread: [String] // username
}, {
    timestamps: true
})
const Thread = mongoose.model('Thread', schema)

module.exports = Thread