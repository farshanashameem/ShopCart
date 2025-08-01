const express=require("express");
const router=express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');
const { validationResult } = require("express-validator");
const { signupValidationRules, changePasswordValidationRules } = require('../middlewares/validateSignUp');



//=======public routes==========//

router.get('/',auth.isUserLoggedOut,userController.getNoLoggedHome);       //nologged home 
router.get("/login",auth.isUserLoggedOut,userController.getLoginPage);      //login page(showing only if logged out)
router.get("/home",auth.isUserLoggedIn,userController.getHomePage);         //home page of user
router.get('/signup',auth.isUserLoggedOut,userController.getSignUpPage);    //signup page for user

router.post("/login",auth.isUserLoggedOut, userController.loginUser);       //login


//=======sign up actions======//

router.post('/signup',auth.isUserLoggedOut,signupValidationRules, userController.signUpUser);     //sign up post request
router.get('/otpForSign-up',auth.isUserLoggedOut,userController.getOtpForSignUpPage);             //OTP for sign up 
router.get("/signup/resend-otp",auth.isUserLoggedOut, userController.resendOtp);                  //resend otp 
router.post("/verify-otp",auth.isUserLoggedOut, userController.verifySignUpOtp);                  //verifying otp for signup

//======Password reset actions=====//

router.get('/resetPassword',auth.isUserLoggedOut,userController.getResetPasswordPage);        //reset password page
router.post('/getEmail',auth.isUserLoggedOut, userController.passwordForOTP);              // POST route from reset password form
router.get('/otpPassword',auth.isUserLoggedOut,userController.getOtpForPasswordPage);       //otp for password page
router.post('/verifyOtpForPassword',auth.isUserLoggedOut,userController.verifyOTPForPasswordReset); //POST request from OTP for password page      
router.get('/changePassword',auth.isUserLoggedOut,userController.getCahngePasswordPage);      //change password page
router.get('/resend-otp',auth.isUserLoggedOut, userController.resendPasswordOtp);                //reseting password
router.post('/change-password',auth.isUserLoggedOut,changePasswordValidationRules, userController.updatePassword);          //post request to change password




//logout
router.get('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.session.destroy(() => {
      res.redirect('/'); 
    });
  });
});


module.exports=router;