const User = require("../../models/userModel");
const productVariant = require("../../models/productVariant");
const Products = require("../../models/Products");

exports.checkCart=async(req,res)=>{
    try {
        const user = await User.findById(req.session.user._id);

        const results = await Promise.all(
            user.cart.map(async (item) => {
                const variant = await productVariant.findById(item.variantId);
                const product=await Products.findById(item.productId);
                if (!variant || variant.stock < item.quantity || variant.stock <= 0) {
                    return {
                        name: product.name,
                        requestedQty: item.quantity,
                        availableQty: variant ? variant.stock : 0
                    }; // return invalid item
                }
                return null;
            })
        );

        const outOfStockItems = results.filter(item => item !== null);
console.log(outOfStockItems)
        if (outOfStockItems.length > 0) {
            return res.json({ ok: false, outOfStockItems });
        }

        return res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ ok: false, message: 'Server error' });
    }
}