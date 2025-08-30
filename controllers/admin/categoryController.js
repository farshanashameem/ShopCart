const ProductType = require('../../models/productType');
const Fit = require('../../models/Fit');
const Colour = require('../../models/Colour');

//=== the category management page ===//
exports.getCategoryManagement = async (req, res) => {
  try {
    // Fetch all category documents
    const productTypes = await ProductType.find({});
    const fits = await Fit.find({});
    const colours = await Colour.find({});

    const successMessage = req.session.successMessage;
    req.session.successMessage = null;
    res.render('admin/category', {
      productTypes: productTypes,
      fits:fits,
      colours: colours,
      successMessage
    });

  } catch (err) {
    console.error(err);
    res.status(500).render('error/500');
  }
};

//=== adding product type ===//
exports.getAddProductType = (req, res) => {
  res.render('admin/addPType');
};

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

    req.session.successMessage="New Type added."
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

//=== editing product type ===//
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

    req.session.successMessage="Product type updated."
    res.redirect('/admin/category');
  } catch (error) {
    console.error(error);
  }
};

//=== deleting and restoring productType ===//
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


