const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middlewares/auth');
const upload=require('../middlewares/multer');
const { validationResult } = require('express-validator');
const { productValidationRules }= require('../middlewares/productValidator');


// Admin Login Page
router.get('/login', auth.isAdminLoggedOut, adminController.loadLogin);

// Verify Admin Login
router.post('/login', auth.isAdminLoggedOut, adminController.verifyLogin);

// Admin Home/Profile Page
router.get('/home', auth.isAdminLoggedIn, adminController.loadHome);

//=======user management page========//
router.get('/users',auth.isAdminLoggedIn,adminController.getUsersPage);
router.post("/users/block/:id",auth.isAdminLoggedIn, adminController.toggleBlockUser);
router.post("/users/delete/:id",auth.isAdminLoggedIn, adminController.deleteUser);


//=====Product MAnagement ========//
router.get('/products',auth.isAdminLoggedIn,adminController.getProductsPage);       //products page
router.get('/addProducts',auth.isAdminLoggedIn,adminController.getAddProductPage);   //addproduct page
router.post('/addProduct', auth.isAdminLoggedIn,upload.array("images", 3),productValidationRules, adminController.addProduct);          //Adding product to Database
router.post('/products/:id/toggle',auth.isAdminLoggedIn, adminController.toggleProductStatus);    //soft delete and restore the product
router.get('/product/:id', auth.isAdminLoggedIn,adminController.getProductDetail);   //Full details about the product
router.get('/editProducts/:id',auth.isAdminLoggedIn,adminController.getEditProductPage);    //edit product page
router.post('/editProduct',auth.isAdminLoggedIn,upload.array("images", 3),productValidationRules,adminController.editProduct);



//caregory management page
router.get('/category',auth.isAdminLoggedIn,adminController.getCategoryManagement);

//======Adding product type======//
router.get('/addPType',auth.isAdminLoggedIn,adminController.getAddProductType);       //add Product type
router.post('/addProductType',adminController.addProductType);                        //post request from add product type

//======Adding fit type=======//
router.get('/addFit',auth.isAdminLoggedIn,adminController.getAddFitPage);           //Add fit page
router.post('/addFit',auth.isAdminLoggedIn,adminController.addFit);           //Add fit to db

//======Adding Colour=====//
router.get('/addColour',auth.isAdminLoggedIn,adminController.getAddColourPage);       //add colour page
router.post('/addColour',auth.isAdminLoggedIn,adminController.addColour);         //adding colour to db

//======Editing product type======//
router.get('/editPType/:id',auth.isAdminLoggedIn,adminController.getEditProductTypePage);   //edit product page
router.post('/editPType',auth.isAdminLoggedIn,adminController.editPType);
router.post('/deletePType/:id',auth.isAdminLoggedIn,adminController.togglePType);

//======editing fit======//
router.get('/editFit/:id',auth.isAdminLoggedIn,adminController.getEditFitPage);   //edit Fit page
router.post('/editFit',auth.isAdminLoggedIn,adminController.editFit);
router.post('/deleteFit/:id',auth.isAdminLoggedIn,adminController.toggleFit);

//======edit colour ========//
router.get('/editColour/:id',auth.isAdminLoggedIn,adminController.getEditColourPage);   //edit Colour page
router.post('/editColour',auth.isAdminLoggedIn,adminController.editColour);
router.post('/deleteColour/:id',auth.isAdminLoggedIn,adminController.toggleColour);

// Admin Logout
router.get('/logout', (req, res) => {
  delete req.session.admin;
  res.redirect('/admin/login');
});

module.exports=router;
