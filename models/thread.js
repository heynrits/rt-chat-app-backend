const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    participants: [String]
}, {
    timestamps: true
})
const Thread = mongoose.model('Thread', schema)

module.exports = Thread