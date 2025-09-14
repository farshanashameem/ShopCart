const Coupon = require("../../models/Coupens");
const productType = require("../../models/productType");
const { validationResult } = require("express-validator");

exports.getCouponPage = async (req, res) => {
  try {
    const coupon = await Coupon.find().sort({ createdAt: -1 }); // latest first

    const categories = await productType.find();

    res.render("admin/coupons", {
      coupon,
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
exports.addCoupon = async (req, res) => {
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
      code,
      category,
      discountValue,
      discountType,
      minValue,
      usageLimit,
      startDate,
      endDate,
    } = req.body;
    const existItem = await Coupon.findOne({ code });
if (existItem) {
  return res.status(400).json({
    success: false,
    errors: { code: "This coupon already exists." }
  });
}
    // Convert to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({success: false,message: "End date must be after start date"});
    }
    const item = new Coupon({
      code,
      category,
      discountValue,
      discountType,
      minValue,
      usageLimit,
      startDate,
      endDate,
    });

    const saved = await item.save();
    return res.status(200).json({ success: true, coupon: saved });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.editCoupon = async (req, res) => {
  try {
    const errorsObj = {};
    const result = validationResult(req);
    const couponId = req.params.id;
  

    // Handle validation errors
    if (!result.isEmpty()) {
      result.array().forEach((error) => {
        errorsObj[error.path] = error.msg;
      });
      return res.status(400).json({ success: false, errors: errorsObj });
    }

    const {
      code,
      category,
      discountValue,
      discountType,
      minValue,
      minOrder,
      startDate,
      endDate,
    } = req.body;

    // Check if coupon exists
    const existingCoupon = await Coupon.findById(couponId);
    if (!existingCoupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    // Check if another coupon with same code exists
    const duplicate = await Coupon.findOne({ code });
    if (duplicate && duplicate._id.toString() !== couponId) {
      return res.status(400).json({
        success: false,
        errors: { code: "Coupon code already exists." },
      });
    }

    // Update and return new doc
    const updatedCoupon = await Coupon.findByIdAndUpdate(
     couponId,
      { code, category, discountValue, discountType, minValue,  minOrder, startDate, endDate },
      { new: true } // returns updated doc
    );

    return res.status(200).json({ success: true, coupon: updatedCoupon });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.toggleCoupon=async (req,res)=>{
  try {
    const coupon = await Coupon.findById(req.params.id);
    console.log(coupon);
    if (!coupon) return res.json({ success: false, error: "Coupon not found" });

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.json({ success: true, isActive: coupon.isActive });
  } catch (err) {
    res.json({ success: false, error: "Server error" });
  }
}
