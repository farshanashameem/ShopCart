const bcrypt = require("bcrypt");
const User = require("../../models/userModel");
const generateOTP = require('../../utils/generateOTP');
const sendOTPMail = require('../../utils/sendOTPMail');
const validator = require("validator");
const { validationResult } = require("express-validator");

//=== reset password page ===//
exports.getResetPasswordPage = (req, res) => {
  res.render('user/reset-password');
};

//=== OTP for password page ===//
exports.getOtpForPasswordPage = (req, res) => {
  res.render('user/otp-password', { remainingTime: 60 });
};

//=== Change password page ===//
exports.getChangePasswordPage = (req, res) => {
  res.render('user/change-password');
}

//=== OTP for reseting the password ===//
exports.passwordForOTP = async (req, res) => {
  const email = req.body.email.trim().toLowerCase();
  if (!email) {
    return res.render('user/reset-password', { error: "Field should not be empty." })
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.render('user/reset-password', { error: 'No user found with this email' });
    }

    // Generate 4-digit OTP
    const OTP = generateOTP();
    await sendOTPMail(email, OTP);

    req.session.tempUser = {
      email: email,
      OTP,
      otpCreatedAt: Date.now()
    };



    // Go to OTP entry page
    return res.render('user/otp-password', { email });
  } catch (err) {
    console.error(err);
    res.render('user/login', { error: "Internal server error." })
  }
};

exports.verifyOTPForPasswordReset = (req, res) => {
  try {
    const enteredOtp = req.body.otp?.join('');
    const sessionUser = req.session.tempUser;
    const email = sessionUser.email;
    if (!sessionUser) {
      return res.render("user/reset-password", {
        error: "Session expired."
      });
    }

    const otpAge = Date.now() - sessionUser.otpCreatedAt;
    if (otpAge > 60 * 1000) {
      req.session.tempUser = null;
      return res.render("user/reset-password", {
        error: "OTP expired. Please sign up again."
      });
    }

    if (enteredOtp !== sessionUser.OTP.toString()) {
      return res.render("user/otp-password", {
        email,
        error: "Incorrect OTP. Please try again.",
        remainingTime: 60 - Math.floor(otpAge / 1000)
      });
    }




    return res.redirect("/changePassword");
  } catch (err) {
    console.error("OTP verification error:", err);
    return res.render("user/reset-password", {
      error: "Internal server error.",

    });
  }

};

exports.resendPasswordOtp = async (req, res) => {

  const sessionUser = req.session.tempUser;
  const email = sessionUser.email;

  if (!sessionUser) {
    req.flash('error', "Session expired . Please enter your email.")
    return res.redirect('/resetPassword'); // If session expired or email missing
  }

  try {
    const OTP = generateOTP();
    await sendOTPMail(email, OTP);


    // Save new OTP 
    req.session.tempUser.OTP = OTP;
    req.session.tempUser.otpCreatedAt = Date.now();

    // Re-render OTP page and restart timer
    res.render('user/otp-password', { email });

  } catch (err) {
    console.error("Resend OTP error:", err);
    req.flash("error", "Failed to resend OTP. Try again.");
    return res.redirect("/resetPassword");
  }
};


//=== password updation ===//
exports.updatePassword = async (req, res) => {
  const { password, cpassword } = req.body;
  const sessionUser = req.session.tempUser;
  const email = sessionUser.email;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('user/change-password', { errors: errors.mapped() });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    await User.findOneAndUpdate({ email }, { password: hashedPassword });

    // Clear session info
    req.session.tempUser = null;

    req.session.successMessage = "Password changed. Please log in to continue.";
    return res.redirect("/login");

  } catch (err) {
    console.error("Error updating password:", err);
    req.flash("error", "Something went wrong. Try again.");
    return res.redirect("/changePassword");
  }
};


