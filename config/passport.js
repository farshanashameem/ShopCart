const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/userModel");

//adding essential things for google based sign up
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const existingUser = await User.findOne({ googleId: profile.id });

    if (existingUser) {
       existingUser._isExisting = true;
      return done(null, existingUser);
    }

    const newUser = new User({
      name: profile.displayName,
      email: profile.emails[0].value,
      googleId: profile.id
    });

    await newUser.save();
    newUser._isExisting = false;
    done(null, newUser);
  } catch (err) {
    done(err, null);
  }
}));

