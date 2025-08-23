const validator = require("validator");
const { validationResult } = require("express-validator");
const User = require("../models/userModel");
const generateOTP = require('../utils/generateOTP');
const sendOTPMail = require('../utils/sendOTPMail');
const mongoose = require('mongoose');
const bcrypt = require("bcrypt");
const { getCountryCodeFromIP } = require('../utils/ipapi');
const productVariant = require("../models/productVariant");
const Products = require('../models/Products');
const Fit = require('../models/Fit');
const Orders = require('../models/Orders');
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



exports.getProfilePage = (req, res) => {
    const user = req.session.user;
    res.render('user/profile', { user, errors: {}, old: {} });
}

exports.getOtpForMail = (req, res) => {
    res.render('user/otp-mailChange', { remainingTime: 60 });
}

exports.updateProfile = async (req, res) => {

    const name = req.body.name?.trim();
    const email = req.body.email?.trim();
    const phone = req.body.phone?.trim();
    const profileImage = req.file?.path || req.body.profileImage;
    const oldMail = req.session.user.email;
    const errorsObj = {};
    const old = { name, email, phone };
    try {

        // ✅ Get validation errors
        const result = validationResult(req);
        if (!result.isEmpty()) {
            result.array().forEach(error => {
                errorsObj[error.path] = error.msg;
            });
            return res.render("user/profile", { errors: errorsObj, old, user: req.session.user });
        }

        if (email === req.session.user.email) {
            const updateUser = await User.findOneAndUpdate({
                email: req.session.user.email
            },
                { name: name, mobile: phone, image: profileImage },
                { new: true }
            );
            req.session.user = updateUser;
            res.redirect('/profile');
        }
        else {
            req.session.name = name;
            req.session.phone = phone;
            res.redirect('/changeMail');
        }
    } catch (err) {
        console.log(err);
    }


}

exports.getChangeMailPage = (req, res) => {
    res.render('user/confirmMail');
}

exports.confirmMail = async (req, res) => {
    try {

        const email = req.body.email;
        const oldUser = await User.findOne({ email: email });
        if (oldUser) {
            req.flash('error', 'This mail already registered.Try another One.');
            res.redirect('/changeMail');
        }
        const OTP = generateOTP(); console.log(OTP);
        await sendOTPMail(email, OTP);
        req.session.tempUser = {
            oldMail: req.session.user.email,
            email: email,
            OTP,
            otpCreatedAt: Date.now()
        };
        console.log(email);
        res.render('user/otp-mailChange', { email });
    } catch (err) {
        console.log(err);
    }
}



exports.verifyOTP = async (req, res) => {
    try {
        const old = req.session.tempUser.oldMail;
        const email = req.session.tempUser.email;
        const enteredOtp = req.body.otp?.join('');
        const sessionUser = req.session.tempUser;
        if (!sessionUser) {
            return res.render("user/confirmMail", {
                error: "Session expired. Please try again."
            });

        }
        const otpAge = Date.now() - sessionUser.otpCreatedAt;
        if (otpAge > 60 * 1000) {
            req.session.tempUser = null;
            return res.render("user/confirmMail", {
                error: "OTP expired. Please sign up again.",

            });
        }

        if (enteredOtp !== sessionUser.OTP.toString()) {
            console.log("incorrect otp");
            return res.render("user/otp-mailChange", {
                error: "Incorrect OTP. Please try again.",
                email,
                remainingTime: 60 - Math.floor(otpAge / 1000)
            });
        }

        const user = await User.findOneAndUpdate({ email: old }, { email: email, name: req.session.name, mobile: req.session.phone });
        req.session.name = null;
        req.session.phone = null;
        res.redirect('/profile');

    }
    catch (err) {
        console.log(err);
    }
}

exports.resendOtp = async (req, res) => {
    try {
        const sessionUser = req.session.tempUser;
        console.log(sessionUser);
        if (!sessionUser) {
            return res.render("user/confirmMail", { error: "error ,  Session expired. Please sign up again." });
        }

        const OTP = generateOTP();
        const email = sessionUser.email;
        await sendOTPMail(email, OTP);


        req.session.tempUser.OTP = OTP;
        req.session.tempUser.otpCreatedAt = Date.now();

        req.flash("success", "A new OTP has been sent to your email.");
        return res.render("user/otp-mailChange", { email });

    } catch (err) {
        console.error("Resend OTP error:", err);
        req.flash("error", "Failed to resend OTP. Try again.");
        return res.redirect("/confirmMail");
    }
};


//password update page
exports.getUpdatePasswordPage = (req, res) => {
    res.render('user/updatePassword', { errors: {} });
};

exports.updatePassword = async (req, res) => {


    try {

        let old = req.body.old.trim();
        let password = req.body.password.trim();
        let cpassword = req.body.cpassword.trim();
        const errorsObj = {};
        // ✅ Get validation errors
        const result = validationResult(req);
        if (!result.isEmpty()) {
            result.array().forEach(error => {
                errorsObj[error.path] = error.msg;
            });
            return res.render("user/updatePassword", { errors: errorsObj });
        }

        const isMatch = await bcrypt.compare(old, req.session.user.password);
        if (!isMatch) {
            req.flash('error', 'Old password doesnot match');
            return res.redirect('/updatePassword');
        }
        else if (await bcrypt.compare(password, req.session.user.password)) {
            req.flash('error', 'Current password is same as your new password');
            return res.redirect('/updatePassword');
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        await User.updateOne({ email: req.session.user.email }, { password: hashedPassword });
        return res.redirect('/profile');

    } catch (err) {
        console.log(err);
    }
}

//=====address management=====//
exports.getAddressPage = async (req, res) => {
    try {

        const user = await User.findOne({ _id: req.session.user._id }, { address: 1 });
        res.render('user/address', { addresses: user.address, old: {}, errors: {}, address: null });

    } catch (err) {
        console.log(err);
    }
}

exports.addAddress = async (req, res) => {
    try {
        const old = req.body;
        const errorsObj = {};


        // ✅ Get validation errors
        const result = validationResult(req);
        if (!result.isEmpty()) {
            result.array().forEach(error => {
                errorsObj[error.path] = error.msg;
            });

            return res.json({ errors: errorsObj, old });


        }
        // Get client IP
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        // Get country code
        const countryCode = await getCountryCodeFromIP(ip);
        const user = await User.findOne({ _id: req.session.user._id });
        console.log(req.body.addressType);
        const newAddress = {
            name: req.body.name,
            phoneNumber: countryCode + req.body.phone,
            pincode: req.body.pin,
            locality: req.body.locality,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            landmark: req.body.landmark,
            altnumber: req.body.altnumber,
            type: req.body.addressType
        }

        user.address.push(newAddress);
        await user.save();

        return res.json({ address: newAddress });



    } catch (err) {
        console.log(err);
    }
}

exports.updateAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        const errorsObj = {};

        const user = await User.findById(req.session.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const old = user.address.find(item => item._id.toString() === addressId);
        if (!old) return res.status(404).json({ message: "Address not found" });

        // ✅ Validation errors
        const result = validationResult(req);
        if (!result.isEmpty()) {
            result.array().forEach(error => {
                errorsObj[error.path] = error.msg;
            });
            return res.json({ errors: errorsObj, old });
        }

        // Get client IP
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        // Get country code
        const countryCode = await getCountryCodeFromIP(ip);

        // Update the address
        const addressIndex = user.address.findIndex(address => address._id.toString() === addressId);
        user.address[addressIndex] = {
            ...user.address[addressIndex]._doc, // preserve _id
            name: req.body.name,
            phoneNumber: countryCode + req.body.phone,
            pincode: req.body.pin,
            locality: req.body.locality,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            landmark: req.body.landmark,
            altnumber: req.body.altnumber,
            type: req.body.addressType
        };

        await user.save();

        // Return the updated address
        return res.json({ address: user.address[addressIndex] });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error" });
    }
};


exports.deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        const result = await User.findByIdAndUpdate(
            req.session.user._id,
            { $pull: { addresses: { _id: addressId } } },
            { new: true }
        );
        res.json({ success: true, message: "Address deleted" });
    } catch (err) {
        console.log(err);
    }
}

//cart management
exports.addToCart = async (req, res) => {
    try {

        const { productId, size, color } = req.body;
        const user = req.session.user;

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
                    subtotal: variant.discountPrice * item.quantity
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

/*exports.ApplyCoupon=async(req,res)=>{
     try {
    const { code } = req.body;
    const coupon = await Coupon.findOne({ code, isActive:true });
    if(!coupon) return res.json({ success:false, message:"Invalid coupon" });

    req.session.coupon = coupon; // save applied coupon
    const user = await User.findById(req.session.user._id);
    const { cartItems, total, discount } = await getCartDetails(user, coupon);

    res.json({ success:true, cartItems, total, discount });
  } catch (err) {
    console.log(err);
    res.json({ success:false });
  }
};
}*/

exports.getCheckout1 = async (req, res) => {
    try {
        const data = await buildCheckoutData(req.session.user._id);
        data.showAddressBar = false;
        if (!data) return res.redirect('/login');
        res.render('user/checkout1', data);
    } catch (err) {
        console.error('Error in checkout:', err);
        res.status(500).send('Internal Server Error');
    }

}

exports.checkoutAdd = async (req, res) => {

    try {
        const old = req.body;
        const errorsObj = {};


        // ✅ Get validation errors
        const result = validationResult(req);
        if (!result.isEmpty()) {
            result.array().forEach(error => {
                errorsObj[error.path] = error.msg;
            });

            const data = await buildCheckoutData(req.session.user._id);
            data.showAddressBar = true;
            data.errors = errorsObj; data.old = old;
            return res.render('user/checkout1', data);


        }
        // Get client IP
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        // Get country code
        const countryCode = await getCountryCodeFromIP(ip);
        const user = await User.findOne({ _id: req.session.user._id });

        const newAddress = {
            name: req.body.name,
            phoneNumber: countryCode + req.body.phone,
            pincode: req.body.pin,
            locality: req.body.locality,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            landmark: req.body.landmark,
            altnumber: req.body.altnumber,
            type: req.body.addressType
        }

        user.address.push(newAddress);
        await user.save();
        const data = await buildCheckoutData(req.session.user._id);
        data.showAddressBar = false;
        return res.render('user/checkout1', data);

    } catch (err) {
        console.log(err);
    }
}

exports.checkoutUpdate = async (req, res) => {
    try {
        const addressId = req.params.id;
        const errorsObj = {};

        const user = await User.findById(req.session.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const old = user.address.find(item => item._id.toString() === addressId);
        console.log(old);
        old.phoneNumber = old.phoneNumber.slice(3);
        if (!old) return res.status(404).json({ message: "Address not found" });

        // ✅ Validation errors
        const result = validationResult(req);
        if (!result.isEmpty()) {
            result.array().forEach(error => {
                errorsObj[error.path] = error.msg;
            });
            const data = await buildCheckoutData(req.session.user._id);
            data.showAddressBar = true;
            data.errors = errorsObj; data.old = old;
            return res.render('user/checkout1', data);
        }

        // Get client IP
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        // Get country code
        const countryCode = await getCountryCodeFromIP(ip);

        // Update the address
        const addressIndex = user.address.findIndex(address => address._id.toString() === addressId);
        user.address[addressIndex] = {
            ...user.address[addressIndex]._doc, // preserve _id
            name: req.body.name,
            phoneNumber: countryCode + req.body.phone,
            pincode: req.body.pin,
            locality: req.body.locality,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            landmark: req.body.landmark,
            altnumber: req.body.altnumber,
            type: req.body.addressType
        };

        await user.save();

        const data = await buildCheckoutData(req.session.user._id);
        data.showAddressBar = false;
        return res.render('user/checkout1', data);

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Server error" });
    }

}


exports.getCheckout2 = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const addressId = req.query.addressId;

        const user = await User.findById(userId)
            .populate({ path: 'cart.variantId', select: 'discountPrice' })
            .populate({ path: 'cart.productId', select: 'name' });

        if (!user) return res.redirect('/'); // or handle error

        const cartItems = user.cart.map(item => ({
            name: item.productId.name,
            price: item.variantId.discountPrice,
            quantity: item.quantity
        }));

        const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        const cart = { items: cartItems, total };

        // Render checkout page with user and cart
        res.render('user/checkout2', { user, cart, chosenAddressId: addressId });
    } catch (err) {
        console.log(err);
        res.status(500).send('Server Error');
    }
};

exports.makePayment = async (req, res) => {
    try {

        const { payment, discountCode, total, addressId } = req.body;
        const user = await User.findById(req.session.user._id);

        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000); // 0-999
        const orderId = `ORD-${timestamp}-${random}`;

        const products = user.cart;
        let totalAmount = 0;
        const walletAmountUsed = 0;

        const userId = user._id;


        const details = await Promise.all(
            products.map(async (item, index) => {

                const variant = await productVariant.findById(item.variantId, { discountPrice: 1 });


                return {
                    orderId,
                    userId,
                    addressId,
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    price: variant.discountPrice,
                    total: variant.discountPrice * item.quantity,
                    walletAmountUsed: walletAmountUsed || 0,
                    status: "pending",
                    paymentStatus: "pending",
                    paymentMethod: payment
                };
            })
        );

        console.log(details);
        await Orders.insertMany(details);
        user.cart = [];
        await user.save();

        if (payment === 'cod') {
            res.render('user/success');
        }
    } catch (err) {
        console.log(err);
    }
}

exports.getOrderPage = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);

   // pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;

    // get paginated orders
    const orders = await Orders.find({ userId: user._id })
      .sort({ createdAt: -1 })   // newest first
      .skip(skip)
      .limit(limit);

    // total count for pagination
    const totalOrders = await Orders.countDocuments({ userId: user._id });
    const totalPages = Math.ceil(totalOrders / limit);
    // Transform each order into formatted object
    const list = await Promise.all(
      orders.map(async (item) => {
        const product = await Products.findById(item.productId).lean();
        const variant = await productVariant.findById(item.variantId).lean();
        const address = user.address.find(
          (addr) => addr._id.toString() === item.addressId.toString()
        );
        const statusDates = {};
        item.statusHistory.forEach(h => {
        statusDates[h.status] = h.date;
        });

        return {
          address,
          name: product?.name,
          description: product?.description,
          color: variant?.color,
          image: variant?.images?.[0],
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          status: item.status,
          method: item.paymentMethod,
          date: item.createdAt,
          statusDates,
           expectedDate: new Date(item.createdAt.getTime() + 10 * 24 * 60 * 60 * 1000) // +10 days
        };
      })
    );

    res.render("user/orders", { orders: list,currentPage: page,
      totalPages });

  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
};
