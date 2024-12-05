const nodemailer = require('nodemailer')
require(`dotenv`).config();
const {EMAIL_USER_SENDER,EMAIL_PASSWORD_SENDER,EMAIL_SERVICE} = process.env;
const SendMail = async (info) =>{
    const transporter = nodemailer.createTransport({
        host: EMAIL_SERVICE,
        port: 587,
        secure: false,
        auth: {
            user: EMAIL_USER_SENDER,
            pass: EMAIL_PASSWORD_SENDER,
        },
    });
    const mailOptions = {
        from: EMAIL_USER_SENDER,
        to:info.to,
        subject:info.subject,
        text:info.text,
        html:info.html
    }
    transporter.sendMail(mailOptions);
}
module.exports = SendMail

