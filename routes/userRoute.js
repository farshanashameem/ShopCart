const express = require("express");
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');
const homePage = require('../controllers/homePage');
const { validationResult } = require("express-validator");
const { signupValidationRules, changePasswordValidationRules,editProfileValidation,changePasswordRules,validateAddress } = require('../middlewares/validation');
const Profile = require('../controllers/profile');
const uploadProfile=require('../middlewares/profileUpload');


//=======public routes==========//

router.get('/', auth.isUserLoggedOut, homePage.getHomePage);       //nologged home 
router.get("/login", auth.isUserLoggedOut, userController.getLoginPage);      //login page(showing only if logged out)
router.get("/home", auth.isUserLoggedIn, homePage.getHomePage);         //home page of user
router.get('/signup', auth.isUserLoggedOut, userController.getSignUpPage);    //signup page for user
router.post("/login", auth.isUserLoggedOut, userController.loginUser);       //login


//=======sign up actions======//

router.post('/signup', auth.isUserLoggedOut, signupValidationRules, userController.signUpUser);     //sign up post request
router.get('/otpForSign-up', auth.isUserLoggedOut, userController.getOtpForSignUpPage);             //OTP for sign up 
router.get("/signup/resend-otp", auth.isUserLoggedOut, userController.resendOtp);                  //resend otp 
router.post("/verify-otp", auth.isUserLoggedOut, userController.verifySignUpOtp);                  //verifying otp for signup

//======Password reset actions=====//

router.get('/resetPassword', auth.isUserLoggedOut, userController.getResetPasswordPage);        //reset password page
router.post('/getEmail', auth.isUserLoggedOut, userController.passwordForOTP);              // POST route from reset password form
router.get('/otpPassword', auth.isUserLoggedOut, userController.getOtpForPasswordPage);       //otp for password page
router.post('/verifyOtpForPassword', auth.isUserLoggedOut, userController.verifyOTPForPasswordReset); //POST request from OTP for password page      
router.get('/changePassword', auth.isUserLoggedOut, userController.getCahngePasswordPage);      //change password page
router.get('/resend-otp', auth.isUserLoggedOut, userController.resendPasswordOtp);                //reseting password
router.post('/change-password', auth.isUserLoggedOut, changePasswordValidationRules, userController.updatePassword);          //post request to change password

//======Product pages=====//
router.get('/products', auth.isUserLoggedIn, homePage.getProductPage); // All products
router.get('/products/:gender', auth.isUserLoggedIn, homePage.getProductPage);
router.get('/details/:id', auth.isUserLoggedIn, homePage.getProductDetails);
router.get('/orders',auth.isUserLoggedIn,Profile.getOrderPage);

//======Profile======//
router.get('/profile', auth.isUserLoggedIn, Profile.getProfilePage);
router.post('/profileUpdate',auth.isUserLoggedIn,uploadProfile.single("profileImage"),editProfileValidation,Profile.updateProfile);
router.get('/changeMail',auth.isUserLoggedIn,Profile.getChangeMailPage);        //page for typing the new mail
router.post('/confirmMail',auth.isUserLoggedIn,Profile.confirmMail);            //post request to send otp to new mail
router.get('/otpForMail',auth.isUserLoggedIn,Profile.getOtpForMail);            //page for typing the otp
router.post('/verifyOtpForMail',auth.isUserLoggedIn,Profile.verifyOTP);         //verify the entered otp
router.get('/resend-otpMail',auth.isUserLoggedIn,Profile.resendOtp);            //resending the otp again
router.get('/updatePassword',auth.isUserLoggedIn,Profile.getUpdatePasswordPage);     //getting password change page
router.post('/updatePassword',auth.isUserLoggedIn,changePasswordRules,Profile.updatePassword);           //Updating the password
router.get('/address',auth.isUserLoggedIn,Profile.getAddressPage);              //address list page
router.post('/addAddress',validateAddress,auth.isUserLoggedIn,Profile.addAddress);      //add address to the data base
router.post('/updateAddress/:id',validateAddress,auth.isUserLoggedIn,Profile.updateAddress);
router.delete('/deleteAddress/:id',auth.isUserLoggedIn,Profile.deleteAddress);

//====cart and wishlist management=====//
router.post('/addtoCart',auth.isUserLoggedIn,Profile.addToCart);
router.post('/addToWishlist',auth.isUserLoggedIn,Profile.addToWishlist);
router.get('/wishlist',auth.isUserLoggedIn,Profile.getWishlistPage);
router.get('/addToCart/:productId/:variantId',auth.isUserLoggedIn,Profile.addFromWishlist);
router.post('/wishlistItemDelete/:productId/:variantId',auth.isUserLoggedIn,Profile.deleteFromWishlist);
router.get('/cart',auth.isUserLoggedIn,Profile.getCartpage);
router.get('/cart/update/:variantId/:action',auth.isUserLoggedIn,Profile.updateCart);
router.get('/cart/remove/:variantId',auth.isUserLoggedIn,Profile.Remove);
//router.post("/cart/apply-coupon",auth.isUserLoggedIn,Profile.ApplyCoupon);

router.get('/checkout1',auth.isUserLoggedIn,Profile.getCheckout1);
router.post('/checkout1/addAddress',auth.isUserLoggedIn,validateAddress,Profile.checkoutAdd);
router.post('/checkout1/updateAddress/:id',auth.isUserLoggedIn,validateAddress,Profile.checkoutUpdate);
router.get('/checkout2',auth.isUserLoggedIn,Profile.getCheckout2);
router.post('/checkout2',auth.isUserLoggedIn,Profile.makePayment);

//log out/
router.get('/logout', (req, res) => {

    delete req.session.user;
    res.redirect('/');

});



module.exports = router;