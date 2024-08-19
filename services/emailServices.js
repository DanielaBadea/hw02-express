const sgMail = require('@sendgrid/mail')
const dotenv = require('dotenv');

dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const msg = {
  to: 'badeadaniella@gmail.com', 
  from: 'badeadaniella@gmail.com', 
  subject: 'Sending with SendGrid is Fun',
  text: 'and easy to do anywhere, even with Node.js',
  html: '<strong>and easy to do anywhere, even with Node.js</strong>',
}
sgMail
    .send(msg)
    .then(() => {
        console.log('Email sent')
    })
    .catch((error) => {
        console.error(error)
    });

module.exports = msg;