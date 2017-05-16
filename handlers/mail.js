const nodeMailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice');
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');

// Configure our transport using env settings
const transport = nodeMailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const generateHTML = (filename, options = {}) => {
  // Use pug plugin to render an HTML string from our pug template + styles
  const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options);
  // Use juice plugin to parse our html and inline the css to support older email clients
  return juice(html);
};

exports.send = async (options) => {
  const html = generateHTML(options.filename, options);
  const text = htmlToText.fromString(html);
  const mailOptions = {
    from: 'Shawn Stern <stern.shawn@gmail.com>',
    to: options.user.email,
    subject: options.subject,
    html,
    text,
  };

  const sendMail = promisify(transport.sendMail, transport);
  return sendMail(mailOptions);
};
