require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/adminModel'); // adjust path if needed

const run = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash('Admin@123', 12);

    const admin = new Admin({
      name: 'Farshana K',
      email: 'admin123@gmail.com',
      password: hashedPassword,
      phoneNumber: '9605934731'
    });

    await admin.save();
    console.log('Admin created successfully!');

    mongoose.disconnect();
  } catch (err) {
    console.error('Error creating admin:', err);
    mongoose.disconnect();
  }
};

run();
