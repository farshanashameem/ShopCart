// testCloudinary.js
const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const filePath = path.join(__dirname, 'public', 'images', 'admin.png');

cloudinary.uploader.upload(filePath, { folder: 'test_folder' })
  .then(result => console.log('Uploaded:', result.secure_url))
  .catch(err => console.error(err));
