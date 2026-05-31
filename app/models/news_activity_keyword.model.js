const NewActivityKeywordQuery = require('../query/news_activity_keyword.query')
const NewActivityKeyword = function (newActivityKeyword) { };

NewActivityKeyword.create = async (news_activity_id, keywords, result) => {
    try {
        for (let index = 0; index < keywords.length; index++) {
            const keyword = keywords[index];
            await NewActivityKeywordQuery.create(news_activity_id, keyword)
        }
        return result(null, {
            'result': 'success',
            'code': 200,
            'message': 'create keyword success'
        })
    } catch (err) {
        console.log(err)
        return result({
            'result': 'error',
            'code': 500,
            'message': 'Server error'
        }, null)
    }
}

NewActivityKeyword.edit = async (id, keyword, result) => {
    try {
        await NewActivityKeywordQuery.edit(id, keyword)
        return result(null, {
            'result': 'success',
            'code': 200,
            'message': 'edit keyword success'
        })
    } catch (err) {
        console.log(err)
        return result({
            'result': 'error',
            'code': 500,
            'message': 'Server error'
        }, null)
    }
}

module.exports = NewActivityKeyword;