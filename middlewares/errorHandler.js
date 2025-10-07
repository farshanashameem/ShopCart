// middleware/errorHandler.js

module.exports = (err, req, res, next) => {
  console.error("❌ Error:", err.stack);

  const statusCode = err.status || 500;
  const message = err.message || "Internal Server Error";

  // If request expects JSON → send JSON
  if (req.xhr || req.headers.accept?.includes("json")) {
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }

  // Otherwise render error page
  res.status(statusCode).render("error/500", {
    title: "Server Error",
    message,
  });
};
