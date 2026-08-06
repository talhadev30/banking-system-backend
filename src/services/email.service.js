require("dotenv").config();
const axios = require("axios");


const sendEmail = async (to, subject, text, html) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: process.env.SENDER_NAME,
          email: process.env.SENDER_EMAIL,
        },
        to: [
          {
            email: to,
          },
        ],
        subject: subject,
        textContent: text,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    console.log("✅ Email Sent Successfully");
    console.log(response.data);
  } catch (error) {
    console.error("❌ Brevo Error:");
    console.error(error.response?.data || error.message);
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