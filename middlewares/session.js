const session=require("express-session");
const MongoStore = require("connect-mongo");

const userSession = session({
  name: "user_sid",
  secret: process.env.SESSION_SECRET || "usersecret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.DB_URL, collectionName: "userSessions" }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    sameSite: "lax"
  }
});

const adminSession = session({
  name: "admin_sid",
  secret: process.env.SESSION_SECRET || "adminsecret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.DB_URL, collectionName: "adminSessions" }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    sameSite: "lax"
  }
});

module.exports = {
  userSession,
  adminSession
};