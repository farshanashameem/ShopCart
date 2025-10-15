const transporter = require("../config/nodemailer");

module.exports = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "ShopCart OTP ",
    html: `<h3>Your new OTP is: <b>${otp}</b></h3><p>This OTP is valid for 60 seconds.</p>`,
  };

  await transporter.sendMail(mailOptions);
};
