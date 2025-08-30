const Review=require('../../models/Review');
const Products=require('../../models/Products');

exports.addOrEditReview=async (req,res)=>{
    try{

        const userId = req.session.user._id; 
        
        const { productId, rating, comment } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.json({ success: false, message: "Invalid rating value" });
    }

    // Check if review already exists
    let review = await Review.findOne({ userId, productId });

    if (review) {
      // Update existing review
      review.rating = rating;
      review.comment = comment;
      await review.save();
      return res.json({ success: true, isUpdate: true });
    } else {
      // Create new review
      await Review.create({ userId, productId, rating, comment });
      return res.json({ success: true, isUpdate: false });
    }


    }catch(err){
        console.log(err)
    }
}