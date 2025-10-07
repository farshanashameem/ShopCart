const uploadProfile = require('../middlewares/profileUpload');

const uploadProfileMiddleware = (req, res, next) => {
  uploadProfile.single("profileImage")(req, res, (err) => {
    if (err) {
      // Log the error for debugging
      console.log("Multer error:", err.message);
      return res.render('user/profile', { 
        errors: { profileImage: err.message }, 
        old: { name: req.body.name, email: req.body.email, phone: req.body.phone }, 
        user: req.session.user 
      });
    }
    next();
  });
};

module.exports = uploadProfileMiddleware;