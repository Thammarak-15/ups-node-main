const mongoose = require('mongoose')

const mongoose_model_order_paperless = new mongoose.Schema({
    _id: { type: mongoose.Schema.Types.ObjectId },
    ownerID: { type: mongoose.Schema.Types.ObjectId }, 
    data: { type : mongoose.Schema.Types.Array , default: [] }
},
{ collection: 'C_order_paperless' })

module.exports = mongoose.model('c_order_paperless', mongoose_model_order_paperless)