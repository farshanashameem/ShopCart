const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary"); 

//inorder to store the product images in to cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "product_images",         //folder name
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
   transformation: [
      { width: 700, height: 700, crop: "fill", gravity: "auto" }    //size of the image saved
    ],

  },
});

// File type check
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true); // Accept file
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "images")); // Trigger error
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
   fileFilter: fileFilter,
});

module.exports = upload;
