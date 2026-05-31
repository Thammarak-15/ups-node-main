const ProductKeywordQuery = require('../query/product_keyword.query')
const ProductKeyword = function (productKeyword) { };

ProductKeyword.create = async (product_id, keywords, result) => {
    try {
        for (let index = 0; index < keywords.length; index++) {
            const keyword = keywords[index];
            await ProductKeywordQuery.create(product_id, keyword)
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

ProductKeyword.edit = async (id, keyword, result) => {
    try {
        await ProductKeywordQuery.edit(id, keyword)
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

module.exports = ProductKeyword;