const Offers = require("../../models/Offers");
const productType = require("../../models/productType");
const { validationResult } = require("express-validator");

exports.getOfferPage = async (req, res) => {  
  try {
    const offers = await Offers.find().sort({ createdAt: -1 }); //finding offers with  latest first

    const categories = await productType.find();    // finding the categories

    res.render("admin/offers", {
      offers,
      categories,
      errors: {},
      old: {},
    });
  } catch (err) {
    console.error("Error fetching coupons:", err);
    res.status(500).send("Server error");
  }
};

// controller/adminController.js
exports.addOffer = async (req, res) => {
  try {
    const errorsObj = {};
    const result = validationResult(req);

    if (!result.isEmpty()) {
      result.array().forEach((error) => {
        errorsObj[error.path] = error.msg;
      });
      return res.status(400).json({ success: false, errors: errorsObj });
    }

    const {
      
      category,
      discountValue,
      discountType,
      minValue,
      startDate,
      endDate,
    } = req.body;
   console.log(req.body);
    // Convert to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end|| !start || !end) {
      return res.status(400).json({success: false,message: "End date must be after start date"});
    }
    const item = new Offers({
   
      category,
      discountValue,
      discountType,
      minValue,
      startDate,
      endDate,
    });

    const saved = await item.save();
    return res.status(200).json({ success: true, offer: saved });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.editOffer = async (req, res) => {
  try {
    const errorsObj = {};
    const result = validationResult(req);
    const OfferId = req.params.id;
  

    // Handle validation errors
    if (!result.isEmpty()) {
      result.array().forEach((error) => {
        errorsObj[error.path] = error.msg;
      });
      return res.status(400).json({ success: false, errors: errorsObj });
    }

    const {
      category,
      discountValue,
      discountType,
      minValue,
      startDate,
      endDate,
    } = req.body;


    // Update and return new doc
    const updatedOffer = await Offers.findByIdAndUpdate(
     OfferId,
      {  category, discountValue, discountType, minValue,  startDate, endDate },
      { new: true } // returns updated doc
    );

    return res.status(200).json({ success: true, offer: updatedOffer });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.toggleOffer=async (req,res)=>{
  try {
    const offer = await Offers.findById(req.params.id);
   
    if (!offer) return res.json({ success: false, error: "Offer not found" });

    offer.isActive = !offer.isActive;
    await offer.save();

    res.json({ success: true, isActive: offer.isActive });
  } catch (err) {
    res.json({ success: false, error: "Server error" });
  }
}
