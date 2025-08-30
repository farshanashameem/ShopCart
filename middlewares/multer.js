const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary"); 

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "product_images", 
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
   transformation: [
      { width: 700, height: 700, crop: "fill", gravity: "auto" }
    ],

  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

module.exports = upload;
