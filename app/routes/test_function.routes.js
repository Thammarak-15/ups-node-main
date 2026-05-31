module.exports = app => {
  //const mailer = require('../controllers/mailer.controller')
  const mailer = require('../share_function/mailer')

  app.get('/mailer/sent_to_customer', mailer.SentToCustomer)
}
