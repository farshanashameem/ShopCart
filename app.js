require("dotenv").config();
require("./config/passport");
require("./utils/orderstatusCrone");

const express = require("express");
const path = require("path");
const passport = require("passport");
const nocache = require("nocache");
const morgan = require("morgan");
const flash = require("connect-flash");

// Config files
const connectDB = require("./config/db");
const setupSession = require("./config/session");

// Routes
const authRoutes = require("./routes/auth");
const userRouter = require("./routes/userRoute");
const adminRouter = require("./routes/adminRoute");

const app = express();

// ----------------------------
// Database Connection
// ----------------------------
connectDB();

// ----------------------------
// Middlewares
// ----------------------------
app.use(morgan("dev"));
app.use(nocache());

// Prevent caching globally
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, "public")));

// ----------------------------
// Session & Auth
// ----------------------------
setupSession(app);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// ----------------------------
// View Engine
// ----------------------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ----------------------------
// Global Template Variables
// ----------------------------
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.user = req.session.user || req.user || null; // user login
  res.locals.admin = req.session.admin || null; // admin login
  next();
});

// ----------------------------
// Routes
// ----------------------------
app.use("/auth", authRoutes);
app.use("/", userRouter);
app.use("/admin", adminRouter);

// 404 Page
app.use((req, res) => {
  res.status(404).render("error/404", { title: "Page Not Found" });
});

// ----------------------------
// Start Server
// ----------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
