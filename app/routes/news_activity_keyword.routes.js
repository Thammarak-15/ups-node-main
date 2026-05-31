const newsActivityKeywordController = require('../controllers/news_activity_keyword.controller')
module.exports = app => {
    app.post('/news_activity/keyword/add', newsActivityKeywordController.create)
    app.post('/news_activity/keyword/edit', newsActivityKeywordController.edit)
}