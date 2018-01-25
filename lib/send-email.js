// test-email.js
var Email = require('keystone-email');

exports.sendEmail = (toUser) =>{
  console.log(JSON.stringify({
    username:toUser.username,
    fname:toUser.name.first,
    lname:toUser.name.last,
    email:toUser.email
  }));
  new Email('./templates/emails/email.pug', {
    transport: 'mailgun',
  }).send({
    fname:toUser.name.first,
    lname:toUser.name.last,
    email:toUser.email,
    username:toUser.username,
    resetKey:toUser.resetPasswordKey
  }, {
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
    to: toUser.email,
    from: {
      name: 'raven',
      email: 'info@raven.com',
    },
    subject: 'Your first KeystoneJS email',
  }, function (err, result) {
    if (err) {
      console.error('🤕 Mailgun test failed with error:\n', err);
    } else {
      console.log('📬 Successfully sent Mailgun test with result:\n', result);
    }
  });
};