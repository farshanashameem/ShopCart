const bcrypt = require("bcrypt");
const validator = require("validator");
const { validationResult } = require("express-validator");
const User = require("../models/userModel");
const generateOTP= require('../utils/generateOTP');
const sendOTPMail = require('../utils/sendOTPMail');

//noLoggedHome
exports.getNoLoggedHome=(req,res)=>{
    res.render('user/noLoggedhome');
}

//Login page
exports.getLoginPage=(req,res)=>{
  const successMessage = req.session.successMessage;
  delete req.session.successMessage; // Clear it after showing once
  res.render("user/login", { successMessage });
}

//Home page of user
exports.getHomePage=(req,res)=>{
    res.render("user/home");
}

//Sign Up Page
exports.getSignUpPage=(req,res)=>{
    res.render('user/signup',{errors: {},old: {}} );
}

//OTP for signUp page
exports.getOtpForSignUpPage=(req,res)=>{
    res.render('user/otp-signup');
}

//get reset password page
exports.getResetPasswordPage=(req,res)=>{
    res.render('user/reset-password');
}

//get OTP for password page
exports.getOtpForPasswordPage=(req,res)=>{
    res.render('user/otp-password',{remainingTime: 60});
}

//get Change password page
exports.getCahngePasswordPage=(req,res)=>{
    res.render('user/change-password');
}

//signup validation
exports.signUpUser = async (req, res) => {
  try {
    
     const name = req.body.name?.trim();
    const email = req.body.email?.trim();
    const mobile = req.body.mobile?.trim();
    const password = req.body.password;
    const cpassword = req.body.cpassword;

    const errorsObj = {};
    const old = { name, email, mobile };

    // ✅ Get validation errors
    const result = validationResult(req);
    if (!result.isEmpty()) {
      result.array().forEach(error => {
        errorsObj[error.path] = error.msg;
      });
      return res.render("user/signup", { errors: errorsObj, old });
    }

    // Check for existing user
    const ExistUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { mobile }]
    });
    if (ExistUser) {
      return res.render("user/signup", {
        errors: { email: "User with this email or mobile already exists." },
        old
      });
    }

    // Generate OTP
    const OTP = generateOTP();
    await sendOTPMail(email,OTP);

    req.session.tempUser = {
      name,
      email: email.toLowerCase(),
      mobile,
      password, // hash later
      OTP,
      otpCreatedAt: Date.now()
    };

    return res.redirect("/otpForSign-up");

  } catch (err) {
    console.error("Signup error:", err);
    return res.render("user/signup", {
      error: { general: "Internal server error" },
      old: req.body
    });
  }
};

//resending the OTP for sign up
exports.resendOtp = async (req, res) => {
  try {
    const sessionUser = req.session.tempUser;

    if (!sessionUser) {
      return res.render("user/signup",{error:"error ,  Session expired. Please sign up again."});
    }

    const OTP = generateOTP();
    const email=sessionUser.email;
    await sendOTPMail(email,OTP);


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

//verifying signup otp
exports.verifySignUpOtp = async (req, res) => {
  try {
    const enteredOtp = req.body.otp?.join('');
    const sessionUser = req.session.tempUser;

    if (!sessionUser) {
      return res.render("user/signup", {
        error: "Session expired. Please sign up again."
      });
    }

    const otpAge = Date.now() - sessionUser.otpCreatedAt;
    if (otpAge > 60 * 1000) {
      req.session.tempUser = null;
      return res.render("user/signup", {
        error: "OTP expired. Please sign up again.",
         old: {},
         errors: {}
      });
    }

    if (enteredOtp !== sessionUser.OTP.toString()) {
      return res.render("user/otp-signup", {
        error: "Incorrect OTP. Please try again.",
         old: {},
         errors: {},
        remainingTime: 60 - Math.floor(otpAge / 1000)
      });
    }

    const hashedPassword = await bcrypt.hash(sessionUser.password, 12);

    const newUser = new User({
      name: sessionUser.name,
      email: sessionUser.email,
      mobile: sessionUser.mobile,
      password: hashedPassword,
      createdAt: new Date()
    });

    await newUser.save();

    req.session.tempUser = null;

    req.session.successMessage = "Signup successful! Please log in to continue.";
     return res.redirect("/login");
  } catch (err) {
    console.error("OTP verification error:", err);
    return res.render("user/signup", {
      error: "Internal server error.",
       old: {},
       errors: {}
    });
  }
};

//post login request
exports.loginUser = async (req, res) => {
  try {
    const email = req.body.email?.trim();
    const password=req.body.password?.trim();
    const old = { email, password };
    // Basic validation
    if (!email || !password) {
      req.flash("error", "All fields are required.");
      return res.render("user/login",{old});
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      req.flash("error", "Invalid email or password.");
      return res.redirect("/login");
    }

    // User exists, check if password matches (skip if googleId exists and no password)
    if (!user.password) {
      req.flash("Error", "Please login with Google.");
      return res.redirect("/login");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      
      return res.render("user/login",{old,error:"Invalid email or password."});
    }

    //check if user blocked or not
    if(user.isBlocked){
      return res.render("user/login", { old, error: "User Blocked" });
    }

    //  create session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      isBlocked:user.isBlocked
    };
    return res.redirect("/home");

  } catch (err) {
    console.error("Login error:", err);
    req.flash("error", "Internal server error.");
    return res.redirect("/login");
  }
};

//======OTP for reseting the password======//
exports.passwordForOTP = async (req, res) => {
   const email=req.body.email.trim().toLowerCase();
   if(!email){
    return res.render('user/reset-password',{error:"Feild should not be empty."})
   }
   
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.render('user/reset-password', { error: 'No user found with this email' });
    }

    // Generate 4-digit OTP
   const OTP =generateOTP();
   await sendOTPMail(email,OTP);

    req.session.tempUser = {
      email: email,
      OTP,
      otpCreatedAt: Date.now()
    };

   

    // Go to OTP entry page
    return res.render('user/otp-password',{email});
  } catch (err) {
    console.error(err);
    res.render('user/login',{error:"Internal server error."})
  }
};

exports.verifyOTPForPasswordReset = (req, res) => {
  try {
    const enteredOtp = req.body.otp?.join('');
    const sessionUser = req.session.tempUser;
    const email=sessionUser.email;
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
     req.flash('error',"Session expired . Please enter your email.")
    return res.redirect('/resetPassword'); // If session expired or email missing
  }

  try {
   const OTP =generateOTP();
   await sendOTPMail(email,OTP);


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


//====password updation=========//
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

