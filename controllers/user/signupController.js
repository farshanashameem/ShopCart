const bcrypt = require("bcrypt");
const validator = require("validator");
const { validationResult } = require("express-validator");
const User = require("../../models/userModel");
const generateOTP = require("../../utils/generateOTP");
const sendOTPMail = require("../../utils/sendOTPMail");
const ReferAndEarn = require("../../models/ReferAndEarn");
const WalletTransaction = require("../../models/WalletTransactions");

//=== Sign Up Page ===//
exports.getSignUpPage = (req, res) => {
  res.render("user/signup", { errors: {}, old: {} });
};

//===post request from sign up page ===//
exports.signUpUser = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim();
    const mobile = req.body.mobile?.trim();
    const password = req.body.password;
    const cpassword = req.body.cpassword;
    const referCode = req.body.referCode?.trim();

    const errorsObj = {};
    const old = { name, email, mobile, referCode };

    // ✅ Get validation errors
    const result = validationResult(req);
    if (!result.isEmpty()) {
      result.array().forEach((error) => {
        errorsObj[error.path] = error.msg;
      });
      return res.render("user/signup", { errors: errorsObj, old });
    }

    // Check for existing user
    const ExistUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { mobile }],
    });
    if (ExistUser) {
      return res.render("user/signup", {
        errors: { email: "User with this email or mobile already exists." },
        old,
      });
    }

    if(referCode){
      const referrer = await User.findOne({ referCode: referCode });
    if (!referrer) {
      return res.render("user/signup", {
        errors: { referCode: "User with this code not exist." },
        old,
      });
    }
    }
    // Generate OTP
    const OTP = generateOTP();
    await sendOTPMail(email, OTP);

    req.session.tempUser = {
      name,
      email: email.toLowerCase(),
      mobile,
      password,
      referCode,
      OTP,
      otpCreatedAt: Date.now(),
    };

    return res.redirect("/otpForSign-up");
  } catch (err) {
    console.error("Signup error:", err);
    return res.render("user/signup", {
      error: { general: "Internal server error" },
      old: req.body,
      errors: {},
    });
  }
};

//=== OTP for signup page ===//
exports.getOtpForSignUpPage = (req, res) => {
  res.render("user/otp-signup");
};

//=== resending the OTP for sign up ===//
exports.resendOtp = async (req, res) => {
  try {
    const sessionUser = req.session.tempUser;

    if (!sessionUser) {
      return res.render("user/signup", {
        error: "error ,  Session expired. Please sign up again.",
      });
    }

    const OTP = generateOTP();
    const email = sessionUser.email;
    await sendOTPMail(email, OTP);

    req.session.tempUser.OTP = OTP;
    req.session.tempUser.otpCreatedAt = Date.now();

    req.flash("success", "A new OTP has been sent to your email.");
    return res.redirect("/otpForSign-up");
  } catch (err) {
    console.error("Resend OTP error:", err);
    req.flash("error", "Failed to resend OTP. Try again.");
    return res.redirect("/signup");
  }
};

//=== verifying signup otp ===//
exports.verifySignUpOtp = async (req, res) => {
  try {
    const enteredOtp = req.body.otp?.join("");
    const sessionUser = req.session.tempUser;

    if (!sessionUser) {
      return res.render("user/changeMail", {
        error: "Session expired. Please try again.",
      });
    }

    const otpAge = Date.now() - sessionUser.otpCreatedAt;
    if (otpAge > 60 * 1000) {
      req.session.tempUser = null;
      return res.render("user/changeMail", {
        error: "OTP expired. Please try again.",
        old: {},
        errors: {},
      });
    }

    if (enteredOtp !== sessionUser.OTP.toString()) {
      return res.render("user/otp-signup", {
        error: "Incorrect OTP. Please try again.",
        old: {},
        errors: {},
        remainingTime: 60 - Math.floor(otpAge / 1000),
      });
    }

    const hashedPassword = await bcrypt.hash(sessionUser.password, 12);

    let referrer = null;
    referrer = await User.findOne({ referCode: sessionUser.referCode });

    const newUser = new User({
      name: sessionUser.name,
      email: sessionUser.email,
      mobile: sessionUser.mobile,
      password: hashedPassword,
      referredBy: referrer ? referrer.referCode : null,
      wallet: referrer ?50: 0,
      createdAt: new Date(),
    });

    await newUser.save();

    

    // If referrer exists → reward them
    if (referrer) {

      // Signup bonus transaction
      await new WalletTransaction({
        userId: newUser._id,
        type: "credit",
        amount: 50,
        reason: "Signup Bonus",
      }).save();
      
      // Increase referrer’s wallet
      referrer.wallet += 100;
      await referrer.save();

      // Update or create ReferAndEarn entry for referrer
      let ref = await ReferAndEarn.findOne({ userId: referrer._id });
      if (ref) {
        ref.rewardAmount += 100;
        ref.referredCount += 1;
        await ref.save();
      } else {
        ref = new ReferAndEarn({
          userId: referrer._id,
          referredCount: 1,
          rewardAmount: 100,
        });
        await ref.save();
      }

      // Add wallet transaction for referrer
      await new WalletTransaction({
        userId: referrer._id,
        type: "credit",
        amount: 100,
        reason: "Referral reward",
      }).save();
    }

    

    req.session.tempUser = null;

    req.session.successMessage =
      "Signup successful! Please log in to continue.";
    return res.redirect("/login");
  } catch (err) {
    console.error("OTP verification error:", err);
    return res.render("user/signup", {
      error: "Internal server error.",
      old: {},
      errors: {},
    });
  }
};

//=== Login page ===//
exports.getLoginPage = (req, res) => {
  const successMessage = req.session.successMessage;
  delete req.session.successMessage;
  res.render("user/login", { successMessage });
};

//=== post login request ===//
exports.loginUser = async (req, res) => {
  try {
    const email = req.body.email?.trim();
    const password = req.body.password?.trim();
    const old = { email, password };

    if (!email || !password) {
      req.flash("error", "All fields are required.");
      return res.render("user/login", { old });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      req.flash("error", "Invalid email or password.");
      return res.redirect("/login");
    }

    if (user.googleId && user.email === email) {
      req.flash("error", "Please login with GoogleId.");
      return res.redirect("/login");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("user/login", {
        old,
        error: "Invalid email or password.",
      });
    }

    if (user.isBlocked) {
      return res.render("user/login", { old, error: "User Blocked" });
    }

    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      isBlocked: user.isBlocked,
    };
    return res.redirect("/home");
  } catch (err) {
    console.error("Login error:", err);
    req.flash("error", "Internal server error.");
    return res.redirect("/login");
  }
};
