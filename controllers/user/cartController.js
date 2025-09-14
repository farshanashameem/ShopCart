const User = require("../../models/userModel");
const productVariant = require("../../models/productVariant");
const Products = require('../../models/Products');
const Fit = require('../../models/Fit');
const Orders = require('../../models/Orders');
const mongoose = require('mongoose');

async function buildCheckoutData(userId, errors = {}, old = {}) {
    const user = await User.findById(userId)
        .populate({ path: 'cart.variantId', select: 'discountPrice' })
        .populate({ path: 'cart.productId', select: 'name' });

    if (!user) return null;

    const cartItems = user.cart.map(item => ({
        name: item.productId.name,
        price: item.variantId.discountPrice,
        quantity: item.quantity
    }));

    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return {
        addresses: user.address,
        user,
        errors,
        old,
        cart: { items: cartItems, total }
    };
}

exports.addToCart = async (req, res) => {
    try {

        const { productId, size, color } = req.body;
        const user = await User.findById(req.session.user._id).populate("cart.variantId");
        const product=await Products.findById(productId);
        if(!product.isActive)
            return res.json({success:false,message:"Product not available."});

        const variant = await productVariant.findOne({ productId: productId, size: size, colorId: color });
        if (!variant)
            return res.json({ success: false, message: "this combination is not available" });

        const existItem = user.cart.find(item =>
            item.variantId.equals(variant._id)
        );
        if (variant.stock <= 0) {
            return res.json({ success: false, message: "This item is out of stock" });
        }
        if (existItem) {
            if (existItem.quantity >= 5)
                return res.json({ success: false, message: "Maximum 5 same items allowed in cart" });

            existItem.quantity += 1;
            variant.stock-=1;
        }
        else{

            user.cart.push({
                variantId: variant._id,
                productId: productId,
                quantity: 1,
                addedAt: new Date()
            });
            variant.stock-=1; 
        }
            
        await Promise.all([variant.save(), user.save()]);
        res.json({ success: true, message: "Product added to cart" });

    } catch (err) {
        console.log(err);
    }
}



exports.getCartpage = async (req, res) => {
    try {

        const user = await User.findById(req.session.user._id);
        
        const items = await Promise.all(
            user.cart.map(async (item) => {
                const product = await Products.findById(item.productId);
                const variant = await productVariant.findById(item.variantId);
                const fit = await Fit.findById(variant.fitId);
                if (!product || !variant) return null;

                return {
                    productId: product._id,
                    variantId: variant._id,
                    name: product.name,
                    description: product.description,
                    fit: fit.name,
                    basePrice: variant.basePrice,
                    discountPrice: variant.discountPrice,
                    size: variant.size,
                    color: variant.name,
                    stock: variant.stock,
                    image: variant.images[0],
                    quantity: item.quantity,
                    total:variant.basePrice * item.quantity,
                    discountTotal: variant.discountPrice * item.quantity,

                };

            })
        )

        const cartItems = items.filter(item => item !== null);

        res.render('user/cart', { items: cartItems, query: req.query });
    } catch (err) {
        console.log(err);
    }

}

exports.updateCart = async (req, res) => {
  try {
    const { variantId, action } = req.params;
    const user = await User.findById(req.session.user._id);
    const variant = await productVariant.findById(variantId);

    const item = user.cart.find(i => i.variantId.toString() === variantId);
    if (!item) return res.json({ success: false, message: "Item not found in cart." });

    let errorMessage = null;

    if (action === "add") {
      if (item.quantity >= 5) errorMessage = "Maximum quantity is 5";
      else if (variant.stock <= 0) errorMessage = "Out of stock";
      else {
        item.quantity += 1;
        variant.stock -= 1;
      }
    } else if (action === "minus") {
      if (item.quantity <= 1) errorMessage = "Minimum quantity is 1";
      else {
        item.quantity -= 1;
        variant.stock += 1;
      }
    }

    await Promise.all([variant.save(), user.save()]);

    if (errorMessage) return res.json({ success: false, message: errorMessage });

    return res.json({
      success: true,
      message: "Cart updated",
      quantity: item.quantity,
      total: item.quantity * variant.discountPrice
    });

  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Something went wrong." });
  }
};


exports.Remove = async (req, res) => {
  try {
    const { variantId } = req.params;
    const user = await User.findById(req.session.user._id);
    const item = user.cart.find(i => i.variantId.toString() === variantId);

    if (!item) return res.json({ success: false, message: "Item not found in cart." });

    const variant = await productVariant.findById(variantId);
    if (variant) {
      variant.stock += item.quantity;
      await variant.save();
    }

    user.cart = user.cart.filter(i => i.variantId.toString() !== variantId);
    await user.save();

    return res.json({ success: true, message: "Item removed from cart." });

  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Something went wrong." });
  }
};
