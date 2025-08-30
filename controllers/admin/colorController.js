const Colour = require('../../models/Colour');

//=== Adding colour ===//
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
    req.session.successMessage="Colour added."
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

//=== edit Colour page ===//
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

//=== deleting and restoring color ===//
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