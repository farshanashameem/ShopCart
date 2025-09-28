const express = require("express");
const router = express.Router();
const signupController=require('../controllers/user/signupController');
const passwordController=require('../controllers/user/passwordController');
const productPageController=require('../controllers/user/productPageController');
const profileController=require('../controllers/user/profileController');
const addressController=require ('../controllers/user/addressController');
const cartController=require('../controllers/user/cartController');
const wishlistController=require('../controllers/user/wishlistController');
const orderController=require('../controllers/user/orderController');
const invoiceController = require('../controllers/user/invoiceController');
const returnController=require('../controllers/user/returnController');
const walletController=require('../controllers/user/walletController');
const reviewController=require('../controllers/user/reviewController');
const paymentController=require('../controllers/user/paymentController');
const referAndEarnController=require('../controllers/user/referAndEarn');
const failedcontroller=require('../controllers/user/failedController');
const deleteAccount=require('../controllers/user/deleteAccount');
const auth = require('../middlewares/auth');
const { validationResult } = require("express-validator");
const { signupValidationRules, changePasswordValidationRules,editProfileValidation,changePasswordRules,validateAddress } = require('../middlewares/validation');
const uploadProfile=require('../middlewares/profileUpload');


//=======public routes==========//

router.get('/', auth.isUserLoggedOut, productPageController.getHomePage);       //nologged home 
router.get("/login", auth.isUserLoggedOut, signupController.getLoginPage);      //login page(showing only if logged out)
router.get("/home", auth.isUserLoggedIn, productPageController.getHomePage);         //home page of user
router.get('/signup', auth.isUserLoggedOut, signupController.getSignUpPage);    //signup page for user
router.post("/login", auth.isUserLoggedOut, signupController.loginUser);       //login


//=======sign up actions======//

router.post('/signup', auth.isUserLoggedOut, signupValidationRules, signupController.signUpUser);     //sign up post request
router.get('/otpForSign-up', auth.isUserLoggedOut, signupController.getOtpForSignUpPage);             //OTP for sign up 
router.get("/signup/resend-otp", auth.isUserLoggedOut, signupController.resendOtp);                  //resend otp 
router.post("/verify-otp", auth.isUserLoggedOut, signupController.verifySignUpOtp);                  //verifying otp for signup

//======Password reset actions=====//

router.get('/resetPassword', auth.isUserLoggedOut, passwordController.getResetPasswordPage);        //reset password page
router.post('/getEmail', auth.isUserLoggedOut, passwordController.passwordForOTP);              // POST route from reset password form
router.get('/otpPassword', auth.isUserLoggedOut, passwordController.getOtpForPasswordPage);       //otp for password page
router.post('/verifyOtpForPassword', auth.isUserLoggedOut, passwordController.verifyOTPForPasswordReset); //POST request from OTP for password page      
router.get('/changePassword', auth.isUserLoggedOut, passwordController.getChangePasswordPage);      //change password page
router.get('/resend-otp', auth.isUserLoggedOut, passwordController.resendPasswordOtp);                //reseting password
router.post('/change-password', auth.isUserLoggedOut, changePasswordValidationRules, passwordController.updatePassword);          //post request to change password

//======Product pages=====//
router.get('/products', auth.isUserLoggedIn, productPageController.getProductPage); // All products
router.get('/products/:gender', auth.isUserLoggedIn, productPageController.getProductPage);
router.get('/details/:id', auth.isUserLoggedIn, productPageController.getProductDetails);
router.get('/search',auth.isUserLoggedIn,productPageController.searchProducts);
router.get('/api/products/:productId/variants',auth.isUserLoggedIn,productPageController.getFirstVariant);

//======Profile======//
router.get('/profile', auth.isUserLoggedIn, profileController.getProfilePage);
router.post('/profileUpdate',auth.isUserLoggedIn,uploadProfile.single("profileImage"),editProfileValidation,profileController.updateProfile);
router.get('/changeMail',auth.isUserLoggedIn,profileController.getChangeMailPage);        //page for typing the new mail
router.post('/confirmMail',auth.isUserLoggedIn,profileController.confirmMail);            //post request to send otp to new mail
router.get('/otpForMail',auth.isUserLoggedIn,profileController.getOtpForMail);            //page for typing the otp
router.post('/verifyOtpForMail',auth.isUserLoggedIn,profileController.verifyOTP);         //verify the entered otp
router.get('/resend-otpMail',auth.isUserLoggedIn,profileController.resendOtp);            //resending the otp again
router.get('/updatePassword',auth.isUserLoggedIn,profileController.getUpdatePasswordPage);     //getting password change page
router.post('/updatePassword',auth.isUserLoggedIn,changePasswordRules,profileController.updatePassword);           //Updating the password
router.get('/address',auth.isUserLoggedIn,addressController.getAddressPage);              //address list page
router.post('/addAddress',validateAddress,auth.isUserLoggedIn,addressController.addAddress);      //add address to the data base
router.post('/updateAddress/:id',validateAddress,auth.isUserLoggedIn,addressController.updateAddress);
router.delete('/deleteAddress/:id',auth.isUserLoggedIn,addressController.deleteAddress);

//====cart and wishlist management=====//

router.post('/addToWishlist',auth.isUserLoggedIn,wishlistController.addToWishlist);
router.get('/wishlist',auth.isUserLoggedIn,wishlistController.getWishlistPage);
router.get('/addToCart/:productId/:variantId',auth.isUserLoggedIn,wishlistController.addFromWishlist);
router.post('/wishlistItemDelete/:productId/:variantId',auth.isUserLoggedIn,wishlistController.deleteFromWishlist);

router.post('/addtoCart',auth.isUserLoggedIn,cartController.addToCart);
router.get('/cart',auth.isUserLoggedIn,cartController.getCartpage);
router.get('/cart/update/:variantId/:action',auth.isUserLoggedIn,cartController.updateCart);
router.get('/cart/remove/:variantId',auth.isUserLoggedIn,cartController.Remove);
router.get('/cart/validate',auth.isUserLoggedIn,cartController.validateCart);

//==== Payment management ====//

router.get('/select-address',auth.isUserLoggedIn,orderController.selectAddress);
router.post('/select-address/addAddress',auth.isUserLoggedIn,validateAddress,orderController.addAddress);
router.post('/select-address/updateAddress/:id',auth.isUserLoggedIn,validateAddress,orderController.updateAddress);
router.get('/payment',auth.isUserLoggedIn,orderController.selectPayment);
router.post('/payment',auth.isUserLoggedIn,paymentController.makePayment);
router.get('/success',auth.isUserLoggedIn,orderController.getSuccessPage);
router.post('/create-razorpay-order', paymentController.createRazorpayOrder);
router.get('/invoice/:orderId', invoiceController.getInvoicePage);
router.get('/failed',auth.isUserLoggedIn,orderController.getFailedPage);  
  
//=== return item ===//
router.post('/orders/return',auth.isUserLoggedIn,returnController.return);
//=== cancel order ===//  
router.post('/cancelOrder',auth.isUserLoggedIn,orderController.cancelOrder);

//=== order pages ===//
router.get('/orders',auth.isUserLoggedIn,orderController.getOrderPage);
router.get('/orderedItem/:Id',auth.isUserLoggedIn,orderController.OrderDetails);

//=== failed page ===//
router.get('/failedOrders',auth.isUserLoggedIn,failedcontroller.getFailedPage);
router.post('/save-failed-order',auth.isUserLoggedIn,failedcontroller.addToFailed);

//=== review ===//
router.post('/review/add',auth.isUserLoggedIn,reviewController.addOrEditReview);

//=== wallet ===//
router.get('/wallet',auth.isUserLoggedIn,walletController.getWalletPage);
router.get('/wallet/transactions',auth.isUserLoggedIn,walletController.getTransactions);

//=== refer and earn ===//
router.get('/referCode',auth.isUserLoggedIn,referAndEarnController.getReferCode);


//log out/
router.get('/logout', (req, res) => {

    delete req.session.user;
    res.redirect('/');

});  
router.get('/delete',auth.isUserLoggedIn,deleteAccount.delete);
router.delete('/delete-account',auth.isUserLoggedIn,deleteAccount.deleteAccount);



module.exports = router; 