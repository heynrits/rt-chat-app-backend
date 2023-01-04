const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    sender: String,
    recipient: String,
    message: String,
    thread: mongoose.Types.ObjectId
}, {
    timestamps: true
})
const Message = mongoose.model('Message', schema)

module.exports = Message