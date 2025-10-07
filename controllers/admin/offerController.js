const Offers = require("../../models/Offers");
const ProductType = require("../../models/ProductType");
const { validationResult } = require("express-validator");

exports.getOfferPage = async (req, res) => {  
  try {
    const offers = await Offers.find().sort({ createdAt: -1 }); //finding offers with  latest first

    const categories = await ProductType.find();    // finding the categories

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

/* adding new offer for a category. If any errors happened, then error msg is passing other wise data will added to database */
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
  
    // Convert to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end|| !start || !end) {
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
 
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Same procedure as adding the offer. Here updating is done
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

     // Convert to Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end|| !start || !end) {
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


    // Update and return new doc
    const updatedOffer = await Offers.findByIdAndUpdate(
     OfferId,
      {  category, discountValue, discountType, minValue,  startDate, endDate },
      { new: true } // returns updated doc
    );

    return res.status(200).json({ success: true, offer: updatedOffer });
  } catch (err) {
    
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


//Offers can activate and desable here by changing the isActive field
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
