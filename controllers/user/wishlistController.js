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
           return res.json({ success: false, message: "This item already present in wishlist" })
        if (!existItem) {

            user.wishlist.push({
                variantId: variant._id,
                productId: productId,
                quantity: 1,
                addedAt: new Date()
            });
        }
        await user.save();
        return res.json({ success: true, message: "Product added to wishlist" });

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
                    stock:variant.stock
                };
            })
        );

         // pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = 3;
    const totalPages = Math.ceil(wishlistItems.length / limit);

    // slice array for current page
    const paginatedItems = wishlistItems.slice((page - 1) * limit, page * limit);

        res.render('user/wishlist', { wishlistItems:paginatedItems,totalPages, currentPage: page });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

// Add item from wishlist to cart
exports.addFromWishlist = async (req, res) => {
    try {
        const { productId, variantId } = req.params;
        const user = await User.findById(req.session.user._id);
        const pdtVariant = await productVariant.findOne({ productId, _id: variantId });

        if (!pdtVariant) {
            return res.json({ success: false, message: "Variant not found." });
        }

        // Check stock
        if (pdtVariant.stock === 0) {
            return res.json({ success: false, message: "This product is out of stock." });
        }

        // Remove from wishlist
        user.wishlist = user.wishlist.filter(
            item => !(item.productId.toString() === productId && item.variantId.toString() === variantId)
        );

        // Check if already in cart
        const cartItem = user.cart.find(
            item => item.productId.toString() === productId && item.variantId.toString() === variantId
        );

        if (cartItem) {
            cartItem.quantity += 1;
        } else {
            user.cart.push({ productId, variantId, quantity: 1 });
        }

        // Reduce stock
        pdtVariant.stock -= 1;

        await user.save();
        await pdtVariant.save();

        return res.json({ success: true, message: "Item moved to cart." });

    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Something went wrong." });
    }
};


// Delete from wishlist
exports.deleteFromWishlist = async (req, res) => {
    try {
        const { productId, variantId } = req.params;
        const user = await User.findById(req.session.user._id);

        const item = user.wishlist.find(
            item => item.productId.toString() === productId && item.variantId.toString() === variantId
        );

        if (!item) {
            return res.json({ success: false, message: "Item not found in wishlist." });
        }

        // Remove from wishlist
        user.wishlist = user.wishlist.filter(
            item => !(item.productId.toString() === productId && item.variantId.toString() === variantId)
        );

        await user.save();
        return res.json({ success: true, message: "Item removed from wishlist." });

    } catch (err) {
        console.error(err);
        res.json({ success: false, message: "Something went wrong." });
    }
};
