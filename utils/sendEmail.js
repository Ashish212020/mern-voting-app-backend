// FILE: server/utils/sendEmail.js

const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Create a "transporter" - an object that is able to send mail
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // We use Gmail's SMTP server
    port: 465,
    secure: true, // use SSL
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address from .env
      pass: process.env.EMAIL_PASS, // Your App Password from .env
    },
  });

  // 2. Define the email options
  const mailOptions = {
    from: `"VoteHub" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html, // We'll use HTML for nicely formatted emails
  };

  // 3. Actually send the email
  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendEmail;
