const NewActivityKeywordModel = require('../models/news_activity_keyword.model')

exports.create = (req, res) => {
    const { news_activity_id, keywords } = req.body
    if (!news_activity_id) {
        return res.status(400).json({
            'result': 'error',
            'code': 400,
            'message': 'missing parameter news_activity_id'
        })
    }
    if (keywords.length === 0) {
        return res.status(400).json({
            'result': 'error',
            'code': 400,
            'message': 'missing parameter keywords'
        })
    }
    NewActivityKeywordModel.create(news_activity_id, keywords, (err, data) => {
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
    NewActivityKeywordModel.edit(id, keyword, (err, data) => {
        if (err) res.status(err.code || 500).json(err)
        return res.status(data.code).json(data)
    })
}