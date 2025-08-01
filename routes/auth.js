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
  }),
  (req, res, next) => {
    if (req.user._isExisting) {
     
      req.flash("error", "User already exists. Please log in.");
      return res.redirect("/login");

    } else {
      // New user signup successful - user is already logged in by Passport,
      // so redirect to home or wherever you want.
      req.flash("success", "Signup successful! Please log in to continue.");
      return res.redirect("/home");
    }
  }
);


// Logout
router.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);

    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res.redirect("/");
      }

      res.clearCookie("connect.sid"); // Optional: clear session cookie
      res.redirect("/login");
    });
  });
});

module.exports = router;
