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
        const user = req.session.user;
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
        }
        else
            user.cart.push({
                variantId: variant._id,
                productId: productId,
                quantity: 1,
                addedAt: new Date()
            });

        await user.save();
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

        const variantId = req.params.variantId;
        const action = req.params.action;
        const user = await User.findById(req.session.user._id);
        const variant = await productVariant.findById(variantId);
        let errorMessage = null;

        const item = user.cart.find(item => item.variantId.toString() === variantId);
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

        await variant.save();
        await user.save();

        if (errorMessage) {
            return res.redirect(`/cart?error=${encodeURIComponent(errorMessage)}&vid=${variantId}`);
        } else {
            return res.redirect('/cart');
        }


    } catch (err) {
        console.log(err);
    }
}

exports.Remove = async (req, res) => {
    try {

        const variantId = req.params.variantId;
        const user = await User.findById(req.session.user._id);

        user.cart = user.cart.filter(item => item.variantId.toString() !== variantId);
        await user.save();


        res.redirect('/cart');
    } catch (err) {
        console.log(err);
    }
}