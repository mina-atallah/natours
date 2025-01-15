const nodemailer = require('nodemailer');

const sendEmail = async options => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST.trimEnd(),
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME.trimEnd(),
      pass: process.env.EMAIL_PASSWORD.trimEnd()
    }
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'user one <hellouser@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
    // html:
  };

  // 3) Actually send the email
  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (err) {
    console.error('Error sending email:', err);
    throw err; // re-throw to propagate the error to the caller
  }
};

module.exports = sendEmail;
