const ProductKeywordModel = require('../models/product_keyword.model')

exports.create = (req, res) => {
    const { product_id, keywords } = req.body
    if (!product_id) {
        return res.status(400).json({
            'result': 'error',
            'code': 400,
            'message': 'missing parameter product_id'
        })
    }
    if (keywords.length === 0) {
        return res.status(400).json({
            'result': 'error',
            'code': 400,
            'message': 'missing parameter keywords'
        })
    }
    ProductKeywordModel.create(product_id, keywords, (err, data) => {
        if (err) res.status(err.code || 500).json(err)
        return res.status(data.code).json(data)
    })
}

exports.edit = (req, res) => {
    const { id, keyword } = req.body
    if (!id) {
        return res.status(400).json({
            'result': 'error',
            'code': 400,
            'message': 'missing parameter id'
        })
    }
    if (!keyword) {
        return res.status(400).json({
            'result': 'error',
            'code': 400,
            'message': 'missing parameter keyword'
        })
    }
    ProductKeywordModel.edit(id, keyword, (err, data) => {
        if (err) res.status(err.code || 500).json(err)
        return res.status(data.code).json(data)
    })
}