require("dotenv").config();

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP Error:", error);
  } else {
    console.log("Brevo SMTP Connected");
  }
});

// Function to send email

const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

  } catch (error) {
    console.error('Error sending email:', error);
  }
};

async function SendRegistrationMail(UserEmail, name) {

  const subject = "Welcome to Falah Bank - Account Registration Successful";
  const text = `Dear ${name},

Welcome to Falah Bank.

We are pleased to inform you that your account has been successfully created.

Your account is now ready to use. You can securely access our banking services, manage your account, and monitor your transactions at any time.

If you have any questions or require assistance, please contact our support team. We are always happy to help.

Thank you for choosing Falah Bank.

Best regards,

Falah Bank Team
`;
  const html = `
<p>Dear <strong>${name}</strong>,</p>

<p>Welcome to <strong>Falah Bank</strong>.</p>

<p>We are pleased to inform you that your account has been <strong>successfully created</strong>.</p>

<p>Your account is now ready to use. You can securely access our banking services, manage your account, and monitor your transactions at any time.</p>

<p>If you have any questions or require assistance, please contact our support team. We are always happy to help.</p>

<p>Thank you for choosing <strong>Falah Bank</strong>.</p>

<p>
Best regards,<br>
<strong>Falah Bank Team</strong>
</p>
`;

  await sendEmail(UserEmail, subject, text, html);
}
async function SendTransactionMail(userEmail, name, amount, toAccount) {

  const subject = "Transaction Successful";

  const text = `Dear ${name},

Your transaction has been successfully completed.

Transaction Details:
----------------------------
Amount: USD $${amount}
Recipient: ${toAccount}
Status: Successful
Date: ${new Date().toLocaleString()}

Your account has been updated successfully.

If you did not authorize this transaction, please contact our support team immediately.

Thank you for choosing Falah Bank.

Best regards,
Falah Bank Team
`;

  const html = `
Dear <strong>${name}</strong>,<br><br>

Your transaction has been <strong>successfully completed</strong>.<br><br>

<b>Transaction Details</b><br>
Amount: USD $${amount}<br>
Recipient: ${toAccount}<br>
Status: Successful<br>
Date: ${new Date().toLocaleString()}<br><br>

Your account has been updated successfully.<br><br>

If you did not authorize this transaction, please contact our support team immediately.<br><br>

Thank you for choosing <strong>Falah Bank</strong>.<br><br>

Best regards,<br>
<strong>Falah Bank Team</strong>
`;

  await sendEmail(userEmail, subject, text, html);
}
async function ReceiverTransactionMail(userEmail, name, amount, senderName) {

  const subject = "Account Credited";

  const text = `Dear ${name},

Your account has been credited successfully.

Transaction Details:
----------------------------
Amount: USD $${amount}
Received From: ${senderName}
Status: Successful
Date: ${new Date().toLocaleString()}

Thank you for choosing Falah Bank.

Best regards,
Falah Bank Team
`;

  const html = `
Dear <strong>${name}</strong>,<br><br>

Your account has been <strong>credited successfully</strong>.<br><br>

<b>Transaction Details</b><br>
Amount: USD $${amount}<br>
Received From: ${senderName}<br>
Status: Successful<br>
Date: ${new Date().toLocaleString()}<br><br>

Thank you for choosing <strong>Falah Bank</strong>.<br><br>

Best regards,<br>
<strong>Falah Bank Team</strong>
`;

  await sendEmail(userEmail, subject, text, html);
}

async function SendTransactionFailureMail(userEmail, name, amount, toAccount) {

  const subject = "Transaction Failed";
  const text = `Dear ${name},

  Your transaction could not be completed.

Amount: PKR ${amount}
Recipient: ${toAccount}
Status: Failed

No funds have been deducted from your account.

If you did not initiate this transaction or need assistance, please contact our support team.

Thank you,
Falah Bank Team`;
  const html = `
<p>Dear <strong>${name}</strong>,</p>

<p>Your transaction could not be completed.</p>

<ul>
    <li><strong>Amount:</strong> PKR ${amount}</li>
    <li><strong>Recipient:</strong> ${toAccount}</li>
    <li><strong>Status:</strong> Failed</li>
</ul>

<p>No funds have been deducted from your account.</p>

<p>If you need assistance, please contact our support team.</p>

<p>Thank you,<br><strong>Falah Bank Team</strong></p>
`;

  await sendEmail(userEmail, subject, text, html);
}

module.exports = {
  SendRegistrationMail,
  SendTransactionMail,
  SendTransactionFailureMail,
  ReceiverTransactionMail
};