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

exports.addToWishlist = async (req, res) => {
    try {

        const { productId, size, color } = req.body;
        const user = req.session.user;

        const variant = await productVariant.findOne({ productId: productId, size: size, colorId: color });
        if (!variant)
            return res.json({ success: false, message: "this combination is not available" });

        const existItem = user.wishlist.find(item =>
            item.variantId.equals(variant._id)
        );
        if (existItem)
            res.json({ success: false, message: "This item already present in wishlist" })
        if (!existItem) {

            user.wishlist.push({
                variantId: variant._id,
                productId: productId,
                quantity: 1,
                addedAt: new Date()
            });
        }
        await user.save();
        res.json({ success: true, message: "Product added to wishlist" });

    } catch (err) {
        console.log(err);
    }
}

exports.getWishlistPage = async (req, res) => {
    try {
        const user = req.session.user;


        const wishlistItems = await Promise.all(
            user.wishlist.map(async (item) => {
                const product = await Products.findById(item.productId);
                const variant = await productVariant.findById(item.variantId);

                if (!product || !variant) return null;

                return {
                    productId: product._id,
                    variantId: variant._id,
                    name: product.name,
                    price: variant.discountPrice,
                    image: variant.images[0],
                    size: variant.size,
                    color: variant.colorId,
                };
            })
        );

        res.render('user/wishlist', { wishlistItems: wishlistItems.filter(i => i !== null) });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.addFromWishlist = async (req, res) => {
    try {
        const productId = req.params.productId;
        const variantId = req.params.variantId;
        const user = await User.findById(req.session.user._id);

        const pdtVariant = await productVariant.findOne({ productId: productId, _id: variantId });

        const item = user.wishlist.find(
            item =>
                item.productId.toString() === productId &&
                item.variantId.toString() === variantId
        );

        user.wishlist = user.wishlist.filter(
            item =>
                !(
                    item.productId.toString() === productId &&
                    item.variantId.toString() === variantId
                )
        );

        const cartItem = user.cart.find(
            item =>
                item.productId.toString() === productId &&
                item.variantId.toString() === variantId
        );
        if (pdtVariant.stock === 0) {
            return res.redirect(`/wishlist?outOfStock=${productId}`);
        }
        if (cartItem) {
            cartItem.quantity += 1;
            pdtVariant.stock -= 1;
        } else {
            user.cart.push({ productId, variantId, quantity: 1 });
            pdtVariant.stock -= 1;
        }

        await user.save();
        await pdtVariant.save();
        return res.redirect("/wishlist");
    } catch (err) {
        console.log(err);
    }
}

exports.deleteFromWishlist = async (req, res) => {
    try {

        const productId = req.params.productId;
        const variantId = req.params.variantId;
        const user = await User.findById(req.session.user._id);

        const item = user.wishlist.find(
            item =>
                item.productId.toString() === productId &&
                item.variantId.toString() === variantId
        );
        if (!item) {
            console.log("no such item present in wishlist.");
            return res.redirect('/wishlist?error=itemNotFound');

        }


        user.wishlist = user.wishlist.filter(
            item =>
                !(
                    item.productId.toString() === productId &&
                    item.variantId.toString() === variantId
                )
        );
        await user.save();
        return res.redirect('/wishlist');

    } catch (err) {
        console.log(err);
    }
}