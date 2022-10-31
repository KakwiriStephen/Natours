const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split('')[0];
        this.url = url;
        this.from = `Kakwiri Stephen <${process.env.EMAIL_FROM}>`;
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            //sendgrid
            return 1;
        }
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    async send(template, subject) {
        //send actual email
        //Render HTML based on a pug template
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject,
        });

        //define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.fromString(html),
        };

        //create a transport and send emails

        await this.newTransport().sendMail(mailOptions);
    }
    async sendWelcome() {
        await this.send('welcome', 'Welcome to the natours family');
    }

    async sendPasswordReset() {
        await this.send(
            'passwordReset',
            'Your password reset token is valid for only 10 minutes'
        );
    }
};