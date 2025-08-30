const Admin = require('../../models/adminModel'); 
const bcrypt = require('bcrypt');

exports.loadLogin = (req, res) => {
  res.render('admin/login', { error: [], success: [] });
};

exports.verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.render('admin/login', { error: ['Invalid email'], success: [] });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      return res.render('admin/login', { error: ['Incorrect password'], success: [] });
    }

    // Store admin session
    req.session.admin = {
      name: admin.name,
      email: admin.email,
      phoneNumber: admin.phoneNumber
    };

    // Redirect to admin dashboard or home
    res.redirect('/admin/home');
  } catch (error) {
    console.error(error);
    res.render('admin/login', { error: ['Server error'], success: [] });
  }
};

exports.loadHome = (req, res) => {
  const admin = req.session.admin;
  res.render('admin/home', { admin });
};