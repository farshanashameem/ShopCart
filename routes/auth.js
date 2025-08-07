const express = require("express");
const passport = require("passport");
const router = express.Router();

// Trigger Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Callback from Google
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    failureFlash: true,
    session:false
  }),
  (req, res, next) => {

     req.session.user = req.user;
      // New user signup successful - user is already logged in by Passport,  
      return res.redirect("/home");
    
  }
);




module.exports = router; 