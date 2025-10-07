const Coupon = require("../../models/Coupens");
const ProductType = require("../../models/ProductType");
const { validationResult } = require("express-validator");

exports.getCouponPage = async (req, res) => {  
  try {
    const coupon = await Coupon.find().sort({ createdAt: -1 }); // latest first

    const categories = await ProductType.find();

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

// Adding new coupo to db
exports.addCoupon = async (req, res) => {
  try {
    const errorsObj = {};
    const result = validationResult(req);

    // Checking for errors. If there is an error then return that error back to page
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

    //Check if this coupon is already present
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

    //Checking for valid date range
    if (start > end) {
      return res.status(400).json({success: false,message: "End date must be after start date"});
    }

    if(discountValue<0)
       return res.status(400).json({success:false,message:"Discount value should not be negative"})

    if(discountType==='flat' && minValue-discountValue<1000){

      return res.status(400).json({success:false,message:"Discount value and minimum order value doesnot match"})
    }
    if(discountType==='percentage' && discountValue>75){
      return res.status(400).json({success:false,message:"Percentage shoulnot be greater than 75"});
    }

     if(usageLimit<0){
      return res.status(400).json({success:false,message:"usage limit should be greater than 0"})
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

    // If every thing ok,save the item to database
    const saved = await item.save();
    return res.status(200).json({ success: true, coupon: saved });
  } catch (err) {
    
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
      usageLimit,
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

    if(discountValue<0)
       return res.status(400).json({success:false,message:"Discount value should not be negative"})

    if(discountType==='flat' && minValue-discountValue<1000){

      return res.status(400).json({success:false,message:"Discount value and minimum order value doesnot match"})
    }
    if(discountType==='percentage' && discountValue>75){
      return res.status(400).json({success:false,message:"Percentage shoulnot be greater than 75"});
    }
    if(usageLimit<0){
      return res.status(400).json({success:false,message:"usage limit should be greater than 0"})
    }

    // Update and return new doc
    const updatedCoupon = await Coupon.findByIdAndUpdate(
     couponId,
      { code, category, discountValue, discountType, minValue,  minOrder,usageLimit, startDate, endDate },
      { new: true } // returns updated doc
    );

    return res.status(200).json({ success: true, coupon: updatedCoupon });
  } catch (err) {
    
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.toggleCoupon=async (req,res)=>{
  try {
    const coupon = await Coupon.findById(req.params.id);
    
    if (!coupon) return res.json({ success: false, error: "Coupon not found" });

    // Find the coupon and chage the status
    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.json({ success: true, isActive: coupon.isActive });
  } catch (err) {
    res.json({ success: false, error: "Server error" });
  }
}
