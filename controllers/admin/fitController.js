const Fit = require('../../models/Fit');

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
      
      req.flash('error', 'Internal server error.')
      return res.redirect('/admin/addFit');
    }
  }
};

//=== edit fit page ===//
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
    
    res.render('admin/editFit', {
      fit: null,
      oldInput: null,
      error: 'Failed to load product type'
    });
  }
};

/* Taking the values from admin, If any mistake, then return error .Other wise adding to the database */
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
   
  }
};

//=== deleting and restoring product fit ===//
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