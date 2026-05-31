const mongoose = require('mongoose')

const mongoose_model_order_paperless = new mongoose.Schema({
	
	_id: { type: mongoose.Schema.Types.ObjectId },
	ownerID: { type: mongoose.Schema.Types.ObjectId }, 
	data: { type : Array, default: [] }
})

module.exports = mongoose.model('C_order_paperless', mongoose_model_order_paperless, 'C_order_paperless')