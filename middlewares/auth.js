
const User = require('../models/userModel'); 

//protecting routes using middleware
module.exports={
  isUserLoggedIn: async (req, res, next) => {
  const sessionUser = req.session.user;
  const passportUser = req.user;
  const isPassportAuth = req.isAuthenticated && req.isAuthenticated();

  // ✅ SESSION USER CASE
  if (sessionUser) {
    try {
      console.log("sessionUser.id:", sessionUser.id);
      const freshUser = await User.findById(sessionUser.id);
      if (!freshUser) {
        req.flash('error', 'User Blocked');
        return req.session.destroy(() => {
          console.log("no user");
          
          return res.redirect('/login');
        });
      } 
      else if (freshUser.isBlocked) {
        req.flash('error', 'User Blocked');
        return req.session.destroy(() => {
          console.log("user blocked.going back to login page");
          
          return res.redirect('/login');
        });
      }else {
        // Optionally update session data to keep fresh info
        req.session.user = freshUser;
        console.log(req.session.user);
        return next();
      }
    } catch (err) {
      console.error(err);
      return res.redirect('/login');
    }
  }

  // ✅ PASSPORT USER CASE
  if (isPassportAuth) {
    if (!passportUser) {
      req.logout(() => res.redirect("/login"));
    } else if (passportUser.isBlocked) {
      req.flash('error', 'User Blocked');
      req.logout(() => {
        
        return res.redirect('/login');
      });
    } else {
      return next();
    }
  }
return res.redirect('/login');
 
}
,


 

  isUserLoggedOut: (req, res, next) => {
    if (req.session.user || (req.isAuthenticated && req.isAuthenticated())) {
      res.redirect("/home");
    } else {
      next();
    }
    },

    isAdminLoggedIn:(req,res,next)=>{
        if(req.session.admin){
            next();
        }else{
            res.redirect("/admin");//login page of admin
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