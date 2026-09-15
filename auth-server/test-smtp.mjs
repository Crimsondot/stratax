import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "umangshukla78082@gmail.com",
    pass: "opfbqwmelfajpcpr",
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP Error:", error.message);
    console.error("Code:", error.code);
    console.error("Response:", error.response);
  } else {
    console.log("SMTP Connected:", success);
  }
});

transporter.sendMail({
  from: "umangshukla78082@gmail.com",
  to: "umangshukla78082@gmail.com",
  subject: "Test OTP",
  text: "Your verification code is: 123456",
}, (err, info) => {
  if (err) {
    console.error("Send Error:", err.message);
  } else {
    console.log("Email sent:", info.messageId);
  }
});
