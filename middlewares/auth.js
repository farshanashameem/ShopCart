
const User = require('../models/userModel'); 


// this middle ware is for protection. if there is a user or admin is logged in , only then the pages can see. Other wise always redirect to login page
//protecting routes using middleware
module.exports={
 isUserLoggedIn :async (req, res, next) => {
  const sessionUser = req.session.user;
  if (!sessionUser) {
    return res.redirect('/login');
  }

  try {
    
    const freshUser = await User.findById(sessionUser._id); // or sessionUser.id if stored as `.id`
    
    if (!freshUser) {
      req.flash('error', 'User not found');
      delete req.session.user;
      return res.redirect('/login');
    }

    if (freshUser.isBlocked) {
      req.flash('error', 'User Blocked');
      delete req.session.user;
      return res.redirect('/login');
    }

    // Optional: refresh session data
    req.session.user = freshUser;

    next();
  } catch (err) {
    console.error(err);
    req.flash('error', 'Something went wrong');
    res.redirect('/login');
  }
 },



 

  isUserLoggedOut: (req, res, next) => {
    if (req.session.user || (req.isAuthenticated && req.isAuthenticated())) {
      res.redirect("/home");
    } else {
      next();
    }
    },

    isAdminLoggedIn:(req,res,next)=>{
        if(req.session.admin){
            res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
            res.set('Pragma', 'no-cache');
            res.set('Expires', '0');
            next();
        }else{
            res.redirect("/admin/login");//login page of admin
        }
    },

    isAdminLoggedOut:(req,res,next)=>{
        if(req.session.admin){
            res.redirect("/admin/home");//home page of admin
        }else{
            next();
        }
    }
};