const express = require('express');
const router = express.Router();
const loginController = require('../controllers/admin/loginController');
const userController = require('../controllers/admin/userController');
const productController=require('../controllers/admin/productController');
const categoryController=require('../controllers/admin/categoryController');
const fitController=require('../controllers/admin/fitController');
const colorController=require('../controllers/admin/colorController');
const orderController=require('../controllers/admin/orderController');
const returnController=require('../controllers/admin/returnController');
const couponController=require('../controllers/admin/couponController');
const referralController=require('../controllers/admin/refferalController');
const offerController=require('../controllers/admin/offerController');
const salesReport=require('../controllers/admin/salesReport');
const auth = require('../middlewares/auth');
const imageUpload=require('../middlewares/imageUpload');
const { validationResult } = require('express-validator');
const { productValidationRules }= require('../middlewares/productValidator');  
const { couponValidationRules }=require('../middlewares/couponValidator');
const { offerValidationRules }=require('../middlewares/offerValidation');


//======login management======//
router.get('/login', auth.isAdminLoggedOut, loginController.loadLogin);   // Admin Login Page
router.post('/login', auth.isAdminLoggedOut, loginController.verifyLogin);    // Verify Admin Login
router.get('/home', auth.isAdminLoggedIn, loginController.loadHome);      // Admin Home/Profile Page

//=======user management page========//
router.get('/users',auth.isAdminLoggedIn,userController.getUsersPage);
router.post("/users/block/:id",auth.isAdminLoggedIn, userController.toggleBlockUser);  
router.post("/users/delete/:id",auth.isAdminLoggedIn, userController.deleteUser);


//=====Product Management ========//
router.get('/products',auth.isAdminLoggedIn,productController.getProductsPage);       //products page
router.get('/addProducts',auth.isAdminLoggedIn,productController.getAddProductPage);   //addproduct page
router.post(
  "/addProduct",
  auth.isAdminLoggedIn, 
  imageUpload({
    type: "array",
    fieldName: "images",
    maxCount: 3,
    renderPage: "admin/addProduct",
  }),
 productValidationRules,
  productController.addProduct
);
         //Adding product to Database
router.post('/products/:id/toggle',auth.isAdminLoggedIn, productController.toggleProductStatus);    //soft delete and restore the product
router.get('/product/:id', auth.isAdminLoggedIn,productController.getProductDetail);   //Full details about the product
router.get('/editProducts/:id',auth.isAdminLoggedIn,productController.getEditProductPage);    //edit product page
router.post(
  "/editProduct",
  auth.isAdminLoggedIn, 
  imageUpload({
    type: "fields",
    fieldName: [
      { name: "images0", maxCount: 1 },
      { name: "images1", maxCount: 1 },
      { name: "images2", maxCount: 1 },
    ],
    renderPage: "admin/editProduct",
  }),
 productValidationRules,
  productController.editProduct
);




//=====caregory management page======//
router.get('/category',auth.isAdminLoggedIn,categoryController.getCategoryManagement);

//====== product type======//
router.get('/addPType',auth.isAdminLoggedIn,categoryController.getAddProductType);       //add Product type
router.post('/addProductType',categoryController.addProductType);                        //post request from add product type
router.get('/editPType/:id',auth.isAdminLoggedIn,categoryController.getEditProductTypePage);   //edit product page
router.post('/editPType',auth.isAdminLoggedIn,categoryController.editPType);
router.post('/deletePType/:id',auth.isAdminLoggedIn,categoryController.togglePType);

//======Adding fit type=======//
router.get('/addFit',auth.isAdminLoggedIn,fitController.getAddFitPage);           //Add fit page
router.post('/addFit',auth.isAdminLoggedIn,fitController.addFit);           //Add fit to db
router.get('/editFit/:id',auth.isAdminLoggedIn,fitController.getEditFitPage);   //edit Fit page
router.post('/editFit',auth.isAdminLoggedIn,fitController.editFit);
router.post('/deleteFit/:id',auth.isAdminLoggedIn,fitController.toggleFit);
 
//======Adding Colour=====//
router.get('/addColour',auth.isAdminLoggedIn,colorController.getAddColourPage);       //add colour page
router.post('/addColour',auth.isAdminLoggedIn,colorController.addColour);         //adding colour to db
router.get('/editColour/:id',auth.isAdminLoggedIn,colorController.getEditColourPage);   //edit Colour page
router.post('/editColour',auth.isAdminLoggedIn,colorController.editColour);
router.post('/deleteColour/:id',auth.isAdminLoggedIn,colorController.toggleColour);

//=== Order management ===//
router.get('/orders',auth.isAdminLoggedIn,orderController.getOrderPage);
router.get('/orders/:id',auth.isAdminLoggedIn,orderController.getOrderDetails);
router.get('/changeStatus/:orderId/:status',auth.isAdminLoggedIn,orderController.changeStatus);

//=== return Management ===//
router.post('/returns',auth.isUserLoggedIn,returnController.updateReturnStatus);
router.get('/returns',auth.isAdminLoggedIn,returnController.getReturnPage);


//===  coupon management ===//
router.get('/coupons',auth.isAdminLoggedIn,couponController.getCouponPage);
router.post('/addCoupon',couponValidationRules,auth.isAdminLoggedIn,couponController.addCoupon);
router.put('/editCoupon/:id',auth.isAdminLoggedIn,couponValidationRules,couponController.editCoupon);
router.patch('/coupons/toggle/:id',auth.isAdminLoggedIn,couponController.toggleCoupon);

//=== Offer maangement ===//  
  
router.get('/offers',auth.isAdminLoggedIn,offerController.getOfferPage);
router.post('/addOffer',offerValidationRules,auth.isAdminLoggedIn,offerController.addOffer);
router.put('/editOffer/:id',auth.isAdminLoggedIn,offerValidationRules,offerController.editOffer);
router.patch('/offers/toggle/:id',auth.isAdminLoggedIn,offerController.toggleOffer);


//=== Referral page ===//
router.get('/referals',auth.isAdminLoggedIn,referralController.getRefferalPage);

//=== Sales Report ===//
router.get('/salesReport',auth.isAdminLoggedIn,salesReport.getSalesReport);
router.post('/salesReport', auth.isAdminLoggedIn, salesReport.postSalesReport);

//=== dashboard ===//
router.get('/Dashboard', auth.isAdminLoggedIn,salesReport.getPage);
router.post('/Dashboard',auth.isAdminLoggedIn,salesReport.getDashboard);

// Admin Logout
router.get('/logout', (req, res) => {
  delete req.session.admin;
  res.redirect('/admin/login');
});
  
module.exports=router;  
