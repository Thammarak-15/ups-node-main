var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
const { ShF_log_to_file } = require("../share_function/log_file")

// setup mail transporter service
const transporter = nodemailer.createTransport({
  //service: 'hotmail',
  //service: 'gmail',
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  //secure: true,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD
  },
 });

// setup email data with unicode symbols
setupEmailData = function (sendTo,orderId,trackNo) {
  let msg1 = '<p><b>บริการอัตโนมัติ : แจ้งเตือนสถานะขนส่ง(Ultimate Plus Online)</b>'
  let msg2 = '<br>คำสั่งซื้อเลขที่ : '+orderId
  let msg3 = '<br>Tracking No. : '+trackNo
  let msg4 = '<br>สถานะ : จัดส่งสำเร็จแล้ว</p>'
  let msg5 = '<p>อีเมลฉบับนี้เป็นการแจ้งข้อมูลโดยอัตโนมัติ'
  let msg6 = '<br>หากคุณไม่ได้ทำรายการตามรายละเอียดข้างต้น หรือพบว่าข้อมูลไม่ถูกต้อง'
  let msg7 = 'โปรดติดต่อเจ้าหน้าที่ โทร 081-235-0354 หรือ 096-996-5515 โดยทันที</p>'
  let msg8 = '<p>ขอแสดงความนับถือ'
  let msg9 = '<br><b>บริษัท อัลติเมท พลัส ซัพพลาย จำกัด</b></p>'
  let msg10 = '<p>สำนักงานใหญ่ 219/230 ซอยงามวงศ์วาน 47 แยก 6 (ชินเขต 2/6)'
  let msg11 = '<br>ถ.งามวงศ์วาน แขวงทุ่งสองห้อง เขตหลักสี่ กรุงเทพฯ 10210'
  let msg12 = '<br>Tel : 02-591-4005, 086-369-0088, 085-160-994'
  let msg13 = '<br>Hot Line : 086-999-6090 ,086-999-8070, 086-314-3159'
  let msg14 = '<br>Fax : 0-2591-4027, 0-2591-4028'
  let msg15 = '<br>E-mail : data2@ultimateplus.co.th</p>'
  let msg = msg1+msg2+msg3+msg4+msg5+msg6+msg7+msg8+msg9+msg10+msg11+msg12+msg13+msg14+msg15
  //return "ok"
  let mailOptions = {
    from: { name: process.env.MAIL_FROM_NAME, address: process.env.MAIL_FROM_ADDRESS },
    to: sendTo,
    subject: 'แจ้งเตือนสถานะขนส่ง(Ultimate Plus Online)', // Mail subject
    html: msg  // HTML body
  };
  return mailOptions;
};

const sendEmail =  async (sendTo,orderId,trackNo) => {
  let timeTaken = Date.now();
  var logfile = "EmailSuccessfullyDelivered.log";
  let resultMail = setupEmailData(sendTo,orderId,trackNo)
  let resultSend = await transporter.sendMail(resultMail)
  var log_data = {};
  log_data.info = {"sendTo":sendTo,"orderId":orderId,"trackNo":trackNo}
  log_data.data = resultSend;
  log_data.execution_time = Date.now() - timeTaken;
  ShF_log_to_file(logfile, JSON.stringify(log_data));
  return resultSend
}

SentToCustomer = (req, res) => {
  let resultMail = setupEmailData('test@hotmail.com','230403000000001408','TH0105AYDN0A')
  transporter.sendMail(resultMail,(err, data) => {
    if (err) {
      res.send(err)
    }
    else{
      res.send(data)
    }
  });
};

module.exports = {sendEmail,SentToCustomer}