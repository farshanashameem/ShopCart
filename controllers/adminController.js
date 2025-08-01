const Admin = require('../models/adminModel'); // Assuming Admin model is here
const User = require('../models/userModel');//user Model
const ProductType = require('../models/productType');//product type model
const Fit=require('../models/Fit');
const Colour=require('../models/Colour');
const bcrypt = require('bcrypt');
const Product = require("../models/Products");
const ProductVariant = require("../models/productVariant");
const path = require("path");
const { validationResult } = require('express-validator');
const generateSKU=require('../utils/skuGenerator');


exports.loadLogin = (req, res) => {
  res.render('admin/login', { error: [], success: [] });
};

exports.loadHome = (req, res) => {
  const admin = req.session.admin;
  res.render('admin/home', { admin });
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

//=======USER MANAGEMENT======//

exports.getUsersPage = async (req, res) => {
  try {
    const search = req.query.search ? req.query.search.trim() : "";
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Substring name match using case-insensitive regex
    const query = {
      name: { $regex: search, $options: "i" }
    };

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query).skip(skip).limit(limit);

    const userData = users.map((user) => ({
      _id: user._id,
      email:user.email,
      name: user.name,
      mobile: user.mobile || "N/A",
      orders: 0,
      wallet: user.wallet || 0,
      status: user.isBlocked ? "Blocked" : "Active",
      isBlocked: user.isBlocked
    }));

    const totalPages = Math.max(Math.ceil(totalUsers / limit), 1);
    const successMessage = req.session.successMessage;
    req.session.successMessage = null;
    res.render("admin/users", {
      users: userData,
      search,
      currentPage: page,
      totalPages,
      successMessage
    });
  } catch (err) {
    console.error(err);
    res.render("admin/users", {
      users: [],
      search: "",
      currentPage: 1,
      totalPages: 1,
      error: ["Something went wrong."]
    });
  }
};

exports.toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.isBlocked = !user.isBlocked;
      await user.save();      
      req.session.successMessage = user.isBlocked ? "User Blocked." : "User Unblocked.";
    }
    res.redirect(`/admin/users?page=${req.query.page || 1}&search=${req.query.search || ""}`);
  } catch (err) {
    console.error(err);
    res.redirect("/admin/users");
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    req.session.successMessage = "User Deleted Successfully.";
    res.redirect(`/admin/users?page=${req.query.page || 1}&search=${req.query.search || ""}`);
  } catch (err) {
    console.error(err);
    res.redirect("/admin/users");
  }
};

//====Product management=====//
exports.getAddProductPage=async (req, res) => {
  try {
    const fits = await Fit.find();
    const colors = await Colour.find();
    const productTypes = await ProductType.find();
    res.render('admin/addProduct', {
      oldInput: {},     // send empty object so EJS doesn't break
      errors: {}, 
      fits,
      colors,
      productTypes,
    });
  } catch (err) {
    console.error("Error loading form data:", err);
   
  }
};

exports.getEditProductPage=(req,res)=>{
  res.render('admin/editProduct');
};

exports.getProductsPage=async (req,res)=>{

  try {
    const search = req.query.search ? req.query.search.trim() : "";
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Substring name match using case-insensitive regex
    const query = {
      name: { $regex: search, $options: "i" }
    };
    
    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query) .sort({ createdAt: -1 }).skip(skip).limit(limit);

    //getting the total stock for each product
      const variantData=await  ProductVariant.aggregate([
        {
          $group:{
            _id:"$productId",
            totalStock:{$sum:"$stock"},
            maxPrice: { $max: "$basePrice" },
            minPrice: { $min: "$discountPrice" }
          }
        }
      ]);  

      //conversion to map for better use
      const variantMap={};
      variantData.forEach(item=>{
        variantMap[item._id.toString()]=item;
      });

    const productData = products.map((product) => {
      const variant=variantMap[product._id.toString()] || {};
      return{
        _id: product._id,
        name: product.name,
        description:product.description,
        type:product.productTypeId,
        gender:product.genderId,
        basePrice: variant.maxPrice || 0,
        discountPrice: variant.minPrice || 0,
        totalStock:variant.totalStock||0,
        create:product.createdAt.toDateString(),
        status: product.isActive ? "Active" : "Blocked",
        isActive: product.isActive
      };
      
    });
      
    const totalPages = Math.max(Math.ceil(totalProducts / limit), 1);
    const successMessage = req.session.successMessage;
    req.session.successMessage = null;
    res.render("admin/products", {
      products: productData,
      search,
      currentPage: page,
      totalPages,
      successMessage
    });
  } catch (err) {
    console.error(err);
    res.render("admin/products", {
      products: [],
      search: "",
      currentPage: 1,
      totalPages: 1,
      error: ["Something went wrong."]
    });
  }
};

exports.addProduct = async (req, res) => {
  const fits = await Fit.find();
  const colors = await Colour.find();
  const productTypes = await ProductType.find();

  try {
    const errorsObj = {};
    const result = validationResult(req);
    const oldInput = req.body;

    if (!result.isEmpty()) {
      result.array().forEach(error => {
        errorsObj[error.path] = error.msg;
      });
      console.log(errorsObj);
      return res.render('admin/addProduct', {
        errors: errorsObj,
        oldInput,
        colors,
        fits,
        productTypes,
      });
    }

    const { name, description, genderId, productTypeId, basePrice, discountPrice } = req.body;

    const newProduct = new Product({
      name,
      description,
      genderId,
      productTypeId,
      
    });

    const savedProduct = await newProduct.save();
    
    // Prepare variant data from dynamic fields
    const variants = Array.isArray(req.body.variants)
      ? req.body.variants
      : Object.values(req.body.variants);

    const filesPerVariant = req.files || [];

    // Group files based on variant index if using multiple file inputs later
    const imagePaths = filesPerVariant.map(file => file.path);

    const variantDocs = variants.map((variant, index) => {
      const sku = generateSKU(name, variant.colorId, variant.size);
      return {
        productId: savedProduct._id,
        colorId: variant.colorId,
        fitId:variant.fitId,
        size: variant.size,
        sku,
        basePrice,
        discountPrice,
        stock: variant.stock,
        images: imagePaths, // apply full images for now
      };
    });
      
    await ProductVariant.insertMany(variantDocs);
    req.session.successMessage = "Product added Successfully.";
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Add product error:', error);
    res.render('admin/addProduct', {
      errors: { general: 'Server error. Please try again.' },
      oldInput: req.body,
      colors,
      fits,
      productTypes,
    });
  }
};

exports.toggleProductStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.flash('error', 'Product not found.');
      return res.redirect("/admin/products");
    }

    product.isActive = !product.isActive;
    await product.save();

    req.session.successMessage = product.isActive ? "Product restored." : "Product deleted.";
    res.redirect(`/admin/products?page=${req.body.page || 1}&search=${req.body.search || ""}`);
  } catch (err) {
    console.error("Toggle product status error:", err);
    req.session.errorMessage = "Something went wrong.";
    res.redirect("/admin/products");
  }
};

exports.getProductDetail = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findById(productId).lean();
    console.log(product);
    if (!product) {
      return res.redirect('/admin/products')
    }

    const variants = await ProductVariant.find({ productId })
      .populate('colorId')
      .populate('fitId')
      .lean();

    res.render("admin/productDetails", {
      product,
      variants
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};



//=======Category Management=====/
//Category page
exports.getCategoryManagement=async (req, res) => {
  try {
    const productTypes = await ProductType.find({});
    const fits = await Fit.find({});
    const colours = await Colour.find({});
    
    res.render('admin/category', {
      productTypes,
      fits,
      colours
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error/500');
  }
};

exports.getAddProductType=(req,res)=>{
  res.render('admin/addPType');
};

//adding new product type to collection
exports.addProductType = async (req, res) => {
  try {
    
    const pname=req.body.pname.trim();
    const description=req.body.description.trim();

    // Check for empty fields
    if (!pname || !description) {
      req.flash('error','All feilds are required');
      return res.redirect('/admin/addPType');
    }

    // Save new product type
    const newType = new ProductType({
      name: pname,
      description: description
    });
    console.log(newType);
    await newType.save();

    // Redirect or send success message
    res.redirect('/admin/category'); 
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate entry
     req.flash('error','Product type already exists.');
     return res.redirect('/admin/addPType');
    } else {
      console.error(err);
      req.flash('error','Internal server error.');
      return res.redirect('/admin/addPType');
    }
  }
};

//====add fit type====//
exports.getAddFitPage= async (req,res)=>{
  res.render('admin/addFit');
};

exports.addFit=async (req,res)=>{
       try {
    const fname =req.body.fitname.trim();
    const description  = req.body.description.trim();
    // Check for empty fields
    if (!fname || !description) {
      req.flash('error','all fields are required');
      return res.redirect('/admin/addFit');
    }

    // Save new product type
    const newType = new Fit({
      name: fname,
      description: description
    });

    await newType.save();

    // Redirect 
    res.redirect('/admin/category'); 
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate entry
      req.flash('error','This fit already exist.')
      return res.redirect('/admin/addFit');
    } else {
      console.error(err);
       req.flash('error','Internal server error.')
      return res.redirect('/admin/addFit');
    }
  }
};

//==Adding colour=====//
exports.getAddColourPage=(req,res)=>{
  res.render('admin/addColour');
};

exports.addColour=async(req,res)=>{
   try {
    const name =req.body.name.trim();
    const hexcode  = req.body.hexcode.trim();
    // Check for empty fields
    if (!name || !hexcode ) {
      req.flash('error','all fields are required');
      return res.redirect('/admin/addColour');
    }

    // Save new product type
    const newType = new Colour({
      name: name,
      hexCode: hexcode
    });

    await newType.save();

    // Redirect 
    res.redirect('/admin/category'); 
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate entry
      req.flash('error','This fit already exist.')
      return res.redirect('/admin/addColour');
    } else {
      console.error(err);
       req.flash('error','Internal server error.')
      return res.redirect('/admin/addColour');
    }
  }
}