const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../utils/cloudinary"); 

const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "profile_images", 
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 100, height: 100, crop: "fill" }],
  },
});

const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

module.exports = uploadProfile;
