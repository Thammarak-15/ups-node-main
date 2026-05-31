const modelOrder = require('../models/order.model')

exports.listOrderNotSent = async (req, res) => {
    if (!req.header('Authorization')) {
        res.status(401).json({
            'result': 'Error',
            'code': 401,
            'message': 'This user has unauthorized'
        })
    }
    let token = req.header('Authorization').split(" ")
    token = token[1]
    const {limit, page, search_keyword, filter} = req.body
    await modelOrder.listOrderNotSent(token, limit, page, search_keyword, filter, (err, data) => {
        if (err) res.status(err.code || 500).json(err)
        if (data) res.json(data)
    })
}