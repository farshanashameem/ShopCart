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
    const item = await Colour.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });    //case insensitive search for duplicate entry
    const code=await Colour.findOne({ hexCode: { $regex: `^${hexCode}$`, $options: 'i' } }); 
    if(item || code){
      req.flash('error',"This item is already present ");
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
      req.flash('error', 'This item already exist.')
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
    console.log(req.body);
    if (!name || !hexCode) {
  
      return res.render('admin/editColour', {
        colour:colour,
        oldInput,
        error: 'Colour  and hexcode are required.'
      });
    }
    const existingName = await Colour.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      _id: { $ne: id },
    });

    const existingCode = await Colour.findOne({
      hexCode: { $regex: `^${hexCode}$`, $options: "i" },
      _id: { $ne: id },
    });

    if (existingName || existingCode) {
      req.flash("error", "This colour name or hex code already exists.");
      return res.redirect(`/admin/editColour/${id}`);
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