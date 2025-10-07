const multer = require("multer");
const upload = require("../middlewares/multer"); // your cloudinary config
const ProductType = require("../models/ProductType");
const Fit = require("../models/Fit");
const Colour = require("../models/Colour");
const Product = require("../models/Products");
const ProductVariant = require("../models/productVariant");

const imageUpload = ({ type = "array", fieldName, maxCount, renderPage }) => {
  return async (req, res, next) => {
    let uploadHandler;

    if (type === "array") {
      uploadHandler = upload.array(fieldName, maxCount);
    } else if (type === "fields") {
      uploadHandler = upload.fields(fieldName);
    } else {
      return next(new Error("Invalid upload type"));
    }

    uploadHandler(req, res, async (err) => {
      if (!err) return next(); // ✅ No upload error, continue

      // 🔹 Prepare dropdown data (always needed)
      const [fits, colors, productTypes] = await Promise.all([
        Fit.find(),
        Colour.find(),
        ProductType.find(),
      ]);

      // 🔹 Detect edit mode
      const pID = req.params.id || req.body.productId || null;
      let product = null;
      let variants = [];

      if (pID) {
        product = await Product.findById(pID);
        variants = await ProductVariant.find({ productId: pID });
      }

      // 🔹 Handle multer errors
      let errors = {};
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          errors.images = "File size should not exceed 5MB";
        } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
          errors.images = "Only image files (jpg, jpeg, png, webp) are allowed";
        } else {
          errors.images = "File upload error";
        }
      } else {
        errors.images = "Only image files (jpg, jpeg, png, webp) are allowed";
      }

      // 🔹 Render the correct page safely
      return res.render(renderPage, {
        errors,
        oldInput: req.body,
        product: product || {}, // prevent EJS crash
        variants: variants || [],
        productTypes,
        fits,
        colors,
      });
    });
  };
};

module.exports = imageUpload;
