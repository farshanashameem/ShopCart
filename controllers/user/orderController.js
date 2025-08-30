const User = require("../../models/userModel");
const mongoose = require('mongoose');
const productVariant = require("../../models/productVariant");
const Products = require('../../models/Products');
const Fit = require('../../models/Fit');
const Orders = require('../../models/Orders');  
const Returns=require('../../models/Returns');
const Review=require('../../models/Review');

async function buildCheckoutData(userId, errors = {}, old = {}) {
    const user = await User.findById(userId)
        .populate({ path: 'cart.variantId', select: 'basePrice discountPrice' })
        .populate({ path: 'cart.productId', select: 'name' });

    if (!user) return null;

    const cartItems = user.cart.map(item => ({
        name: item.productId.name,
        price:item.variantId.basePrice,
        discountPrice: item.variantId.discountPrice,
        quantity: item.quantity
    }));

    const total = cartItems.reduce((sum, item) => sum + item.discountPrice* item.quantity, 0);

    return {
        addresses: user.address,
        user,
        errors,
        old,
        cart: { items: cartItems, total }
    };
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
            .populate({ path: 'cart.variantId', select: 'discountPrice basePrice' })
            .populate({ path: 'cart.productId', select: 'name' });

        if (!user) return res.redirect('/'); // or handle error

        const cartItems = user.cart.map(item => ({
            name: item.productId.name,
            price: item.variantId.basePrice,
            discountPrice:item.variantId.discountPrice,
            quantity: item.quantity
        }));

        const total = cartItems.reduce((sum, item) => sum + item.discountPrice * item.quantity, 0);

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
        
        const walletAmountUsed = 0;

        const userId = user._id;


        const details = await Promise.all(
            products.map(async (item, index) => {

                const variant = await productVariant.findById(item.variantId, { discountPrice: 1 });
                const product = await Products.findById(item.productId).select("name");


                return {
                    name: product.name,
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
            res.render('user/success',{orderId});
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

        // check if return request exists for this order item
        const returnRequest = await Returns.findOne({
          orderId: item.orderId,
          orderedItem: item.productId,
          variantId: item.variantId,
          userId: user._id
        }).lean();
       
       
        const statusDates = {};
        item.statusHistory.forEach(h => {
        statusDates[h.status] = h.date;
        });

        return {
            id:item._id,
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
          variantId:item.variantId,
          orderId:item.orderId,
            productId:item.productId,
            returnStatus: returnRequest ? returnRequest.status : null,
           expectedDate: new Date(item.createdAt.getTime() + 10 * 24 * 60 * 60 * 1000) // +10 days
        };
      })
    );
   list.forEach(o => console.log(o.orderId, o.returnStatus));

     const successMessage = req.session.successMessage;
    delete req.session.successMessage; 
    res.render("user/orders", { orders: list,currentPage: page,
      totalPages,successMessage  });

  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
};


exports.cancelOrder=async (req,res)=>{
    try{
        const {orderId, variantId,productId}=req.body;
         await Orders.findOneAndUpdate({orderId,variantId,productId},{ 
        $set: { status: "cancelled" },
        $push: { statusHistory: { status: "cancelled", date: new Date() } }
      })

      return res.json({success:true, message:"Order cancelled."})
    }catch(err){
        console.log(err);
    }
}

exports.OrderDetails = async (req, res) => {
  try {
    const id = req.params.Id;

    const order = await Orders.findById(id);
    const product=await Products.findById(order.productId);
    const variant=await productVariant.findById(order.variantId);
    const user=await User.findById(order.userId);
    const address = user.address.id(order.addressId);
    const statusDates={};     
    if (!order) return res.status(404).send("Order not found");
   order.statusHistory.forEach(h => {
        statusDates[h.status] = h.date;
        });

    const returnRequest = await Returns.findOne({
          orderId: order.orderId,
          orderedItem: order.productId,
          variantId: order.variantId,
          userId: user._id
        }).lean();
  
        const review=await Review.find(user._id,product._id);
    res.render("user/orderedItem", { order, address ,product,variant,statusDates,returnStatus: returnRequest ? returnRequest.status : null,returnDate: returnRequest ? returnRequest.returnDate : null, 
           expectedDate: new Date(order.createdAt.getTime() + 10 * 24 * 60 * 60 * 1000),userReview:review?review:null});
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
};
