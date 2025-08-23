const Admin = require('../models/adminModel'); // Assuming Admin model is here
const User = require('../models/userModel');//user Model
const ProductType = require('../models/productType');//product type model
const Fit = require('../models/Fit');
const Colour = require('../models/Colour');
const bcrypt = require('bcrypt');
const Product = require("../models/Products");
const ProductVariant = require("../models/productVariant");
const path = require("path");
const { validationResult } = require('express-validator');
const generateSKU = require('../utils/skuGenerator');


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
    const users = await User.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });

    const userData = users.map((user) => ({
      _id: user._id,
      email: user.email,
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
exports.getAddProductPage = async (req, res) => {
  try {
    const fits = await Fit.find();
    const colors = await Colour.find();
    const productTypes = await ProductType.find();
    res.render('admin/addProduct', {
      oldInput: {},     
      errors: {},
      fits,
      colors,
      productTypes
    });
  } catch (err) {
    console.error("Error loading form data:", err);

  }
};

exports.getEditProductPage = async (req, res) => {
  const pID = req.params.id;

  try {
    const product = await Product.findById(pID);
    const variants = await ProductVariant.find({ productId: pID });

    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/admin/products');
    }

    // Pass variants and productTypes, fits, colors too
    const productTypes = await ProductType.find();
    const fits = await Fit.find();
    const colors = await Colour.find();

    res.render('admin/editProduct', {
      product,
      variants,
      productTypes,
      fits,
      colors,
      oldInput: null,
      errors: null
    });
  } catch (err) {
    console.log(err);
    req.flash('error', 'Error loading product edit page');
    res.redirect('/admin/products');
  }
};

exports.editProduct = async (req, res) => {
  const fits = await Fit.find();
  const colors = await Colour.find();
  const productTypes = await ProductType.find();
  const product = await Product.findById(req.body.productId);
  try {
    const errorsObj = {};
    const result = validationResult(req);
    const oldInput = req.body;

    if (!result.isEmpty()) {
      result.array().forEach(error => {
        errorsObj[error.path] = error.msg;
      });
      console.log(errorsObj);
      return res.render('admin/editProduct', {
        errors: errorsObj,
        product,
        oldInput,
        colors,
        fits,
        productTypes,
      });
    }

    const { name, description, genderId } = req.body;
    

    product.name = name;
    product.description = description;
    product.genderId = genderId;
    product.updatedAt = new Date();


    await product.save();
    // 🟡 Normalize variant input (array of objects)
    const variants = Array.isArray(req.body.variants)
      ? req.body.variants
      : Object.values(req.body.variants);

    const filesPerVariant = req.files || [];
    const imagePaths = filesPerVariant.map(file => file.path);

    const submittedVariantIds = [];

    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      

      const sku = generateSKU(name, variant.colorId, variant.size);

      if (variant._id) {
        // 🔵 Update existing variant
        await ProductVariant.findByIdAndUpdate(variant._id, {
          colorId: variant.colorId,
          fitId: variant.fitId,
          size: variant.size,
          sku,
          basePrice: variant.basePrice,
          discountPrice: variant.discountPrice,
          stock: variant.stock,
          images: imagePaths,
          updatedAt: new Date(),
        });
        submittedVariantIds.push(variant._id);
      } else {
        // 🟢 Create new variant
        const newVariant = new ProductVariant({
          productId: req.body.productId,
          colorId: variant.colorId,
          fitId: variant.fitId,
          size: variant.size,
          sku,
          basePrice: variant.basePrice,
          discountPrice: variant.discountPrice,
          stock: variant.stock,
          images: imagePaths,
          updatedAt: new Date(),
        });
        await newVariant.save();
        submittedVariantIds.push(newVariant._id);
      }
    }


    req.session.successMessage = "Product updated Successfully.";
    res.redirect('/admin/products');


  } catch (error) {
    console.error('Add product error:', error);
    res.render('admin/products', {
      errors: { general: 'Server error. Please try again.' },
      oldInput,
      product,
      colors,
      fits,
      productTypes,
    });
  }
}

exports.getProductsPage = async (req, res) => {

  try {
    const search = req.query.search ? req.query.search.trim() : "";
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const selectedGender = req.query.gender || "";

    // Substring name match using case-insensitive regex
    const query = {
      name: { $regex: search, $options: "i" }
    };

    if (selectedGender) {
      query.genderId = selectedGender;
    }
    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);

    //getting the total stock for each product
    const variantData = await ProductVariant.aggregate([
      {
        $group: {
          _id: "$productId",
          totalStock: { $sum: "$stock" },
          maxPrice: { $max: "$basePrice" },
          minPrice: { $min: "$discountPrice" }
        }
      }
    ]);

    //conversion to map for better use
    const variantMap = {};
    variantData.forEach(item => {
      variantMap[item._id.toString()] = item;
    });

    const productData = products.map((product) => {
      const variant = variantMap[product._id.toString()] || {};
      return {
        _id: product._id,
        name: product.name,
        description: product.description,
        type: product.productTypeId,
        gender: product.genderId,
        basePrice: variant.maxPrice || 0,
        discountPrice: variant.minPrice || 0,
        totalStock: variant.totalStock || 0,
        create: product.createdAt.toDateString(),
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
      selectedGender,
      successMessage
    });
  } catch (err) {
    console.error(err);
    res.render("admin/products", {
      products: [],
      search: "",
      currentPage: 1,
      selectedGender,
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

    const { name, description, genderId, productTypeId } = req.body;

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
        fitId: variant.fitId,
        size: variant.size,
        sku,
        basePrice: variant.basePrice,
        discountPrice: variant.discountPrice,
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
exports.getCategoryManagement = async (req, res) => {
  try {
    // Fetch all category documents
    const productTypes = await ProductType.find({});
    const fits = await Fit.find({});
    const colours = await Colour.find({});

    // 🟦 Get stock per ProductType (via Product -> ProductVariant)
    const stockByType = await ProductVariant.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.productTypeId',
          totalStock: { $sum: '$stock' }
        }
      }
    ]);

    // 🟦 Get stock per Fit
    const stockByFit = await ProductVariant.aggregate([
      {
        $group: {
          _id: '$fitId',
          totalStock: { $sum: '$stock' }
        }
      }
    ]);

    // 🟦 Get stock per Colour
    const stockByColour = await ProductVariant.aggregate([
      {
        $group: {
          _id: '$colorId',
          totalStock: { $sum: '$stock' }
        }
      }
    ]);

    // 🔁 Convert to maps for easy lookup
    const typeStockMap = {};
    stockByType.forEach(item => {
      typeStockMap[item._id?.toString()] = item.totalStock;
    });

    const fitStockMap = {};
    stockByFit.forEach(item => {
      fitStockMap[item._id?.toString()] = item.totalStock;
    });

    const colourStockMap = {};
    stockByColour.forEach(item => {
      colourStockMap[item._id?.toString()] = item.totalStock;
    });

    // 📝 Add stock to each item
    const updatedProductTypes = productTypes.map(type => ({
      ...type.toObject(),
      stock: typeStockMap[type._id.toString()] || 0
    }));

    const updatedFits = fits.map(fit => ({
      ...fit.toObject(),
      stock: fitStockMap[fit._id.toString()] || 0
    }));

    const updatedColours = colours.map(colour => ({
      ...colour.toObject(),
      stock: colourStockMap[colour._id.toString()] || 0
    }));
     const successMessage = req.session.successMessage;
    req.session.successMessage = null;
    // 📤 Render with stock data
    res.render('admin/category', {
      productTypes: updatedProductTypes,
      fits: updatedFits,
      colours: updatedColours,
      successMessage
    });

  } catch (err) {
    console.error(err);
    res.status(500).render('error/500');
  }
};

exports.getAddProductType = (req, res) => {
  res.render('admin/addPType');
};

//edit product page
exports.getEditProductTypePage = async (req, res) => {
  try {
    const pTypeId = req.params.id;
    const pType = await ProductType.findById(pTypeId);

    res.render('admin/editPtype', {
      pType,
      oldInput: null,
      error: null
    });

  } catch (error) {
    console.log(error);
    res.render('admin/editPtype', {
      pType: null,
      oldInput: null,
      error: 'Failed to load product type'
    });
  }
};

//editing the productType
exports.editPType = async (req, res) => {
  try {
    const id= req.body.id;
    const name=req.body.pname.trim();
    const description=req.body.description.trim();
    const type = await ProductType.findById(id);
    const oldInput = req.body;
    console.log(type);
    if (!name || !description) {
  
      return res.render('admin/editPtype', {
        pType: type,
        oldInput,
        error: 'Product name and description are required.'
      });
    }

    if (!type) {
      return res.redirect('/admin/category');
    }

    type.name = name;
    type.description = description;
    await type.save();

    res.redirect('/admin/category');
  } catch (error) {
    console.error(error);
  }
};

//deleting and restoring productType
exports.togglePType=async (req, res) => {
  try {
    const type = await ProductType.findById(req.params.id);
    if (!type) {
      return res.redirect("/admin/category");
    }

    type.isActive = !type.isActive;
    await type.save();
    req.session.successMessage = type.isActive ? "Product Type restored." : "Product Type deleted.";
    res.redirect(`/admin/category`);
  } catch (err) {
    console.error("Toggle product status error:", err);
    res.redirect("/admin/category");
  }
};

//adding new product type to collection
exports.addProductType = async (req, res) => {
  try {

    const pname = req.body.pname.trim();
    const description = req.body.description.trim();

    // Check for empty fields
    if (!pname || !description) {
      req.flash('error', 'All feilds are required');
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
      req.flash('error', 'Product type already exists.');
      return res.redirect('/admin/addPType');
    } else {
      console.error(err);
      req.flash('error', 'Internal server error.');
      return res.redirect('/admin/addPType');
    }
  }
};

//====add fit type====//
exports.getAddFitPage = async (req, res) => {
  res.render('admin/addFit');
};

exports.addFit = async (req, res) => {
  try {
    const fname = req.body.fitname.trim();
    const description = req.body.description.trim();
    // Check for empty fields
    if (!fname || !description) {
      req.flash('error', 'all fields are required');
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
      req.flash('error', 'This fit already exist.')
      return res.redirect('/admin/addFit');
    } else {
      console.error(err);
      req.flash('error', 'Internal server error.')
      return res.redirect('/admin/addFit');
    }
  }
};

//edit fit page
exports.getEditFitPage = async (req, res) => {
  try {
    const Id = req.params.id;
    const fit = await Fit.findById(Id);

    res.render('admin/editFit',{
      fit,
      oldInput: null,
      error: null
    });

  } catch (error) {
    console.log(error);
    res.render('admin/editFit', {
      fit: null,
      oldInput: null,
      error: 'Failed to load product type'
    });
  }
};

//editing the productType
exports.editFit = async (req, res) => {
  try {
    const id= req.body.id;
    const name=req.body.name.trim();
    const description=req.body.description.trim();
    const fit = await Fit.findById(id);
    const oldInput = req.body;
 
    if (!name || !description) {
  
      return res.render('admin/editFit', {
        fit: fit,
        oldInput,
        error: 'Product name and description are required.'
      });
    }

    if (!fit) {
      return res.redirect('/admin/category');
    }

    fit.name = name;
   fit.description = description;
    await fit.save();
    req.session.successMessage="Product fit updated."
    res.redirect('/admin/category');
  } catch (error) {
    console.error(error);
  }
};

//deleting and restoring product fit
exports.toggleFit=async (req, res) => {
  try {
    const type = await Fit.findById(req.params.id);
    if (!type) {
      return res.redirect("/admin/category");
    }

    type.isActive = !type.isActive;
    await type.save();
    req.session.successMessage = type.isActive ? "Product Fit restored." : "Product Fit deleted.";
    res.redirect(`/admin/category`);
  } catch (err) {
    console.error("Toggle product status error:", err);
    res.redirect("/admin/category");
  }
};

//==Adding colour=====//
exports.getAddColourPage = (req, res) => {
  res.render('admin/addColour');
};

exports.addColour = async (req, res) => {
  try {
    const name = req.body.name.trim();
    const hexCode = req.body.hexcode.trim();
    // Check for empty fields
    if (!name || !hexCode) {
      req.flash('error', 'all fields are required');
      return res.redirect('/admin/addColour');
    }

    // Save new product type
    const newType = new Colour({
      name: name,
      hexCode: hexCode
    });

    await newType.save();

    // Redirect 
    res.redirect('/admin/category');
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate entry
      req.flash('error', 'This fit already exist.')
      return res.redirect('/admin/addColour');
    } else {
      console.error(err);
      req.flash('error', 'Internal server error.')
      return res.redirect('/admin/addColour');
    }
  }
}

//edit Colour page
exports.getEditColourPage = async (req, res) => {
  try {
    const Id = req.params.id;
    const colour = await Colour.findById(Id);

    res.render('admin/editColour',{
      colour,
      oldInput: null,
      error: null
    });

  } catch (error) {
    console.log(error);
    res.render('admin/editColour', {
      colour: null,
      oldInput: null,
      error: 'Failed to load product type'
    });
  }
};

//editing the productType
exports.editColour = async (req, res) => {
  try {
    const id= req.body.id;
    const name=req.body.name.trim();
    const hexCode=req.body.hexCode.trim();
    const colour= await Colour.findById(id);
    const oldInput = req.body;
 
    if (!name || !hexCode) {
  
      return res.render('admin/editFit', {
        colour:colour,
        oldInput,
        error: 'Colour  and hexcode are required.'
      });
    }

    if (!colour) {
      return res.redirect('/admin/category');
    }

    colour.name = name;
   colour.hexCode = hexCode;
    await colour.save();
    req.session.successMessage="Colour updated."
    res.redirect('/admin/category');
  } catch (error) {
    console.error(error);
  }
};

//deleting and restoring product fit
exports.toggleColour=async (req, res) => {
  try {
    const type = await Colour.findById(req.params.id);
    if (!type) {
      return res.redirect("/admin/category");
    }

    type.isActive = !type.isActive;
    await type.save();
    req.session.successMessage = type.isActive ? "Colour restored." : "Colour deleted.";
    res.redirect(`/admin/category`);
  } catch (err) {
    console.error("Toggle product status error:", err);
    res.redirect("/admin/category");
  }
};



