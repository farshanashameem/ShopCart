const ProductType = require('../../models/productType');
const Fit = require('../../models/Fit');
const Colour = require('../../models/Colour');
const Product = require("../../models/Products");
const ProductVariant = require("../../models/productVariant");
const path = require("path");
const { validationResult } = require('express-validator');
const generateSKU = require('../../utils/skuGenerator');

//===load Product details page ===//
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

//=== getting details about a product ===//
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

//=== adding new product ===//
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

//=== edit a product ===//
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

    const files = req.files || {};
const existing = req.body.existingImages || {};

// Normalize existing to array form
let keep = [existing[0], existing[1], existing[2]];

const finalImages = [];
for (let i = 0; i < 3; i++) {
  if (files[`images${i}`] && files[`images${i}`][0]) {
    // new upload replaces this slot
    finalImages.push(files[`images${i}`][0].path);
  } else if (keep[i]) {
    // fallback: keep old one if no replacement
    finalImages.push(keep[i]);
  }
}





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
          images: finalImages,
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
          images: finalImages,
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
};

//=== toggle the status of product ===//
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