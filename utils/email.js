const nodemailer = require('nodemailer');


//creating a transporter
const sendEmail = async options => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }

    });

    //Define the email options

    const mailOptions = {
        from: 'Kakwiri Stephen <kakwiri@ngota.io',
        to: options.email,
        subject: options.subject,
        text: options.message
    }


    //sending email

    await transporter.sendMail(mailOptions)
}

module.exports = sendEmail;