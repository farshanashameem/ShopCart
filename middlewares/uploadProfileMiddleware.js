const uploadProfile = require('../middlewares/profileUpload');
const User = require("../models/userModel");

const uploadProfileMiddleware = (req, res, next) => {
  uploadProfile.single("profileImage")(req, res, (err) => {
    if (err) {
      // Log the error for debugging
      console.log("Multer error:", err.message);
       const user = req.session.user;
       const cartCount = user?.cart?.length || 0;
      const wishlistCount = user?.wishlist?.length || 0;
      return res.render('user/profile', { 
        errors: { profileImage: err.message }, 
        old: { name: req.body.name, email: req.body.email, phone: req.body.phone }, 
        user: req.session.user ,cartCount,wishlistCount
      });
    }
    next();
  });
};  

module.exports = uploadProfileMiddleware;